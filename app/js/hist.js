/* ===== history from your sheet, and what it says ===== */
let _hc={};
function normHist(k){
  if(_hc[k])return _hc[k];const m=HIST[k];if(!m)return null;
  const neg=v=>v==null?0:-v;
  const r={k,startBal:m.startBal,savings:m.savings,fixed:[],vars:{},lines:[],wages:{},otherIn:0,otherInF:0};
  (m.incoming||[]).forEach(i=>{if(isWages(i.n)){r.wages[i.n.toLowerCase()]={f:i.f||0,a:i.a||0}}else{r.otherIn+=i.a||0;r.otherInF+=i.f||0}});
  r.inF=m.inTotal?m.inTotal[0]||0:0;r.inA=m.inTotal?m.inTotal[1]||0:0;
  const grp={};
  (m.fixed||[]).forEach(f=>{const key=fixedKey(f.n),type=fixedType(f.n);const g=grp[key]||(grp[key]={key,n:f.n,type,f:0,a:0,note:f.note});g.f+=neg(f.f);g.a+=neg(f.a)});
  r.fixed=Object.values(grp);
  r.fixedF=sum(r.fixed,x=>x.f);r.fixedA=sum(r.fixed,x=>x.a);
  (m.vars||[]).forEach(v=>{const id=canonVar(v.n);const g=r.vars[id]||(r.vars[id]={f:0,a:0});g.f+=neg(v.f);g.a+=neg(v.a)});
  r.varF=sum(Object.values(r.vars),x=>x.f);r.varA=sum(Object.values(r.vars),x=>x.a);
  (m.lines||[]).forEach(l=>{const id=canonLine(l.c);if(id)r.lines.push({c:id,a:-l.a,n:l.n||''})});
  const cl=m.cashLeft;r.leftF=cl&&cl[0]!=null?cl[0]:r.inF-r.fixedF-r.varF;r.leftA=cl&&cl[1]!=null?cl[1]:r.inA-r.fixedA-r.varA;
  r.hasActual=r.inA>0||r.fixedA>0||r.varA>0;
  return _hc[k]=r}
const resetHist=()=>{_hc={}};
const histKeys=()=>Object.keys(HIST).sort();
const actualKeys=()=>histKeys().filter(k=>normHist(k)&&normHist(k).hasActual);
const lastActualK=()=>{const a=actualKeys();return a[a.length-1]};
function catSpend(k,id){
  const h=normHist(k);if(h&&h.hasActual)return h.vars[id]?h.vars[id].a:0;
  if(TX[k])return spentIn(k,id);return 0}
function catSeries(id,n,endK){endK=endK||lastActualK();if(!endK)return[];const out=[];for(let i=n-1;i>=0;i--){const k=addMonthsK(endK,-i);out.push({k,a:catSpend(k,id)})}return out}
/* totals over a run of months, for the period filters */
function periodMonths(p){
  const cur=thisMonthK(),last=addMonthsK(cur,-1);
  if(p==='latest'){const l=lastActualK();return[l||last]}
  if(p==='this')return[cur];if(p==='last')return[last];
  if(p==='3')return[0,1,2].map(i=>addMonthsK(last,-i)).reverse();
  if(p==='6')return[0,1,2,3,4,5].map(i=>addMonthsK(last,-i)).reverse();
  if(p==='12')return Array.from({length:12},(_,i)=>addMonthsK(last,-(11-i)));
  if(p==='year')return Array.from({length:monthOf(cur)},(_,i)=>cur.slice(0,4)+'-'+String(i+1).padStart(2,'0'));
  if(p==='lastyear')return Array.from({length:12},(_,i)=>(+cur.slice(0,4)-1)+'-'+String(i+1).padStart(2,'0'));
  return[cur]}
function shiftYear(ks,n){return ks.map(k=>(+k.slice(0,4)+n)+k.slice(4))}
function totalsFor(ks){const t={cats:{},in:0,fixed:0,left:0,n:0,have:0};
  ks.forEach(k=>{const h=normHist(k);t.n++;
    allVars().forEach(v=>{const a=catSpend(k,v.id);if(a)t.cats[v.id]=(t.cats[v.id]||0)+a});
    if(h&&h.hasActual){t.have++;t.in+=h.inA;t.fixed+=h.fixedA;t.left+=h.leftA}else if(TX[k])t.have++;});
  t.varTotal=sum(Object.values(t.cats));return t}
/* ---- patterns ---- */
function monthName(m){return MONL[m-1]}
function patterns(){
  const out=[],ak=actualKeys();if(ak.length<6)return out;const lastK=ak[ak.length-1];
  const P=curPlan();const vname=id=>catName({vars:allVars()},id);
  // 1. seasonal
  const cand=[];
  allVars().forEach(v=>{if(v.id==='v_acash'||v.id==='v_scash'||v.id==='v_other')return;
    const ser=ak.map(k=>({k,a:catSpend(k,v.id)}));const med=median(ser.map(s=>s.a));if(med<30)return;
    for(let cm=1;cm<=12;cm++){const obs=ser.filter(s=>monthOf(s.k)===cm);if(obs.length<2)continue;const av=avg(obs.map(o=>o.a));
      if(av>=med*1.25&&av-med>=60&&obs.every(o=>o.a>=med*1.1))cand.push({v,cm,av,med,n:obs.length,gap:av-med,ser})}});
  cand.sort((a,b)=>b.gap-a.gap).slice(0,3).forEach(c=>{
    const byCal=Array.from({length:12},(_,i)=>{const o=c.ser.filter(s=>monthOf(s.k)===i+1);return o.length?avg(o.map(x=>x.a)):0});
    const bud=(P.vars.find(x=>x.id===c.v.id)||{}).budget;
    out.push({id:'sea'+c.v.id+c.cm,tag:'Seasonal',kind:'act',title:`${c.v.name} costs more every ${monthName(c.cm)}`,
      body:`${GBP(c.av)} on average in ${monthName(c.cm)} over ${c.n} years, against ${GBP(c.med)} in a typical month.${bud?` Your budget is ${GBP(bud)}.`:''}`,series:byCal,hi:c.cm-1,action:{label:'Review the budget',go:'budgets'}})});
  // 2. price creep and 3. plan drift on fixed bills
  const byKey={};ak.forEach(k=>normHist(k).fixed.forEach(f=>{if(f.type!=='bill')return;(byKey[f.key]=byKey[f.key]||[]).push({k,f:f.f,a:f.a,n:f.n})}));
  const creep=[],drift=[];
  Object.entries(byKey).forEach(([key,s])=>{
    const at=k=>s.find(x=>x.k===k);
    const l3=[0,1,2].map(i=>at(addMonthsK(lastK,-i))).filter(Boolean),p3=[12,13,14].map(i=>at(addMonthsK(lastK,-i))).filter(Boolean);
    if(l3.length>=2&&p3.length>=2){const a=avg(l3.map(x=>x.a)),b=avg(p3.map(x=>x.a));if(b>0&&a-b>=Math.max(5,b*.07))creep.push({key,n:s[s.length-1].n,a,b,ser:s.slice(-12).map(x=>x.a)})}
    const l6=s.filter(x=>x.k>addMonthsK(lastK,-6)&&x.f>0);
    if(l6.length>=4){const diffs=l6.filter(x=>Math.abs(x.a-x.f)>=Math.max(5,x.f*.08));if(diffs.length>=4)drift.push({n:s[s.length-1].n,d:avg(l6.map(x=>x.a-x.f)),ser:s.slice(-12).map(x=>x.a)})}});
  creep.sort((a,b)=>(b.a-b.b)-(a.a-a.b)).slice(0,2).forEach(c=>out.push({id:'cr'+c.key,tag:'Price creep',kind:'act',title:`${c.n} is up ${Math.round((c.a/c.b-1)*100)}% in 12 months`,body:`About ${GBP(c.b)} a month a year ago, ${GBP(c.a)} now.`,series:c.ser,hi:c.ser.length-1,action:{label:'Update the bill',go:'budgets'}}));
  drift.filter(d=>!creep.find(c=>c.n===d.n)).slice(0,2).forEach(d=>out.push({id:'dr'+d.n,tag:'Plan vs actual',kind:'info',title:`${d.n} is usually ${d.d>0?'more':'less'} than planned`,body:`Over the last 6 months it came out ${GBP(Math.abs(d.d))} ${d.d>0?'above':'below'} the planned amount on average.`,series:d.ser,hi:d.ser.length-1,action:{label:'Update the plan',go:'budgets'}}));
  // 4. over and under budget
  allVars().forEach(v=>{if(v.id==='v_acash'||v.id==='v_scash'||v.id==='v_round')return;
    const l6=ak.slice(-6).map(k=>({k,h:normHist(k).vars[v.id]})).filter(x=>x.h&&x.h.f>0);if(l6.length<5)return;
    const over=l6.filter(x=>x.h.a-x.h.f>=20),under=l6.filter(x=>x.h.f-x.h.a>=40);
    const ser=l6.map(x=>x.h.a);
    if(over.length>=4)out.push({id:'ov'+v.id,tag:'Over budget',kind:'act',title:`${v.name} was over budget in ${over.length} of the last ${l6.length} months`,body:`By an average of ${GBP(avg(over.map(x=>x.h.a-x.h.f)))} a month. Raise the budget or cut the spend.`,series:ser,hi:null,action:{label:'Try it on What if',go:'whatif'}});
    else if(under.length>=5)out.push({id:'un'+v.id,tag:'Under budget',kind:'good',title:`${v.name} stayed under budget in ${under.length} of the last ${l6.length} months`,body:`Average ${GBP(avg(l6.map(x=>x.h.a)))} against ${GBP(avg(l6.map(x=>x.h.f)))} budgeted: about ${GBP(sum(under,x=>x.h.f-x.h.a)*2)} a year of slack.`,series:ser,hi:null,action:{label:'Lower the budget',go:'budgets'}})});
  // 5. repeating one-offs  6. small spends
  const keyOf=n=>(n||'').toLowerCase().replace(/[^a-z ]+/g,' ').split(/\s+/).filter(w=>w.length>2).slice(0,2).join(' ');
  const big={};ak.forEach(k=>normHist(k).lines.forEach(l=>{if(l.a>=150&&l.n){const kk=keyOf(l.n);if(kk)(big[kk]=big[kk]||[]).push({k,a:l.a,n:l.n})}}));
  const freq={};ak.forEach(k=>normHist(k).lines.forEach(l=>{const kk=keyOf(l.n);if(kk)freq[kk]=(freq[kk]||0)+1}));
  Object.entries(big).forEach(([kk,arr])=>{if((freq[kk]||0)>8)return;const yrs=[...new Set(arr.map(x=>x.k.slice(0,4)))];if(yrs.length<2)return;if(Math.max(...arr.map(x=>x.a))>2.2*Math.min(...arr.map(x=>x.a)))return;
    const near=arr.some((a,i)=>arr.some((b,j)=>i<j&&a.k.slice(0,4)!==b.k.slice(0,4)&&Math.min(Math.abs(monthOf(a.k)-monthOf(b.k)),12-Math.abs(monthOf(a.k)-monthOf(b.k)))<=1));
    if(!near)return;const cm=monthOf(arr[arr.length-1].k);
    out.push({id:'rp'+kk,tag:'Repeating "one-offs"',kind:'act',title:`"${arr[arr.length-1].n}" comes round every year, around ${monthName(cm)}`,body:`${arr.length} times in ${yrs.length} years, ${GBP(avg(arr.map(x=>x.a)))} on average. If it is a regular cost, add it as a yearly bill.`,series:arr.map(x=>x.a),hi:arr.length-1,action:{label:'Add as a yearly bill',go:'budgets'}})});
  const small={};ak.slice(-3).forEach(k=>normHist(k).lines.forEach(l=>{const kk=(l.n||'').toLowerCase().replace(/[^a-z]/g,' ').trim().split(' ')[0];if(kk&&kk.length>2&&l.a>0)(small[kk]=small[kk]||[]).push(l.a)}));
  Object.entries(small).filter(([_,a])=>a.length>=8&&sum(a)>=150).sort((a,b)=>sum(b[1])-sum(a[1])).slice(0,2).forEach(([kk,a])=>out.push({id:'sm'+kk,tag:'Small spends',kind:'info',title:`${kk[0].toUpperCase()+kk.slice(1)}: ${a.length} payments in 3 months`,body:`${GBP(sum(a))} in total, averaging ${GBP(avg(a))} each. None is big, but together they add up.`,series:a.slice(-12),hi:null,action:{label:'See where it goes',go:'daily'}}));
  // 7. wage steps
  ['annie wages','sander wages'].forEach(w=>{const ser=ak.filter(k=>normHist(k).wages[w]).map(k=>({k,a:normHist(k).wages[w].a}));
    for(let i=ser.length-1;i>=1;i--){const a=ser[i-1].a,b=ser[i].a,c=ser[i+1]?ser[i+1].a:b;if(a>0&&b>0&&Math.abs(b-a)/a>=.1&&Math.abs(c-b)/b<.05){out.push({id:'wg'+w,tag:'Income',kind:'info',title:`${w.split(' ')[0][0].toUpperCase()+w.split(' ')[0].slice(1)}'s wages ${b>a?'rose':'fell'} ${Math.round(Math.abs(b-a)/a*100)}% in ${fmonth(ser[i].k)}`,body:`${GBP(a)} to ${GBP(b)} a month. Your plan uses ${GBP((P.income.find(x=>x.name.toLowerCase().startsWith(w.split(' ')[0]))||{}).amount)}.`,series:ser.slice(-12).map(x=>x.a),hi:null,action:{label:'Check your income',go:'budgets'}});break}}});
  // 8. mortgage changes
  const mort=ak.map(k=>({k,a:(normHist(k).fixed.find(f=>f.type==='mortgage')||{}).a})).filter(x=>x.a>0);
  for(let i=mort.length-1;i>=1;i--){if(Math.abs(mort[i].a-mort[i-1].a)/mort[i-1].a>=.05){out.push({id:'mort',tag:'Mortgage',kind:'info',title:`Your mortgage payment changed in ${fmonth(mort[i].k)}`,body:`${GBP(mort[i-1].a)} to ${GBP(mort[i].a)} a month.`,series:mort.slice(-12).map(x=>x.a),hi:null,action:{label:'See debts',go:'debts'}});break}}
  // 9. left over each month
  const l6=ak.slice(-6).map(k=>normHist(k).leftA),p6=ak.slice(-12,-6).map(k=>normHist(k).leftA);
  if(l6.length===6&&p6.length===6){const a=avg(l6),b=avg(p6);if(Math.abs(a-b)>=200)out.push({id:'left',tag:'Left over',kind:a>b?'good':'act',title:`Money left over each month ${a>b?'improved':'fell'}`,body:`${GBP(a)} a month over the last 6 months, against ${GBP(b)} in the 6 before.`,series:ak.slice(-12).map(k=>normHist(k).leftA).map(v=>Math.max(0,v)),hi:null,action:{label:'See plan vs actual',go:'pva'}});
    const neg=ak.slice(-12).filter(k=>normHist(k).leftA<0).length;if(neg>=3)out.push({id:'neg',tag:'Overspending',kind:'act',title:`You ended ${neg} of the last 12 months below zero`,body:'Spending plus fixed bills was more than money in. Plan vs actual shows which months.',series:ak.slice(-12).map(k=>Math.max(0,-normHist(k).leftA)),hi:null,action:{label:'See plan vs actual',go:'pva'}})}
  return out}
/* ---- big payments waiting for a note ---- */
function needsNote(){
  const lim=STATE.flagLimit||100,ex=new Set(STATE.flagExcl||[]),P=curPlan();
  const keys=P.bills.map(b=>(b.match||b.name.split(' ')[0]).toLowerCase()).filter(Boolean);
  const out=[];Object.keys(TX).sort().forEach(k=>TX[k].forEach(t=>{if(t.a<=-lim&&isSpendCat(t.c)&&!ex.has(t.c)&&!STATE.notes[t.id]){
    const desc=(t.t||'').toLowerCase();if(keys.some(x=>x&&desc.includes(x)))return;out.push(t)}}));
  return out.sort((a,b)=>a.d<b.d?1:-1)}
