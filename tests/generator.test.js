import test from 'node:test';
import assert from 'node:assert/strict';
import {MODULES,DEFAULT_SETTINGS,generate,convertUnit,toleranceFor} from '../src/generator.js';
import {frac,decimal,eq,format,carryProfile,borrowProfile,finite,order,multiplicationCarries} from '../src/math.js';
import {validate} from '../src/validation.js';
function random(seed=123456){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
test('每个专项批量生成，精确答案均可通过校验，选择题仅一个正确选项',()=>{
  const rng=random();let total=0;
  for(const m of MODULES)for(const [sub] of m.subs)for(let i=0;i<120;i++){
    const settings={...DEFAULT_SETTINGS,tolerancePercent:null,module:m.id,sub,difficulty:i%2?'advanced':'standard',sig:i%2?2:3,rule:i%2?'truncate':'round'};
    const q=generate(settings,rng);total++;
    assert.equal(q.module,m.id);assert(q.answer.d!=='0');
    if(q.kind==='choice'){
      assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.value)).size,4);assert.equal(q.options.filter(o=>o.value===q.choiceAnswer).length,1);assert.equal(Number(q.choiceAnswer),order(q.answer));
      for(const o of q.options)assert.equal(validate(q,o.value).correct,o.value===q.choiceAnswer);
    }else if(!q.estimate){assert(finite(q.answer,10),`${m.id}/${sub}: ${q.answer.n}/${q.answer.d}`);assert.equal(validate(q,format(q.answer),q.unit).correct,true);}
    else {assert.equal(validate(q,format(q.approx)).correct,true);if(q.module!=='magnitude')assert.equal(q.approximations.length,2);}
    if(m.id==='add'&&q.operands){const [a,b]=q.operands,c=carryProfile(a,b),br=borrowProfile(a,b);assert.equal(String(a).length,['add3','sub3','zero'].includes(q.skill)?3:2);if(q.skill==='add2')assert.equal(c.count,0);if(q.skill==='carry2')assert(a%10+b%10>=10);if(q.skill==='sub2')assert.equal(br.count,0);if(q.skill==='borrow2')assert(a%10<b%10);if(q.skill==='ten')assert(a%10===0&&b%10>0);if(q.skill==='add3')assert(c.maxRun>=2);if(q.skill==='sub3')assert(br.maxRun>=2);if(q.skill==='zero')assert(br.crossZero);}
    if(m.id==='multiply'&&q.operands){const [a,b]=q.operands;if(q.skill.includes('x')){const dims=q.skill.split('x').map(Number);assert.equal(String(a).length,dims[0]);assert.equal(String(b).length,dims[1]);}if(q.skill==='carry')assert(multiplicationCarries(a,b));}
    if(m.id==='divide'&&q.operands&&q.skill.includes('/')){const [a,b]=q.operands,dims=q.skill.split('/').map(Number);assert.equal(a.length,dims[0]);assert.equal(b.length,dims[1]);assert(finite(q.answer,2));}
  }
  assert.equal(total,MODULES.reduce((n,m)=>n+m.subs.length,0)*120);
});
test('乘除法估算：两三位及两种规则生成的参考估算落在公布容差内',()=>{
  const rng=random(99);
  for(const module of ['multiply','divide','estimate'])for(const sig of [2,3])for(const rule of ['round','truncate'])for(let i=0;i<180;i++){
    const q=generate({...DEFAULT_SETTINGS,tolerancePercent:null,module,mode:'estimate',sig,rule},rng);
    if(q.estimate)assert(validate(q,format(q.approx)).correct,JSON.stringify(q));
  }
});
test('单位换算量纲和万亿比例',()=>{
  for(const [v,from,to,out] of [['1','亿元','元','100000000'],['783','万元','亿元','0.0783'],['2.5','万人','人','25000'],['3','亿吨','万吨','30000'],['0.001','万千米','千米','10']])assert(eq(convertUnit(decimal(v),from,to),decimal(out)));
  assert.throws(()=>convertUnit(frac(1),'元','吨'),/量纲/);
});
test('不同位数除法量级校准',()=>{
  const expressions=[[783,26,1],[783,263,0],[7830,263,1],[78300,263,2]];
  for(const [a,b,k] of expressions)assert.equal(order(frac(a,b)),k);
});
test('混合训练覆盖六个模块，无异常答案',()=>{
  const rng=random(42),ids=new Set();
  for(let i=0;i<1000;i++){const q=generate({...DEFAULT_SETTINGS,tolerancePercent:null,module:'mixed'},rng);ids.add(q.module);assert(q.id);}
  assert.equal(ids.size,6);
});
test('0–20% 每个误差阈值精确判定边界且不放宽用户要求',()=>{
  for(let p=0;p<=20;p++) {
    const tolerance=toleranceFor({tolerancePercent:p}),q={estimate:true,answer:frac(100),tolerance};
    assert(validate(q,String(100+p)).correct);
    assert(validate(q,String(100-p)).correct);
    assert.equal(validate(q,String(100+p+0.0001)).correct,false);
  }
  for(const p of [-1,21,2.5,'bad'])assert.throws(()=>toleranceFor({tolerancePercent:p}));
});
test('数量级默认采用数值估算，十倍区间仍可独立选择；0%题有可输入的有限小数答案',()=>{
  const rng=random(45);
  for(const module of ['magnitude','estimate','divide','multiply'])for(const p of [0,1,5,20])for(let i=0;i<50;i++) {
    const q=generate({...DEFAULT_SETTINGS,module,mode:'estimate',tolerancePercent:p},rng);
    assert.equal(q.kind,'number');assert(q.estimate);assert.equal(q.tolerance,toleranceFor({tolerancePercent:p}));
    if(p===0) {assert(finite(q.answer,10));assert(validate(q,format(q.answer)).correct);}
  }
  const q=generate({...DEFAULT_SETTINGS,module:'magnitude',sub:'range'},rng);assert.equal(q.kind,'choice');
});
