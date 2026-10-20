import test from 'node:test';
import assert from 'node:assert/strict';
import {blank,load,save,recordSession,clear} from '../src/storage.js';
import {summarize,recommendation} from '../src/stats.js';
const question={id:'original',module:'add',expression:'703 − 468',answer:{n:'235',d:'1'},kind:'number'};
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};
test('错题原样保留，正确重练后已解决，历史不修改',()=>{
  const d=blank(),attempt={question,input:'245',elapsedMs:12300,status:'answered',result:{correct:false},reason:'待确认'};
  recordSession(d,{id:'first',attempts:[attempt]});
  assert.deepEqual(d.wrongs.original.question.answer,question.answer);assert.equal(d.wrongs.original.resolved,false);
  const retry=structuredClone(d.wrongs.original.question);recordSession(d,{id:'second',attempts:[{...attempt,question:retry,input:'235',result:{correct:true}}]});
  assert.equal(d.wrongs.original.resolved,true);assert.equal(d.sessions[0].attempts[0].input,'245');assert.equal(d.sessions.length,2);
  recordSession(d,{id:'third',attempts:[attempt]});assert.equal(d.wrongs.original.resolved,false);assert.equal(d.wrongs.original.times,2);
});
test('保存、读取、损坏数据、存储禁用及清空',()=>{
  const s=storage(),d=blank();assert.equal(load(s).data.version,1);d.settings.count=20;assert(save(d,s));assert.equal(load(s).data.settings.count,20);s.setItem('suyouzhang-v1','invalid');assert(load(s).warning);assert.equal(s.getItem('suyouzhang-v1'),'invalid');clear(s);assert.equal(load(s).data.sessions.length,0);assert.equal(save(d,{setItem(){throw new Error();}}),false);
});
test('统计包含未作答题，平均整组用时和平均作答用时分别计算',()=>{
  const attempts=[{question,status:'answered',result:{correct:true},elapsedMs:10000},{question,status:'answered',result:{correct:false},elapsedMs:20000},{question:{...question,module:'unit'},status:'unanswered',result:null,elapsedMs:5000}];
  const s=summarize(attempts,60000);assert.equal(s.correct,1);assert.equal(s.total,3);assert.equal(s.answered,2);assert.equal(s.avgMs,20000);assert.equal(s.groups[0].avgMs,15000);assert.equal(recommendation(attempts).module,'unit');
});
test('浏览器拒绝访问 localStorage 时仍能进入训练',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('SecurityError');}});
  try{assert(load().warning);assert.equal(save(blank()),false);}finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;}
});
