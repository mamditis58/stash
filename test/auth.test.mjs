import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';

test('registration, login, protected route, CSRF, logout, rotation and expiry', async t => {
  let clock = 1000;
  const server = createApp({ now: () => clock, sessionTtlMs: 60000 });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base + '/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Stash authentication playground/);
  assert.equal((await fetch(base + '/app.js')).status, 200);
  const credentials = { username: 'learner', password: 'made-up-password-123' };
  const post = (path, data = credentials, headers = {}) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data)
  });
  assert.equal((await fetch(base + '/api/me')).status, 401);
  assert.equal((await post('/api/register', credentials, { Origin: 'https://example.com' })).status, 403);
  assert.equal((await post('/api/register', { ...credentials, password: 'short' })).status, 400);
  assert.equal((await post('/api/register')).status, 201);
  assert.equal((await post('/api/register')).status, 409);
  assert.equal((await post('/api/login', { ...credentials, password: 'wrong-password-123' })).status, 401);
  const login = await post('/api/login');
  assert.equal(login.status, 200);
  const cookieHeader = login.headers.get('set-cookie');
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Strict/);
  const cookie = cookieHeader.split(';')[0];
  const { csrf } = await login.json();
  const me = await fetch(base + '/api/me', { headers: { Cookie: cookie } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).username, 'learner');
  assert.equal((await post('/api/logout', {}, { Cookie: cookie })).status, 403);
  assert.equal((await post('/api/logout', {}, { Cookie: cookie, 'X-CSRF-Token': csrf })).status, 200);
  assert.equal((await fetch(base + '/api/me', { headers: { Cookie: cookie } })).status, 401);
  const second = await post('/api/login');
  const oldCookie = second.headers.get('set-cookie').split(';')[0];
  const third = await post('/api/login', credentials, { Cookie: oldCookie });
  const newCookie = third.headers.get('set-cookie').split(';')[0];
  assert.notEqual(oldCookie, newCookie);
  assert.equal((await fetch(base + '/api/me', { headers: { Cookie: oldCookie } })).status, 401);
  clock += 60001;
  assert.equal((await fetch(base + '/api/me', { headers: { Cookie: newCookie } })).status, 401);
});
