import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir,rename} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createAccess,CODE_MS,IDLE_MS} from '../standalone/access.mjs';
import {startStandalone} from '../standalone/server.mjs';
import {issueLocalCode,resetLocalAccess} from '../standalone/auth-cli.mjs';
async function store(t){const root=await mkdtemp(join(tmpdir(),'psw-access-store-'));let time=Date.now();const access=await createAccess(root,{now:()=>time});t.after(async()=>{await access.close();await rm(root,{recursive:true,force:true});});return {root,access,advance:n=>time+=n};}
test('codes expire, replacement invalidates earlier code, and failures are rate limited with recovery',async t=>{
 const {access,advance}=await store(t);const first=await access.issue();advance(CODE_MS);await assert.rejects(access.redeem(first.code),e=>e.status===401);
 const second=await access.issue();await access.issue();await assert.rejects(access.redeem(second.code),e=>e.status===401);
 for(let i=0;i<8;i++)await assert.rejects(access.redeem('ZZZZ-ZZZZ'),e=>e.status===401);
 const current=await access.issue();await assert.rejects(access.redeem(current.code),e=>e.status===429&&e.retryAfter>0);advance(60000);
 assert.ok((await access.redeem(current.code)).token);
});
test('idle expiry and activity renewal use persistent separate session records',async t=>{
 const {access,advance}=await store(t);const a=await access.redeem((await access.issue()).code);const b=await access.redeem((await access.issue()).code);
 advance(IDLE_MS-60000);assert.ok(await access.authenticate(a.token));advance(60000);
 assert.equal(await access.authenticate(b.token),null);assert.ok(await access.authenticate(a.token));
});
test('failed durable write neither consumes code nor grants a session',async t=>{
 const {access,root}=await store(t);const code=(await access.issue()).code,path=join(root,'standalone-session.json');
 await rename(path,path+'.saved');await mkdir(path);await assert.rejects(access.redeem(code));assert.equal((await access.list()).length,0);
 await rm(path,{recursive:true});await rename(path+'.saved',path);assert.ok((await access.redeem(code)).token);
});
test('terminal command regenerates code without restart; stopped-service reset is explicit and preserves business data',async t=>{
 const root=await mkdtemp(join(tmpdir(),'psw-access-cli-'));const app=await startStandalone({root,port:0,browserExecutable:'/nonexistent'});t.after(async()=>{await app.close();await rm(root,{recursive:true,force:true});});
 const code=await issueLocalCode(root);assert.match(code.code,/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
 const output=await promisify(execFile)(process.execPath,['standalone/auth-cli.mjs','code','--root',root]);assert.match(output.stdout,/配对码/);
 await assert.rejects(resetLocalAccess(root,false));await assert.rejects(resetLocalAccess(root,true),/先停止/);
 await app.close();await writeFile(join(root,'accounts.json'),'business-untouched');await writeFile(join(root,'standalone-session.json'),'corrupt-auth');
 await assert.rejects(issueLocalCode(root),/先启动/);const backup=await resetLocalAccess(root,true);
 assert.equal(await readFile(backup,'utf8'),'corrupt-auth');assert.equal(await readFile(join(root,'accounts.json'),'utf8'),'business-untouched');
 assert.deepEqual(JSON.parse(await readFile(join(root,'standalone-session.json'),'utf8')).sessions,[]);
});

test('recovery never removes an existing stale lock or follows a non-regular auth file',async t=>{
 const root=await mkdtemp(join(tmpdir(),'psw-access-reset-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await writeFile(join(root,'standalone-session.json'),'corrupt');
 await writeFile(join(root,'.standalone.lock'),JSON.stringify({pid:2147483647}));
 await assert.rejects(resetLocalAccess(root,true),/目录锁/);
 assert.equal(await readFile(join(root,'standalone-session.json'),'utf8'),'corrupt');
 assert.ok(await readFile(join(root,'.standalone.lock'),'utf8'));
 await rm(join(root,'.standalone.lock'));await rm(join(root,'standalone-session.json'));await mkdir(join(root,'standalone-session.json'));
 await assert.rejects(resetLocalAccess(root,true),/未找到可恢复/);
 await assert.rejects(readFile(join(root,'.standalone.lock')),e=>e.code==='ENOENT');
});
