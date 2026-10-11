import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
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
  define: { 'process.env.NODE_ENV': '"production"' },
});
console.log('Built standalone React interface from the shared client.');
