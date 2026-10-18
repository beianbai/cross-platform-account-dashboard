import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { startStandalone, defaultDataRoot } from '../standalone/server.mjs';
const api = '/api/personal-social/';
async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), 'social-standalone-'));
  const app = await startStandalone({ root, port: 0, browserExecutable: '/nonexistent-test-browser' });
  t.after(async () => { await app.close(); await rm(root, { recursive: true, force: true }); });
  return app;
}
async function login(app) {
  const code = app.pairing.code;
  const response = await fetch(app.url + '/auth/pair', { method: 'POST', headers: { Origin: app.url, 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/); assert.match(cookie, /Max-Age=/);
  return { cookie: cookie.split(';')[0], csrf: (await response.json()).csrf };
}
function call(app, auth, path, body, extra = {}) {
  return fetch(app.url + api + path, { method: body === undefined ? 'GET' : 'POST', headers: { Cookie: auth.cookie, Origin: app.url, 'Content-Type': 'application/json', 'X-CSRF-Token': auth.csrf, ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
function raw(app, path, headers = {}) {
  return new Promise((resolve, reject) => { const req = request({ hostname: '127.0.0.1', port: new URL(app.url).port, path, headers }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end(); });
}
test('standalone protects state, bootstrap, Host and browser request origin', async t => {
  const app = await setup(t);
  assert.match(defaultDataRoot(), /cross-platform-account-dashboard/);
  assert.equal((await fetch(app.url + api + 'state')).status, 401);
  assert.equal((await fetch(app.url + '/session')).status, 401);
  assert.equal(await raw(app, '/', { Host: 'evil.test' }), 403);
  assert.equal((await fetch(app.url + '/', { headers: { Origin: 'https://evil.test' } })).status, 403);
  assert.equal(await raw(app, '/', { 'Sec-Fetch-Site': 'cross-site' }), 403);
  const code = app.pairing.code;
  for (const origin of [undefined, 'null', 'https://evil.test']) {
    const response = await fetch(app.url + '/auth/pair', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify({ code }) });
    assert.equal(response.status, 403);
  }
  const auth = await login(app);
  assert.equal((await call(app, auth, 'state')).status, 200);
  assert.equal((await fetch(app.url + '/auth/pair', { method: 'POST', headers: { Origin: app.url, 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })).status, 401);
  assert.equal((await call(app, auth, 'state', undefined, { Origin: 'https://evil.test' })).status, 403);
  assert.equal(await raw(app, api + 'state', { Cookie: auth.cookie, 'Sec-Fetch-Site': 'cross-site' }), 403);
});
test('standalone rejects CSRF, oversized bodies and arbitrary filesystem routes', async t => {
  const app = await setup(t), auth = await login(app);
  for (const headers of [{ 'X-CSRF-Token': '' }, { Origin: '' }, { 'Content-Type': 'text/plain' }]) assert.equal((await call(app, auth, 'settings', { provider: 'browser' }, headers)).status, 403);
  assert.equal((await call(app, auth, 'settings', { provider: 'x'.repeat(9000) })).status, 413);
  assert.equal((await call(app, auth, 'settings', { provider: 'invalid' })).status, 400);
  for (const path of ['/accounts.json', '/standalone-session.json', '/src/client.js', '/%2e%2e/package.json', '/assets/../../package.json']) assert.equal(await raw(app, path, { Cookie: auth.cookie }), 404);
  const bundle = await fetch(app.url + '/assets/standalone.js'); assert.equal(bundle.status, 200); assert.match(bundle.headers.get('content-type'), /javascript/); assert.ok((await bundle.text()).length > 100000);
  const download = await call(app, auth, 'browser/download'); assert.equal(download.status, 200); assert.equal(download.headers.get('content-type'), 'application/zip'); assert.equal(Buffer.from(await download.arrayBuffer()).subarray(0, 2).toString(), 'PK');
  const page = await fetch(app.url + '/'); assert.equal(page.status, 200); assert.match(await page.text(), /\/assets\/standalone.js/); assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
});
test('same business service pairs, syncs and persists state and login across graceful restart', async t => {
  const app = await setup(t), auth = await login(app);
  assert.equal((await call(app, auth, 'settings', { provider: 'browser' })).status, 200);
  assert.equal((await call(app, auth, 'sync', { platform: 'douyin' })).status, 400);
  const pair = new URL((await (await call(app, auth, 'browser/pair', {})).json()).code);
  const extensionOrigin = 'chrome-extension://' + 'a'.repeat(32);
  let extensionToken = pair.hash.slice(1);
  const bridge = (path, body = {}) => fetch('http://127.0.0.1:' + pair.port + path, { method: 'POST', headers: { Origin: extensionOrigin, Authorization: 'Bearer ' + extensionToken, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  extensionToken = (await (await bridge('/pair', { label: 'Standalone test' })).json()).token;
  assert.equal((await call(app, auth, 'sync', { platform: 'douyin' })).status, 202);
  let job;
  for (let n = 0; n < 100 && !job; n++) { job = (await (await bridge('/poll')).json()).job; if (!job) await new Promise(r => setTimeout(r, 10)); }
  assert.equal(job.platform, 'douyin');
  assert.equal((await bridge('/result', { id: job.id, status: 'ok', raw: { url: 'https://www.douyin.com/user/self', name: 'Standalone fixture', accountId: 'standalone-fixture', fans: '42', following: '2', works: [] } })).status, 200);
  let state;
  for (let n = 0; n < 100; n++) { state = await (await call(app, auth, 'state')).json(); if (!state.sync.running) break; await new Promise(r => setTimeout(r, 10)); }
  assert.equal(state.accounts.douyin.fans.value, 42);
  assert.equal((await stat(join(app.root, 'standalone-session.json'))).mode & 0o777, 0o600);
  assert.equal(JSON.parse(await readFile(join(app.root, 'accounts.json'))).accounts.douyin.fans.value, 42);
  await app.close();
  const restarted = await startStandalone({ root: app.root, port: 0, browserExecutable: '/nonexistent-test-browser' }); t.after(() => restarted.close());
  const session = await fetch(restarted.url + '/session', { headers: { Cookie: auth.cookie } }); assert.equal(session.status, 200);
  auth.csrf = (await session.json()).csrf;
  state = await (await call(restarted, auth, 'state')).json(); assert.equal(state.settings.provider, 'browser'); assert.equal(state.accounts.douyin.fans.value, 42); assert.equal(state.browserConnection.paired, true);
  assert.equal((await call(restarted, auth, 'browser/revoke', { confirm: true })).status, 200);
  await restarted.close();
});
test('single data root cannot be opened concurrently and graceful close releases lock', async t => {
  const app = await setup(t);
  await assert.rejects(startStandalone({ root: app.root, port: 0 }), /already|占用|运行|lock/i);
  await app.close();
  const next = await startStandalone({ root: app.root, port: 0, browserExecutable: '/nonexistent-test-browser' }); await next.close();
});

test('standalone refuses existing DSH data and cleans up after a port bind failure', async t => {
  const app = await setup(t), other = await mkdtemp(join(tmpdir(), 'social-standalone-separate-'));
  t.after(() => rm(other, { recursive: true, force: true }));
  await writeFile(join(other, 'accounts.json'), '{"existing":"untouched"}');
  await assert.rejects(startStandalone({ root: other, port: 0 }), /DSH/);
  assert.equal(await readFile(join(other, 'accounts.json'), 'utf8'), '{"existing":"untouched"}');
  await assert.rejects(stat(join(other, '.standalone.lock')), { code: 'ENOENT' });
  await rm(join(other, 'accounts.json'));
  await assert.rejects(startStandalone({ root: other, port: Number(new URL(app.url).port), browserExecutable: '/nonexistent-test-browser' }), { code: 'EADDRINUSE' });
  await assert.rejects(stat(join(other, '.standalone.lock')), { code: 'ENOENT' });
  const recovered = await startStandalone({ root: other, port: 0, browserExecutable: '/nonexistent-test-browser' }); await recovered.close();
});
test('chunked body limit cannot be bypassed without Content-Length', async t => {
  const app = await setup(t), auth = await login(app);
  const status = await new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: new URL(app.url).port, path: api + 'settings', method: 'POST', headers: { Origin: app.url, Cookie: auth.cookie, 'X-CSRF-Token': auth.csrf, 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject); req.write('x'.repeat(5000)); req.end('y'.repeat(5000));
  });
  assert.equal(status, 413);
});

test('storage location and backups require login; backup excludes local credentials', async t => {
  const app = await setup(t);
  assert.equal((await fetch(app.url + api + 'backup', {method:'POST',headers:{Origin:app.url,'Content-Type':'application/json'},body:'{}'})).status, 401);
  const auth = await login(app);
  assert.equal((await call(app, auth, 'backup', {}, {'X-CSRF-Token':''})).status, 403);
  const state = await (await call(app, auth, 'state')).json();
  assert.equal(state.storage.path, app.root);
  await call(app, auth, 'settings', {provider:'browser'});
  const credential = await readFile(join(app.root, 'standalone-session.json'), 'utf8');
  const response = await call(app, auth, 'backup', {});
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /attachment; filename="personal-social-backup-.*\.json"/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const backup = await response.json();
  assert.deepEqual(Object.keys(backup).sort(), ['accounts','archives','settings','version']);
  assert.equal(backup.settings.provider, 'browser');
  assert.ok(!JSON.stringify(backup).includes(auth.cookie.split('=')[1]));
  assert.equal(await readFile(join(app.root, 'standalone-session.json'), 'utf8'), credential);
});
