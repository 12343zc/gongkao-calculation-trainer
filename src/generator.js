import {frac,decimal,add,sub,mul,div,format,finite,significant,carryProfile,borrowProfile,multiplicationCarries,order} from './math.js';

export const MODULES = [
  {id:'add', letter:'A', name:'基础加减', desc:'进位、借位与凑整补偿', mark:'把基础算稳', subs:[['mixed','随机加减'],['add2','两位数 · 不进位'],['carry2','两位数 · 个位进位'],['sum2','多个两位数相加'],['sub2','两位数 · 不退位'],['borrow2','两位数 · 个位退位'],['ten','跨整十减法'],['add3','三位数 · 连续进位'],['sub3','三位数 · 连续借位'],['zero','跨零借位'],['comp','凑整补偿'],['chain','连续加减']]},
  {id:'multiply',letter:'B',name:'乘法训练',desc:'进位运算与接近整十整百',mark:'减少中间失误',subs:[['mixed','随机乘法'],['2x1','两位数 × 一位数'],['2x2','两位数 × 两位数'],['3x1','三位数 × 一位数'],['3x2','三位数 × 两位数'],['carry','乘法进位专项'],['near','接近整十、整百'],['digits','乘积位数判断']]},
  {id:'divide',letter:'C',name:'除法与试商',desc:'有限小数、估商与有效数字',mark:'重点练习',subs:[['mixed','随机精确除法'],['3/1','三位数 ÷ 一位数'],['3/2','三位数 ÷ 两位数'],['3/3','三位数 ÷ 三位数'],['4/2','四位数 ÷ 两位数'],['4/3','四位数 ÷ 三位数'],['decimal','带小数的除法'],['scaled','同时缩放的除法'],['range','估商 · 数量级'],['sig','商的有效数字']]},
  {id:'magnitude',letter:'D',name:'数量级判断',desc:'先看位数，再移动小数点',mark:'守住数量级',subs:[['mixed','整数与小数混合'],['division','除法数量级'],['multiplication','乘法数量级']]},
  {id:'unit',letter:'E',name:'单位换算',desc:'万、亿与百分数的统一',mark:'不再差一万倍',subs:[['mixed','随机基础换算'],['money','元 / 万元 / 亿元'],['people','人 / 万人 / 亿人'],['weight','吨 / 万吨 / 亿吨'],['distance','千米 / 万千米'],['percent','百分数 / 小数 / 倍数'],['combined','带单位的乘除']]},
  {id:'estimate',letter:'F',name:'截位与估算',desc:'两位、三位有效数字与误差',mark:'用对计算精度',subs:[['mixed','乘除截位估算'],['division','除法截位估算'],['multiplication','乘法截位估算'],['sig','原数的有效数字']]}
];
export const moduleInfo = id => MODULES.find(m=>m.id===id);
const integer = (a,b,rng) => a+Math.floor(rng()*(b-a+1));
const pick = (arr,rng) => arr[integer(0,arr.length-1,rng)];
const digits = (count,rng) => integer(10**(count-1),10**count-1,rng);
let serial=0;
const base = (module,skill,expression,answer,extra={}) => ({id:`q-${Date.now()}-${++serial}`,module,skill,expression,answer,kind:'number',unit:'',...extra});
function search(make,predicate) { for(let i=0;i<20000;i++) { const value=make(); if(predicate(value)) return value; } throw new Error('未能生成符合条件的题目，请重试'); }
function addition(settings,rng) {
  let skill=settings.sub;
  if(!skill || skill==='mixed') skill=pick(moduleInfo('add').subs.slice(1).map(x=>x[0]),rng);
  if(skill==='sum2' || skill==='chain') {
    const count=integer(3,5,rng), values=Array.from({length:count},()=>digits(skill==='sum2'?2:3,rng));
    let value=values[0], expression=String(value);
    for(let i=1;i<count;i++) { const plus=skill==='sum2'||rng()>.45; value+=plus?values[i]:-values[i]; expression+=` ${plus?'+':'−'} ${values[i]}`; }
    return base('add',skill,expression,frac(value),{explanation:'从左至右累加，保留每一步的正负号。'});
  }
  if(skill==='comp') { const a=digits(3,rng), b=pick([198,199,298,299,398,399,498,499,998,999],rng); return base('add',skill,`${a} − ${b}`,frac(a-b),{explanation:`${a} − ${b+ (b%100===98?2:1)} + ${b%100===98?2:1} = ${a-b}。`}); }
  const subtraction=['sub2','borrow2','ten','sub3','zero'].includes(skill), count=['add3','sub3','zero'].includes(skill)?3:2;
  const [a,b]=search(()=> { let a=digits(count,rng),b=digits(count,rng); return subtraction?[Math.max(a,b),Math.min(a,b)]:[a,b]; },([a,b])=>{
    const c=carryProfile(a,b),br=borrowProfile(a,b);
    return ({add2:c.count===0,carry2:a%10+b%10>=10,sub2:br.count===0,borrow2:a%10<b%10,ten:a%10===0&&b%10>0,add3:c.maxRun>=2,sub3:br.maxRun>=2,zero:br.crossZero})[skill];
  });
  const answer=subtraction?a-b:a+b;
  return base('add',skill,`${a} ${subtraction?'−':'+'} ${b}`,frac(answer),{operands:[a,b],explanation:subtraction?'按位相减，借位后记得将前一位减 1。':'按位相加，进位要计入下一位。'});
}
function multiplication(settings,rng) {
  let skill=settings.sub||'mixed'; if(skill==='mixed') skill=pick(['2x1','2x2','3x1','carry','near'],rng);
  let a,b;
  if(skill==='near') { a=pick([19,29,39,49,98,99,101,102],rng); b=digits(settings.difficulty==='advanced'?3:2,rng); }
  else { const pair=skill.includes('x')?skill.split('x').map(Number):[settings.difficulty==='advanced'?3:2,2]; [a,b]=search(()=>[digits(pair[0],rng),digits(pair[1],rng)],([a,b])=>skill!=='carry'||multiplicationCarries(a,b)); }
  if(skill==='digits') return base('multiply',skill,`${a} × ${b} 的积有几位？`,frac(String(a*b).length),{explanation:`${a} × ${b} = ${a*b}，共 ${String(a*b).length} 位。`});
  if(settings.mode==='estimate') return estimateQuestion('multiply',skill,decimal(a),decimal(b),'×',settings);
  return base('multiply',skill,`${a} × ${b}`,frac(a*b),{operands:[a,b],explanation:`可拆分计算：${a} × ${Math.floor(b/10)*10} + ${a} × ${b%10} = ${a*b}。`});
}
function division(settings,rng) {
  let skill=settings.sub||'mixed'; if(skill==='mixed') skill=pick(settings.difficulty==='advanced'?['3/2','3/3','4/2','4/3','decimal','scaled']:['3/1','3/2','3/3','decimal'],rng);
  if(skill==='range') return magnitude({...settings,sub:'division'},rng,'divide');
  if(skill==='sig') { const a=frac(digits(3,rng)),b=frac(digits(integer(1,3,rng),rng)); const value=div(a,b),result=significant(value,Number(settings.sig),settings.rule); return base('divide',skill,`${format(a)} ÷ ${format(b)}`,result,{exact:value,explanation:`商约为 ${format(value)}；按${settings.rule==='truncate'?'直接截断':'四舍五入'}保留 ${settings.sig} 位有效数字为 ${format(result)}。`,instruction:`商保留 ${settings.sig} 位有效数字 · ${settings.rule==='truncate'?'直接截断':'四舍五入'}`}); }
  const shape=skill.includes('/')?skill:pick(['3/2','4/3'],rng),[ac,bc]=shape.split('/').map(Number);
  const [a,b]=search(()=>{
    const b=digits(bc,rng), scale=pick([1,10,100],rng),q=integer(1,Math.ceil(10**ac/b*scale),rng);
    return [b*q/scale,b];
  },([a,b])=>Number.isInteger(a)&&a>=10**(ac-1)&&a<10**ac&&finite(div(frac(a),frac(b)),2));
  let left=frac(a),right=frac(b), note='';
  if(skill==='decimal') { left=div(left,frac(10));right=div(right,frac(pick([10,100],rng))); }
  if(skill==='scaled') { const scale=pick([10,100],rng);left=div(left,frac(scale));right=div(right,frac(scale));note=`被除数和除数同乘 ${scale}，商不变。`; }
  const answer=div(left,right);
  if(settings.mode==='estimate') return estimateQuestion('divide',skill,left,right,'÷',settings);
  return base('divide',skill,`${format(left)} ÷ ${format(right)}`,answer,{operands:[format(left),format(right)],explanation:`${note}乘回验证：${format(right)} × ${format(answer)} = ${format(left)}。`,instruction:'精确计算 · 答案为整数或有限小数'});
}
function magnitude(settings,rng,module='magnitude') {
  const op=settings.sub==='division'?'÷':settings.sub==='multiplication'?'×':pick(['÷','×'],rng);
  const a=div(frac(digits(3,rng)),frac(10**integer(0,3,rng))),b=div(frac(digits(integer(1,3,rng),rng)),frac(10**integer(0,3,rng)));
  const answer=op==='÷'?div(a,b):mul(a,b),k=order(answer);
  const power=x=>x>=0?frac(10n**BigInt(x)):frac(1n,10n**BigInt(-x));
  const label=x=>`[${format(power(x))}, ${format(power(x+1))})`;
  // Distinct half-open intervals ensure boundaries belong to one answer only.
  const powers=[k-1,k,k+1,k+2].sort(()=>rng()-.5),options=powers.map(x=>({value:String(x),label:label(x)}));
  return base(module,'range',`${format(a)} ${op} ${format(b)}`,answer,{kind:'choice',choiceAnswer:String(k),options,instruction:'判断结果范围 · 左端包含，右端不包含',explanation:`结果约为 ${format(answer)}，属于 ${label(k)}。`});
}
const families={money:[['元',0],['万元',4],['亿元',8]],people:[['人',0],['万人',4],['亿人',8]],weight:[['吨',0],['万吨',4],['亿吨',8]],distance:[['千米',0],['万千米',4]]};
export const scalePower = exp => exp>=0?frac(10n**BigInt(exp)):frac(1n,10n**BigInt(-exp));
export function convertUnit(value,from,to) {
  for(const family of Object.values(families)) { const a=family.find(x=>x[0]===from),b=family.find(x=>x[0]===to);if(a&&b) return mul(value,scalePower(a[1]-b[1])); }
  throw new Error('单位量纲不一致');
}
function units(settings,rng) {
  let skill=settings.sub||'mixed';if(skill==='mixed') skill=pick([...Object.keys(families),'percent','combined'],rng);
  if(skill==='percent') {
    const n=integer(1,3500,rng),a=div(frac(n),frac(100));
    const variant=integer(0,2,rng);
    if(variant===0) return base('unit',skill,`${format(a)}% = ?`,div(a,frac(100)),{unit:'小数',unitOptions:['小数','%','倍'],explanation:'百分数转为小数，除以 100。'});
    if(variant===1) return base('unit',skill,`${format(div(a,frac(100)))} = ? %`,a,{unit:'%',unitOptions:['%','小数','倍'],explanation:'小数转为百分数，乘以 100 后加 %。'});
    return base('unit',skill,`${format(a)} 倍 = ? %`,mul(a,frac(100)),{unit:'%',unitOptions:['%','倍','小数'],explanation:'1 倍 = 100%。'});
  }
  if(skill==='combined') {
    const spec=pick([{from:'亿元',bottom:'万人',to:'万元/人',power:0},{from:'万元',bottom:'万人',to:'元/人',power:0},{from:'万吨',bottom:'亿吨',to:'比值',power:-4}],rng);
    const b=integer(2,90,rng),q=integer(2,90,rng),a=b*q;
    return base('unit',skill,`${a} ${spec.from} ÷ ${b} ${spec.bottom}`,mul(frac(q),scalePower(spec.power)),{unit:spec.to,unitOptions:['万元/人','元/人','比值'],explanation:`先统一单位：${spec.from} ÷ ${spec.bottom} = ${spec.power===-4?'0.0001 × 比值':spec.to}，所以结果为 ${format(mul(frac(q),scalePower(spec.power)))} ${spec.to}。`});
  }
  const family=families[skill],i=integer(0,family.length-1,rng),j=(i+integer(1,family.length-1,rng))%family.length;
  const [from]=family[i],[to]=family[j],value=div(frac(integer(10,9999,rng)),frac(pick([1,10,100],rng))),answer=convertUnit(value,from,to);
  return base('unit',skill,`${format(value)} ${from} = ? ${to}`,answer,{unit:to,unitOptions:family.map(x=>x[0]),explanation:`1 ${family.at(-1)[0]} = ${format(scalePower(family.at(-1)[1]))} ${family[0][0]}。${format(value)} ${from} = ${format(answer)} ${to}。`});
}
function estimateQuestion(module,skill,a,b,op,settings) {
  const sig=Number(settings.sig||2),rule=settings.rule||'round',left=significant(a,sig,rule),right=significant(b,sig,rule),answer=op==='÷'?div(a,b):mul(a,b),approx=op==='÷'?div(left,right):mul(left,right);
  const tolerance=sig===2?(rule==='truncate'?'0.12':'0.06'):(rule==='truncate'?'0.02':'0.01');
  return base(module,skill,`${format(a)} ${op} ${format(b)}`,answer,{estimate:true,tolerance,approx,approximations:[format(left),format(right)],instruction:`各数保留 ${sig} 位有效数字 · ${rule==='truncate'?'直接截断':'四舍五入'} · 相对误差 ≤ ${Number(tolerance)*100}%`,explanation:`${format(a)} → ${format(left)}；${format(b)} → ${format(right)}。近似算式 ${format(left)} ${op} ${format(right)} ≈ ${format(approx)}。数量级随原数保留。`});
}
function estimation(settings,rng) {
  const a=div(frac(digits(integer(3,5,rng),rng)),frac(10**integer(0,3,rng)));
  if(settings.sub==='sig') { const answer=significant(a,Number(settings.sig),settings.rule); return base('estimate','sig',`${format(a)} 保留 ${settings.sig} 位有效数字`,answer,{instruction:settings.rule==='truncate'?'直接截断 · 未保留的位置补零，保持数量级':'四舍五入 · 未保留的位置补零，保持数量级',explanation:`${format(a)} → ${format(answer)}。有效数字从第一个非零数字开始计数。`}); }
  const b=div(frac(digits(integer(2,4,rng),rng)),frac(10**integer(0,2,rng))),op=settings.sub==='division'?'÷':settings.sub==='multiplication'?'×':pick(['÷','×'],rng);
  return estimateQuestion('estimate',settings.sub,a,b,op,settings);
}
export function generate(settings,rng=Math.random) {
  const module=settings.module==='mixed'?pick(MODULES.map(x=>x.id),rng):settings.module;
  const s={...settings,sub:settings.module==='mixed'?'mixed':settings.sub};
  return ({add:addition,multiply:multiplication,divide:division,magnitude,unit:units,estimate:estimation})[module](s,rng);
}
export const DEFAULT_SETTINGS={module:'add',sub:'mixed',difficulty:'standard',count:10,timed:false,minutes:5,mode:'exact',sig:2,rule:'round'};
