import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

test('DSH release archive loads its client and serves connectors without the standalone bundle', async t => {
  const repository = fileURLToPath(new URL('../', import.meta.url));
  const temporary = await mkdtemp(join(tmpdir(), 'social-package-'));
  const cleanups = [];
  t.after(async () => {
    for (const cleanup of cleanups.reverse()) await cleanup?.();
    await rm(temporary, { recursive: true, force: true });
  });
  const archive = join(temporary, 'workbench.tgz');
  execFileSync('pnpm', ['pack', '--out', archive], { cwd: repository, stdio: 'pipe' });
  const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).split('\n');
  assert(!entries.includes('package/lib/standalone.js'), 'DSH archive must not include the standalone browser bundle');
  for (const name of ['lib/client.js', 'lib/browser-connector.zip', 'lib/browser-extension/chromium/manifest.json', 'lib/browser-extension/firefox/manifest.json', 'dsh/index.js', 'cordis.patch.yml', 'standalone/server.mjs', 'standalone/client-entry.jsx', 'scripts/build-standalone.mjs']) {
    assert(entries.includes('package/' + name), `Missing release file: ${name}`);
  }
  execFileSync('tar', ['-xzf', archive, '-C', temporary]);
  const root = join(temporary, 'package');
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'junction');
  execFileSync(process.execPath, ['scripts/check-workbench-package.mjs'], { cwd: root, stdio: 'pipe' });
  const { apply } = await import(pathToFileURL(join(root, 'dsh/index.js')));
  const routes = new Map();
  const data = join(temporary, 'data');
  await mkdir(data);
  apply({ connection: { fetch: { register(route) { routes.set(route.path, route.fetch); } } }, effect(fn) { cleanups.push(fn()); } }, { root: data, browserExecutable: '/nonexistent-test-browser' });
  const download = await routes.get('/api/personal-social/browser/download')(new Request('http://localhost/api/personal-social/browser/download'));
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'application/zip');
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), await readFile(join(root, 'lib/browser-connector.zip')));
});
