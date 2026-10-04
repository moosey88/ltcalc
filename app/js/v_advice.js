/* ===== Heads-up: big bills coming, and what to do to stay healthy ===== */
const dismissed=k=>(STATE.dismissed||{})[k];
function bigBillsAhead(S,days=120,min=150){
  const t0=S.start,lim=t0+days*DAY,buf=STATE.buffer||0,out=[];
  S.events.filter(e=>e.t<=lim&&e.a<0&&-e.a>=min&&(e.k==='yearly'||e.k==='one'||e.k==='goal'||e.k==='lump')).forEach(e=>{
    const i=S.days.findIndex(x=>x.t===e.t),win=i<0?[]:S.days.slice(i,i+30),after=i<0?null:Math.min(...win.map(x=>x.bank)),away=Math.round((e.t-t0)/DAY);
    out.push({n:e.n,t:e.t,a:-e.a,away,after,state:after==null?'ok':after<0?'short':after<buf?'tight':'ok',weekly:away>7?-e.a/(away/7):0,yearly:e.k==='yearly'})});
  return out.sort((a,b)=>a.t-b.t)}
function adviceList(S){
  const P=curPlan(),buf=STATE.buffer||0,out=[],now=thisMonthK(),T=trackingData(),sav=P.savings.monthly||0;
  const add=(key,sev,title,body,go)=>{if(!dismissed('adv|'+key))out.push({key,sev,title,body,go})};
  const neg=S.days.find(d=>d.bank<0);
  if(neg){const need=-S.lowBank.v+buf,m=ym(neg.t);
    add('neg',"bad",`The bank goes overdrawn on ${fdate(neg.t)}`,`It reaches ${GBP(S.lowBank.v)} on ${fdate(S.lowBank.t)}. To stay above your ${GBP(buf)} buffer you need about ${GBP(need)} more by then. ${sav>=need?`Pausing the ${GBP(sav)} savings transfer in ${fmonthLong(m)} would cover it.`:`Even pausing the ${GBP(sav)} savings transfer is not enough, so trim budgets or move a yearly bill.`} Try it in What if.`,'whatif')}
  else if(S.lowTrue.v<buf)add('tight','warn',`Cash gets tight on ${fdate(S.lowTrue.t)}`,`After what you owe Amex it falls to ${GBP(S.lowTrue.v)}, under your ${GBP(buf)} buffer. A smaller savings transfer that month would fix it.`,'whatif');
  /* yearly bills: set aside monthly so they never ambush the account */
  P.bills.filter(b=>(b.freq||'monthly')==='yearly'&&b.amount>=75).forEach(b=>{
    const mo=b.month||12,cur=monthOf(now);let ahead=(mo-cur+12)%12;if(ahead===0&&+todayISO().slice(8)>b.day)ahead=12;if(ahead===0)ahead=1;
    if(ahead<=6)add('y|'+b.id,ahead<=2?'warn':'info',`${b.name} ${GBP(b.amount)} is due in ${MONL[mo-1]}`,b.spread?`About ${ahead} month${ahead>1?'s':''} away. Your plan already sets this aside monthly, so check that pot is actually funded.`:`About ${ahead} month${ahead>1?'s':''} away. Your plan takes it all in one go. Put aside ${GBP(b.amount/ahead)} a month${ahead>1?'':' now'} so it does not hit that month's cash.`,'budgets')});
  /* budgets running ahead of pace */
  const bud=budgetsOf(now),{by}=catTotalsFor(now),xcat=new Set((P.transfers||[]).map(x=>x.catId)),left=Math.max(1,T.n-T.dom+1);
  allVars().filter(v=>!xcat.has(v.id)&&bud[v.id]>0).forEach(v=>{const a=by[v.id]||0,b=bud[v.id];
    if(T.dom>=3&&a>b*T.dom/T.n*1.5&&a>40)add('v|'+now+'|'+v.id,a>b?'bad':'warn',`${v.name} is running ahead`,`${GBP(a)} spent of ${GBP(b)} by day ${T.dom}. ${a>=b?'You are over budget.':`That leaves ${GBP(b-a)}, about ${GBP((b-a)/left)} a day.`}`,'daily')});
  /* budgets versus what really happens */
  const done=[1,2,3].map(i=>addMonthsK(now,-i)),real=done.map(k=>{const bt=catTotalsFor(k);return sum(allVars().filter(v=>!xcat.has(v.id)),v=>bt.by[v.id]||0)+bt.unc}).filter(x=>x>0);
  const budT=sum(P.vars.filter(v=>!xcat.has(v.id)),v=>v.budget);
  if(real.length>=2){const avg=sum(real)/real.length;if(avg>budT*1.15)add('real','warn',`Real spending runs above your budgets`,`The last ${real.length} months averaged ${GBP(avg)} of everyday spending against ${GBP(budT)} budgeted. Either raise the budgets to match, or pick the categories to cut. Budgets that are never met make the forecast look better than it is.`,'budgets')}
  /* wages that arrive lower than planned */
  P.income.filter(i=>i.amount>=300).forEach(i=>{const got=done.map(k=>incFor(k,i)).filter(x=>x>0);
    if(got.length>=2){const avg=sum(got)/got.length;if(avg<i.amount*.85)add('inc|'+i.id,'warn',`${i.name} is arriving lower than planned`,`It averaged ${GBP(avg)} over the last ${got.length} months against ${GBP(i.amount)} in the plan, which is ${GBP(i.amount-avg)} a month the forecast counts on but does not receive.`,'whatif')}});
  /* goals */
  S.goals.filter(g=>g.target>0&&g.status!=='ok').forEach(g=>add('g|'+g.id,'warn',`${g.name} is not on track`,`${g.status==='beyond'?'It is not funded in the next 12 months.':'It will be short.'} Needed by ${fdate(parseISO(g.date))}: put aside about ${GBP(g.reqM)} a month.`,'goals'));
  /* spare cash: a healthy position should put money to work */
  const s12=S.days[Math.min(364,S.days.length-1)];
  if(!neg&&S.lowTrue.v>=buf&&s12&&s12.bank>buf*4+3000){const dbt=P.debts.map(d=>({d,bal:STATE.debtBal[d.id]||0})).filter(x=>x.bal>0&&x.d.type!=='mortgage'&&(x.d.apr||0)>0).sort((a,b)=>b.d.apr-a.d.apr)[0];
    add('spare','info',`You end the year with spare cash`,`The forecast has ${GBP(s12.bank)} in the bank in 12 months, well above your buffer.${dbt?` The highest rate is ${dbt.d.name} at ${dbt.d.apr}%, so extra there saves the most interest.`:''} Use What if to try an overpayment.`,'whatif')}
  const rank={bad:0,warn:1,info:2};return out.sort((a,b)=>rank[a.sev]-rank[b.sev])}
function advicePanel(){
  const S=fc(),bills=bigBillsAhead(S),adv=adviceList(S),lab={bad:'Act now',warn:'Soon',info:'Idea'},pc={bad:'bad',warn:'warn',info:'info'},st={ok:['good','covered'],tight:['warn','tight'],short:['bad','not covered']};
  return`<div class="panel c12"><h2>Heads-up <span class="muted small">big bills coming and what to do about them</span></h2><div class="grid" style="margin-top:6px">
   <div class="c5"><div class="lbl" style="margin-bottom:6px">Big bills in the next 4 months</div>
    <div class="list scrollbox">${bills.map(b=>`<div class="item" style="align-items:flex-start"><span><b>${esc(b.n)}</b> <span class="pill ${st[b.state][0]}">${st[b.state][1]}</span><br><small class="muted">${fdate(b.t)} · ${b.away<=0?'today':b.away+' days'}${b.after!=null?` · lowest in the next 30 days ${GBP(b.after)}`:''}${b.weekly?` · put aside ${GBP(b.weekly)} a week`:''}</small></span><b>${GBP(b.a)}</b></div>`).join('')||'<p class="muted small" style="margin:0">Nothing big in the next 4 months.</p>'}</div></div>
   <div class="c7"><div class="lbl" style="margin-bottom:6px">Suggestions to hit targets and keep cash healthy${adv.length?` (${adv.length})`:''}</div>
    <div class="list scrollbox">${adv.map(a=>`<div class="item" style="align-items:flex-start"><span><span class="pill ${pc[a.sev]}">${lab[a.sev]}</span> <b>${esc(a.title)}</b><br><span class="small ink2">${esc(a.body)}</span><span class="fixes"><button class="btn ghost sm" data-go="${a.go}">${({whatif:'Open What if',budgets:'Open Budgets',daily:'Open Day to day',goals:'Open Goals'})[a.go]}</button>${fxDismiss('adv|'+a.key)}</span></span></div>`).join('')||'<p class="muted small" style="margin:0">Nothing to act on. Cash stays above your buffer, budgets are on pace and every goal is on track.</p>'}</div></div></div></div>`}
