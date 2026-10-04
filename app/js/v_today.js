/* ===== Today ===== */
const isSpendCat=c=>!c||c[0]!=='_';
const monthSpendTx=k=>monthTx(k).filter(t=>isSpendCat(t.c));
const monthSpent=k=>-sum(monthSpendTx(k),t=>t.a);
function cashBalance(){let b=STATE.cashOpening||0;(STATE.cash||[]).forEach(e=>{if(e.type==='in'||e.type==='out')b+=e.a;else if(e.type==='deposit')b-=e.a});
  Object.values(TX).flat().forEach(t=>{if(t.p==='cash'&&t.a<0&&t.d>=(STATE.cashOpenDate||'0'))b+=t.a});return b}
/* a new real balance arrives (typed, or the last line of a NatWest file): compare it with what the entries say it should be */
/* every bank movement we know of between two balances: ticks, typed entries and uploaded bank lines */
const checkRows=(from,to)=>sum(Object.values(TX).flat().filter(t=>(t.s==='man'||t.s==='tick'||t.s==='nw')&&t.p==='bank'&&t.d>from&&t.d<=to),t=>t.a);
/* the bank check, worked out again from what is recorded now, so a tick added later counts */
/* the last running balance on the uploaded bank file: the one figure the bank itself vouches for */
function fileAnchor(){
  const rows=Object.values(TX).flat().filter(t=>t.s==='nw'&&t.p==='bank'&&t.b!=null);if(!rows.length)return null;
  const ld=rows.reduce((m,t)=>t.d>m?t.d:m,'0'),same=rows.filter(t=>t.d===ld);
  const last=same.find(r=>!same.some(q=>q!==r&&Math.abs(q.b-(r.b+q.a))<0.005))||same[0];
  return{d:ld,b:Math.round(last.b*100)/100}}
function liveCheck(){
  const lc=STATE.lastCheck;if(!lc)return null;
  const fa=fileAnchor();let pb=lc.prevBank!=null?lc.prevBank:lc.est,pa=lc.prevAsOf||addDays(lc.d,-1),est;
  if(fa&&fa.d<=lc.d){pa=fa.d;pb=fa.b;est=pb+sum(Object.values(TX).flat().filter(t=>(t.s==='man'||t.s==='tick')&&t.p==='bank'&&t.d<=lc.d&&(t.d>fa.d||t.s==='tick')),t=>t.a)}
  else est=pb+checkRows(pa,lc.d);
  const diff=lc.d===STATE.asOf?Math.round((STATE.bank-est)*100)/100:lc.diff,m=lc.d.slice(0,7),dd=+lc.d.slice(8);
  const unticked=expectedItems(m).filter(it=>it.day<=dd&&!tickRow(m,it.id)&&!bankRowFor(it,m)),untickedSum=sum(unticked,it=>it.sign*it.amt);
  const rs=Object.values(TX).flat().filter(t=>(t.s==='man'||t.s==='tick'||t.s==='nw')&&t.p==='bank'&&t.d>pa&&t.d<=lc.d),inn=sum(rs.filter(t=>t.a>0),t=>t.a),out=-sum(rs.filter(t=>t.a<0),t=>t.a);
  const pend=fa&&fa.d<=lc.d?Object.values(TX).flat().filter(t=>(t.s==='man'||t.s==='tick')&&t.p==='bank'&&t.d<=lc.d&&(t.d>fa.d||t.s==='tick')):[];
  return{...lc,est,diff,unticked,untickedSum,inn,out,pb,pend,fa}}
function applyBalance(value,dateStr,src){
  const had=STATE.bank!=null,prevBank=STATE.bank,prevAsOf=STATE.asOf;const est=had?prevBank+checkRows(prevAsOf,dateStr):null;
  audit('Bank balance set',`${GBP2(value)} as of ${dateStr} (${src||'typed'})${had?', check difference '+GBP2(Math.round((value-est)*100)/100):''}`);
  STATE.lastCheck=had?{d:dateStr,diff:Math.round((value-est)*100)/100,est,src,prevBank,prevAsOf}:null;STATE.bank=value;STATE.asOf=dateStr;invalidate()}
function banners(){let h='';
  if(STATE.bank==null)h+=`<div class="banner warn"><span><b>Add today's NatWest balance.</b> Until you do, the forecast starts from £0 and its lines show change, not real cash.</span><span class="row"><input type="number" id="quickBal" placeholder="Balance £" style="width:130px"><button class="btn sm" data-act="setbal">Save</button><button class="btn ghost sm" data-go="daily">or upload a file</button></span></div>`;
  if(STATE.bank!=null){const S=fc(),neg=S.days.find(d=>d.bank<0),buf=STATE.buffer||0;
    if(neg)h+=`<div class="banner bad"><span><b>Forecast: the bank goes overdrawn on ${fdate(neg.t)}</b> (lowest ${GBP(S.lowBank.v)} on ${fdate(S.lowBank.t)}). Check What if or Budgets before then.</span><button class="btn ghost sm" data-go="whatif">Open What if</button></div>`;
    else if(S.lowTrue.v<buf)h+=`<div class="banner warn"><span><b>Forecast: cash falls to ${GBP(S.lowTrue.v)} on ${fdate(S.lowTrue.t)},</b> below your ${GBP(buf)} buffer.</span><button class="btn ghost sm" data-go="whatif">Open What if</button></div>`}
  const miss=curPlan().debts.filter(d=>STATE.debtBal[d.id]==null&&(d.pay>0));
  if(miss.length)h+=`<div class="banner warn"><span><b>Balances missing</b> for ${miss.map(d=>esc(d.name)).join(', ')}. End dates and the debt effects need them.</span><button class="btn ghost sm" data-go="debts">Add them</button></div>`;
  return h}
const verdictPill=S=>S.verdict==='good'?'<span class="pill good">Safe</span>':S.verdict==='warn'?'<span class="pill warn">Tight</span>':S.verdict==='bad'?'<span class="pill bad">Unsafe</span>':'<span class="pill info">Not used</span>';
function goalsMini(S){
  const gs=S.goals.filter(g=>g.target>0);if(!gs.length)return'<p class="muted small">No goals yet. Add holidays and events on the Goals and holidays tab, and tax on the Tax tab.</p>';
  return gs.map(g=>{const p=Math.min(100,Math.round((g.saved/g.target)*100));
    const st=g.status==='ok'?'<span class="pill good">On track</span>':g.status==='late'?'<span class="pill bad">Short '+GBP(g.gs?g.gs.short:g.target-g.pot)+'</span>':'<span class="pill warn">Not funded in time</span>';
    return`<div style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><b>${esc(g.name)}</b>${st}</div><div class="bar" style="margin:6px 0"><i class="${g.status==='ok'?'g':g.status==='late'?'r':'w'}" style="width:${p}%"></i></div>
    <div class="small ink2">${GBP(g.saved)} of ${GBP(g.target)} saved · needed by ${fdate(parseISO(g.date))} · put aside about ${GBP(g.reqM)} a month${g.kind==='tax'?' (tax comes first)':''}</div></div>`}).join('')}
function unsortedPanel(k,compact){
  const u=monthTx(k).filter(t=>!t.c&&t.a<0);if(!u.length)return'';
  return`<div class="panel c12" style="border-color:var(--warn)"><div class="row" style="justify-content:space-between"><h3>Needs sorting: ${u.length} payment${u.length>1?'s':''}, ${GBP(-sum(u,t=>t.a))}</h3><span class="small muted">counted in spending as "Unsorted" until you pick a category</span></div>
   <div class="tblwrap"><table><tbody>${u.slice(0,compact?6:30).map(t=>`<tr><td>${fdate(parseISO(t.d))}</td><td>${esc(t.t)}</td><td class="n">${GBP2(-t.a)}</td><td>${catSelect(t.id,k,'')}</td></tr>`).join('')}</tbody></table></div>
   ${u.length>6&&compact?`<p class="small muted" style="margin:6px 0 0">${u.length-6} more on Day to day.</p>`:''}</div>`}
function catSelect(id,k,sel,ss){
  return`<select data-cat="${esc(id)}" data-m="${k}"><option value="">Choose…</option>${catOptions(sel,ss)}<option value="_skip" ${sel==='_skip'?'selected':''}>Not a spending item</option></select>`}
function trackingData(){
  const k=thisMonthK(),P=curPlan(),y=+k.slice(0,4),mo=monthOf(k)-1,n=dim(y,mo),dom=+todayISO().slice(8);
  const xcat=new Set((P.transfers||[]).map(x=>x.catId));
  const stx=monthSpendTx(k).filter(t=>!xcat.has(t.c)),budget=sum(P.vars.filter(v=>!xcat.has(v.id)),v=>v.budget),spent=-sum(stx,t=>t.a);
  const cum=[];let run=0;for(let d=1;d<=dom;d++){run+=-sum(stx.filter(t=>+t.d.slice(8)===d),t=>t.a);cum.push(run)}
  const mb=P.bills.filter(b=>(b.freq||'monthly')==='monthly'),billsAll=sum(mb,b=>b.amount)+sum(P.debts,d=>(d.pay||0)+(d.extra||0));
  const paidB=(key,amt,day)=>!!findBillTx(key,amt,k)||Math.min(day,n)<=dom;
  const billsPaid=sum(mb.filter(b=>paidB(bkey(b),b.amount,b.day)),b=>b.amount)+sum(P.debts.filter(d=>(d.pay||0)>0&&paidB((d.match||d.name.split(' ')[0]).toUpperCase(),(d.pay||0)+(d.extra||0),d.day)),d=>(d.pay||0)+(d.extra||0));
  return{k,P,n,dom,budget,spent,cum,billsAll,billsPaid,savDone:P.savings.day<=dom,sav:P.savings.monthly}}
function vToday(){
  const S=fc(),T=trackingData(),buf=STATE.buffer||0;
  const d90=S.days.slice(0,90),low90=d90.reduce((a,b)=>b.bank<a.bank?b:a,d90[0]);
  const np=S.events.find(e=>e.k==='in'&&e.a>=1000)||S.events.find(e=>e.k==='in'),ni=np?S.days.findIndex(d=>d.t===np.t):0,seg=S.days.slice(0,Math.max(1,ni)),lowSeg=seg.reduce((a,b)=>b.tru<a.tru?b:a,seg[0]);
  const head=lowSeg.tru-buf,s12=S.days[Math.min(364,S.days.length-1)],cardOn=S.cardSpend>0;
  const lc=liveCheck();
  const comingAll=S.events.filter(e=>e.t<=S.start+90*DAY&&((e.k==='bill'&&(e.variable||-e.a>=200))||((e.k==='debt'||e.k==='xfer')&&-e.a>=200)||e.k==='yearly'||e.k==='one'||e.k==='goal'||e.k==='lump'||(e.k==='amex'&&-e.a>=200)));
  const pace=T.budget*T.dom/T.n,under=pace-T.spent;
  const debtRows=debtEffects(Math.min(view.debtAmt??1000,Math.max(0,head)||1000));
  return banners()+intro('Where you stand today, built from your real bank balance, your bills and what you have spent so far.')+`
  <div class="kpis">
   <div class="kpi"><span>In the bank</span><b>${STATE.bank==null?'–':GBP(STATE.bank+sinceBalance())}</b><small>${STATE.bank==null?'add a balance':Math.abs(sinceBalance())>=0.005?`${GBP2(STATE.bank)} at ${fdate(parseISO(STATE.asOf))}, ${sinceBalance()>0?'plus':'less'} ${GBP2(Math.abs(sinceBalance()))} ticked or typed since`:'as of '+fdate(parseISO(STATE.asOf))}</small></div>
   <div class="kpi"><span>Household cash</span><b>${GBP(cashBalance())}</b><small>shared cash pot</small></div>
   <div class="kpi"><span>Left over before payday</span><b class="${head<0?'neg':'pos'}">${GBP(head)}</b><small>${np?'wages '+fdate(np.t)+'. After every planned bill, your remaining budgets, what you owe Amex and your '+GBP(buf)+' buffer':'add wages in Budgets'}</small></div>
   <div class="kpi" ${lc&&Math.abs(lc.diff)>=1?'style="border-color:var(--warn)"':''}><span>Bank check</span><b class="${lc&&Math.abs(lc.diff)>=1?'warnc':''}">${lc?(Math.abs(lc.diff)<1?'Matches':GBP(lc.diff)):'–'}</b><small>${lc?(Math.abs(lc.diff)<1?'entries add up to the bank':`Bank shows ${GBP2(lc.est+lc.diff)}, expected ${GBP2(lc.est)}. Fix it in Weekly check below.`):'updates when you add a balance'}</small></div>
   <div class="kpi"><span>Amex</span><b style="padding:6px 0;font-size:1.2rem">${verdictPill(S)}</b><small>${esc(S.why)}</small></div></div>
  <div class="grid">
   ${advicePanel()}
   ${uploadPanel()}
   ${anomalyPanel()}
   ${budgetsPanel(T.k)}
   <div class="panel c12"><h2>How are we tracking in ${MONL[monthOf(T.k)-1]}?</h2><div class="grid" style="margin-top:6px">
    <div class="c5"><div class="note" style="margin-bottom:12px">${T.budget>0?`<b class="${under>=0?'pos':'neg'}">${under>=0?'On track.':'Over pace.'}</b> You have spent ${GBP(T.spent)} by day ${T.dom}. The budget pace is ${GBP(pace)}, so you are ${GBP(Math.abs(under))} ${under>=0?'under':'over'}.`:'Set spending budgets on the Budgets tab to see your pace.'}</div>
     <div class="lbl" style="margin-bottom:4px">Spending</div><div class="row" style="justify-content:space-between"><span>${GBP(T.spent)} of ${GBP(T.budget)}</span><span class="${under>=0?'pos':'neg'} small">${GBP(Math.abs(under))} ${under>=0?'under':'over'} pace</span></div><div class="bar"><i class="${T.spent>T.budget?'r':T.spent>pace*1.1?'w':'g'}" style="width:${Math.min(100,T.budget?T.spent/T.budget*100:0)}%"></i></div>
     <div class="lbl" style="margin:12px 0 4px">Bills and debts paid</div><div class="row" style="justify-content:space-between"><span>${GBP(T.billsPaid)} of ${GBP(T.billsAll)}</span><span class="small muted">${GBP(T.billsAll-T.billsPaid)} still to come</span></div><div class="bar"><i class="g" style="width:${T.billsAll?T.billsPaid/T.billsAll*100:0}%"></i></div>
     <div class="lbl" style="margin:12px 0 4px">Moved to savings</div><div class="row" style="justify-content:space-between"><span>${T.savDone?GBP(T.sav):GBP(0)} of ${GBP(T.sav)}</span><span class="small muted">${T.savDone?'done':'due on the '+ord(T.P.savings.day)}</span></div><div class="bar"><i class="g" style="width:${T.savDone?100:0}%"></i></div></div>
    <div class="c7">${T.cum.length?paceChart(T.cum,T.budget,T.n,T.dom):'<p class="muted">Enter spending on Day to day and the month builds here.</p>'}<div class="legend"><span><i style="border-color:var(--bank)"></i>Spent so far</span><span><i style="border-color:var(--bank);border-top-style:dotted"></i>If the rest of the month looks the same</span><span><i style="border-color:var(--muted);border-top-style:dashed"></i>Budget pace</span></div></div></div>
    ${unsortedPanel(T.k,true)?`<div style="margin-top:14px">${unsortedPanel(T.k,true)}</div>`:''}</div>
   <div class="panel c12"><h2>Left over: what could it do for your debts?</h2><div class="grid"><div class="c4">
     ${slider('debtAmt','Put towards debt',Math.min(view.debtAmt??1000,Math.max(1000,Math.round(Math.max(0,head)/50)*50)),0,Math.max(1000,Math.round(Math.max(0,head)/50)*50),50,`Out of your ${GBP(Math.max(0,head))} left over.`)}
     ${debtRows.missing?'<div class="note">Add your balances and interest rates on the Debts tab. Until then this has nothing to work with.</div>':''}</div>
    <div class="c8" id="debtEff">${debtEffectTable(debtRows)}</div></div></div>
   <div class="panel c12"><h2>Coming up: big and variable bills</h2><p class="small muted" style="margin-top:0">Bills over £200, any marked variable, yearly bills and one-offs, over the next 90 days.</p>
    <div class="list">${dedupeComing(comingAll).slice(0,12).map(e=>`<div class="item"><span class="l">${esc(e.n)}${e.variable?' <span class="pill warn">variable</span>':''}${e.k==='yearly'?' <span class="pill info">yearly</span>':''}<br><small class="muted">${fdate(e.t)}</small></span><b>${GBP(e.a)}</b></div>`).join('')||'<span class="muted small">Nothing big coming up in the next 90 days.</span>'}</div></div>
   <div class="panel c12"><h2>Goals, holidays and tax</h2>${goalsMini(S)}</div>
   <div class="panel c12"><div class="row" style="justify-content:space-between"><h2>The next 12 months</h2><button class="btn ghost sm" data-act="toggle" data-v="year">${view.open.year?'Hide':'Show'}</button></div>${view.open.year?annualBlock(S):'<p class="small muted" style="margin:0">Month by month: what comes in, what goes out, and where the bank and savings end up.</p>'}</div>
  </div>`}
function debtEffects(amt){
  const P=curPlan(),rows=[];let missing=true;
  P.debts.forEach(d=>{const bal=STATE.debtBal[d.id];if(!(bal>0))return;missing=false;
    const a0=amort(bal,d.apr,d.pay,d.extra,0,-1),a1=amort(bal,d.apr,d.pay,d.extra,amt,0);
    if(a0&&a1)rows.push({d,bal,a0,a1})});
  return{rows,missing,amt}}
function debtEffectTable(R){
  if(!R.rows.length)return'<p class="muted small" style="margin:0">Nothing to show yet.</p>';
  return`<div class="tblwrap"><table><thead><tr><th>If ${GBP(R.amt)} goes on…</th><th class="n">Rate</th><th class="n">Ends sooner by</th><th class="n">Interest saved</th></tr></thead><tbody>${R.rows.sort((a,b)=>(b.d.apr||0)-(a.d.apr||0)).map(r=>{const sooner=(r.a0.n!=null&&r.a1.n!=null)?r.a0.n-r.a1.n:null,saved=(r.a0.int!=null&&r.a1.int!=null)?r.a0.int-r.a1.int:null;
    return`<tr><td>${esc(r.d.name)}</td><td class="n">${r.d.apr==null?'?':r.d.apr+'%'}</td><td class="n">${sooner==null?'–':ys(sooner)}</td><td class="n pos">${saved==null?'–':GBP(saved)}</td></tr>`}).join('')}</tbody></table></div><p class="small ink2" style="margin-bottom:0">[Likely] Money on the highest rate saves the most interest per pound. A lump sum on a large mortgage saves interest over many years but barely moves its end date. A 0% debt saves no interest at all.</p>`}
function annualBlock(S){
  const ms=S.months.slice(0,13).map(m=>({...m,out:m.bills+m.yearly+m.debt+m.lump+m.vars+m.xfer+m.one+m.sav+m.fee}));const yr=ms.slice(0,12);const tot=k=>sum(yr,m=>m[k]||0);
  const due=S.goals.filter(g=>parseISO(g.date)<=S.start+365*DAY),dueNeed=sum(due,g=>Math.max(0,g.target-g.saved)),tx=sum(due.filter(g=>g.kind==='tax'),g=>g.target);
  return`${barChart(yr)}<div class="tblwrap" style="margin-top:12px"><table><thead><tr><th>Month</th><th class="n">Income</th><th class="n">Bills</th><th class="n">Yearly bills</th><th class="n">Debts</th><th class="n">Spending</th><th class="n">Transfers</th><th class="n">One-offs</th><th class="n">To savings</th><th class="n">Bank at end</th><th class="n">Savings at end</th></tr></thead><tbody>
   ${yr.map(m=>`<tr><td>${fmonth(m.k)}</td><td class="n">${GBP(m.inc)}</td><td class="n">${GBP(m.bills)}</td><td class="n">${m.yearly?GBP(m.yearly):'–'}</td><td class="n">${GBP(m.debt+m.lump)}</td><td class="n">${GBP(m.vars)}</td><td class="n">${GBP(m.xfer)}</td><td class="n">${m.one?GBP(m.one):'–'}</td><td class="n">${GBP(m.sav)}</td><td class="n ${m.endBank<0?'neg':m.endBank<(STATE.buffer||0)?'warnc':''}">${GBP(m.endBank)}</td><td class="n">${GBP(m.endSav)}</td></tr>`).join('')}
   <tr class="tot"><td>12 months</td><td class="n">${GBP(tot('inc'))}</td><td class="n">${GBP(tot('bills'))}</td><td class="n">${GBP(tot('yearly'))}</td><td class="n">${GBP(tot('debt')+tot('lump'))}</td><td class="n">${GBP(tot('vars'))}</td><td class="n">${GBP(tot('xfer'))}</td><td class="n">${GBP(tot('one'))}</td><td class="n">${GBP(tot('sav'))}</td><td></td><td></td></tr></tbody></table></div>
   <div class="note" style="margin-top:12px">Goals and tax due in the next 12 months need <b>${GBP(dueNeed)}</b> more (tax alone ${GBP(tx)}). You plan to save <b>${GBP(curPlan().savings.monthly)}</b> a month, ${GBP(curPlan().savings.monthly*12)} a year.</div>`}

const findBillTx=(key,amt,k)=>key?monthTx(k).find(t=>t.s!=='man'&&t.a<0&&(t.t||'').toUpperCase().includes(key)&&Math.abs(-t.a-amt)<=amt*.3+1):null;

function dedupeComing(list){const seen=new Set(),out=[];list.forEach(e=>{const k=e.k+'|'+e.n;if(e.k==='bill'||e.k==='debt'||e.k==='xfer'){if(seen.has(k))return;seen.add(k)}out.push(e)});return out}
