import {DEFAULT_SETTINGS} from './generator.js';
const KEY='suyouzhang-v1';
export const blank=()=>({version:1,settings:{...DEFAULT_SETTINGS},sessions:[],wrongs:{}});
export function load(storage) {
  try {storage??=globalThis.localStorage;const raw=storage.getItem(KEY);if(!raw) return {data:blank()};const d=JSON.parse(raw);if(d.version!==1||!Array.isArray(d.sessions)||!d.wrongs||typeof d.wrongs!=='object'||Array.isArray(d.wrongs)) throw new Error();return {data:{...d,settings:{...DEFAULT_SETTINGS,...d.settings}}};}
  catch {return {data:blank(),warning:'本地记录读取失败。原始存储未覆盖；请检查浏览器存储设置。'};}
}
export function save(data,storage) {try{storage??=globalThis.localStorage;storage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
export function clear(storage=globalThis.localStorage) {storage.removeItem(KEY);}
export function recordSession(data,session) {
  data.sessions.push(session);
  for(const attempt of session.attempts) {
    const id=attempt.question.originId||attempt.question.id;
    if(attempt.result?.correct) {if(data.wrongs[id]) {data.wrongs[id].resolved=true;data.wrongs[id].lastPracticed=Date.now();} continue;}
    const previous=data.wrongs[id];
    data.wrongs[id]={question:{...attempt.question,originId:id},reason:attempt.reason||previous?.reason||'待确认',lastAnswer:attempt.input||'未作答',lastUnit:attempt.unit||'',elapsedMs:attempt.elapsedMs,resolved:false,times:(previous?.times||0)+1,lastPracticed:Date.now()};
  }
}
