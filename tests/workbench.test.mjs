import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {apply} from '../dsh/index.js';import {emptyState,normalizeSnapshot,applySnapshot} from '../src/core.mjs';import {saveState,loadState} from '../src/store.mjs';
const raw={url:'https://www.douyin.com/user/self',accountId:'fixture-owner',name:'测试账号',fans:'4',following:'2',works:[],workCount:'0'};
async function setup(t,seed){const root=await mkdtemp(join(tmpdir(),'social-v03-'));if(seed)await saveState(root,seed);const routes=new Map();let dispose;apply({connection:{fetch:{register(r){routes.set(r.path,r.fetch);}}},effect(fn){dispose=fn();}},{root,browserExecutable:'/missing-browser'});t.after(async()=>{await dispose();await rm(root,{recursive:true,force:true});});const call=async(p,data)=>{const route=routes.get('/api/personal-social/'+p);assert(route,`route ${p} must exist`);const response=await route(new Request('http://localhost/'+p,data?{method:'POST',body:JSON.stringify(data)}:{}));return {status:response.status,data:await response.json()};};await call('state');return {call,root};}
async function pair(app){const code=new URL((await app.call('browser/pair',{})).data.code),base='http://127.0.0.1:'+code.port;const send=async(p,token,data)=>{const r=await fetch(base+p,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(data)});return r.json();};const token=(await send('/pair',code.hash.slice(1),{label:'测试连接'})).token;return (p,data={})=>send(p,token,data);}
async function jobFrom(browser){for(let i=0;i<100;i++){const r=await browser('/poll');if(r.job)return r.job;await new Promise(r=>setTimeout(r,5));}throw Error('job not delivered');}
async function wait(app,predicate){for(let i=0;i<100;i++){const s=(await app.call('state')).data;if(predicate(s))return s;await new Promise(r=>setTimeout(r,10));}throw Error('state did not settle');}
test('settings persist independently, reject invalid plans, and preserve other platform settings',async t=>{const app=await setup(t,applySnapshot(emptyState(), 'douyin', normalizeSnapshot('douyin',raw)));const saved=await app.call('settings',{platform:'douyin',visible:false,schedule:{enabled:true,kind:'daily',time:'09:00',hours:6,timeZone:'Asia/Shanghai'}});assert.equal(saved.status,200);assert.equal((await loadState(app.root)).settings.platforms.douyin.visible,false);assert.equal((await app.call('settings',{platform:'douyin',schedule:{enabled:true,kind:'interval',hours:0}})).status,400);assert.equal((await app.call('settings',{provider:'invented'})).status,400);assert.equal((await app.call('state')).data.accounts.douyin.name,raw.name);});
test('login pauses a platform; manual recovery clears pause and adds only one daily sample',async t=>{const app=await setup(t,applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw)));const browser=await pair(app);await app.call('sync',{platform:'douyin'});let job=await jobFrom(browser);await browser('/result',{id:job.id,status:'needs_login'});let s=await wait(app,s=>!s.sync.running);assert.equal(s.settings.platforms.douyin.pausedReason,'needs_login');assert.equal(s.accounts.douyin.fans.value,4);await app.call('sync',{platform:'douyin',resume:true});job=await jobFrom(browser);await browser('/result',{id:job.id,status:'ok',raw:{...raw,fans:'5'}});s=await wait(app,s=>!s.sync.running);assert.equal(s.settings.platforms.douyin.pausedReason,null);assert.equal(s.accounts.douyin.daily.length,1);assert.equal(s.accounts.douyin.fans.value,5);});
test('unbind during collection archives old record and rejects late result',async t=>{const app=await setup(t,applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw)));const browser=await pair(app);await app.call('sync',{platform:'douyin'});const job=await jobFrom(browser);assert.equal((await app.call('unbind',{platform:'douyin',confirm:true})).status,200);await browser('/result',{id:job.id,status:'ok',raw:{...raw,fans:'9'}});const s=await wait(app,s=>!s.sync.running);assert.equal(s.accounts.douyin,undefined);assert.equal(s.archives[0].fans.value,4);});
test('disabling a queued plan clears its running state',async t=>{
 let seed=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw));seed=applySnapshot(seed,'x',normalizeSnapshot('x',{...raw,url:'https://x.com/fixture',accountId:'fixture'}));const app=await setup(t,seed),browser=await pair(app);
 await app.call('sync',{platform:'douyin'});const first=await jobFrom(browser);await app.call('sync',{platform:'x'});assert.equal((await app.call('state')).data.syncByPlatform.x.running,true);
 await app.call('settings',{platform:'x',schedule:{enabled:false}});await browser('/result',{id:first.id,status:'needs_login'});const s=await wait(app,s=>!s.sync.running);assert.equal(s.syncByPlatform.x.running,false);assert.equal(s.syncByPlatform.x.phase,'idle');
});
test('paused login restores original browser and page recovery metadata after restart',async t=>{
 const seed=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw));seed.settings.platforms.douyin.pausedReason='needs_login';seed.settings.platforms.douyin.recovery={provider:'ego',spaceId:42,url:raw.url};
 const app=await setup(t,seed),s=(await app.call('state')).data;assert.equal(s.syncByPlatform.douyin.provider,'ego');assert.equal(s.syncByPlatform.douyin.url,raw.url);
});
test('overdue schedules run once in background and successful completion advances the plan',async t=>{
 const seed=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw));const c=seed.settings.platforms.douyin;c.schedule.enabled=true;c.nextRunAt='2026-01-01T00:00:00.000Z';
 const app=await setup(t,seed),browser=await pair(app);let job;
 for(let i=0;i<250;i++){job=(await browser('/poll')).job;if(job)break;await new Promise(r=>setTimeout(r,10));}
 assert(job,'overdue job should start without opening dashboard');assert.equal(job.automatic,true);assert.equal((await browser('/poll')).job,null);
 await browser('/result',{id:job.id,status:'ok',raw});const s=await wait(app,s=>!s.sync.running);assert.equal(s.syncByPlatform.douyin.automatic,true);assert.equal(typeof s.syncByPlatform.douyin.jobId,'string');assert(Number.isFinite(Date.parse(s.syncByPlatform.douyin.completedAt)));assert.equal(s.settings.platforms.douyin.lastStatus,'complete');assert(Date.parse(s.settings.platforms.douyin.nextRunAt)>Date.now());assert.equal((await loadState(app.root)).accounts.douyin.daily.length,1);
});
test('unpaired scheduled browser reports offline for every due platform',async t=>{
 let seed=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw));seed=applySnapshot(seed,'x',normalizeSnapshot('x',{...raw,url:'https://x.com/fixture',accountId:'fixture'}));seed.settings.provider='browser';
 for(const id of ['douyin','x']){seed.settings.platforms[id].schedule.enabled=true;seed.settings.platforms[id].nextRunAt='2026-01-01T00:00:00.000Z';}
 const app=await setup(t,seed);await new Promise(r=>setTimeout(r,1200));const s=(await app.call('state')).data;
 for(const id of ['douyin','x'])assert.equal(s.syncByPlatform[id].phase,'connection_offline');
});
test('manual sync exposes a stable lifecycle id and completion only after persisted browser result',async t=>{
 const app=await setup(t),browser=await pair(app);await app.call('sync',{platform:'douyin'});const job=await jobFrom(browser);
 const reading=(await app.call('state')).data.syncByPlatform.douyin;assert.equal(typeof reading.jobId,'string');assert(reading.jobId.length>10);assert.equal(reading.automatic,false);assert.equal(reading.completedAt,null);
 await browser('/result',{id:job.id,status:'ok',raw});let s=await wait(app,s=>!s.sync.running);assert.equal(s.syncByPlatform.douyin.jobId,reading.jobId);assert(Number.isFinite(Date.parse(s.syncByPlatform.douyin.completedAt)));assert.equal(s.accounts.douyin.fans.value,4);
 await app.call('sync',{platform:'douyin'});const second=await jobFrom(browser);const retry=(await app.call('state')).data.syncByPlatform.douyin;assert.notEqual(retry.jobId,reading.jobId);assert.equal(retry.completedAt,null);
 await browser('/result',{id:second.id,status:'parse_error'});s=await wait(app,s=>!s.sync.running);assert.equal(s.syncByPlatform.douyin.jobId,retry.jobId);assert.equal(s.syncByPlatform.douyin.phase,'parse_error');assert(Number.isFinite(Date.parse(s.syncByPlatform.douyin.completedAt)));assert.equal(s.accounts.douyin.fans.value,4);
});

test('page batches persist before acknowledgement, survive pause, resume and become incremental',async t=>{
 const app=await setup(t),browser=await pair(app);
 await app.call('sync',{platform:'douyin'});let job=await jobFrom(browser);
 assert.equal(job.collection.mode,'history');
 const makeBatch=(start,count,status='running')=>({...raw,workCount:'500',works:Array.from({length:count},(_,i)=>({url:`https://www.douyin.com/video/${start+i}`,title:`作品 ${start+i}`})),collectionProgress:{mode:'history',status,reason:status==='complete'?'visible_end':'reading',checkpoint:status==='complete'?null:{page:Math.floor(start/100)+1},scanned:start+count}});
 for(let sequence=0;sequence<3;sequence++){
   const ack=await browser('/batch',{id:job.id,sequence,raw:makeBatch(sequence*100+1,100)});assert.equal(ack.ok,true);
 }
 assert.equal((await loadState(app.root)).accounts.douyin.works.length,300);
 assert.equal((await app.call('sync/pause',{platform:'douyin'})).status,200);
 assert((await browser('/batch',{id:job.id,sequence:3,raw:makeBatch(301,100)})).error);
 await wait(app,s=>!s.sync.running);
 assert.equal((await loadState(app.root)).accounts.douyin.works.length,300);
 await app.call('sync',{platform:'douyin'});job=await jobFrom(browser);
 assert(job.collection.checkpoint);assert.equal(job.collection.mode,'history');
 await browser('/batch',{id:job.id,sequence:0,raw:makeBatch(301,20)});
 await browser('/batch',{id:job.id,sequence:1,raw:makeBatch(321,0,'complete')});
 await browser('/result',{id:job.id,status:'ok'});await wait(app,s=>!s.sync.running);
 let state=(await app.call('state')).data;assert.equal(state.accounts.douyin.works.length,320);assert.equal(state.accounts.douyin.workLibrary.added,20);assert.equal(state.accounts.douyin.workSync.historyComplete,true);
 await app.call('sync',{platform:'douyin'});job=await jobFrom(browser);assert.equal(job.collection.mode,'incremental');
 const duplicate=await browser('/batch',{id:job.id,sequence:0,raw:makeBatch(10,2)});assert.equal(duplicate.known,true);
 await browser('/result',{id:job.id,status:'needs_login'});state=await wait(app,s=>!s.sync.running);assert.equal(state.accounts.douyin.works.length,320);assert.equal(state.accounts.douyin.workSync.status,'paused');
});

test('batch rejects changed identity and unbind invalidates late writes',async t=>{
 const app=await setup(t),browser=await pair(app);await app.call('sync',{platform:'douyin'});const job=await jobFrom(browser);
 const base={...raw,workCount:'1',works:[{url:'https://www.douyin.com/video/1',title:'test'}]};
 assert.equal((await browser('/batch',{id:job.id,sequence:0,raw:base})).ok,true);
 const mismatch=await browser('/batch',{id:job.id,sequence:1,raw:{...base,accountId:'imposter'}});assert(mismatch.error);
 assert.equal((await loadState(app.root)).accounts.douyin.accountId,'fixture-owner');
 await app.call('unbind',{platform:'douyin',confirm:true});
 assert((await browser('/batch',{id:job.id,sequence:1,raw:base})).error);
 assert.equal((await loadState(app.root)).accounts.douyin,undefined);
});
