/* ===== What if ===== */
function scInit(){
  const P=planFor(nextMonthK()),dsel=(P.debts.find(d=>STATE.debtBal[d.id]>0)||P.debts[0]||{}).id;
  view.scen={inc:{},vars:{},xfer:{},tax:{},sav:P.savings.monthly,share:P.amexShare||0,debtSel:dsel,extra:0,lump:0,lumpDate:addDays(todayISO(),30),lumpFrom:'savings',from:nextMonthK()};
  P.income.forEach(i=>view.scen.inc[i.id]=i.amount);P.vars.forEach(v=>view.scen.vars[v.id]=v.budget);(P.transfers||[]).forEach(x=>view.scen.xfer[x.id]=x.amount);P.tax.forEach(t=>view.scen.tax[t.id]=t.adj??100)}
function scLumps(sc){return sc.lump>0&&sc.debtSel?[{id:'sc',debt:sc.debtSel,amount:sc.lump,date:sc.lumpDate,from:sc.lumpFrom}]:[]}
function scPlan(sc,k){return scenarioPlanOf(sc,sc.from)(k)}
function vWhatIf(){
  if(!view.scen)scInit();const sc=view.scen,P=planFor(nextMonthK());
  const xcat=new Set((P.transfers||[]).map(x=>x.catId));
  const inc=P.income.map(i=>slider('inc_'+i.id,esc(i.name),sc.inc[i.id],0,Math.max(12000,i.amount*1.5),50,'',GBP,i.amount)).join('');
  const vars=P.vars.filter(v=>!xcat.has(v.id)&&(v.budget>0||sc.vars[v.id]>0)).map(v=>slider('var_'+v.id,esc(v.name),sc.vars[v.id],0,Math.max(1500,v.budget*2.5),5,'',GBP,v.budget)).join('');
  const xf=(P.transfers||[]).map(x=>slider('xf_'+x.id,esc(x.name),sc.xfer[x.id],0,Math.max(1500,x.amount*2),25,'',GBP,x.amount)).join('');
  const tax=P.tax.map(t=>slider('tax_'+t.id,esc(t.name)+': share of last year',sc.tax[t.id],0,200,5,'',pct,t.adj??100)).join('');
  const dopt=P.debts.map(d=>`<option value="${d.id}" ${sc.debtSel===d.id?'selected':''}>${esc(d.name)}</option>`).join('');
  const nm=nextMonthK(),fopts=Array.from({length:6},(_,i)=>addMonthsK(thisMonthK(),i+1)).map(k=>`<option value="${k}" ${sc.from===k?'selected':''}>${fmonthLong(k)}</option>`).join('');
  return banners()+intro('Try changes without touching your real plan. Move a slider, or type a number in the box, and the results update. A saved plan starts from next month, so no past month ever changes.')+`<div class="grid">
   <div class="panel c12"><details><summary><b>How these sliders work</b></summary><div class="small ink2" style="margin-top:8px">
    <p style="margin:0 0 6px"><b>"Now"</b> under each slider is what your plan says today. The slider starts there. Moving it only changes this what-if, never your real plan.</p>
    <p style="margin:0 0 6px">You can drag the slider or <b>type an exact number</b> in the box. <b>↺ Back to now</b> puts one slider back, and the <b>Back to baseline</b> button resets them all.</p>
    <p style="margin:0 0 6px">The results on the right compare your <b>current plan</b> with <b>this scenario</b>: what is left over each month, savings after 6 and 12 months, the lowest the bank gets, and how much sooner a debt ends.</p>
    <p style="margin:0">Nothing is saved until you press <b>Make this my plan</b>, and that only applies from the month you choose.</p></div></details></div>
   <div class="panel c4"><div class="lbl" style="margin-bottom:10px">Income per month</div>${inc}
    <div class="lbl" style="margin:14px 0 10px">Spending budgets per month</div>${vars}
    ${xf?`<div class="lbl" style="margin:14px 0 10px">Transfers to personal accounts</div>${xf}`:''}
    ${tax?`<div class="lbl" style="margin:14px 0 10px">Tax</div>${tax}`:''}
    <div class="lbl" style="margin:14px 0 10px">Savings and card</div>
    ${slider('sav','Monthly savings transfer',sc.sav,0,5000,50,'',GBP,P.savings.monthly)}
    ${slider('share','Share of card-friendly spend put on Amex',sc.share,0,100,5,'Shopping, general, eating out and home maintenance.',pct,P.amexShare||0)}
    <div class="lbl" style="margin:14px 0 10px">Pay a debt down faster</div>
    <div class="sl"><label for="debtSel">Which debt</label><span></span><select id="debtSel" data-sl="debtSel" style="grid-column:1/-1">${dopt}</select></div>
    ${slider('extra','Extra each month',sc.extra,0,3000,25,`On top of the normal payment. Check your lender's yearly overpayment limit.`,GBP,0)}
    ${slider('lump','One-off lump sum',sc.lump,0,150000,500,'',GBP,0)}
    <div class="sl"><label for="lumpDate">Lump sum date</label><span></span><input type="date" id="lumpDate" data-sl="lumpDate" value="${sc.lumpDate}" style="grid-column:1/-1"></div>
    <div class="sl"><label for="lumpFrom">Paid from</label><span></span><select id="lumpFrom" data-sl="lumpFrom" style="grid-column:1/-1"><option value="savings" ${sc.lumpFrom==='savings'?'selected':''}>Savings first, then bank</option><option value="bank" ${sc.lumpFrom==='bank'?'selected':''}>Bank</option></select></div>
    <div class="sl"><label for="from">Changes start from</label><span></span><select id="from" data-sl="from" style="grid-column:1/-1">${fopts}</select></div>
    <div class="row" style="margin-top:8px"><button class="btn" data-act="commitask">Make this my plan</button><button class="btn ghost" data-act="screset">Back to baseline (all)</button></div></div>
   <div class="panel c8" id="scRes">${scResults()}</div></div>`}
function scResults(){
  const sc=view.scen,P=simulate(),X=simulate({planOf:k=>scPlan(sc,k),lumps:scLumps(sc)});
  const fm=S=>S.months.find(m=>m.k>=sc.from)||S.months[0];
  const at=(S,i)=>S.days[Math.min(i,S.days.length-1)];
  const row=(l,a,b,f=GBP,up=true)=>{const d=b-a,c=Math.abs(d)<0.5?'muted':(d>0)===up?'pos':'neg';return`<div>${l}</div><div class="n">${f(a)}</div><div class="n">${f(b)}</div><div class="n ${c}">${Math.abs(d)<0.5?'–':(d>0?'+':'−')+f(Math.abs(d))}</div>`};
  const base=planMonth(sc.from,planFor(sc.from)),scn=planMonth(sc.from,scPlan(sc,sc.from));
  const d=planFor(nextMonthK()).debts.find(x=>x.id===sc.debtSel);let debtHtml='';
  if(d&&(sc.extra>0||sc.lump>0)){
    const bal=STATE.debtBal[d.id],lm=Math.max(0,monthsBetween(parseISO(STATE.asOf),parseISO(sc.lumpDate)));
    const a0=amort(bal,d.apr,d.pay,d.extra,0,-1),a1=amort(bal,d.apr,d.pay,(d.extra||0)+sc.extra,sc.lump,lm);
    if(a0&&a1&&a0.n!=null&&a1.n!=null){const N=Math.min(480,Math.max(a0.n,a1.n)+2),ser=[],t0=addMonthsT(parseISO(STATE.asOf),0);
      for(let i=0;i<=N;i++)ser.push({t:addMonthsT(t0,i),p:a0.ser[i]??0,s:a1.ser[i]??0});
      debtHtml=`<h3 style="margin:16px 0 6px">${esc(d.name)}: what the extra does</h3><div class="kpis" style="margin-bottom:8px"><div class="kpi"><span>Debt free</span><b style="font-size:1.25rem">${fmonthT(addMonthsT(parseISO(STATE.asOf),a1.n))}</b><small>${ys(a0.n-a1.n)} sooner than ${fmonthT(addMonthsT(parseISO(STATE.asOf),a0.n))}</small></div>
       <div class="kpi"><span>Interest saved</span><b class="pos" style="font-size:1.25rem">${GBP(a0.int-a1.int)}</b><small>${GBP(a0.int)} down to ${GBP(a1.int)}</small></div><div class="kpi"><span>Cash it costs</span><b style="font-size:1.25rem">${GBP(sc.lump+sc.extra*12)}</b><small>in the first year</small></div>${d.erc>0&&sc.lump>0?`<div class="kpi"><span>Early repayment charge</span><b class="neg" style="font-size:1.25rem">${GBP(sc.lump*d.erc/100)}</b><small>${pct(d.erc)} of the lump sum. Interest saved after it: ${GBP(a0.int-a1.int-sc.lump*d.erc/100)}</small></div>`:''}</div>
       ${lineChart('c3',ser,{label:'Debt balance',years:true,series:[{k:'p',c:'var(--muted)',name:'Current plan',dash:1},{k:'s',c:'var(--debt)',name:'With extra'}]})}`}
    else debtHtml=`<div class="note" style="margin-top:12px">Add the balance and interest rate for ${esc(d.name)} on the Debts tab to see how much sooner it ends and how much interest you save.</div>`}
  return`<h2>What it does</h2><div class="compare" style="margin-top:10px"><div class="h"></div><div class="h n">Current plan</div><div class="h n">This scenario</div><div class="h n">Change</div>
   ${row('Left over a month, from '+fmonth(sc.from),base.left,scn.left)}${row('Savings after 6 months',at(P,182).sav,at(X,182).sav)}${row('Savings after 12 months',at(P,364).sav,at(X,364).sav)}
   ${row('Lowest bank balance',P.lowBank.v,X.lowBank.v)}${row('Card spend a year',P.cardSpend/P.nMonths*12,X.cardSpend/X.nMonths*12)}</div>
   ${lineChart('c2',X.days.slice(0,365),{label:'Scenario',buffer:STATE.buffer,series:[{k:'bank',c:'var(--bank)',name:'Bank'},...(X.cardSpend>0?[{k:'tru',c:'var(--amex)',name:'After Amex owed',dash:1}]:[]),{k:'sav',c:'var(--save)',name:'Savings'}]})}
   <div class="legend"><span><i style="border-color:var(--bank)"></i>Bank</span>${X.cardSpend>0?'<span><i style="border-color:var(--amex);border-top-style:dashed"></i>Bank minus Amex owed</span>':''}<span><i style="border-color:var(--save)"></i>Savings</span></div>
   <div class="note" style="margin:12px 0">Amex ${verdictPill(X)} ${esc(X.why)}</div>${debtHtml}
   ${X.goals.length?`<h3 style="margin:16px 0 6px">Goals, holidays and tax</h3><div class="compare"><div class="h"></div><div class="h n">Current</div><div class="h n">Scenario</div><div class="h n"></div>${X.goals.filter(g=>g.target>0).map(g=>{const p0=P.goals.find(x=>x.id===g.id),f=x=>x.hit?fdate(x.hit):'not funded';return`<div>${esc(g.name)}</div><div class="n">${f(p0)}</div><div class="n">${f(g)}</div><div class="n">${g.status==='ok'?'<span class="pill good">on time</span>':'<span class="pill bad">late</span>'}</div>`}).join('')}</div>`:''}`}
function scenarioToPlan(){
  const sc=view.scen,p=clone(planFor(sc.from));
  p.income.forEach(i=>{if(sc.inc[i.id]!=null)i.amount=sc.inc[i.id]});p.vars.forEach(v=>{if(sc.vars[v.id]!=null)v.budget=sc.vars[v.id]});
  (p.transfers||[]).forEach(x=>{if(sc.xfer[x.id]!=null)x.amount=sc.xfer[x.id]});p.tax.forEach(t=>{if(sc.tax[t.id]!=null)t.adj=sc.tax[t.id]});
  p.savings.monthly=sc.sav;p.amexShare=sc.share;const d=p.debts.find(x=>x.id===sc.debtSel);if(d)d.extra=(d.extra||0)+sc.extra;return p}
function commitModal(){
  const sc=view.scen,np=scenarioToPlan(),ch=changesBetween(planFor(sc.from),np);if(sc.lump>0)ch.push(`Lump sum ${GBP(sc.lump)} on ${fdate(parseISO(sc.lumpDate))}`);
  return`<div class="modal"><div><h2>Make this my plan</h2><p class="small ink2">You changed these on What if:</p>${ch.length?`<div class="list">${ch.map(c=>`<div class="item"><span>${esc(c)}</span></div>`).join('')}</div>`:`<p class="muted">You haven't changed anything yet.</p>`}
   <div class="note" style="margin:12px 0"><b>Starts from ${fmonthLong(sc.from)}.</b> Every month before it keeps the plan it had, and so do the comparisons made against it.</div>
   <div class="row"><button class="btn" data-act="commit" ${ch.length?'':'disabled'}>Apply from ${fmonth(sc.from)}</button><button class="btn ghost" data-act="closemodal">Cancel</button></div></div></div>`}
function commitScenario(){
  const sc=view.scen,np=scenarioToPlan();commitPlan(np,sc.from,'From What if',ME.name||'');
  if(sc.lump>0)(STATE.lumps=STATE.lumps||[]).push({id:uid(),debt:sc.debtSel,amount:sc.lump,date:sc.lumpDate,from:sc.lumpFrom});
  view.modal=null;view.scen=null;resetHist();invalidate();persistAll();toast('Plan saved from '+fmonthLong(sc.from));tab='today';render()}
