import http from 'node:http';
import { randomBytes, scrypt as scryptCallback, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const scrypt = promisify(scryptCallback);
const digest = value => createHash('sha256').update(value).digest('hex');
const token = () => randomBytes(32).toString('hex');

// Each server instance owns disposable accounts and sessions. Restart resets both.
export function createApp({ sessionTtlMs = 15 * 60 * 1000, now = Date.now } = {}) {
  const users = new Map();
  const sessions = new Map();
  const reply = (res, status, data, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
    res.end(JSON.stringify(data));
  };
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw new Error('Use application/json');
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 4096) throw new Error('Request too large');
    }
    return JSON.parse(raw);
  }
  return http.createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && path === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'" });
        return res.end(await readFile(new URL('./public/index.html', import.meta.url)));
      }
      if (req.method === 'GET' && path === '/app.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        return res.end(await readFile(new URL('./public/app.js', import.meta.url)));
      }
      // Browser POSTs must originate at this server. CLI requests may omit Origin.
      if (req.method === 'POST' && req.headers.origin && req.headers.origin !== `http://${req.headers.host}`)
        return reply(res, 403, { error: 'Origin rejected' });
      if (req.method === 'POST' && ['/api/register', '/api/login'].includes(path)) {
        const { username, password } = await body(req);
        if (typeof username !== 'string' || !/^[a-zA-Z0-9_-]{3,32}$/.test(username) ||
            typeof password !== 'string' || password.length < 12 || password.length > 128)
          return reply(res, 400, { error: 'Use a 3–32 character username and a 12–128 character password' });
        if (path === '/api/register') {
          if (users.has(username)) return reply(res, 409, { error: 'Username already exists' });
          const salt = randomBytes(16).toString('hex');
          const hash = await scrypt(password, salt, 64);
          // Recheck after the asynchronous hash to handle simultaneous registrations.
          if (users.has(username)) return reply(res, 409, { error: 'Username already exists' });
          users.set(username, { salt, hash });
          return reply(res, 201, { message: 'Registered. Now log in.' });
        }
        const user = users.get(username);
        const hash = await scrypt(password, user?.salt ?? 'dummy-salt', 64);
        if (!user || !timingSafeEqual(hash, user.hash)) return reply(res, 401, { error: 'Invalid credentials' });
        const sid = token();
        const csrf = token();
        const previous = req.headers.cookie?.match(/(?:^|;\s*)sid=([a-f0-9]{64})(?:;|$)/)?.[1];
        if (previous) sessions.delete(digest(previous));
        for (const [key, session] of sessions) if (session.expires <= now()) sessions.delete(key);
        sessions.set(digest(sid), { username, csrf, expires: now() + sessionTtlMs });
        return reply(res, 200, { username, csrf }, {
          'Set-Cookie': `sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}`
        });
      }
      const sid = req.headers.cookie?.match(/(?:^|;\s*)sid=([a-f0-9]{64})(?:;|$)/)?.[1];
      const key = sid && digest(sid);
      const session = key && sessions.get(key);
      if (path === '/api/me' || path === '/api/logout') {
        if (!session || session.expires <= now()) {
          if (key) sessions.delete(key);
          return reply(res, 401, { error: 'Log in first (session missing or expired)' });
        }
        if (req.method === 'GET' && path === '/api/me')
          return reply(res, 200, { username: session.username, csrf: session.csrf });
        if (req.method === 'POST' && path === '/api/logout') {
          if (req.headers['x-csrf-token'] !== session.csrf) return reply(res, 403, { error: 'CSRF token rejected' });
          sessions.delete(key);
          return reply(res, 200, { message: 'Logged out' }, { 'Set-Cookie': 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
        }
      }
      reply(res, 404, { error: 'Route not found' });
    } catch {
      reply(res, 400, { error: 'Invalid request' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, '127.0.0.1', () => console.log(`Stash playground: http://127.0.0.1:${port}`));
}
