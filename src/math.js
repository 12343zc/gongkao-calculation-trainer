// All answer-critical arithmetic uses reduced BigInt fractions.
export function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a,b] = [b,a%b]; return a; }
export function frac(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  if (!d) throw new Error('除数不能为零');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n,d); return { n: (n/g).toString(), d: (d/g).toString() };
}
export function decimal(value) {
  const s = String(value).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s) || s.length > 60) throw new Error('请输入有效数字，支持小数和负数');
  const negative = s.startsWith('-'); const [whole, tail=''] = s.replace(/^[+-]/,'').split('.');
  return frac(BigInt((whole || '0') + tail) * (negative ? -1n : 1n), 10n ** BigInt(tail.length));
}
export const add = (a,b) => frac(BigInt(a.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d),BigInt(a.d)*BigInt(b.d));
export const sub = (a,b) => add(a,frac(-BigInt(b.n),b.d));
export const mul = (a,b) => frac(BigInt(a.n)*BigInt(b.n),BigInt(a.d)*BigInt(b.d));
export const div = (a,b) => frac(BigInt(a.n)*BigInt(b.d),BigInt(a.d)*BigInt(b.n));
export const eq = (a,b) => BigInt(a.n)*BigInt(b.d) === BigInt(b.n)*BigInt(a.d);
export const abs = a => frac(BigInt(a.n)<0n?-BigInt(a.n):BigInt(a.n),a.d);
export const number = a => Number(a.n)/Number(a.d);
export function format(a, digits=10) {
  let n = BigInt(a.n); const d = BigInt(a.d), negative = n < 0n; n = negative ? -n : n;
  const scale = 10n ** BigInt(digits);
  const rounded = (n*scale*2n+d)/(2n*d);
  const whole = rounded/scale, tail=(rounded%scale).toString().padStart(digits,'0').replace(/0+$/,'');
  return (negative && rounded ? '-' : '') + whole + (tail ? '.'+tail : '');
}
export function finite(a, places=2) { return (BigInt(a.n)*10n**BigInt(places))%BigInt(a.d) === 0n; }
export function order(a) {
  const v=abs(a); if(v.n==='0') return null;
  let k=v.n.length-v.d.length;
  if(k>=0 ? BigInt(v.n)<BigInt(v.d)*10n**BigInt(k) : BigInt(v.n)*10n**BigInt(-k)<BigInt(v.d)) k--;
  return k;
}
export function significant(a, count, rule='round') {
  const k=order(a); if(k===null) return frac(0);
  const shift=count-1-k, scale=shift>=0?frac(10n**BigInt(shift)):frac(1n,10n**BigInt(-shift));
  const v=mul(abs(a),scale); let integer=BigInt(v.n)/BigInt(v.d);
  if(rule==='round' && 2n*(BigInt(v.n)%BigInt(v.d))>=BigInt(v.d)) integer++;
  return div(frac(BigInt(a.n)<0n?-integer:integer),scale);
}
export function carryProfile(a,b) {
  let carry=0, count=0, run=0, maxRun=0;
  while(a || b) { const s=a%10+b%10+carry; carry=s>=10?1:0; count+=carry; run=carry?run+1:0; maxRun=Math.max(maxRun,run); a=Math.floor(a/10); b=Math.floor(b/10); }
  return {count,maxRun};
}
export function borrowProfile(a,b) {
  let borrow=0,count=0,run=0,maxRun=0,crossZero=false;
  while(a || b) { const raw=a%10; const need=raw-borrow<b%10; if(need && raw===0) crossZero=true; borrow=need?1:0; count+=borrow; run=borrow?run+1:0; maxRun=Math.max(maxRun,run); a=Math.floor(a/10); b=Math.floor(b/10); }
  return {count,maxRun,crossZero};
}
export function multiplicationCarries(a,b) {
  for(const digit of String(b)) { let carry=0; for(const d of String(a).split('').reverse()) { const product=Number(d)*Number(digit)+carry; if(product>=10) return true; carry=Math.floor(product/10); } }
  return false;
}
