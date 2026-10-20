import {decimal,frac,abs,sub,div,mul,eq,number,format} from './math.js';

export const ERROR_REASONS=['待确认','进位错误','借位或退位错误','乘法进位错误','除法试商错误','数量级错误','单位换算错误','小数点位置错误','截位规则错误','估算误差过大','精度选择不合理','其他计算错误'];
export function validate(question,input,unit='') {
  if(question.kind==='choice') {
    if(!question.options.some(x=>x.value===input)) return {valid:false,message:'请先选择一个范围'};
    return {valid:true,correct:input===question.choiceAnswer,reason:'待确认',hint:input===question.choiceAnswer?'':'所选范围与精确结果不符；真实错因请手动确认。'};
  }
  let actual;
  try { actual=decimal(input); } catch(e) { return {valid:false,message:e.message}; }
  if(question.unit && !question.unitOptions.includes(unit)) return {valid:false,message:'请选择结果单位'};
  const delta=abs(sub(actual,question.answer)),zero=question.answer.n==='0';
  const relative=zero?null:div(delta,abs(question.answer));
  const threshold=question.estimate?decimal(zero?(question.absoluteTolerance||'0.01'):question.tolerance):null;
  const error=zero?delta:relative;
  const numericCorrect=question.estimate ? BigInt(error.n)*BigInt(threshold.d)<=BigInt(threshold.n)*BigInt(error.d) : eq(actual,question.answer);
  const unitCorrect=!question.unit || unit===question.unit;
  let hint='';
  if(!unitCorrect) hint='结果单位与题目要求不一致；请确认是否存在换算失误。';
  else if(!numericCorrect && !zero && actual.n!=='0') {
    const ratio=abs(div(actual,question.answer));
    for(const factor of [10,100,10000]) if(eq(ratio,frac(factor))||eq(ratio,frac(1,factor))) { hint=`数值与答案相差约 ${factor} 倍，可能涉及数量级或小数点，请确认。`; break; }
  }
  if(!numericCorrect&&!hint) hint=question.estimate?'估算误差超过本题允许范围；真实错因请手动确认。':'最终答案不符，无法据此判断心算过程，请手动确认错因。';
  return {valid:true,correct:numericCorrect&&unitCorrect,numericCorrect,unitCorrect,absolute:format(delta),relative:relative?format(mul(relative,frac(100)),4):null,reason:'待确认',hint};
}
