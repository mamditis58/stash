let csrf;
const result = document.querySelector('#result');
async function request(path, options = {}) {
  try {
    const response = await fetch(path, { credentials: 'same-origin', ...options });
    const data = await response.json();
    if (response.ok && data.csrf) csrf = data.csrf;
    if (response.status === 401 || (response.ok && path === '/api/logout')) csrf = undefined;
    result.textContent = `${response.status}\n${JSON.stringify(data, null, 2)}`;
  } catch { result.textContent = 'Cannot reach the server'; }
}
document.querySelector('#credentials').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  form.elements.password.value = '';
  await request(`/api/${event.submitter.value}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
});
document.querySelector('#me').onclick = () => request('/api/me');
document.querySelector('#logout').onclick = () => request('/api/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrf || '' } });
request('/api/me');
