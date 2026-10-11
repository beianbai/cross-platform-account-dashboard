import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {apply} from '../dsh/index.js';
import {saveState} from '../src/store.mjs';
import {emptyState,normalizeSnapshot,applySnapshot} from '../src/core.mjs';
async function harness(seed,existingRoot){
 const routes=new Map();const root=existingRoot||await mkdtemp(join(tmpdir(),'social-server-test-'));let dispose;
 if(seed)await saveState(root,seed);
 apply({connection:{fetch:{register(v){routes.set(v.path,v.fetch);}}},effect(fn){dispose=fn();}},{root,browserExecutable:'/intentionally-missing-ego-browser'});
 return {root,call:(name,body)=>routes.get('/api/personal-social/'+name)(new Request('http://localhost/api/personal-social/'+name,body?{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}}:{})),dispose:()=>dispose()};
}
async function settled(app){for(let i=0;i<100;i++){const state=await(await app.call('state')).json();if(!state.sync.running)return state;await new Promise(r=>setTimeout(r,5));}throw Error('Server did not settle');}
async function jobFrom(browser){for(let i=0;i<100;i++){const r=await(await browser('/poll')).json();if(r.job)return r.job;await new Promise(r=>setTimeout(r,5));}throw Error('job not delivered');}
async function pairBrowser(app){const code=new URL((await(await app.call('browser/pair',{})).json()).code);const base=`http://127.0.0.1:${code.port}`;const send=(path,token,body={})=>fetch(base+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});const token=(await(await send('/pair',code.hash.slice(1),{label:'测试浏览器'})).json()).token;return (path,body)=>send(path,token,body);}
test('no Ego installation is needed for extension login, continue and account synchronization',async t=>{
 const app=await harness();t.after(()=>app.dispose());assert.equal((await app.call('sync',{platform:'douyin'})).status,400);const browser=await pairBrowser(app);
 assert.equal((await app.call('sync',{platform:'douyin'})).status,202);const job=await jobFrom(browser);
 await browser('/result',{id:job.id,status:'needs_login'});let state=await settled(app);assert.equal(state.environment.status,'missing');assert.equal(state.sync.phase,'needs_login');assert.deepEqual(state.accounts,{});
 assert.equal((await app.call('sync',{platform:'douyin'})).status,202);const retry=await jobFrom(browser);
 const raw={url:'https://www.douyin.com/user/self',accountId:'fixture-account',name:'浏览器账号',fans:'0',following:'12',workCount:'0',works:[],worksStatus:'empty',scope:'fixture only'};
 await browser('/result',{id:retry.id,status:'ok',raw});state=await settled(app);assert.equal(state.sync.phase,'complete');assert.equal(state.accounts.douyin.name,'浏览器账号');assert.equal(state.accounts.douyin.fans.value,0);
 assert.equal((await app.call('sync',{platform:'douyin'})).status,202);const changed=await jobFrom(browser);await browser('/result',{id:changed.id,status:'ok',raw:{...raw,accountId:'another-account'}});state=await settled(app);assert.equal(state.sync.phase,'account_mismatch');assert.equal(state.accounts.douyin.accountId,'fixture-account');
 assert.equal((await app.call('browser/revoke',{})).status,400);assert.equal((await app.call('browser/revoke',{confirm:true})).status,200);assert.equal((await app.call('sync',{platform:'douyin'})).status,400);assert.equal((await(await app.call('state')).json()).accounts.douyin.name,'浏览器账号');
});
test('replacement instance waits for disposal before reopening the same data root',async t=>{
 const first=await harness();await first.call('state');const second=await harness(undefined,first.root);t.after(()=>second.dispose());const closing=first.dispose();await closing;const state=await(await second.call('state')).json();assert.equal(state.browserConnection.available,true);
});
test('requires host-authenticated fetch routes',()=>assert.throws(()=>apply({connection:{}},{})));
test('empty state is usable without a session and rejects unsafe inputs',async()=>{
 const app=await harness();const initial=await (await app.call('state')).json();assert.equal(initial.version,2);assert.deepEqual(initial.accounts,{});
 for(const data of [{platform:'other'},{platform:'douyin',url:'http://127.0.0.1'},{platform:'douyin',url:'https://evil.com'}])assert.equal((await app.call('sync',data)).status,400);
 assert.equal((await app.call('unbind',{platform:'douyin'})).status,400);
 assert.equal((await app.call('state')).status,200);app.dispose();
});
test('environment endpoint remains available without a browser and leaves account data intact',async()=>{
 const seed=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',{url:'https://www.douyin.com/user/self',name:'cached fixture',accountId:'fixture',fans:'1',following:'2',works:[]}));
 const app=await harness(seed);const initial=await(await app.call('state')).json();assert.equal(initial.environment.status,'missing');assert.deepEqual(initial.accounts,seed.accounts);
 const results=await Promise.all([app.call('environment',{}),app.call('environment',{})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const after=await(await app.call('state')).json();assert.deepEqual(after.accounts,initial.accounts);assert.equal(after.environment.checking,false);assert.equal(after.sync.running,false);app.dispose();
 assert.equal((await app.call('environment',{})).status,503);
});
test('simultaneous requests for the same account deliver only one browser task',async t=>{
 const app=await harness();t.after(()=>app.dispose());const browser=await pairBrowser(app);
 const requests=await Promise.all([app.call('sync',{platform:'douyin'}),app.call('sync',{platform:'douyin'})]);
 assert.deepEqual(requests.map(v=>v.status),[202,202]);
 const job=await jobFrom(browser);assert.equal(job.platform,'douyin');assert.equal((await(await browser('/poll')).json()).job,null);
 await browser('/result',{id:job.id,status:'needs_login'});const state=await settled(app);assert.equal(state.sync.phase,'needs_login');assert.deepEqual(state.accounts,{});
});
