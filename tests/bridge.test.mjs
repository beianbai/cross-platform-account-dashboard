import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {request} from 'node:http';
import {createBrowserBridge} from '../src/browser-bridge.mjs';
const origin='chrome-extension://'+'a'.repeat(32);
async function setup(t,options){const root=await mkdtemp(join(tmpdir(),'social-bridge-'));const bridge=await createBrowserBridge(root,options);t.after(()=>bridge.close());return {bridge,root};}
const call=(port,token,path,body={},headers={})=>fetch(`http://127.0.0.1:${port}`+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Origin:origin,...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
async function pair(bridge){const code=new URL(bridge.beginPair().code),response=await call(code.port,code.hash.slice(1),'/pair',{label:'My Chrome'});assert.equal(response.status,200);return {port:code.port,token:(await response.json()).token,code};}
test('bridge only accepts authorized extension requests, exact loopback Host and one-use pairing',async t=>{
 const {bridge}=await setup(t);const code=new URL(bridge.beginPair().code),port=code.port,token=code.hash.slice(1);
 for(const Origin of ['https://evil.test','http://127.0.0.1:9999','null'])assert.equal((await call(port,token,'/pair',{}, {Origin})).status,403);
 // Node fetch normalizes Host; raw HTTP is needed to actually exercise rebinding protection.
 const spoofed=await new Promise((resolve,reject)=>{const req=request({hostname:'127.0.0.1',port,path:'/pair',method:'POST',headers:{Host:'evil.test',Origin:origin,Authorization:'Bearer '+token}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end('{}');});assert.equal(spoofed,403);
 assert.equal((await call(port,'0'.repeat(64),'/pair')).status,401);
 const first=await call(port,token,'/pair',{label:'Chrome'});assert.equal(first.status,200);const connection=await first.json();assert.notEqual(connection.token,token);
 assert.equal((await call(port,token,'/pair')).status,401);
 assert.equal((await call(port,connection.token,'/poll',{}, {Origin:'chrome-extension://'+'b'.repeat(32)})).status,401);
 assert.equal((await call(port,connection.token,'/poll')).status,200);assert.equal(bridge.status().online,true);assert.equal('token' in bridge.status(),false);
});
test('delivery is single-use and accepts only the matching pending result',async t=>{
 const {bridge}=await setup(t);assert.throws(()=>bridge.run({platform:'douyin'}),/先连接/);const {port,token}=await pair(bridge);
 assert.throws(()=>bridge.run({platform:'douyin',url:'http://127.0.0.1'}));
 const result=bridge.run({platform:'douyin'});const job=(await(await call(port,token,'/poll')).json()).job;assert.equal(job.platform,'douyin');assert.equal((await(await call(port,token,'/poll')).json()).job,null);
 assert.equal((await call(port,token,'/result',{id:'wrong',status:'ok'})).status,409);
 assert.equal((await call(port,token,'/result',{id:job.id,status:'unexpected'})).status,400);
 assert.equal((await call(port,token,'/result',{id:job.id,status:'needs_login'})).status,200);assert.equal((await result).status,'needs_login');
 assert.equal((await call(port,token,'/result',{id:job.id,status:'ok'})).status,409);
});
test('revocation invalidates memory immediately, cancels pending work and forbids new work during disk commit',async t=>{
 const {bridge}=await setup(t);const {port,token}=await pair(bridge);const pending=bridge.run({platform:'douyin'});const rejected=assert.rejects(pending,/撤销/);const revoke=bridge.revoke();assert.equal(bridge.status().paired,false);assert.throws(()=>bridge.run({platform:'douyin'}));assert.throws(()=>bridge.beginPair());await revoke;await rejected;assert.equal((await call(port,token,'/poll')).status,401);
});
test('connection survives Desktop restarts without persisting platform credentials',async t=>{
 const {bridge,root}=await setup(t);const {token,port}=await pair(bridge);await bridge.close();const next=await createBrowserBridge(root);t.after(()=>next.close());assert.equal(next.status().port,Number(port));assert.equal(next.status().paired,true);assert.equal(next.status().online,false);assert.equal((await call(port,token,'/poll')).status,200);assert.equal((await stat(join(root,'browser-connection.json'))).mode&0o777,0o600);
});
test('overlarge results are rejected without consuming the current task',async t=>{
 const {bridge}=await setup(t);const {port,token}=await pair(bridge);assert.equal((await call(port,token,'/result',{data:'x'.repeat(2*1024*1024)})).status,413);
});
test('a stopped browser times out and frees the next task slot',async t=>{
 const {bridge}=await setup(t,{pickupTimeout:20});await pair(bridge);const result=assert.rejects(bridge.run({platform:'douyin'}),/未接收/);await new Promise(r=>setTimeout(r,40));await result;
 const next=assert.rejects(bridge.run({platform:'bilibili'}),/退出/);await bridge.close();await next;
});

test('batch acknowledgements follow persistence, are idempotent and reject gaps and late batches',async t=>{
 const {bridge}=await setup(t);const {port,token}=await pair(bridge);let writes=0;
 const pending=bridge.run({platform:'douyin',collection:{mode:'history'},onBatch:async raw=>{writes++;return {known:false,count:raw.works.length};}});
 const job=(await(await call(port,token,'/poll')).json()).job;
 assert.equal(job.protocol,2);
 const batch={id:job.id,sequence:0,raw:{works:[{url:'test'}]}};
 assert.equal((await call(port,token,'/batch',{...batch,sequence:2})).status,409);
 assert.equal((await call(port,token,'/batch',batch)).status,200);
 assert.equal((await call(port,token,'/batch',batch)).status,200);assert.equal(writes,1);
 await call(port,token,'/result',{id:job.id,status:'ok'});await pending;
 assert.equal((await call(port,token,'/batch',{...batch,sequence:1})).status,409);
});

test('unpaired batch requests cannot bypass extension authorization',async t=>{
 const {bridge}=await setup(t),port=bridge.status().port;
 assert.equal((await call(port,'0'.repeat(64),'/batch',{id:'obsolete-local-session',sequence:0,raw:{works:[]}},{Origin:''})).status,401);
});

test('pair completion identifies the successful attempt even when the browser label stays the same', async t=>{
 const {bridge}=await setup(t);
 for(let i=0;i<2;i++){
  const attempt=bridge.beginPair(),code=new URL(attempt.code);
  assert.equal(typeof attempt.id,'string');
  assert.notEqual(attempt.id,code.hash.slice(1));
  assert.notEqual(bridge.status().completedPairId,attempt.id);
  assert.equal((await call(code.port,'0'.repeat(64),'/pair',{label:'Chrome'})).status,401);
  assert.notEqual(bridge.status().completedPairId,attempt.id);
  const response=await call(code.port,code.hash.slice(1),'/pair',{label:'Chrome'});
  assert.equal(response.status,200);
  assert.equal(bridge.status().completedPairId,attempt.id);
 }
 await bridge.revoke();assert.equal(bridge.status().completedPairId,null);
});


test('Safari pairing pins its extension origin, survives restart and rejects forged web origins',async t=>{
 const {bridge,root}=await setup(t),code=new URL(bridge.beginPair().code);
 const safariOrigin='safari-web-extension://A1B2C3D4-1234-5678-ABCD-0123456789AB';
 for(const Origin of [
  'https://safari-web-extension.example',
  safariOrigin+'.evil.test',
  safariOrigin+'/path',
  'safari-web-extension://invalid',
  'safari-web-extension://a1b2c3d4-1234-5678-abcd-0123456789ab@evil.test',
  'null',
 ])assert.equal((await call(code.port,code.hash.slice(1),'/pair',{}, {Origin})).status,403);
 const preflight=await fetch(`http://127.0.0.1:${code.port}/pair`,{method:'OPTIONS',headers:{Origin:safariOrigin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
 assert.equal(preflight.status,204);
 assert.equal(preflight.headers.get('access-control-allow-origin'),safariOrigin);
 assert.equal((await call(code.port,'0'.repeat(64),'/pair',{}, {Origin:safariOrigin})).status,401);
 const response=await call(code.port,code.hash.slice(1),'/pair',{label:'Safari'},{Origin:safariOrigin});
 assert.equal(response.status,200);
 const {token}=await response.json();
 assert.equal((await call(code.port,token,'/poll',{}, {Origin:safariOrigin})).status,200);
 assert.equal((await call(code.port,token,'/poll',{}, {Origin:'safari-web-extension://b1b2c3d4-1234-5678-abcd-0123456789ab'})).status,401);
 assert.equal((await call(code.port,token,'/poll')).status,401);
 const pending=bridge.run({platform:'douyin'});
 const job=(await(await call(code.port,token,'/poll',{}, {Origin:safariOrigin})).json()).job;
 assert.equal((await call(code.port,token,'/result',{id:job.id,status:'needs_login'},{Origin:safariOrigin})).status,200);
 assert.equal((await pending).status,'needs_login');
 await bridge.close();
 const restarted=await createBrowserBridge(root);t.after(()=>restarted.close());
 assert.equal((await call(restarted.status().port,token,'/poll',{}, {Origin:safariOrigin})).status,200);
 await restarted.revoke();
 assert.equal((await call(restarted.status().port,token,'/poll',{}, {Origin:safariOrigin})).status,401);
});

test('bridge forwards only allowlisted page failure reasons, never arbitrary error details',async t=>{
 const {bridge}=await setup(t),{port,token}=await pair(bridge);
 for(const reason of ['page_access_denied','page_script_error','secret-token-private-details']){
  const pending=bridge.run({platform:'douyin'}),job=(await(await call(port,token,'/poll')).json()).job;
  await call(port,token,'/result',{id:job.id,status:'needs_attention',reason});const result=await pending;
  assert.equal(result.reason,reason.startsWith('page_')?reason:undefined);
 }
});

test('undelivered tasks expire in a separate pickup window; delivery starts the reading timeout',async t=>{
 const {bridge}=await setup(t,{pickupTimeout:25,jobTimeout:180}),{port,token}=await pair(bridge);
 await assert.rejects(bridge.run({platform:'douyin'}),e=>e.status==='connection_offline'&&/接收/.test(e.message));
 const next=bridge.run({platform:'douyin'});const job=(await(await call(port,token,'/poll')).json()).job;
 await new Promise(r=>setTimeout(r,45));
 assert.equal((await call(port,token,'/result',{id:job.id,status:'needs_login'})).status,200);
 assert.equal((await next).status,'needs_login');
});
test('job liveness rejects cancelled ids and late writes without affecting the next job',async t=>{
 const {bridge}=await setup(t),{port,token}=await pair(bridge);
 assert.equal((await call(port,'0'.repeat(64),'/job',{id:'a'.repeat(64)})).status,401);
 const first=bridge.run({platform:'douyin'}),rejected=assert.rejects(first,/取消/);
 const old=(await(await call(port,token,'/poll')).json()).job;
 assert.equal((await(await call(port,token,'/job',{id:old.id})).json()).active,true);
 bridge.cancelCurrent();await rejected;
 const next=bridge.run({platform:'x'}),job=(await(await call(port,token,'/poll')).json()).job;
 assert.equal((await(await call(port,token,'/job',{id:old.id})).json()).active,false);
 assert.equal((await call(port,token,'/result',{id:old.id,status:'ok'})).status,409);
 assert.equal((await(await call(port,token,'/job',{id:job.id})).json()).active,true);
 await call(port,token,'/result',{id:job.id,status:'needs_login'});await next;
});
test('paired but offline bridge rejects manual sync immediately after restart',async t=>{
 const {bridge,root}=await setup(t);await pair(bridge);await bridge.close();
 const next=await createBrowserBridge(root);t.after(()=>next.close());
 assert.throws(()=>next.run({platform:'douyin'}),e=>e.status==='connection_offline');
});
