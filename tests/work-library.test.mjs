import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSnapshot,applySnapshot,emptyState,validateState} from '../src/core.mjs';
const raw=(ids,extra={})=>({url:'https://www.douyin.com/user/abc',name:'合成作者',accountId:'abc',fans:'12',following:'2',works:ids.map(i=>({url:`https://www.douyin.com/video/${i}`,title:`作品 ${i}`,kind:'视频'})),...extra});
test('work library retains more than 200 records and accumulates across snapshots',()=>{
 let state=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw(Array.from({length:250},(_,i)=>i+1))));
 assert.equal(state.accounts.douyin.works.length,250);
 state=applySnapshot(state,'douyin',normalizeSnapshot('douyin',raw([250,251])));
 assert.equal(state.accounts.douyin.works.length,251);
 assert.equal(state.accounts.douyin.workLibrary.added,1);
 assert.equal(state.accounts.douyin.works[0].id,'/video/251');
 validateState(state);
});
test('repeated batches update metadata idempotently and empty pages never delete old works',()=>{
 let state=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw([1])));
 const first=state.accounts.douyin.works[0].firstSeenAt;
 state=applySnapshot(state,'douyin',normalizeSnapshot('douyin',raw([1],{works:[{url:'https://www.douyin.com/video/1',title:'更新标题',kind:'视频'}]})));
 assert.equal(state.accounts.douyin.works.length,1);assert.equal(state.accounts.douyin.works[0].title,'更新标题');assert.equal(state.accounts.douyin.works[0].firstSeenAt,first);
 assert.equal(state.accounts.douyin.workLibrary.added,0);
 state=applySnapshot(state,'douyin',normalizeSnapshot('douyin',raw([])));
 assert.equal(state.accounts.douyin.works.length,1);validateState(state);
});
test('history completion requires collector evidence and incremental does not promote historical coverage',()=>{
 let state=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw([1],{collectionProgress:{mode:'history',status:'paused',reason:'budget',checkpoint:{section:'video',step:3},scanned:1}})));
 assert.equal(state.accounts.douyin.workSync.status,'paused');
 assert.equal(state.accounts.douyin.workSync.historyComplete,false);
 state=applySnapshot(state,'douyin',normalizeSnapshot('douyin',raw([2],{collectionProgress:{mode:'incremental',status:'incremental',reason:'known',checkpoint:null,scanned:1}})));
 assert.equal(state.accounts.douyin.workSync.historyComplete,false);
 assert.equal(state.accounts.douyin.workSync.historyCheckpoint.step,3);
 state=applySnapshot(state,'douyin',normalizeSnapshot('douyin',raw([],{collectionProgress:{mode:'history',status:'complete',reason:'end',checkpoint:null,scanned:2}})));
 assert.equal(state.accounts.douyin.workSync.historyComplete,true);validateState(state);
});
test('invalid progress and account switches never overwrite a library',()=>{
 assert.throws(()=>normalizeSnapshot('douyin',raw([1],{collectionProgress:{mode:'history',status:'complete',checkpoint:{url:'https://evil.test'},scanned:-1}})));
 const state=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw([1])));
 assert.throws(()=>applySnapshot(state,'douyin',normalizeSnapshot('douyin',raw([2],{url:'https://www.douyin.com/user/other',accountId:'other'}))));
 assert.equal(state.accounts.douyin.works.length,1);
});

test('daily refresh retains the unfinished history checkpoint and previously saved works',()=>{
 const checkpoint={version:1,platform:'douyin',accountURL:'https://www.douyin.com/user/abc',category:'posts',window:3};
 let state=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',raw([1],{collectionProgress:{mode:'history',status:'paused',reason:'budget',checkpoint,scanned:1}})));
 state=applySnapshot(state,'douyin',normalizeSnapshot('douyin',raw([2],{collectionProgress:{mode:'refresh',status:'incremental',reason:'visible_snapshot',checkpoint:null,scanned:1}})));
 assert.equal(state.accounts.douyin.works.length,2);assert.deepEqual(state.accounts.douyin.workSync.historyCheckpoint,checkpoint);assert.equal(state.accounts.douyin.workSync.historyComplete,false);validateState(state);
});
