import {moduleInfo} from './generator.js';
export function summarize(attempts,totalMs=0) {
  const answered=attempts.filter(a=>a.status==='answered'),correct=answered.filter(a=>a.result.correct).length,total=attempts.length;
  const grouped={};for(const a of attempts)(grouped[a.question.module]??=[]).push(a);
  const groups=Object.entries(grouped).map(([id,items])=>({id,name:moduleInfo(id)?.name||id,total:items.length,correct:items.filter(a=>a.result?.correct).length,avgMs:items.reduce((s,a)=>s+a.elapsedMs,0)/items.length}));
  return {total,answered:answered.length,correct,accuracy:total?correct/total:0,totalMs,avgMs:total?totalMs/total:0,groups};
}
export function recommendation(attempts) {
  if(!attempts.length) return {module:'add',text:'从基础加减开始，先用 10 题了解自己的计算状态。'};
  const groups=summarize(attempts).groups.sort((a,b)=>(a.correct/a.total)-(b.correct/b.total)||b.avgMs-a.avgMs),weak=groups[0];
  if(weak.correct===weak.total) return {module:weak.id,text:`本组准确率 100%。下次可继续练「${weak.name}」，保持准确后再逐步提速。`};
  return {module:weak.id,text:`下次建议练「${weak.name}」：${weak.total} 题中 ${weak.total-weak.correct} 题未答对。先重练原题，再做 10 题专项。`};
}
