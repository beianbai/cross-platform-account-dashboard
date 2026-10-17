import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
await build({
  entryPoints: [fileURLToPath(new URL('../standalone/client-entry.jsx', import.meta.url))],
  outfile: fileURLToPath(new URL('../lib/standalone.js', import.meta.url)),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['chrome120', 'firefox115', 'safari17'],
  minify: true,
  sourcemap: false,
  legalComments: 'eof',
  define: { 'process.env.NODE_ENV': '"production"', __PSW_VERSION__: JSON.stringify(version), __PSW_RUNTIME__: JSON.stringify('独立工作台') },
});
console.log('Built standalone React interface from the shared client.');
