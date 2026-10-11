// Isolated browser preview only: API fixture is never copied into the shipped extension.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('../.preview/extension/',import.meta.url);await mkdir(out,{recursive:true});
const html=await readFile(new URL('extension/popup.html',root),'utf8');
await writeFile(new URL('index.html',out),html.replace('<script src="popup.js">','<script src="fixture.js"></script><script src="popup.js">'));
for(const file of ['popup.css','popup.js'])await copyFile(new URL('extension/'+file,root),new URL(file,out));
await writeFile(new URL('fixture.js',out),`
const params=new URLSearchParams(location.search),mode=params.get('state')||'connected';
let onChange=()=>{};
const connection={label:'Chrome',base:'http://127.0.0.1:54321',token:'a'.repeat(64)};
const current=mode==='error'?{phase:'error',message:'哔哩哔哩页面未能识别，请返回看板查看原因。',updatedAt:new Date().toISOString()}:mode==='reading'?{phase:'reading',message:'正在读取哔哩哔哩图文投稿…',updatedAt:new Date().toISOString()}:{phase:'idle',message:'已连接，暂无待处理任务。',updatedAt:new Date().toISOString()};
const state=mode==='unpaired'?{}:{connection,activity:current,lastResult:{phase:'submitted',message:'已提交读取结果，请回工作台查看保存结果。',updatedAt:new Date().toISOString()}};
function change(values){const changes={};for(const [key,value]of Object.entries(values)){changes[key]={oldValue:state[key],newValue:value};if(value===undefined)delete state[key];else state[key]=value;}onChange(changes,'local');}
window.chrome={storage:{local:{get:async()=>structuredClone(state)},onChanged:{addListener(fn){onChange=fn;}}},runtime:{async sendMessage(m){if(m.type==='pair'){change({connection:{...connection,label:m.label},activity:{phase:'idle',message:'已连接'}});return {ok:true};}if(m.type==='disconnect'){change({connection:undefined,activity:{phase:'idle',message:'此扩展已断开'}});return {ok:true};}if(m.type==='poll'){change({activity:{phase:'checking',message:'正在检查工作台任务…',updatedAt:new Date().toISOString()}});setTimeout(()=>change({activity:{phase:'idle',message:'暂无待处理任务',updatedAt:new Date().toISOString()}}),900);return {ok:true,accepted:true};}}};
document.title='Extension · UI QA';
`);
console.log('Built isolated extension popup preview.');
