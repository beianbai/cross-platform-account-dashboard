import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../extension/popup.js',import.meta.url),'utf8');
const html=await readFile(new URL('../extension/popup.html',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function popup(initial={},handler=async()=>({ok:true})){
 const nodes=new Map();
 function element(id){if(!nodes.has(id))nodes.set(id,{id,textContent:'',value:id==='label'?'我的浏览器':'',hidden:false,disabled:false,dataset:{},attributes:{},listeners:{},setAttribute(name,value){this.attributes[name]=String(value);},removeAttribute(name){delete this.attributes[name];},addEventListener(name,fn){this.listeners[name]=fn;},focus(){if(!this.disabled)this.focused=true;}});return nodes.get(id);}
 for(const id of ['pair','poll','disconnect','reconnect','cancel-pair','pair-form','pair-panel','connected-panel','status','code','code-error','label','connection-state','connection-title','connection-detail','task-state','task-detail','result-text','result-time'])element(id);
 const state={...initial},messages=[];let onChanged;
 const document={getElementById:element,querySelectorAll:selector=>selector==='button'?['pair','poll','disconnect','reconnect','cancel-pair'].map(element):[]};
 const api={storage:{local:{get:async()=>({...state})},onChanged:{addListener(fn){onChanged=fn;}}},runtime:{async sendMessage(message){messages.push(message);return handler(message,state);}}};
 vm.runInNewContext(source,{chrome:api,document,URL,Date,console});await tick();
 return {nodes,state,messages,async event(id,type='click'){const result=element(id).listeners[type]?.({preventDefault(){}});await tick();return result;},change(values){const changes={};for(const [key,newValue]of Object.entries(values)){changes[key]={oldValue:state[key],newValue};state[key]=newValue;}onChanged(changes,'local');},node:element};
}
const connection={base:'http://127.0.0.1:54321',token:'a'.repeat(64),label:'日常浏览器'};

test('paired popup hides pairing until explicit reconnect and distinguishes platform login',async()=>{
 const ui=await popup({connection,status:'连接成功。现在可回工作台读取账号。'});
 assert.equal(ui.node('pair-panel').hidden,true);assert.equal(ui.node('connected-panel').hidden,false);
 assert.match(ui.node('connection-title').textContent,/日常浏览器/);
 assert.match(ui.node('connection-detail').textContent,/登录/);
 await ui.event('reconnect');assert.equal(ui.node('pair-panel').hidden,false);assert.equal(ui.node('code').focused,true);
 await ui.event('cancel-pair');assert.equal(ui.node('pair-panel').hidden,true);
});

test('unpaired popup explains manual and automatic tasks without an outdated platform count',async()=>{
 const ui=await popup();assert.equal(ui.node('connected-panel').hidden,true);assert.equal(ui.node('pair-panel').hidden,false);
 assert.match(html,/手动读取.*自动同步/);assert.doesNotMatch(html,/三个平台|只在你从工作台发起/);
});

test('pair validates missing code beside field and clears error on input',async()=>{
 const ui=await popup();await ui.event('pair-form','submit');
 assert.equal(ui.messages.length,0);assert.match(ui.node('code-error').textContent,/连接码/);assert.equal(ui.node('code').attributes['aria-invalid'],'true');
 ui.node('code').value='dsh-social://127.0.0.1:54321#'+'a'.repeat(64);await ui.event('code','input');assert.equal(ui.node('code-error').textContent,'');
});

test('pair shows pending immediately and only confirms success after stored connection',async()=>{
 let resolve;const ui=await popup({},()=>new Promise(done=>{resolve=done;}));
 ui.node('code').value='dsh-social://127.0.0.1:54321#'+'a'.repeat(64);
 const pending=ui.event('pair-form','submit');await tick();
 assert.equal(ui.node('pair').disabled,true);assert.equal(ui.node('status').dataset.tone,'pending');assert.match(ui.node('status').textContent,/正在连接/);
 ui.state.connection=connection;resolve({ok:true});await pending;
 assert.equal(ui.node('pair-panel').hidden,true);assert.equal(ui.node('status').dataset.tone,'success');assert.equal(ui.node('code').value,'');assert.equal(ui.node('poll').focused,true);
});

test('action errors stay visible and never use success styling',async()=>{
 const ui=await popup({connection},async()=>({error:'正在读取，请稍后断开'}));await ui.event('disconnect');
 assert.equal(ui.node('status').dataset.tone,'error');assert.equal(ui.node('status').attributes.role,'alert');assert.match(ui.node('status').textContent,/稍后断开/);assert.equal(ui.node('pair-panel').hidden,true);assert.equal(ui.node('disconnect').disabled,false);
});

test('accepted poll is not completion and structured storage drives final task result',async()=>{
 const ui=await popup({connection,status:'读取完成，请回工作台查看。'});
 await ui.event('poll');assert.equal(ui.node('status').dataset.tone,'pending');assert.doesNotMatch(ui.node('status').textContent,/同步成功|读取完成/);
 ui.change({activity:{phase:'reading',message:'正在读取哔哩哔哩',updatedAt:'2026-10-11T01:00:00Z'}});await tick();assert.match(ui.node('task-detail').textContent,/正在读取/);
 ui.change({activity:{phase:'success',message:'读取完成，数据已保存。',updatedAt:'2026-10-11T01:01:00Z'}});await tick();assert.equal(ui.node('status').dataset.tone,'success');assert.match(ui.node('result-text').textContent,/数据已保存/);
});

test('disconnect only changes layout after actual storage removal',async()=>{
 let resolve;const ui=await popup({connection},()=>new Promise(done=>{resolve=done;}));
 const pending=ui.event('disconnect');await tick();assert.equal(ui.node('status').dataset.tone,'pending');assert.equal(ui.node('pair-panel').hidden,true);
 delete ui.state.connection;resolve({ok:true});await pending;assert.equal(ui.node('pair-panel').hidden,false);assert.equal(ui.node('connected-panel').hidden,true);assert.equal(ui.node('status').dataset.tone,'neutral');
});

test('legacy failure strings receive error or attention treatment',async()=>{
 for(const message of ['连接或读取未完成。请确认 Desktop 已打开。','请在浏览器完成登录后继续读取。']){
 const ui=await popup({connection,status:message});assert.ok(['error','attention'].includes(ui.node('task-state').dataset.tone));
 }
});


test('empty task check reports completion without claiming a data sync',async()=>{
 const ui=await popup({connection},async()=>({accepted:true}));await ui.event('poll');
 ui.change({activity:{phase:'idle',message:'没有待执行任务',updatedAt:'2026-10-11T01:00:00Z'}});await tick();
 assert.match(ui.node('status').textContent,/检查完成.*没有待执行/);assert.equal(ui.node('status').dataset.tone,'neutral');assert.equal(ui.node('result-text').textContent,'暂无读取记录');
});

test('latest saved result survives idle polling and background updates stay quiet',async()=>{
 const lastResult={phase:'success',message:'哔哩哔哩读取完成，数据已保存。',updatedAt:'2026-10-11T01:00:00Z'};
 const ui=await popup({connection,lastResult,activity:{phase:'idle',message:'没有待执行任务'}});
 assert.equal(ui.node('result-text').textContent,lastResult.message);assert.equal(ui.node('result-time').hidden,false);
 ui.change({activity:{phase:'reading',message:'正在读取抖音'}});await tick();
 assert.equal(ui.node('result-text').textContent,lastResult.message);assert.equal(ui.node('status').textContent,'');
});

test('format-invalid pairing is blocked before a browser request',async()=>{
 const ui=await popup();ui.node('code').value='dsh-social://127.0.0.1.evil.test:54321#'+'a'.repeat(64);
 await ui.event('pair-form','submit');assert.equal(ui.messages.length,0);assert.match(ui.node('code-error').textContent,/格式不正确/);
});

test('legacy in-progress read is not mistaken for a login request',async()=>{
 const ui=await popup({connection,status:'正在读取平台；未登录时请亲自登录，不需要提供密码给工作台。'});
 assert.equal(ui.node('task-state').textContent,'正在读取');assert.equal(ui.node('task-state').dataset.tone,'pending');
});

test('idle arriving before poll acknowledgement remains completed',async()=>{
 let resolve;const ui=await popup({connection},()=>new Promise(done=>{resolve=done;}));
 const pending=ui.event('poll');await tick();
 ui.change({activity:{phase:'idle',message:'暂无待执行任务。',updatedAt:'2026-10-11T01:00:00Z'}});await tick();
 assert.match(ui.node('status').textContent,/检查完成/);
 resolve({ok:true,accepted:true});await pending;
 assert.match(ui.node('status').textContent,/检查完成.*没有待执行任务/);assert.equal(ui.node('status').dataset.tone,'neutral');
});

test('success task label precisely describes a finished read',async()=>{
 const ui=await popup({connection,activity:{phase:'success',message:'读取完成，请回看板查看。'}});
 assert.equal(ui.node('task-state').textContent,'读取完成');
});

test('submitted collector result stays neutral until the workbench confirms saving',async()=>{
 const ui=await popup({connection},async()=>({accepted:true}));await ui.event('poll');
 ui.change({activity:{phase:'submitted',message:'已提交读取结果，请回工作台查看保存结果。',updatedAt:'2026-10-11T01:00:00Z'}});
 assert.equal(ui.node('task-state').textContent,'已提交');assert.equal(ui.node('status').dataset.tone,'neutral');assert.equal(ui.node('task-state').dataset.tone,'neutral');assert.match(ui.node('result-text').textContent,/保存结果/);
});
