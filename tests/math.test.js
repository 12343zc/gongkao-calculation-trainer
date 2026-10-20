import test from 'node:test';
import assert from 'node:assert/strict';
import {frac,decimal,add,sub,mul,div,eq,format,order,significant,carryProfile,borrowProfile,multiplicationCarries} from '../src/math.js';
import {validate} from '../src/validation.js';

test('十进制精确运算，不依赖二进制浮点',()=>{
  assert(eq(add(decimal('0.1'),decimal('0.2')),decimal('0.3')));
  assert(eq(div(decimal('7.83'),decimal('2.61')),frac(3)));
  assert(eq(sub(decimal('-1.25'),decimal('0.75')),frac(-2)));
  assert(eq(mul(decimal('.001'),decimal('10000')),frac(10)));
  assert.throws(()=>div(frac(2),frac(0)));
  for(const invalid of ['','NaN','1e3','--2','1,000','Infinity','3/4','0x10'])assert.throws(()=>decimal(invalid));
});
test('进位和借位根据真实逐位过程识别',()=>{
  assert.equal(carryProfile(11,22).count,0);
  assert.equal(carryProfile(58,67).maxRun,2);
  assert.equal(carryProfile(567,456).maxRun,3);
  assert.equal(borrowProfile(703,468).crossZero,true);
  assert.equal(borrowProfile(703,468).maxRun,2);
  assert.equal(borrowProfile(835,412).count,0);
  assert.equal(borrowProfile(730,281).crossZero,true);
  assert.equal(multiplicationCarries(12,3),false);
  assert.equal(multiplicationCarries(23,4),true);
});
test('两位与三位有效数字：截断、四舍五入、边界及零',()=>{
  for(const [value,count,rule,result] of [['7830',2,'truncate','7800'],['7830',3,'round','7830'],['0.00785',2,'round','0.0079'],['0.00785',2,'truncate','0.0078'],['999',2,'round','1000'],['9.995',3,'round','10'],['-785',2,'round','-790'],['-785',2,'truncate','-780'],['0',3,'round','0']]) assert.equal(format(significant(decimal(value),count,rule)),result);
});
test('数量级边界不误判',()=>{
  for(const [value,expected] of [['0.1',-1],['0.999',-1],['1',0],['9.999',0],['10',1],['10000',4],['0.000001',-6]])assert.equal(order(decimal(value)),expected);
  assert.equal(order(frac(0)),null);
});
test('精确答案、有效数字及单位严格校验',()=>{
  assert.equal(validate({answer:decimal('0.3')},'0.300').correct,true);
  assert.equal(validate({answer:decimal('0.3')},'0.3000001').correct,false);
  const q={answer:frac(2),unit:'元/人',unitOptions:['元/人','万元/人']};
  assert.equal(validate(q,'2','万元/人').correct,false);
  assert.equal(validate(q,'2','元/人').correct,true);
  assert.equal(validate(q,'2','').valid,false);
  const r=validate({answer:frac(3)},'300');assert.match(r.hint,/100 倍/);assert.equal(r.reason,'待确认');
});
test('估算误差使用闭区间；精确值为零时只比较绝对误差',()=>{
  const q={answer:frac(100),estimate:true,tolerance:'0.05'};
  assert.equal(validate(q,'105').correct,true);
  assert.equal(validate(q,'105.00000001').correct,false);
  assert.equal(validate(q,'95').correct,true);
  assert.equal(validate(q,'105').relative,'5');
  const z={answer:frac(0),estimate:true,absoluteTolerance:'0.01'};
  assert.equal(validate(z,'0.009').correct,true);assert.equal(validate(z,'0.011').correct,false);assert.equal(validate(z,'0').relative,null);
});
