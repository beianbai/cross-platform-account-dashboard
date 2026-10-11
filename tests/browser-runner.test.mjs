import test from 'node:test';
import assert from 'node:assert/strict';
import * as runner from '../src/browser-runner.mjs';
import {classifyCollectionError} from '../src/collector.mjs';

function runtimeFixture({ownership='agent',failure=null}={}) {
 const calls=[];
 const task={spaceId:7,ownership,page(){calls.push('page');return {};},async finish(options){calls.push(['finish',options]);},async handOff(){calls.push('handoff');}};
 const runtime={async listTaskSpaces(){calls.push('list');return [{id:7,ownership,createdBy:'agent'}];},async taskSpace(id){calls.push(['space',id]);return task;},async takeOverTaskSpace(id){calls.push(['takeover',id]);task.ownership='agent';return task;}};
 const collect=async()=>{calls.push('collect');if(failure)throw failure;return {accountId:'fixture'};};
 return {runtime,calls,collect};
}
test('automatic jobs respect user ownership and never replace or take over the space',async()=>{
 const fixture=runtimeFixture({ownership:'user'});
 assert.equal(typeof runner.collectInTaskSpace,'function');
 const result=await runner.collectInTaskSpace(fixture.runtime,{platform:'x',spaceId:7,automatic:true,resume:true},fixture.collect);
 assert.equal(result.status,'needs_attention');assert.deepEqual(fixture.calls,['list']);assert.equal(result.spaceId,7);
});
test('manual resume explicitly takes over and success finishes once before returning data',async()=>{
 const fixture=runtimeFixture({ownership:'user'});
 const result=await runner.collectInTaskSpace(fixture.runtime,{platform:'x',spaceId:7,resume:true},fixture.collect);
 assert.equal(result.ok,true);assert.equal(result.spaceId,null);assert.deepEqual(result.raw,{accountId:'fixture'});
 assert.deepEqual(fixture.calls,['list',['takeover',7],'page','collect',['finish',{keep:[]}]]);
});
test('a collection failure hands off the same space and retains its typed recovery status',async()=>{
 const fixture=runtimeFixture({failure:Object.assign(Error('login required'),{status:'needs_login'})});
 const result=await runner.collectInTaskSpace(fixture.runtime,{platform:'x',spaceId:7},fixture.collect);
 assert.equal(result.status,'needs_login');assert.equal(result.spaceId,7);assert.equal(result.ok,false);
 assert.deepEqual(fixture.calls,['list',['space',7],'page','collect','handoff']);
});
test('CLI connection failure resolves a classified result and never exposes stderr',async()=>{
 const result=await runner.runBrowser({executable:'/missing',platform:'x',execute(_exe,_args,_options,callback){queueMicrotask(()=>callback(Object.assign(Error('secret'),{code:'ENOENT'}),'','private token'));return {stdin:{end(){}}};}});
 assert.equal(result.ok,false);assert.equal(result.status,'connection_offline');assert.doesNotMatch(result.error,/private|secret/);
});
test('a missing saved space never silently starts a replacement space',async()=>{
 const fixture=runtimeFixture();fixture.runtime.listTaskSpaces=async()=>[];
 const result=await runner.collectInTaskSpace(fixture.runtime,{platform:'x',spaceId:7,automatic:true},fixture.collect);
 assert.equal(result.status,'needs_attention');assert.deepEqual(fixture.calls,[]);
});
test('new automatic runs use a platform-specific space and finish without takeover',async()=>{
 const fixture=runtimeFixture();
 const result=await runner.collectInTaskSpace(fixture.runtime,{platform:'x',automatic:true},fixture.collect);
 assert.equal(result.ok,true);assert.deepEqual(fixture.calls,[['space','个人账号工作台 · x · 只读同步'],'page','collect',['finish',{keep:[]}]]);
});
test('connection failure before a space exists is classified as connection_offline',async()=>{
 const fixture=runtimeFixture();fixture.runtime.taskSpace=async()=>{throw Object.assign(Error('transport down'),{code:'ECONNREFUSED'});};
 const result=await runner.collectInTaskSpace(fixture.runtime,{platform:'x'},fixture.collect);
 assert.equal(result.status,'connection_offline');
});
test('a killed CLI retains the created space for recovery without exposing process output',async()=>{
 const result=await runner.runBrowser({executable:'/fixture',platform:'x',execute(_exe,_args,_options,callback){queueMicrotask(()=>callback(Object.assign(Error('timed out'),{killed:true}),'PERSONAL_SOCIAL_SPACE=19\n','private token'));return {stdin:{end(){}}};}});
 assert.equal(result.ok,false);assert.equal(result.spaceId,19);assert.equal(result.status,'connection_offline');assert.doesNotMatch(result.error,/private|secret/);
});

test('user takeover signals are attention errors, never a reason for automatic transport retries',async()=>{
 for(const error of [{executionStopped:true,message:'Execution stopped'},Error('The user has control of this space'),Error('Task space is not active; use takeOverTaskSpace')])assert.equal(await classifyCollectionError(error),'needs_attention');
});

test('retryable page failures keep agent ownership so the delayed retry can reuse the same space',async()=>{
 const fixture=runtimeFixture({failure:Object.assign(Error('navigation failed'),{status:'network_error'})});
 const result=await runner.collectInTaskSpace(fixture.runtime,{platform:'x',spaceId:7,automatic:true},fixture.collect);
 assert.equal(result.status,'network_error');assert.equal(result.spaceId,7);assert.deepEqual(fixture.calls,['list',['space',7],'page','collect']);
});
