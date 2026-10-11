import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
// Optional argument is a local QA dependency directory, never shipped in the workbench.
const require=createRequire(resolve(process.argv[2]||'.','package.json'));
const {build}=require('esbuild');
const react=require.resolve('react'),dom=require.resolve('react-dom/client');
await mkdir(new URL('../.preview/',import.meta.url),{recursive:true});
await build({entryPoints:[new URL('./preview-entry.jsx',import.meta.url).pathname],bundle:true,outfile:new URL('../.preview/fixture.js',import.meta.url).pathname,platform:'browser',define:{'process.env.NODE_ENV':'"production"'},alias:{react:dirname(react),'react-dom':dirname(dom)},nodePaths:[resolve(dirname(dom),'../')],logLevel:'info'});
await writeFile(new URL('../.preview/index.html',import.meta.url),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>跨平台账号看板 · UI QA</title><style>html,body,#root{height:100%;margin:0}body{background:#101419}</style><body><div id="root"></div><script src="fixture.js"></script></body></html>');
