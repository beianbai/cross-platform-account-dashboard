import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,stat,access,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import * as core from '../src/core.mjs';
import {loadState,saveState} from '../src/store.mjs';
const metric=value=>({value,display:String(value),approximate:false});
const snapshot=(at='2026-10-10T16:30:00.000Z',fans='1.2万')=>({...core.normalizeSnapshot('douyin',{url:'https://www.douyin.com/user/self',name:'账号',accountId:'a',fans,following:'2',works:[]}),syncedAt:at});
const legacy=()=>({version:1,accounts:{douyin:{...snapshot(),history:[{at:'2026-10-10T15:00:00.000Z',fans:metric(1),following:null},{at:'2026-10-10T16:00:00.000Z',fans:metric(2),following:null},{at:'2026-10-10T17:00:00.000Z',fans:metric(3),following:metric(4)}]}}});
test('v1 migration groups by saved timezone and never backfills unknown historical metrics',()=>{
  const old=legacy(),copy=structuredClone(old);assert.equal(typeof core.migrateState,'function');
  const state=core.migrateState(old,'Asia/Shanghai');
  assert.deepEqual(old,copy);assert.equal(state.version,2);assert.equal(state.settings.provider,'browser');
  assert.equal(state.settings.platforms.douyin.schedule.enabled,false);assert.equal(state.settings.platforms.douyin.visible,true);
  assert.deepEqual(state.accounts.douyin.history,old.accounts.douyin.history);
  assert.deepEqual(state.accounts.douyin.daily.map(p=>[p.date,p.fans.value,p.workCount,p.likes]),[['2026-10-10',1,null,null],['2026-10-11',3,null,null]]);
  assert.deepEqual(core.migrateState(state,'America/New_York'),state);
});
test('daily records keep last success, approximations, missing values and more than 90 days',()=>{
  let state=core.emptyState('Asia/Shanghai');state=core.applySnapshot(state,'douyin',snapshot());
  assert.ok(Array.isArray(state.accounts.douyin.daily));assert.equal(state.accounts.douyin.daily[0].fans.approximate,true);
  state=core.applySnapshot(state,'douyin',snapshot('2026-10-10T17:30:00.000Z','0'));
  assert.equal(state.accounts.douyin.daily.length,1);assert.equal(state.accounts.douyin.daily[0].fans.value,0);assert.equal(state.accounts.douyin.daily[0].likes,null);
  for(let i=0;i<100;i++)state=core.applySnapshot(state,'douyin',snapshot(new Date(Date.UTC(2027,0,i+1)).toISOString(),String(i)));
  assert.equal(state.accounts.douyin.daily.length,101);
  assert.equal(state.accounts.douyin.daily[0].date,'2026-10-11');
});
test('timezone changes affect only new daily records',()=>{
  let state=core.applySnapshot(core.emptyState('Asia/Shanghai'),'douyin',snapshot());
  state={...state,settings:{...state.settings,platforms:{...state.settings.platforms,douyin:{...state.settings.platforms.douyin,schedule:{...state.settings.platforms.douyin.schedule,timeZone:'America/New_York'}}}}};
  state=core.applySnapshot(state,'douyin',snapshot('2026-10-12T01:30:00.000Z','20'));
  assert.equal(state.accounts.douyin.daily[0].timeZone,'Asia/Shanghai');
  assert.equal(state.accounts.douyin.daily.at(-1).timeZone,'America/New_York');
});
test('unbind archives immutable data, stops plans, and rebind restores only matching identity',()=>{
  const bound=core.applySnapshot(core.emptyState('Asia/Shanghai'),'douyin',snapshot());assert.equal(typeof core.unbindAccount,'function');
  bound.settings.platforms.douyin.schedule.enabled=true;const original=structuredClone(bound);
  const unbound=core.unbindAccount(bound,'douyin');assert.deepEqual(bound,original);assert.equal(unbound.accounts.douyin,undefined);
  assert.equal(unbound.archives.length,1);assert.equal(unbound.settings.platforms.douyin.schedule.enabled,false);
  const restored=core.applySnapshot(unbound,'douyin',snapshot('2026-10-11T16:30:00.000Z','22'));
  assert.equal(restored.accounts.douyin.daily.length,2);assert.equal(restored.archives.length,0);
  const other=core.applySnapshot(unbound,'douyin',{...snapshot(),accountId:'b'});assert.equal(other.accounts.douyin.daily.length,1);assert.equal(other.archives.length,1);
});
test('migration writes an exclusive byte-for-byte v1 backup and is idempotent',async()=>{
  const root=await mkdtemp(join(tmpdir(),'daily-migrate-'));const old=JSON.stringify(legacy());await writeFile(join(root,'accounts.json'),old);
  const state=await loadState(root,'Asia/Shanghai');assert.equal(state.version,2);
  assert.equal(await readFile(join(root,'accounts.v1.backup.json'),'utf8'),old);
  assert.equal((await stat(join(root,'accounts.v1.backup.json'))).mode&0o777,0o600);
  assert.equal(JSON.parse(await readFile(join(root,'accounts.json'),'utf8')).version,2);
  await writeFile(join(root,'accounts.v1.backup.json'),'preserve existing backup');await writeFile(join(root,'accounts.json'),old);
  await loadState(root,'Asia/Shanghai');assert.equal(await readFile(join(root,'accounts.v1.backup.json'),'utf8'),'preserve existing backup');
});
test('malformed migration and invalid writes never replace original data',async()=>{
  const root=await mkdtemp(join(tmpdir(),'daily-corrupt-'));const old=legacy();old.accounts.douyin.history[0].at='invalid';const bytes=JSON.stringify(old);
  await writeFile(join(root,'accounts.json'),bytes);await assert.rejects(loadState(root));
  assert.equal(await readFile(join(root,'accounts.json'),'utf8'),bytes);await assert.rejects(access(join(root,'accounts.v1.backup.json')));
  await assert.rejects(saveState(root,{version:2,accounts:{}}));assert.equal(await readFile(join(root,'accounts.json'),'utf8'),bytes);
});
test('invalid timezone and negative history metrics fail closed',()=>{
  assert.throws(()=>core.emptyState('Invalid/Zone'));
  const old=legacy();old.accounts.douyin.history[0].fans.value=-3;assert.throws(()=>core.migrateState(old,'Asia/Shanghai'));
});

test('a directory at the backup destination cannot count as a successful migration backup',async()=>{
  const root=await mkdtemp(join(tmpdir(),'daily-backup-'));const bytes=JSON.stringify(legacy());
  await writeFile(join(root,'accounts.json'),bytes);await mkdir(join(root,'accounts.v1.backup.json'));
  await assert.rejects(loadState(root));assert.equal(await readFile(join(root,'accounts.json'),'utf8'),bytes);
});
test('mismatched platform fields cannot introduce an archive under another identity',()=>{
  const old=legacy();old.accounts.douyin.platform='bilibili';assert.throws(()=>core.migrateState(old,'Asia/Shanghai'));
});
test('legacy account map supplies missing platform identity for a valid archive round trip',()=>{
  const old=legacy();delete old.accounts.douyin.platform;
  const state=core.migrateState(old,'Asia/Shanghai');const unbound=core.unbindAccount(state,'douyin');
  assert.doesNotThrow(()=>core.migrateState(unbound));assert.equal(unbound.archives[0].platform,'douyin');
});
test('persisted recovery accepts a matching browser route and rejects unsafe or mismatched identity routes',()=>{
  const state=core.emptyState('Asia/Shanghai');
  state.settings.platforms.douyin.recovery={provider:'ego',spaceId:42,url:'https://www.douyin.com/user/self'};
  state.settings.platforms.douyin.lastStatus='login_required';state.settings.platforms.douyin.retryCount=2;
  assert.doesNotThrow(()=>core.migrateState(state));
  for(const recovery of [{provider:'unknown',spaceId:42,url:''},{provider:'ego',spaceId:0,url:''},{provider:'browser',spaceId:1.5,url:''},{provider:'browser',spaceId:1,url:'https://x.com/alice'},{provider:'ego',spaceId:1,url:'https://www.douyin.com/user/self?token=secret'}]) {
    const invalid=structuredClone(state);invalid.settings.platforms.douyin.recovery=recovery;assert.throws(()=>core.migrateState(invalid));
  }
  for(const [key,value] of [['lastStatus',5],['lastResult',{}],['retryCount',-1],['retryCount',3],['retryCount',1.5]]) {
    const invalid=structuredClone(state);invalid.settings.platforms.douyin[key]=value;assert.throws(()=>core.migrateState(invalid));
  }
  state.settings.platforms.douyin.recovery=null;state.settings.platforms.douyin.lastStatus=null;state.settings.platforms.douyin.retryCount=null;assert.doesNotThrow(()=>core.migrateState(state));
});
test('unbind clears recovery route, last status and retry count so the next identity starts clean',()=>{
  const state=core.applySnapshot(core.emptyState('Asia/Shanghai'),'douyin',snapshot());
  Object.assign(state.settings.platforms.douyin,{recovery:{provider:'ego',spaceId:42,url:'https://www.douyin.com/user/self'},lastStatus:'login_required',retryCount:2});
  const unbound=core.unbindAccount(state,'douyin');
  assert.equal(unbound.settings.platforms.douyin.recovery,null);assert.equal(unbound.settings.platforms.douyin.lastStatus,null);assert.equal(unbound.settings.platforms.douyin.retryCount,0);
  assert.equal(state.settings.platforms.douyin.recovery.spaceId,42);
});
test('unbind also clears pending recovery when the initial account binding never completed',()=>{
  const state=core.emptyState('Asia/Shanghai');Object.assign(state.settings.platforms.douyin,{recovery:{provider:'ego',spaceId:42,url:''},lastStatus:'login_required',retryCount:1});
  const unbound=core.unbindAccount(state,'douyin');assert.equal(unbound.archives.length,0);assert.equal(unbound.settings.platforms.douyin.recovery,null);assert.equal(unbound.settings.platforms.douyin.retryCount,0);
});

for(const provider of ['auto','ego'])test(`legacy ${provider} settings migrate without losing account data or schedules`,async()=>{
  let old=core.applySnapshot(core.emptyState('Asia/Shanghai'),'douyin',snapshot());
  old.archives=[{...structuredClone(old.accounts.douyin),archivedAt:'2026-10-12T00:00:00.000Z'}];
  old.settings.provider=provider;
  const settings=old.settings.platforms.douyin;
  Object.assign(settings,{recovery:{provider:'ego',spaceId:42,url:old.accounts.douyin.url},pausedReason:'needs_login',lastStatus:'needs_login',lastResult:'old login',retryCount:2});
  settings.schedule.enabled=true;
  const original=structuredClone(old),root=await mkdtemp(join(tmpdir(),'extension-migrate-'));
  await writeFile(join(root,'accounts.json'),JSON.stringify(old));
  const migrated=await loadState(root);
  assert.equal(migrated.settings.provider,'browser');
  assert.deepEqual(migrated.accounts,original.accounts);assert.deepEqual(migrated.archives,original.archives);
  assert.deepEqual(migrated.settings.platforms.douyin.schedule,settings.schedule);
  assert.equal(migrated.settings.platforms.douyin.recovery,null);assert.equal(migrated.settings.platforms.douyin.pausedReason,null);
  assert.equal(migrated.settings.platforms.douyin.lastStatus,null);assert.equal(migrated.settings.platforms.douyin.lastResult,null);assert.equal(migrated.settings.platforms.douyin.retryCount,0);
  assert(Date.parse(migrated.settings.platforms.douyin.nextRunAt)>Date.now());
  const persisted=await readFile(join(root,'accounts.json'),'utf8');assert.deepEqual(JSON.parse(persisted),migrated);
  assert.deepEqual(await loadState(root),migrated);assert.equal(await readFile(join(root,'accounts.json'),'utf8'),persisted);
  assert.deepEqual(old,original);
});
test('migration preserves intentional pauses and existing extension login state',()=>{
  const old=core.emptyState('Asia/Shanghai');old.settings.provider='ego';
  Object.assign(old.settings.platforms.douyin,{pausedReason:'user_paused',lastStatus:'paused',lastResult:'已暂停',recovery:{provider:'ego',spaceId:42,url:''}});
  const migrated=core.migrateState(old);assert.equal(migrated.settings.platforms.douyin.recovery,null);
  assert.equal(migrated.settings.platforms.douyin.pausedReason,'user_paused');assert.equal(migrated.settings.platforms.douyin.lastStatus,'paused');
  const browser=core.emptyState('Asia/Shanghai');browser.settings.provider='browser';
  Object.assign(browser.settings.platforms.douyin,{pausedReason:'needs_login',lastStatus:'needs_login',lastResult:'请登录'});
  assert.deepEqual(core.migrateState(browser),browser);
  browser.settings.provider='auto';const auto=core.migrateState(browser);assert.deepEqual(auto.settings.platforms,browser.settings.platforms);
  old.settings.platforms.douyin.pausedReason='account_mismatch';old.settings.platforms.douyin.lastStatus='account_mismatch';
  assert.equal(core.migrateState(old).settings.platforms.douyin.pausedReason,'account_mismatch');
});
test('invalid legacy recovery is validated before migration touches the persisted file',async()=>{
  const root=await mkdtemp(join(tmpdir(),'extension-invalid-')),old=core.emptyState();old.settings.provider='ego';
  old.settings.platforms.douyin.recovery={provider:'ego',spaceId:0,url:''};
  const bytes=JSON.stringify(old);await writeFile(join(root,'accounts.json'),bytes);
  await assert.rejects(loadState(root));assert.equal(await readFile(join(root,'accounts.json'),'utf8'),bytes);
});

test('retiring the provider preserves successful status and existing scheduled time',()=>{
  const old=core.emptyState('Asia/Shanghai');old.settings.provider='ego';
  Object.assign(old.settings.platforms.douyin,{lastStatus:'complete',lastResult:'已保存 12 条作品',lastAttemptAt:'2026-10-10T09:00:00.000Z',nextRunAt:'2026-10-11T09:00:00.000Z'});
  old.settings.platforms.douyin.schedule.enabled=true;
  const migrated=core.migrateState(old);assert.deepEqual(migrated.settings.platforms,old.settings.platforms);
});
