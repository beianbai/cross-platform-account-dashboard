import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=(await readFile(new URL('../standalone/access-client.js',import.meta.url),'utf8')).replace(/export /g,'');
function client(responses){
  const calls=[],events=[];
  const window={fetch:async(...args)=>{calls.push(args);const next=responses.shift();if(next instanceof Error)throw next;if(!next)throw Error('Unexpected request');return new Response(JSON.stringify(next.body),{status:next.status||200});},dispatchEvent:e=>events.push(e.type)};
  const context=vm.createContext({window,location:{origin:'http://127.0.0.1:43120'},URL,Request,Headers,Event});
  vm.runInContext(source+'\nwindow.api={session,accessRequest,installAccessFetch};',context);
  window.api.installAccessFetch();return {window,calls,events,...window.api};
}
test('expired runtime CSRF refreshes session without replaying the mutation',async()=>{
  const c=client([{body:{csrf:'before'}},{status:403,body:{code:'csrf_expired',error:'请刷新页面后重试'}},{body:{csrf:'after'}},{body:{ok:true}}]);
  await c.session();await assert.rejects(c.accessRequest('/auth/code',{}),/刷新/);
  assert.deepEqual(c.calls.map(([url])=>url),['/session','/auth/code','/session']);
  await c.accessRequest('/auth/code',{});assert.equal(c.calls[1][1].headers.get('X-CSRF-Token'),'before');assert.equal(c.calls[3][1].headers.get('X-CSRF-Token'),'after');assert.deepEqual(c.events,[]);
});
test('wrong pairing code stays on the form; unauthorized business requests require new pairing',async()=>{
  const c=client([{status:401,body:{error:'配对码无效'}},{status:401,body:{error:'授权失效'}}]);
  await assert.rejects(c.accessRequest('/auth/pair',{code:'bad'}));assert.deepEqual(c.events,[]);
  await c.window.fetch('/api/personal-social/state');assert.deepEqual(c.events,['psw-access-required']);
});
test('offline service and external fetches are distinguished, and copied requests keep original headers',async()=>{
  const c=client([Error('offline'),{body:{}},{body:{}}]);
  await assert.rejects(c.accessRequest('/auth/sessions'));assert.deepEqual(c.events,['psw-service-unavailable']);
  await c.window.fetch('https://example.test/');assert.equal(c.calls[1][1].headers,undefined);
  await c.window.fetch(new Request('http://127.0.0.1:43120/auth/code',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));
  assert.equal(c.calls[2][1].headers.get('Content-Type'),'application/json');
});
