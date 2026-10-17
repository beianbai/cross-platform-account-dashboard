import {mkdir,readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const cover=await readFile(new URL('../assets/cover.png',import.meta.url));
if(cover.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('封面必须是有效 PNG');
const packageJSON=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const source=(await readFile(new URL('../src/client.js',import.meta.url),'utf8'))
 .replace('__WORKBENCH_COVER__','data:image/png;base64,'+cover.toString('base64'))
 .replace(/\b__PSW_VERSION__\b/g,JSON.stringify(packageJSON.version))
 .replace(/\b__PSW_RUNTIME__\b/g,JSON.stringify('桌面工作台'));
new vm.Script(source,{filename:'client.js'});
if(!source.includes('window.__ModuleLoader__.load('))throw Error('缺少客户端加载器注册');
await mkdir(new URL('../lib/',import.meta.url),{recursive:true});
await writeFile(new URL('../lib/client.js',import.meta.url),'/* Built single-file module; no runtime compiler required. */\n'+source);
console.log('Built lib/client.js; syntax verified.');
const {zipEntries}=await import('./zip.mjs');
const sources=await Promise.all(['../src/platforms.mjs','../src/work-traversal.mjs','../src/collector.mjs','../extension/adapter.mjs','../extension/background.mjs'].map(p=>readFile(new URL(p,import.meta.url),'utf8')));
const background='(()=>{\n'+sources.map(s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n')+'\n})();\n';new vm.Script(background);
const shared=await Promise.all(['popup.html','popup.js','popup.css'].map(async name=>[name,await readFile(new URL('../extension/'+name,import.meta.url),'utf8')]));
const manifest={manifest_version:3,name:'跨平台账号看板 · 浏览器连接',version:packageJSON.version,description:'在你自己的浏览器中登录，授权本机工作台只读同步账号与作品。',permissions:['storage','scripting','alarms'],host_permissions:['http://127.0.0.1/*','https://www.xiaohongshu.com/*','https://www.douyin.com/*','https://www.bilibili.com/*','https://space.bilibili.com/*','https://x.com/*','https://www.x.com/*'],icons:{16:'icon16.png',32:'icon32.png',48:'icon48.png',128:'icon128.png'},action:{default_popup:'popup.html',default_title:'跨平台账号看板',default_icon:{16:'icon16.png',32:'icon32.png'}},content_security_policy:{extension_pages:"script-src 'self'; object-src 'none'"}};
const iconFiles=await Promise.all(['icon16.png','icon32.png','icon48.png','icon128.png','logo.svg'].map(async name=>[name,await readFile(new URL('../assets/'+name,import.meta.url))]));
const entries=[['README.md',await readFile(new URL('../extension/README.md',import.meta.url),'utf8')]];
for(const browser of ['chromium','firefox']){
 const specific=browser==='chromium'?{background:{service_worker:'background.js'},minimum_chrome_version:'120'}:{background:{scripts:['background.js']},browser_specific_settings:{gecko:{id:'personal-social-local@dsh.local',strict_min_version:'115.0'}}};
 const files=[...shared,...iconFiles,['background.js',background],['manifest.json',JSON.stringify({...manifest,...specific},null,2)+'\n']];
 const directory=new URL('../lib/browser-extension/'+browser+'/',import.meta.url);await mkdir(directory,{recursive:true});
 for(const [name,content] of files){await writeFile(new URL(name,directory),content);entries.push([browser+'/'+name,content]);}
}
await writeFile(new URL('../lib/browser-connector.zip',import.meta.url),zipEntries(entries));
console.log('Built local Chromium/Firefox connectors and downloadable ZIP; no remote code or publishing.');
