import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,stat,rename} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startStandalone} from '../standalone/server.mjs';
async function setup(t){const root=await mkdtemp(join(tmpdir(),'psw-access-'));const app=await startStandalone({root,port:0,browserExecutable:'/nonexistent'});t.after(async()=>{await app.close();await rm(root,{recursive:true,force:true});});return app;}
async function request(app,path,body,auth={},extra={}){return fetch(app.url+path,{method:body===undefined?'GET':'POST',headers:{Origin:app.url,'Content-Type':'application/json',...(auth.cookie?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrf}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});}
async function pair(app,code,agent='Edg/130.0'){const r=await request(app,'/auth/pair',{code}, {},{'User-Agent':agent});assert.equal(r.status,200);return {cookie:r.headers.get('set-cookie').split(';')[0],...await r.json()};}
test('plain address opens without login; two independently paired browsers survive restart and can be individually revoked',async t=>{
 const app=await setup(t);assert.equal((await fetch(app.url+'/')).status,200);assert.equal((await request(app,'/session')).status,401);
 const a=await pair(app,app.pairing.code.toLowerCase().replace('-',' '));
 const newCode=await(await request(app,'/auth/code',{},a)).json();const b=await pair(app,newCode.code,'Chrome/130.0');assert.notEqual(a.cookie,b.cookie);
 const replay=await request(app,'/auth/pair',{code:newCode.code});assert.equal(replay.status,401);
 const list=await(await request(app,'/auth/sessions',undefined,a)).json();assert.equal(list.sessions.length,2);assert.equal(list.sessions.filter(s=>s.current).length,1);assert(!JSON.stringify(list).includes('tokenHash'));
 const bytes=await readFile(join(app.root,'standalone-session.json'),'utf8');assert(!bytes.includes(a.cookie.split('=')[1]));assert.equal((await stat(join(app.root,'standalone-session.json'))).mode&0o777,0o600);
 await app.close();const second=await startStandalone({root:app.root,port:0,browserExecutable:'/nonexistent'});t.after(()=>second.close());
 assert.equal((await request(second,'/auth/code',{},a)).status,403);
 const active=await request(second,'/session',undefined,a);assert.equal(active.status,200);a.csrf=(await active.json()).csrf;
 assert.equal((await request(second,'/session',undefined,b)).status,200);
 const target=list.sessions.find(s=>!s.current);assert.equal((await request(second,'/auth/revoke',{id:target.id,confirm:true},a)).status,200);
 assert.equal((await request(second,'/session',undefined,b)).status,401);assert.equal((await request(second,'/session',undefined,a)).status,200);await second.close();
});
test('pairing is atomic and already-authorized browser cannot consume a code intended for another browser',async t=>{
 const app=await setup(t);const a=await pair(app,app.pairing.code);const code=(await(await request(app,'/auth/code',{},a)).json()).code;
 assert.equal((await request(app,'/auth/pair',{code},a)).status,200);
 const results=await Promise.all([request(app,'/auth/pair',{code}),request(app,'/auth/pair',{code})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,401]);
});
test('browser management cannot bypass origin, CSRF or local-control isolation',async t=>{
 const app=await setup(t);const a=await pair(app,app.pairing.code);
 for(const path of ['/auth/code','/auth/revoke'])assert.equal((await request(app,path,{},a,{'X-CSRF-Token':''})).status,403);
 assert.equal((await request(app,'/auth/pair',{code:'BAD'},{},{Origin:'https://evil.test'})).status,403);
 const control=JSON.parse(await readFile(join(app.root,'.standalone-control.json'),'utf8'));
 assert.equal((await request(app,'/auth/control',{}, {},{Authorization:'Bearer '+control.secret})).status,403);
 const local=await fetch(app.url+'/auth/control',{method:'POST',headers:{Authorization:'Bearer '+control.secret,'Content-Type':'application/json'},body:'{}'});assert.equal(local.status,200);
 const newCode=await local.json();assert.equal((await request(app,'/auth/pair',{code:app.pairing.code})).status,401);await pair(app,newCode.code);
});
test('legacy shared credentials are invalidated without changing account data and corrupt auth is not silently reset',async t=>{
 const root=await mkdtemp(join(tmpdir(),'psw-access-legacy-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await writeFile(join(root,'standalone-session.json'),JSON.stringify({version:1,secret:'a'.repeat(64)}));
 // Invalid business fixture is intentional: auth migration must not rewrite it.
 await writeFile(join(root,'accounts.json'),'existing-business-file');
 const app=await startStandalone({root,port:0,browserExecutable:'/nonexistent'});t.after(()=>app.close());
 const oldCookie='psw_session_'+createHash('sha256').update(app.root).digest('hex').slice(0,16)+'='+'a'.repeat(64);
 assert.equal((await request(app,'/session',undefined,{cookie:oldCookie})).status,401);assert.equal((await(await request(app,'/session')).json()).upgraded,true);
 assert.equal(await readFile(join(root,'accounts.json'),'utf8'),'existing-business-file');await app.close();
 await writeFile(join(root,'standalone-session.json'),'broken');
 await assert.rejects(startStandalone({root,port:0,browserExecutable:'/nonexistent'}),/auth:reset/);
 assert.equal(await readFile(join(root,'standalone-session.json'),'utf8'),'broken');
});
