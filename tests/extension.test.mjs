import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {isPlatformURL,validJob,readLoginGate,createPageAdapter} from '../extension/adapter.mjs';
import {collect} from '../src/collector.mjs';
test('extension accepts only approved platform pages and task data, never remote scripts',()=>{
 for(const url of ['https://www.douyin.com/user/self','https://www.douyin.com/user/abc'])assert(isPlatformURL('douyin',url));
 for(const url of ['http://127.0.0.1','https://www.douyin.com.evil.test/user/self','https://user:pass@www.douyin.com/user/self','https://www.douyin.com:8443/user/self','https://www.xiaohongshu.com/user/profile/'+'a'.repeat(24),'javascript:alert(1)'])assert.equal(isPlatformURL('douyin',url),false);
 assert(isPlatformURL('xiaohongshu','https://www.xiaohongshu.com/user/profile/ABCDEF0123456789ABCDEF01'));
 assert(validJob({id:'a'.repeat(64),platform:'douyin',url:''}));assert.equal(validJob({id:'x',platform:'douyin',url:''}),false);assert.equal(validJob({id:'a'.repeat(64),platform:'other',url:''}),false);
});
test('real shared collector runs through a browser scripting adapter without Ego APIs',async()=>{
 const root={innerText:'粉丝 3 关注 4 获赞 8 抖音号：fixture-123',querySelector:()=>({innerText:'模拟浏览器账号'}),parentElement:{querySelector:()=>({src:''})}};
 const document={querySelector:selector=>selector==='[data-e2e="user-info"]'?root:selector==='[data-e2e="user-info-fans"]'?{innerText:'粉丝 3'}:selector==='[data-e2e="user-post-list"]'?{}:null,querySelectorAll:selector=>selector==='[role="tab"]'?[{innerText:'作品 0'}]:[]};
 let url='about:blank';const injections=[];
 const api={tabs:{update:async(id,options)=>{assert.equal(id,42);url=options.url;},get:async()=>({url,status:'complete'})},scripting:{executeScript:async options=>{injections.push(options);return [{result:vm.runInNewContext('('+options.func.toString()+')()',{document,location:new URL(url)})}];}}};
 const page=createPageAdapter(api,42,'douyin');const raw=await collect({page,platform:'douyin'});assert.equal(raw.accountId,'fixture-123');assert.equal(raw.name,'模拟浏览器账号');assert.equal(raw.workCount,'0');assert.equal(raw.works.length,0);assert(injections.every(v=>v.target.tabId===42&&!v.world));
 url='https://evil.test';await assert.rejects(page.evaluate(()=>1),/对应平台/);await assert.rejects(page.goto('https://evil.test'),/不受支持/);
});
test('login gates distinguish explicit login UI from captcha and uncertain loading',()=>{
 function run(selector){return vm.runInNewContext('('+readLoginGate.toString()+')()',{document:{querySelectorAll:s=>s===selector?[{getBoundingClientRect:()=>({width:100,height:20})}]:[]}});}
 assert.equal(run('.login-container'),'needs_login');assert.equal(run('[class*="captcha"],[id*="captcha"],iframe[src*="captcha"]'),'needs_attention');assert.equal(run('none'),'parse_error');
});
test('background acknowledges invalid task and failed tab creation instead of leaving delivered jobs hanging',async()=>{
 const bundle=await sourceBundle();
 for(const platform of ['unknown','douyin']){
  let listener,complete;const result=new Promise(resolve=>{complete=resolve;});const state={connection:{base:'http://127.0.0.1:54321',token:'a'.repeat(64)}};
  const api={runtime:{id:'fixture',onMessage:{addListener:fn=>{listener=fn;}},onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{onAlarm:{addListener(){}}},storage:{local:{get:async()=>state,set:async value=>Object.assign(state,value)}},tabs:{create:async()=>{throw Error('browser permission denied');}}};
  vm.runInNewContext(bundle,{chrome:api,URL,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{if(url.endsWith('/result')){complete(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true})};}return {ok:true,json:async()=>({job:{id:'b'.repeat(64),platform,url:''}})};}});
  listener({type:'poll'},{id:'fixture'},()=>{});const response=await result;assert.equal(response.id,'b'.repeat(64));assert.equal(response.status,platform==='unknown'?'error':'connection_offline');
 }
});
test('packaged connectors have restricted permissions and no remote code policy',async()=>{
 for(const type of ['chromium','firefox']){const manifest=JSON.parse(await readFile(new URL('../lib/browser-extension/'+type+'/manifest.json',import.meta.url),'utf8'));assert.deepEqual(manifest.permissions,['storage','scripting','alarms']);assert(!manifest.host_permissions.includes('<all_urls>'));assert.equal(manifest.content_security_policy.extension_pages,"script-src 'self'; object-src 'none'");assert(type==='chromium'?manifest.background.service_worker:manifest.background.scripts);}
});

test('X routes reject impostor domains and system paths while allowing a personal profile',()=>{
 assert(isPlatformURL('x','https://x.com/Example_1'));
 assert(isPlatformURL('x','https://twitter.com/Example_1'));
 assert(validJob({id:'a'.repeat(64),platform:'x',url:'https://x.com/Example_1',automatic:true}));
 for(const url of ['https://x.com.evil.test/Example_1','https://x.com/search','https://x.com/example/status/42','https://x.com:8443/example'])assert.equal(isPlatformURL('x',url),false);
});
test('automatic navigation never activates a browser tab and incomplete loading is network_error',async()=>{
 let time=0;const changes=[];
 const api={tabs:{update:async(id,options)=>{changes.push(options);},get:async()=>({url:'https://www.douyin.com/user/self',status:'loading'})}};
 const page=createPageAdapter(api,42,'douyin',{automatic:true,now:()=>time,sleep:async ms=>{time+=ms;}});
 await assert.rejects(page.goto('https://www.douyin.com/user/self'),e=>e.status==='network_error');
 assert.equal(changes.length,1);assert.equal(changes[0].active,false);
});
test('unrecognized page structures report parse_error without claiming a login failure',async()=>{
 const page={goto:async()=>{},waitForFunction:async()=>{throw Error('waiting for selector');},evaluate:async fn=>vm.runInNewContext('('+fn.toString()+')()',{document:{querySelectorAll:()=>[],body:{innerText:''}},location:new URL('https://x.com/home')})};
 await assert.rejects(collect({page,platform:'x'}),e=>e.status==='parse_error');
});

function xFixture({handle='Example_1',profileHandle=handle,count='1,234 posts',fans='12.3K Followers',following='56 Following',posts=['https://x.com/Example_1/status/123','https://x.com/somebody/status/456','https://twitter.com/Example_1/status/123'],gate=null}={}){
 const visible=()=>({width:100,height:20});
 const node=(innerText='',fields={})=>({innerText,getBoundingClientRect:visible,querySelector:()=>null,querySelectorAll:()=>[],getAttribute:()=>null,...fields});
 const anchors=[node(fans,{href:'https://x.com/'+handle+'/verified_followers'}),node(following,{href:'https://x.com/'+handle+'/following'})];
 const articles=posts.map(href=>{const link=node('',{href});const time=node('',{closest:()=>link});return node('A visible post',{querySelector:selector=>selector==='time'?time:selector==='[data-testid="tweetText"]'?node('My post'):null});});
 const name=node('Example Name\n@'+profileHandle);const heading=node('Example Name',{parentElement:node('',{parentElement:node('Example Name\n'+count)})});
 const primary=node('',{querySelector:selector=>selector==='[data-testid="UserName"]'?name:selector==='h2'?heading:null,querySelectorAll:selector=>selector==='a[href]'?anchors:selector==='article[data-testid="tweet"]'?articles:[]});
 const document={body:node(),querySelector:selector=>selector==='a[data-testid="AppTabBar_Profile_Link"]'?node('',{href:'https://x.com/'+handle}):selector==='[data-testid="primaryColumn"]'?primary:selector==='[data-testid="UserName"]'?name:null,querySelectorAll:selector=>selector===gate?[node()]:[]};
 let current='https://x.com/home';const visited=[];
 const evaluate=async fn=>vm.runInNewContext('('+fn.toString()+')()',{document,location:new URL(current),URL});
 return {page:{async goto(url){current=url;visited.push(url);},evaluate,async waitForFunction(fn){if(!await evaluate(fn))throw Error('selector missing');}},visited};
}
test('X collection keeps canonical own posts, deduplicates and preserves header totals independently',async()=>{
 const fixture=xFixture();const raw=await collect({page:fixture.page,platform:'x'});
 assert.equal(raw.url,'https://x.com/example_1');assert.equal(raw.accountId,'@example_1');assert.equal(raw.name,'Example Name');
 assert.equal(raw.fans,'12.3K');assert.equal(raw.following,'56');assert.equal(raw.workCount,'1,234');assert.equal(raw.likes,null);
 assert.equal(raw.works.length,1);assert.equal(raw.works[0].url,'https://x.com/example_1/status/123');assert.equal(raw.works[0].title,'My post');assert.equal(raw.worksStatus,'partial');
 assert.match(raw.scope,/当前.*本人/);
});
test('X visible Chinese metrics preserve approximate displays and missing metrics remain unknown',async()=>{
 const fixture=xFixture({count:'1.2万 帖子',fans:'2.3万 位关注者',following:'正在关注 7',posts:[]});
 const raw=await collect({page:fixture.page,platform:'x',url:'https://twitter.com/Example_1'});
 assert.equal(raw.fans,'2.3万');assert.equal(raw.following,'7');assert.equal(raw.workCount,'1.2万');assert.equal(raw.worksStatus,'unavailable');
 const missing=await collect({page:xFixture({fans:'Followers',count:'Posts',posts:[]}).page,platform:'x'});assert.equal(missing.fans,null);assert.equal(missing.workCount,null);
});
test('X requested and rendered identities must match signed-in profile before saving',async()=>{
 for(const fixture of [xFixture(),xFixture({handle:'Another',profileHandle:'Changed'})]){
  await assert.rejects(collect({page:fixture.page,platform:'x',url:'https://x.com/another'}),e=>e.status==='account_mismatch');
 }
});
test('explicit page login or captcha gives a typed failure for any collector',async()=>{
 for(const [gate,status] of [['[data-testid="loginButton"]','needs_login'],['[class*="captcha"],[id*="captcha"],iframe[src*="captcha"]','needs_attention']]){
  const fixture=xFixture({gate});fixture.page.waitForFunction=async()=>{throw Error('missing profile');};
  await assert.rejects(collect({page:fixture.page,platform:'x'}),e=>e.status===status);
 }
});

async function sourceBundle(){
 const parts=await Promise.all(['../src/platforms.mjs','../src/work-traversal.mjs','../src/collector.mjs','../extension/adapter.mjs','../extension/background.mjs'].map(path=>readFile(new URL(path,import.meta.url),'utf8')));
 return '(()=>{'+parts.map(s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n')+'})();';
}
async function runExtensionJob(job,{pending=false,retryable=false,active=false,failNavigation=false}={}){
 const calls=[];let listener,complete,finish,activityAtSubmission;const response=new Promise(resolve=>{complete=resolve;});const ended=new Promise(resolve=>{finish=resolve;});
 const state={connection:{base:'http://127.0.0.1:54321',token:'a'.repeat(64)},tabsByPlatform:pending?{douyin:retryable?{id:42,retryable:true}:42}:{}};let url='https://www.douyin.com/user/self';
 const root={innerText:'粉丝 3 关注 4 获赞 8 抖音号：fixture-123',querySelector:()=>({innerText:'模拟浏览器账号'}),parentElement:{querySelector:()=>({src:''})}};
 const document={body:{innerText:''},querySelector:selector=>selector==='[data-e2e="user-info"]'?root:selector==='[data-e2e="user-info-fans"]'?{innerText:'粉丝 3'}:selector==='[data-e2e="user-post-list"]'?{}:null,querySelectorAll:selector=>selector==='[role="tab"]'?[{innerText:'作品 0'}]:[]};
 const api={runtime:{id:'fixture',onMessage:{addListener:fn=>{listener=fn;}},onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{onAlarm:{addListener(){}}},storage:{local:{get:async()=>state,set:async value=>{Object.assign(state,value);if(['submitted','success','error','attention'].includes(value.activity?.phase))finish();}}},tabs:{create:async options=>{calls.push(['create',options]);url=options.url;return {id:42};},get:async()=>({id:42,url,status:'complete',active}),update:async(id,options)=>{calls.push(['update',options]);if(failNavigation)throw Object.assign(Error('navigation failed'),{status:'network_error'});url=options.url;},remove:async id=>{calls.push(['remove',id]);}},scripting:{executeScript:async options=>[{result:vm.runInNewContext('('+options.func.toString()+')()',{document,location:new URL(url)})}]}};
 vm.runInNewContext(await sourceBundle(),{chrome:api,URL,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{if(url.endsWith('/result')){activityAtSubmission=state.activity?.phase;complete(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true})};}return {ok:true,json:async()=>({job})};}});
 listener({type:'poll'},{id:'fixture'},()=>{});const result=await response;await ended;return {result,calls,state,activityAtSubmission};
}
test('automatic extension jobs use an inactive dedicated tab, then close only that tab on success',async()=>{
 const {result,calls,state}=await runExtensionJob({id:'b'.repeat(64),platform:'douyin',url:'',automatic:true});
 assert.equal(result.status,'ok');assert.equal(result.raw.accountId,'fixture-123');
 assert.deepEqual(JSON.parse(JSON.stringify(calls)),[['create',{url:'about:blank',active:false}],['update',{url:'https://www.douyin.com/user/self',active:false}],['remove',42]]);
 assert.equal(state.tabsByPlatform.douyin,undefined);
});
test('automatic extension jobs never navigate a pending recovery tab, even if resume is set',async()=>{
 const {result,calls}=await runExtensionJob({id:'b'.repeat(64),platform:'douyin',url:'',automatic:true,resume:true},{pending:true});
 assert.equal(result.status,'needs_attention');assert.deepEqual(calls,[]);
});

test('extension network failures retain an explicitly retryable tab for delayed automatic retry',async()=>{
 const failed=await runExtensionJob({id:'b'.repeat(64),platform:'douyin',url:'',automatic:true},{failNavigation:true});
 assert.equal(failed.result.status,'network_error');assert.deepEqual(JSON.parse(JSON.stringify(failed.state.tabsByPlatform.douyin)),{id:42,retryable:true});
 const retry=await runExtensionJob({id:'b'.repeat(64),platform:'douyin',url:'',automatic:true},{pending:true,retryable:true});
 assert.equal(retry.result.status,'ok');assert(!retry.calls.some(([method])=>method==='create'));assert.equal(retry.calls[0][1].active,false);
});
test('a formerly retryable extension tab stops automatic retry when the user is viewing it',async()=>{
 const {result,calls}=await runExtensionJob({id:'b'.repeat(64),platform:'douyin',url:'',automatic:true},{pending:true,retryable:true,active:true});
 assert.equal(result.status,'needs_attention');assert.deepEqual(calls,[]);
});

test('extension records submitted-result status only after the bridge accepts the result',async()=>{
 const {state,activityAtSubmission}=await runExtensionJob({id:'b'.repeat(64),platform:'douyin',url:''});
 assert.equal(activityAtSubmission,'reading');assert.match(state.activity.message,/已提交.*保存结果/);
 assert.equal(state.activity.phase,'submitted');assert.notEqual(state.activity.phase,'success');assert.equal(state.activity.platform,'douyin');assert.equal(state.lastResult.phase,'submitted');assert.match(state.activity.updatedAt,/^\d{4}-/);
});
test('manual resume preserves the user recovery tab after successful collection',async()=>{
 const {result,calls}=await runExtensionJob({id:'b'.repeat(64),platform:'douyin',url:'',resume:true},{pending:true,active:true});
 assert.equal(result.status,'ok');assert(!calls.some(([method])=>method==='remove'));
});
test('extension attention is distinct from connection error in structured status',async()=>{
 const {state}=await runExtensionJob({id:'b'.repeat(64),platform:'douyin',url:'',automatic:true},{pending:true});
 assert.equal(state.activity.phase,'attention');assert.equal(state.lastResult.phase,'attention');
});

test('protocol 2 connector streams ordered batches, retries acknowledgement loss, and ends without full result payload',async()=>{
 const bundle=(await sourceBundle()).replace('const raw=await collect({page,platform:job.platform','const raw=await fixtureCollect({page,platform:job.platform');
 let listener,done;const ended=new Promise(r=>done=r),sequences=[];let first=true;
 const state={connection:{base:'http://127.0.0.1:54321',token:'a'.repeat(64)}};
 const api={runtime:{id:'fixture',onMessage:{addListener:f=>listener=f},onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{onAlarm:{addListener(){}}},storage:{local:{get:async()=>state,set:async v=>Object.assign(state,v)}},tabs:{create:async()=>({id:1}),remove:async()=>{}}};
 vm.runInNewContext(bundle,{chrome:api,URL,AbortController,setTimeout,clearTimeout,
  fixtureCollect:async({onBatch,collection})=>{assert.equal(collection.mode,'history');for(let i=0;i<3;i++){const ack=await onBatch({works:Array.from({length:100},(_,n)=>({url:`https://www.douyin.com/video/${i*100+n}`}))});assert.equal(ack.known,false);}return {works:[]};},
  fetch:async(url,options)=>{const body=JSON.parse(options.body);if(url.endsWith('/poll'))return {ok:true,json:async()=>({job:{id:'b'.repeat(64),platform:'douyin',url:'',protocol:2,collection:{mode:'history'}}})};if(url.endsWith('/batch')){sequences.push(body.sequence);if(first){first=false;throw Error('ack lost');}return {ok:true,json:async()=>({ok:true,known:false})};}if(url.endsWith('/result')){done(body);return {ok:true,json:async()=>({ok:true})};}throw Error(url);}
 });
 listener({type:'poll'},{id:'fixture'},()=>{});const result=await ended;
 assert.deepEqual(sequences,[0,0,1,2]);assert.equal(result.status,'ok');assert.equal(result.raw,undefined);
});
