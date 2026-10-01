/* ===== Where it goes ===== */
function planLines(){
  const P=curPlan(),inc=sum(P.income,i=>i.amount),L=[];
  P.debts.forEach(d=>{const v=(d.pay||0)+(d.extra||0);if(v>0)L.push({n:d.name,v,k:'debt'})});
  P.bills.forEach(b=>{const fr=b.freq||'monthly',v=fr==='monthly'?b.amount:fr==='quarterly'?b.amount/3:b.amount/12;L.push({n:b.name+(fr!=='monthly'?' (yearly, per month)':''),v,k:b.kind||'need'})});
  const xcat=new Set((P.transfers||[]).map(x=>x.catId));
  P.vars.filter(v=>!xcat.has(v.id)&&v.budget>0).forEach(v=>L.push({n:v.name,v:v.budget,k:v.kind||'want',cat:true}));
  (P.transfers||[]).forEach(x=>L.push({n:x.name,v:x.amount,k:'want'}));
  const taxM=sum(fc().goals.filter(g=>g.kind==='tax'),g=>g.reqM);if(taxM>0)L.push({n:'Tax set-aside',v:taxM,k:'need'});
  const rest=Math.max(0,P.savings.monthly-taxM);if(rest>0)L.push({n:'Holidays, goals and savings',v:rest,k:'save'});
  return{inc,L:L.sort((a,b)=>b.v-a.v)}}
function vWhere(){
  const {inc,L}=planLines(),tot=sum(L,x=>x.v),left=inc-tot,grp={need:0,want:0,debt:0,save:0};L.forEach(x=>grp[x.k]+=x.v);
  const seg=k=>`<span style="background:${KIND[k][1]};width:${Math.max(0,grp[k]/Math.max(inc,tot)*100)}%" title="${KIND[k][0]} ${GBP(grp[k])}"></span>`;
  const ks=periodMonths(view.period),T=totalsFor(ks),rows=allVars().map(v=>({v,a:T.cats[v.id]||0})).filter(r=>r.a>0).sort((a,b)=>b.a-a.a),maxA=rows[0]?rows[0].a:1;
  const wantsTot=grp.want;
  return banners()+intro('Where the money goes, biggest first. Use it to spot the spending you would happily cut so that money can fund what you care about.')+`
  <div class="grid">
   <div class="panel c12"><h2>Every £ of your ${GBP(inc)} monthly income, as planned</h2>
    <div class="split" role="img" aria-label="Split of income">${seg('need')}${seg('debt')}${seg('want')}${seg('save')}<span style="background:var(--surface2);flex:1" title="Left over"></span></div>
    <div class="legend">${['need','debt','want','save'].map(k=>`<span><b class="sw" style="background:${KIND[k][1]}"></b>${k==='need'?'Needs':k==='debt'?'Debt repayments':k==='want'?'Wants':'Savings and goals'} ${GBP(grp[k])} (${pct(inc?grp[k]/inc*100:0)})</span>`).join('')}<span><b class="sw" style="background:var(--surface2)"></b>Left over ${GBP(left)}</span></div>
    <p class="small ink2" style="margin-bottom:0">Your three biggest outgoings are ${L.slice(0,3).map(x=>`<b>${esc(x.n)}</b> (${GBP(x.v)}, ${pct(inc?x.v/inc*100:0)})`).join(', ')}. You decide what counts as a need or a want, on the Budgets tab.</p></div>
   <div class="panel c7"><h2>All planned outgoings, each month</h2>
    ${L.map(x=>`<div class="hb"><span title="${esc(x.n)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.n)}</span><span class="t"><i style="width:${x.v/L[0].v*100}%;background:${KIND[x.k][1]}"></i></span><span class="v">${GBP(x.v)}</span></div>`).join('')}</div>
   <div class="panel c5"><h2>What if we cut the wants?</h2><p class="small ink2" style="margin-top:0">Wants are ${GBP(wantsTot)} a month (${GBP(wantsTot*12)} a year).</p>
    ${slider('cut','Cut every want by',view.cut,0,60,5,'',pct)}<div id="cutRes">${cutResult(wantsTot)}</div>
    <div class="row" style="margin-top:10px"><button class="btn" data-act="trycut">Try it on What if</button></div>
    <div class="lbl" style="margin:14px 0 4px">Wants by yearly cost</div>${L.filter(x=>x.k==='want').map(x=>`<div class="item"><span>${esc(x.n)}</span><b>${GBP(x.v*12)}</b></div>`).join('')}</div>
   <div class="panel c12"><div class="row" style="justify-content:space-between"><h2>Where it actually went: ${periodLabel(ks)}</h2></div>
    ${periodBar()}
    ${rows.length?rows.map(r=>`<div class="hb"><span>${esc(r.v.name)}</span><span class="t"><i style="width:${r.a/maxA*100}%;background:var(--${r.v.kind==='need'?'need':'want'})"></i></span><span class="v">${GBP(r.a)}</span></div>`).join(''):'<p class="muted">No spending recorded for this period.</p>'}
    <p class="small muted">${T.have}/${T.n} months have spending recorded. Total ${GBP(T.varTotal)}${ks.length>1?', about '+GBP(T.varTotal/Math.max(1,T.have))+' a month':''}. Spending money transfers are included for months from your sheet.</p></div>
  </div>`}
function cutResult(wantsTot){const fr=wantsTot*view.cut/100,S=fc(),hol=S.goals.find(g=>g.kind==='holiday'),gap=sum(S.goals.filter(g=>g.kind!=='tax'),g=>Math.max(0,g.target-g.saved));
  return`<div class="note"><b>${GBP(fr)}</b> more a month, <b>${GBP(fr*12)}</b> a year. ${hol?`That is ${pct(fr*12/hol.target*100)} of your ${esc(hol.name)} budget every year.`:(gap?`That is ${pct(fr*12/gap*100)} of everything you are saving for.`:'')}</div>`}
