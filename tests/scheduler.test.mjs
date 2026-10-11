import test from 'node:test';
import assert from 'node:assert/strict';
let api={};try{api=await import('../src/scheduler.mjs');}catch{}
const daily={enabled:true,kind:'daily',time:'09:00',hours:6,timeZone:'Asia/Shanghai'};
test('daily schedule uses saved timezone and advances after execution',()=>{
 assert.equal(typeof api.nextOccurrence,'function');
 assert.equal(api.nextOccurrence(daily,'2026-10-11T00:00:00Z'),'2026-10-11T01:00:00.000Z');
 assert.equal(api.nextOccurrence(daily,'2026-10-11T01:00:00Z'),'2026-10-12T01:00:00.000Z');
});
test('DST missing time moves forward and repeated time runs once per date',()=>{
 assert.equal(typeof api.nextOccurrence,'function');
 assert.equal(api.nextOccurrence({...daily,time:'02:30',timeZone:'America/New_York'},'2026-03-08T05:00:00Z'),'2026-03-08T07:00:00.000Z');
 assert.equal(api.nextOccurrence({...daily,time:'01:30',timeZone:'America/New_York'},'2026-11-01T05:45:00Z'),'2026-11-02T06:30:00.000Z');
});
test('interval validates rate and recovers missed dates with one due platform',()=>{
 assert.equal(typeof api.validateSchedule,'function');
 assert.throws(()=>api.validateSchedule({...daily,time:'29:00'}));
 assert.throws(()=>api.validateSchedule({...daily,timeZone:'invalid'}));
 assert.throws(()=>api.validateSchedule({...daily,kind:'interval',hours:0}));
 assert.equal(api.nextOccurrence({...daily,kind:'interval',hours:3},'2026-10-11T00:00:00Z'),'2026-10-11T03:00:00.000Z');
 const state={accounts:{x:{},douyin:{}},settings:{platforms:{x:{schedule:daily,nextRunAt:'2026-10-01T01:00:00Z'},douyin:{schedule:daily,nextRunAt:'2026-10-01T01:00:00Z',pausedReason:'needs_login'}}}};
 assert.deepEqual(api.duePlatforms(state,'2026-10-11T01:00:00Z'),['x']);
});
test('only network failures retry, twice, while authentication pauses',()=>{
 assert.equal(typeof api.failureTransition,'function');
 assert.equal(api.failureTransition('needs_login',0,0,daily).pausedReason,'needs_login');
 assert.equal(api.failureTransition('network_error',0,0,daily).nextRunAt,'1970-01-01T00:01:00.000Z');
 assert.equal(api.failureTransition('network_error',1,0,daily).nextRunAt,'1970-01-01T00:05:00.000Z');
 assert.equal(api.failureTransition('network_error',2,0,daily).retryCount,0);
});
