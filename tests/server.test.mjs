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
 apply({connection:{fetch:{register(v){routes.set(v.path,v.fetch);}}},effect(fn){dispose=fn();}},{root});
 return {root,routes,call:(name,body)=>routes.get('/api/personal-social/'+name)(new Request('http://localhost/api/personal-social/'+name,body?{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}}:{})),dispose:()=>dispose()};
}
async function settled(app){for(let i=0;i<100;i++){const state=await(await app.call('state')).json();if(!state.sync.running)return state;await new Promise(r=>setTimeout(r,5));}throw Error('Server did not settle');}
async function jobFrom(browser){for(let i=0;i<100;i++){const r=await(await browser('/poll')).json();if(r.job)return r.job;await new Promise(r=>setTimeout(r,5));}throw Error('job not delivered');}
async function pairBrowser(app){const code=new URL((await(await app.call('browser/pair',{})).json()).code);const base=`http://127.0.0.1:${code.port}`;const send=(path,token,body={})=>fetch(base+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});const token=(await(await send('/pair',code.hash.slice(1),{label:'测试浏览器'})).json()).token;return (path,body)=>send(path,token,body);}
test('extension login, continue and account synchronization use the paired browser',async t=>{
 const app=await harness();t.after(()=>app.dispose());assert.equal((await app.call('sync',{platform:'douyin'})).status,400);const browser=await pairBrowser(app);
 assert.equal((await app.call('sync',{platform:'douyin'})).status,202);const job=await jobFrom(browser);
 await browser('/result',{id:job.id,status:'needs_login'});let state=await settled(app);assert.equal(state.environment,undefined);assert.equal(state.sync.phase,'needs_login');assert.deepEqual(state.accounts,{});
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
test('backend exposes extension connection only and rejects obsolete provider selection',async t=>{
 const seed=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',{url:'https://www.douyin.com/user/self',name:'cached fixture',accountId:'fixture',fans:'1',following:'2',works:[]}));
 const app=await harness(seed);t.after(()=>app.dispose());const initial=await(await app.call('state')).json();
 assert.equal(initial.environment,undefined);assert.equal(app.routes.has('/api/personal-social/environment'),false);assert.deepEqual(initial.accounts,seed.accounts);
 const browser=await pairBrowser(app);
 for(const provider of ['auto','ego','invented']){
  assert.equal((await app.call('settings',{provider})).status,400);
  assert.equal((await app.call('sync',{platform:'douyin',provider})).status,400);
 }
 assert.equal((await(await browser('/poll')).json()).job,null);
 assert.equal((await(await app.call('state')).json()).settings.provider,'browser');
 await app.call('sync',{platform:'douyin'});const job=await jobFrom(browser);
 assert.equal((await app.call('sync',{platform:'douyin',provider:'ego'})).status,400);
 await browser('/result',{id:job.id,status:'needs_login'});await settled(app);
});
test('simultaneous requests for the same account deliver only one browser task',async t=>{
 const app=await harness();t.after(()=>app.dispose());const browser=await pairBrowser(app);
 const requests=await Promise.all([app.call('sync',{platform:'douyin'}),app.call('sync',{platform:'douyin'})]);
 assert.deepEqual(requests.map(v=>v.status),[202,202]);
 const job=await jobFrom(browser);assert.equal(job.platform,'douyin');assert.equal((await(await browser('/poll')).json()).job,null);
 await browser('/result',{id:job.id,status:'needs_login'});const state=await settled(app);assert.equal(state.sync.phase,'needs_login');assert.deepEqual(state.accounts,{});
});

test('backup restores accounts, works, archives and settings without changing live data', async t=>{
 const {readFile,rm}=await import('node:fs/promises');
 const {loadState}=await import('../src/store.mjs');
 const {unbindAccount}=await import('../src/core.mjs');
 let seed=applySnapshot(emptyState('Asia/Shanghai'),'douyin',normalizeSnapshot('douyin',{url:'https://www.douyin.com/user/self',accountId:'backup-fixture',name:'备份测试',fans:'42',following:'2',works:[]}));
 seed=unbindAccount(seed,'douyin');
 seed=applySnapshot(seed,'douyin',normalizeSnapshot('douyin',{url:'https://www.douyin.com/user/self',accountId:'current-fixture',name:'当前测试',fans:'55',following:'3',works:[{url:'https://www.douyin.com/video/123',title:'备份作品',kind:'视频'}]}));
 const app=await harness(seed);t.after(async()=>{await app.dispose();await rm(app.root,{recursive:true,force:true});});
 const before=await readFile(join(app.root,'accounts.json'),'utf8');
 const response=await app.call('backup',{});assert.equal(response.status,200);
 const backup=await response.json();assert.deepEqual(backup,seed);
 const restored=await mkdtemp(join(tmpdir(),'social-backup-restore-'));t.after(()=>rm(restored,{recursive:true,force:true}));
 await saveState(restored,backup);const loaded=await loadState(restored);
 assert.equal(loaded.accounts.douyin.fans.value,55);assert.equal(loaded.accounts.douyin.works[0].title,'备份作品');assert.equal(loaded.archives[0].fans.value,42);
 assert.equal(await readFile(join(app.root,'accounts.json'),'utf8'),before);
});

test('backup refuses to export an empty replacement when stored data is corrupt',async t=>{
 const {writeFile,readFile,rm}=await import('node:fs/promises');
 const root=await mkdtemp(join(tmpdir(),'social-backup-corrupt-'));
 await writeFile(join(root,'accounts.json'),'broken-original');
 const app=await harness(undefined,root);t.after(async()=>{await app.dispose();await rm(root,{recursive:true,force:true});});
 const response=await app.call('backup',{});assert.equal(response.status,500);
 assert.ok((await response.json()).error);
 assert.equal(await readFile(join(root,'accounts.json'),'utf8'),'broken-original');
});

test('saved account with unconfirmed history finishes as partial, not user-paused or complete',async t=>{
 const app=await harness();t.after(()=>app.dispose());const browser=await pairBrowser(app);
 await app.call('sync',{platform:'douyin'});const job=await jobFrom(browser);
 await browser('/result',{id:job.id,status:'ok',raw:{url:'https://www.douyin.com/user/self',name:'合成账号',accountId:'partial-fixture',fans:'7',following:'2',works:[],collectionProgress:{mode:'history',status:'paused',reason:'no_progress',checkpoint:null,scanned:0}}});
 const s=await settled(app);assert.equal(s.accounts.douyin.fans.value,7);assert.equal(s.sync.phase,'partial');assert.equal(s.accounts.douyin.workSync.historyComplete,false);
});
