/* ===== Patterns, and Plan vs actual ===== */
function vPatterns(){
  const cards=patterns(),nn=needsNote(),ak=actualKeys();
  return banners()+intro('What your history is telling you. These are found from your past months and itemised payments, and each links to what you could do about it.')+`
  <div class="grid">
   <div class="panel c12" style="${nn.length?'border-color:var(--warn)':''}"><div class="row" style="justify-content:space-between"><h2>Big payments waiting for a note (${nn.length})</h2><span class="small muted">Any single payment over ${GBP(STATE.flagLimit||100)} that isn't a planned bill. Change the limit in Settings.</span></div>
    ${nn.length?`<div class="tblwrap"><table><thead><tr><th>Date</th><th>On the statement</th><th class="n">£</th><th>Category</th><th>What was it?</th></tr></thead><tbody>${nn.slice(0,25).map(t=>`<tr><td>${fdate(parseISO(t.d))}</td><td>${esc(t.t)}</td><td class="n">${GBP2(-t.a)}</td><td>${catName({vars:allVars()},t.c)}</td><td><span class="row"><button class="btn sm" data-act="note" data-id="${esc(t.id)}" data-kind="oneoff">One-off</button><button class="btn ghost sm" data-act="note" data-id="${esc(t.id)}" data-kind="yearly">Repeats yearly</button><button class="btn ghost sm" data-act="note" data-id="${esc(t.id)}" data-kind="monthly">Repeats monthly</button><button class="btn ghost sm" data-act="note" data-id="${esc(t.id)}" data-kind="normal">Normal</button><input type="text" id="nt_${esc(t.id)}" placeholder="note" style="width:130px"></span></td></tr>`).join('')}</tbody></table></div>
    <p class="small muted" style="margin-bottom:0">"Repeats" adds it to your Budgets as a yearly or monthly bill, for you to save. "One-off" keeps it as an unplanned bill on Plan vs actual. Shopping and personal transfers aren't flagged, so weekly shops don't nag you.</p>`:'<p class="muted" style="margin:0">Nothing big is waiting. Payments over the limit show here once you add or upload spending.</p>'}</div>
   <div class="panel c12"><h2>What we have noticed</h2><p class="small ink2" style="margin-top:0">${ak.length?`Based on ${ak.length} months from your sheet (${fmonth(ak[0])} to ${fmonth(ak[ak.length-1])}) plus anything entered since. A pattern appears only when it shows up several times. Orange needs a decision, blue is for interest, green is good news.`:'No history is loaded yet, so there is nothing to find. Once your sheet history is loaded this fills in.'}</p>
    <div class="grid" style="margin-top:6px">${cards.map(c=>`<div class="c6"><div class="card"><div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="lbl">${esc(c.tag)}</span>${c.kind==='act'?'<span class="pill warn">Worth acting on</span>':c.kind==='good'?'<span class="pill good">Good news</span>':'<span class="pill info">For information</span>'}</div><b>${esc(c.title)}</b><p class="small ink2" style="margin:6px 0 8px">${esc(c.body)}</p>${miniBars(c.series,c.hi,c.kind==='good'?'var(--good)':'var(--bank)')}<div style="margin-top:8px"><button class="btn ghost sm" data-go="${c.action.go}">${esc(c.action.label)}</button></div></div></div>`).join('')||'<div class="c12 muted small">Nothing stands out yet.</div>'}</div></div>
  </div>`}
function noteTx(id,kind){
  const t=Object.values(TX).flat().find(x=>x.id===id);if(!t)return;const el=document.getElementById('nt_'+id),text=(el&&el.value.trim())||'';
  STATE.notes[id]={kind,text:text||t.t};
  if(kind==='yearly'||kind==='monthly'){const p=draft();p.bills.push({id:'b_'+uid(),name:text||t.t,amount:Math.round(-t.a*100)/100,day:+t.d.slice(8),kind:'need',freq:kind==='yearly'?'yearly':'monthly',month:monthOf(t.d.slice(0,7)),match:merchKey(t.t).split(' ')[0],variable:false});toast('Added to your Budgets draft. Save the plan there.')}
  persistAll();render()}
/* ---- Plan vs actual ---- */
function vPva(){
  const ks=periodMonths(view.period),cks=compareMonths(view.period),T=totalsFor(ks),C=cks?totalsFor(cks):null;
  const norm=C&&ks.length!==cks.length,fa=T.have?T.have:1,fb=C&&C.have?C.have:1;
  const cats=allVars().filter(v=>(view.cat==='all'||v.id===view.cat)&&((T.cats[v.id]||0)>0||(C&&(C.cats[v.id]||0)>0)));
  const val=(x,h)=>norm||ks.length>1&&C?x/h:x;
  const rows=cats.map(v=>{const a=val(T.cats[v.id]||0,fa),b=C?val(C.cats[v.id]||0,fb):null;return`<tr><td>${esc(v.name)}</td><td class="n"><b>${GBP(a)}</b></td>${C?`<td class="n">${GBP(b)}</td><td class="n">${chgCell(a,b)}</td>`:''}</tr>`}).join('');
  const ta=val(T.varTotal,fa),tb=C?val(C.varTotal,fb):null;
  const mtab=monthTable();
  return banners()+intro('Look at any period, and set it against another. A bill that has come out is marked paid with its real amount. An expected one stays in the forecast until it does.')+filterBar()+`
  <div class="grid">
   <div class="panel c12"><h2>${periodLabel(ks)}${C?' against '+periodLabel(cks):''}</h2>
    ${norm||(ks.length>1&&C)?'<p class="small muted" style="margin-top:0">The periods differ in length, so figures are an average per month.</p>':''}
    ${T.have===0?'<p class="muted">No spending recorded in this period yet.</p>':`<div class="tblwrap"><table><thead><tr><th>Category</th><th class="n">${ks.length===1?fmonth(ks[0]):'Period'}</th>${C?`<th class="n">Compared</th><th class="n">Change</th>`:''}</tr></thead><tbody>${rows}
     <tr class="tot"><td>Spending total</td><td class="n">${GBP(ta)}</td>${C?`<td class="n">${GBP(tb)}</td><td class="n">${chgCell(ta,tb)}</td>`:''}</tr></tbody></table></div>
     <p class="small muted" style="margin-bottom:0">Green means less spent, red means more. Months from your sheet include the spending-money transfers as categories.</p>`}</div>
   <div class="panel c12"><h2>Plan, actual and forecast by month</h2>${mtab}</div>
   <div class="panel c7"><h2>Fixed bills this month: paid or expected</h2>${billsStatus()}</div>
   <div class="panel c5"><h2>Which plan applies</h2>${planVersionsPanel()}</div>
   ${unplannedPanel()}
  </div>`}
function monthTable(){
  const cur=thisMonthK(),rows=[],ak=view.open.allmonths?actualKeys():actualKeys().slice(-12);
  ak.forEach(k=>{const h=normHist(k);rows.push({k,state:'Actual',outP:h.fixedF+h.varF,outA:h.fixedA+h.varA,leftP:h.leftF,leftA:h.leftA,note:''})});
  const pm=planMonth(cur),P=curPlan(),xcat=new Set((P.transfers||[]).map(x=>x.catId)),vb=sum(P.vars.filter(v=>!xcat.has(v.id)),v=>v.budget),spent=monthSpent(cur);
  const fOut=pm.out-vb+Math.max(spent,vb);const unp=sum(monthTx(cur).filter(t=>STATE.notes[t.id]&&STATE.notes[t.id].kind==='oneoff'),t=>-t.a);
  rows.push({k:cur,state:'Actual so far + plan',cur:true,outP:pm.out,outA:fOut,leftP:pm.left,leftA:incActualTotal(cur)-fOut,note:unp?`unplanned ${GBP(unp)}`:''});
  for(let i=1;i<=6;i++){const k=addMonthsK(cur,i),p=planMonth(k);rows.push({k,state:'Plan',outP:p.out,outA:p.out,leftP:p.left,leftA:p.left,note:p.yearly?'yearly bills '+GBP(p.yearly):''})}
  if(!rows.length)return'<p class="muted">Nothing to show yet.</p>';
  return`${actualKeys().length>12?`<div class="row" style="margin-bottom:8px"><button class="btn ghost sm" data-act="toggle" data-v="allmonths">${view.open.allmonths?'Show only the last 12 months':'Show all '+actualKeys().length+' months of history'}</button></div>`:''}<div class="tblwrap"><table><thead><tr><th>Month</th><th>State</th><th class="n">Out: plan</th><th class="n">Out: actual / forecast</th><th class="n">Left over: plan</th><th class="n">Left over: actual / forecast</th><th class="n">Difference</th></tr></thead><tbody>
   ${rows.map(r=>{const d=r.leftA-r.leftP;return`<tr ${r.cur?'style="background:var(--bank-bg)"':''}><td><b>${fmonth(r.k)}</b></td><td><span class="pill ${r.state==='Plan'?'good':'info'}">${r.state}</span></td><td class="n">${GBP(r.outP)}</td><td class="n">${r.state==='Plan'?GBP(r.outA):'<b>'+GBP(r.outA)+'</b>'}</td><td class="n ${r.leftP<0?'neg':''}">${GBP(r.leftP)}</td><td class="n ${r.leftA<0?'neg':''}">${GBP(r.leftA)}</td><td class="n ${Math.abs(d)<1?'muted':d<0?'neg':'pos'}">${Math.abs(d)<1?'–':(d<0?'−':'+')+GBP(Math.abs(d)).replace('−','')} <span class="small muted">${esc(r.note)}</span></td></tr>`}).join('')}</tbody></table></div>
   <p class="small muted" style="margin-bottom:0">"Out" is everything leaving the bank: bills, debts, variable spending, personal transfers, savings and yearly bills paid when due. For months from your sheet, plan is what you planned then. The blue row is the month you are in.</p>`}
function billsStatus(){
  const k=thisMonthK(),P=curPlan(),n=dim(+k.slice(0,4),monthOf(k)-1),dom=+todayISO().slice(8),tx=monthTx(k).filter(t=>t.s!=='man'&&t.a<0);
  const items=[];
  P.bills.filter(b=>(b.freq||'monthly')==='monthly').forEach(b=>items.push({n:b.name,amt:b.amount,day:Math.min(b.day,n),key:bkey(b),variable:b.variable,fk:fixedKey(b.name)}));
  P.debts.filter(d=>(d.pay||0)>0).forEach(d=>items.push({n:d.name,amt:d.pay+(d.extra||0),day:Math.min(d.day,n),key:(d.match||d.name.split(' ')[0]).toUpperCase()}));
  items.sort((a,b)=>a.day-b.day);
  const ak=actualKeys().slice(-12);
  const rows=items.map(it=>{const m=findBillTx(it.key,it.amt,k);
    let range='';if(it.variable){const v=ak.map(kk=>(normHist(kk).fixed.find(f=>f.key===it.fk)||{}).a).filter(x=>x>0);if(v.length>=3)range=` · usually ${GBP(Math.min(...v))} to ${GBP(Math.max(...v))}`}
    const chip=m?'<span class="chip in">✓ Paid</span>':it.day<=dom?'<span class="chip wait">Due, day passed</span>':'<span class="chip mv">Expected</span>';
    return`<tr><td>${esc(it.n)}${it.variable?' <span class="pill warn">variable</span>':''}</td><td>${chip}</td><td class="n">${m?GBP2(-m.a):'about '+GBP2(it.amt)}</td><td class="small muted">${m?fdateS(parseISO(m.d))+(Math.abs(-m.a-it.amt)>=0.5?` · plan ${GBP2(it.amt)}`:' · as planned'):'due the '+ord(it.day)}${range}</td></tr>`}).join('');
  const paid=items.filter(it=>tx.some(t=>it.key&&(t.t||'').toUpperCase().includes(it.key))).length;
  return`<div class="tblwrap"><table><thead><tr><th>Bill</th><th>Status</th><th class="n">Amount</th><th>Note</th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="muted">No bills in the plan.</td></tr>'}</tbody></table></div>
   <p class="small muted" style="margin-bottom:0">${items.length} bills and debts, ${paid} matched to a bank line. Paid ones use the real amount from the bank. "Due, day passed" means the day has gone but no bank line matched: upload your latest NatWest file, or set the match word on Budgets.</p>`}
function planVersionsPanel(){
  const vs=[...VERSIONS].reverse(),cur=thisMonthK();
  return`<div class="tblwrap"><table><thead><tr><th>Applies from</th><th>What changed</th></tr></thead><tbody>${vs.map((v,i)=>{const prev=VERSIONS[VERSIONS.indexOf(v)-1],ch=prev?changesBetween(prev.plan,v.plan):[];
    return`<tr ${v===versionFor(cur)?'style="background:var(--bank-bg)"':''}><td>${v.from==='2000-01'?'Start':fmonth(v.from)} ${v.from>cur?'<span class="pill info">next</span>':v===versionFor(cur)?'<span class="pill good">in force</span>':''}<br><span class="small muted">${esc(v.by||'')}</span></td><td class="small">${esc(v.note||'')}${ch.length?'<br>'+ch.slice(0,4).map(esc).join('<br>'):''}</td></tr>`}).join('')}</tbody></table></div>
   <p class="small muted" style="margin-bottom:0">Changing the plan never rewrites a past month. Each version applies from the month shown.</p>`}
function unplannedPanel(){
  const items=Object.keys(TX).sort().reverse().flatMap(k=>TX[k].filter(t=>STATE.notes[t.id]&&['oneoff','yearly','monthly'].includes(STATE.notes[t.id].kind)).map(t=>({t,n:STATE.notes[t.id]})));
  if(!items.length)return'';
  return`<div class="panel c12"><h2>Unplanned and noted payments</h2><div class="tblwrap"><table><thead><tr><th>Date</th><th>What</th><th class="n">£</th><th>Marked as</th></tr></thead><tbody>${items.slice(0,30).map(({t,n})=>`<tr><td>${fdate(parseISO(t.d))}</td><td>${esc(n.text||t.t)}</td><td class="n">${GBP2(-t.a)}</td><td>${n.kind==='oneoff'?'One-off':n.kind==='yearly'?'Repeats yearly':'Repeats monthly'}</td></tr>`).join('')}</tbody></table></div></div>`}
