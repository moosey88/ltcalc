/* ===== What if ===== */
function scInit(){
  const P=planFor(nextMonthK()),dsel=(P.debts.find(d=>STATE.debtBal[d.id]>0)||P.debts[0]||{}).id;
  view.scen={inc:{},vars:{},xfer:{},tax:{},sav:P.savings.monthly,share:P.amexShare||0,debtSel:dsel,extra:0,lump:0,lumpDate:addDays(todayISO(),30),lumpFrom:'savings',from:nextMonthK(),sweep:!!(P.savings&&P.savings.sweep)};
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
   <div class="wi">
   <div class="panel wi-l"><div class="lbl" style="margin-bottom:10px">Income per month</div>${inc}
    <div class="lbl" style="margin:14px 0 10px">Spending budgets per month</div>${vars}
    ${xf?`<div class="lbl" style="margin:14px 0 10px">Transfers to personal accounts</div>${xf}`:''}
    ${tax?`<div class="lbl" style="margin:14px 0 10px">Tax</div>${tax}`:''}
    <div class="lbl" style="margin:14px 0 10px">Savings and card</div>
    ${slider('sav','Monthly savings transfer',sc.sav,0,5000,50,'',GBP,P.savings.monthly)}
    ${slider('share','Share of card-friendly spend put on Amex',sc.share,0,100,5,'Shopping, general, eating out and home maintenance.',pct,P.amexShare||0)}
    <label class="small" style="display:flex;gap:6px;align-items:flex-start;margin:-4px 0 12px"><input type="checkbox" id="sweep" data-sl="sweepbox" ${sc.sweep?'checked':''}> <span>Also move any surplus above my ${GBP(STATE.buffer||0)} buffer into savings on the last day of each month</span></label>
    <div class="lbl" style="margin:14px 0 10px">Pay a debt down faster</div>
    <div class="sl"><label for="debtSel">Which debt</label><span></span><select id="debtSel" data-sl="debtSel" style="grid-column:1/-1">${dopt}</select></div>
    ${slider('extra','Extra each month',sc.extra,0,3000,25,`On top of the normal payment. Check your lender's yearly overpayment limit.`,GBP,0)}
    ${slider('lump','One-off lump sum',sc.lump,0,150000,500,'',GBP,0)}
    <div class="sl"><label for="lumpDate">Lump sum date</label><span></span><input type="date" id="lumpDate" data-sl="lumpDate" value="${sc.lumpDate}" style="grid-column:1/-1"></div>
    <div class="sl"><label for="lumpFrom">Paid from</label><span></span><select id="lumpFrom" data-sl="lumpFrom" style="grid-column:1/-1"><option value="savings" ${sc.lumpFrom==='savings'?'selected':''}>Savings first, then bank</option><option value="bank" ${sc.lumpFrom==='bank'?'selected':''}>Bank</option></select></div>
    <div class="sl"><label for="from">Changes start from</label><span></span><select id="from" data-sl="from" style="grid-column:1/-1">${fopts}</select></div>
    <div class="row" style="margin-top:8px"><button class="btn" data-act="commitask">Make this my plan</button><button class="btn ghost" data-act="screset">Back to baseline (all)</button></div></div>
   <div class="wi-r" id="scRes">${scResults()}</div></div></div>`}
/* plain-English warnings about what a scenario does to the account */
function scenarioFlags(P,X,sc){
  const out=[],buf=STATE.buffer||0,fl=(sev,t)=>out.push({sev,t});
  const neg=X.days.find(d=>d.bank<0),negBase=P.days.find(d=>d.bank<0);
  if(neg)fl('bad',`The bank goes overdrawn on ${fdate(neg.t)} and the lowest it reaches is ${GBP(X.lowBank.v)} on ${fdate(X.lowBank.t)}.${negBase?'':' Your current plan never goes below zero.'} Bills and the mortgage could bounce.`);
  else if(X.lowTrue.v<buf)fl('warn',`Cash drops to ${GBP(X.lowTrue.v)} on ${fdate(X.lowTrue.t)}, below your ${GBP(buf)} safety buffer.`);
  const lm=X.months.slice(0,12).filter(m=>m.k>=sc.from).map(m=>({k:m.k,left:m.inc-(m.bills+m.yearly+m.debt+m.lump+m.vars+m.xfer+m.one+(m.sav-(m.sweep||0))+m.fee)})).filter(m=>m.left<-0.5);
  if(lm.length)fl(lm.length>=3?'bad':'warn',`${lm.length} of the next 12 months spend more than comes in. The worst is ${fmonth(lm.reduce((a,b)=>b.left<a.left?b:a).k)} at ${GBP(lm.reduce((a,b)=>b.left<a.left?b:a).left)}.`);
  const s12=X.days[Math.min(364,X.days.length-1)].sav,s12b=P.days[Math.min(364,P.days.length-1)].sav;
  if(s12<s12b-0.5)fl(s12<=X.days[0].sav+0.5?'warn':'info',`Savings after 12 months are ${GBP(s12)}, which is ${GBP(s12b-s12)} less than the current plan (${GBP(s12b)}).`);
  X.goals.filter(g=>g.target>0&&g.status!=='ok'&&(P.goals.find(x=>x.id===g.id)||{}).status==='ok').forEach(g=>fl('warn',`${g.name} (${GBP(g.target)} by ${fdate(parseISO(g.date))}) would no longer be fully funded${g.gs&&g.gs.short>1?`: ${GBP(g.gs.short)} short`:''}.`));
  if(!neg){if(X.verdict==='bad'&&P.verdict!=='bad')fl('bad','Amex: '+X.why);else if(X.verdict==='warn'&&P.verdict==='good')fl('warn','Amex: '+X.why)}
  return out}
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
  const flags=scenarioFlags(P,X,sc),fp={bad:'bad',warn:'warn',info:'info'},fl={bad:'Problem',warn:'Watch',info:'Note'};
  const rP=scMonthRows(P,sc.from),rX=scMonthRows(X,sc.from),bank0=(STATE.bank||0)+sinceBalance();
  const negX=X.days.find(d=>d.bank<0),negP=P.days.find(d=>d.bank<0),nw=R=>sum(R,r=>r.nw);
  const k=(label,v,sub,cls)=>`<div class="wk"><small>${label}</small><b class="${cls||''}">${v}</b><i>${sub}</i></div>`;
  const kpis=`<div class="wks">${k('Left over a month',GBP(scn.left),'plan '+GBP(base.left,true),scn.left<0?'neg':'')}${k('First day overdrawn',negX?fdate(negX.t):'never','plan: '+(negP?fdate(negP.t):'never'),negX?'neg':'pos')}${k('Bank in 12 months',GBP(at(X,364).bank),'plan '+GBP(at(P,364).bank),at(X,364).bank<0?'neg':'')}${k('Net worth change, 12 months',GBP(nw(rX),true),'plan '+GBP(nw(rP),true),nw(rX)<0?'neg':'')}</div>`;
  const zoom=view.scZoom||60,zb=[[60,'2 months'],[365,'12 months'],[730,'24 months']].map(([z,l])=>`<button class="btn ${zoom===z?'':'ghost'} sm" data-act="sczoom" data-z="${z}">${l}</button>`).join('');
  const nb=flags.filter(x=>x.sev==='bad').length,nwn=flags.filter(x=>x.sev==='warn').length;
  const flagList=flags.length?flags.map(f=>`<div class="wf-i"><span class="pill ${fp[f.sev]}">${fl[f.sev]}</span> ${esc(f.t)}</div>`).join(''):'<div class="wf-i"><span class="pill good">All clear</span> No overdraft, no month overspent, no goal pushed late.</div>';
  const sticky=`<div class="scsticky"><div class="wflags ${nb?'bad':nwn?'warn':'ok'}"><div class="flagsum">${nb?`<b>${nb} problem${nb>1?'s':''}</b>`:''}${nwn?` ${nwn} to watch`:''}${!nb&&!nwn?'All clear':''}</div><div class="flaglist">${flagList}</div></div>${kpis}
   <div class="chartbox"><div class="row" style="justify-content:space-between;margin:6px 0 2px"><b class="small">Bank balance, day by day</b><span class="row" style="gap:4px">${zb}<button class="btn ghost sm" data-act="schide">${view.scHide?'Show chart':'Hide chart'}</button></span></div>
   ${view.scHide?'':cashChart(P,X,zoom)}<div class="legend"><span><i style="border-color:#7a8b97;border-top-style:dashed"></i>Current plan</span><span><i style="border-color:${negX?'#c0392b':'var(--bank)'}"></i>This scenario</span><span><i style="border-color:#d98a1f;border-top-style:dashed"></i>${GBP(STATE.buffer||0)} buffer</span></div></div></div>`;
  const rows=rX.map((x,i)=>{const p=rP[i],c=(v,pv,sg)=>`<td class="n${v<-0.5?' neg':''}">${GBP(v,sg)}<i>plan ${GBP(pv,sg)}</i></td>`;
    return`<tr><td><b>${fmonth(x.k)}</b></td><td class="n">${GBP(x.inc)}</td><td class="n">${GBP(x.out)}</td><td class="n">${GBP(x.sav)}</td>${c(x.left,p.left,true)}<td class="n b${x.end<0?' negbg':''}">${GBP(x.end)}<i>plan ${GBP(p.end)}</i></td><td class="n">${GBP(x.savTot)}</td><td class="n">${GBP(x.debtLeft)}</td>${c(x.nw,p.nw,true)}</tr>`}).join('');
  const tot=`<tr class="tot"><td>${rX.length} months</td><td class="n">${GBP(sum(rX,r=>r.inc))}</td><td class="n">${GBP(sum(rX,r=>r.out))}</td><td class="n">${GBP(sum(rX,r=>r.sav))}</td><td class="n${sum(rX,r=>r.left)<0?' neg':''}">${GBP(sum(rX,r=>r.left),true)}<i>plan ${GBP(sum(rP,r=>r.left),true)}</i></td><td class="n">${GBP(rX.length?rX[rX.length-1].end-bank0:0,true)}</td><td class="n">${GBP(rX.length?rX[rX.length-1].savTot-rX[0].savStart:0,true)}</td><td class="n">${GBP(rX.length?rX[rX.length-1].debtLeft-rX[0].debtStart:0,true)}</td><td class="n${nw(rX)<0?' neg':''}">${GBP(nw(rX),true)}<i>plan ${GBP(nw(rP),true)}</i></td></tr>`;
  const monthly=`<div class="panel" style="margin-bottom:12px"><h3 style="margin:0 0 4px">Month by month</h3><p class="small muted" style="margin:0 0 6px">Grey bars and dashed lines are your current plan. Coloured is this scenario.</p>${growthChart(rP,rX)}
   <div class="tblwrap" style="margin-top:8px"><table class="wtab"><thead><tr><th>Month</th><th class="n">Money in</th><th class="n">Money out</th><th class="n">To savings</th><th class="n">Left over</th><th class="n">Bank at month end</th><th class="n">Savings</th><th class="n">Debt left</th><th class="n">Net worth change</th></tr></thead><tbody>${rows}${tot}</tbody></table></div>
   <p class="small muted" style="margin:6px 0 0">Net worth change = bank + savings + debts paid off in the month. Debts count only the part that reduces what you owe, not interest.</p></div>`;
  return`${sticky}${monthly}<div class="note" style="margin:0 0 12px">Amex ${verdictPill(X)} ${esc(X.why)}</div>${debtHtml}
   ${X.goals.some(g=>g.target>0)?`<h3 style="margin:16px 0 6px">Goals, holidays and tax</h3><div class="compare"><div class="h"></div><div class="h n">Current</div><div class="h n">Scenario</div><div class="h n"></div>${X.goals.filter(g=>g.target>0).map(g=>{const p0=P.goals.find(x=>x.id===g.id),f=x=>x.hit?fdate(x.hit):'not funded';return`<div>${esc(g.name)}</div><div class="n">${f(p0)}</div><div class="n">${f(g)}</div><div class="n">${g.status==='ok'?'<span class="pill good">on time</span>':'<span class="pill bad">late</span>'}</div>`}).join('')}</div>`:''}`}
/* one row per month: money, balances and the change in net worth */
function scMonthRows(S,from){
  const idx=Math.max(0,S.months.findIndex(m=>m.k>=from)),sa=sum((STATE.assets||[]).filter(a=>a.group==='savings'),a=>a.value||0),out=[];
  const p0=S.months[idx-1]||{endBank:(STATE.bank||0)+sinceBalance(),endSav:0,debtLeft:sum(Object.values(STATE.debtBal||{}),v=>v||0)};
  for(let i=idx;i<Math.min(S.months.length,idx+12);i++){const m=S.months[i],prev=i>idx?S.months[i-1]:p0,sw=m.sweep||0;
    const o=m.bills+m.yearly+m.fee+m.debt+m.lump+m.vars+m.one+m.xfer;
    out.push({k:m.k,inc:m.inc,out:o,sav:m.sav,left:m.inc-o-(m.sav-sw),end:m.endBank,savTot:sa+m.endSav,savStart:sa+(prev.endSav||0),debtLeft:m.debtLeft||0,debtStart:prev.debtLeft||0,
      nw:(m.endBank-prev.endBank)+(m.endSav-(prev.endSav||0))+((prev.debtLeft||0)-(m.debtLeft||0))})}
  return out}
/* nice round tick spacing */
function niceStep(r){const t=r/4,p=Math.pow(10,Math.floor(Math.log10(t))),n=t/p;return(n<1.5?1:n<3.5?2:n<7.5?5:10)*p}
function cashChart(P,X,zoom){
  const n=Math.min(zoom,P.days.length,X.days.length),dp=P.days.slice(0,n),dx=X.days.slice(0,n),buf=STATE.buffer||0;
  const W=900,H=zoom<=60?250:230,ox=62,oy=12,pw=W-ox-14,ph=H-oy-34;
  const vals=[...dp,...dx].map(d=>d.bank),rawLo=Math.min(...vals,0),floor=-Math.max(8000,buf*8);
  const lo=Math.max(rawLo,floor),clip=rawLo<floor,hi=Math.max(Math.max(...vals),buf*2,2000)*1.05,st=niceStep(hi-lo);
  const Xp=i=>ox+i/Math.max(1,n-1)*pw,Yp=v=>oy+(hi-Math.max(v,lo))/(hi-lo)*ph;
  const path=ds=>'M'+ds.map((d,i)=>`${Xp(i).toFixed(1)},${Yp(d.bank).toFixed(1)}`).join(' L');
  let g=`<svg viewBox="0 0 ${W} ${H}" class="cc" role="img" aria-label="Bank balance, current plan against this scenario">`;
  for(let v=Math.ceil(lo/st)*st;v<=hi;v+=st)g+=`<line x1="${ox}" x2="${W-14}" y1="${Yp(v).toFixed(1)}" y2="${Yp(v).toFixed(1)}" class="cgrid"/><text x="${ox-6}" y="${(Yp(v)+4).toFixed(1)}" class="cax" text-anchor="end">${GBP(v)}</text>`;
  if(lo<0)g+=`<rect x="${ox}" y="${Yp(0).toFixed(1)}" width="${pw}" height="${(Yp(lo)-Yp(0)).toFixed(1)}" fill="#c0392b" opacity=".10"/>`;
  g+=`<line x1="${ox}" x2="${W-14}" y1="${Yp(0).toFixed(1)}" y2="${Yp(0).toFixed(1)}" class="czero"/><line x1="${ox}" x2="${W-14}" y1="${Yp(buf).toFixed(1)}" y2="${Yp(buf).toFixed(1)}" class="cbuf"/>`;
  const step=zoom<=60?7:zoom<=365?30:91;
  for(let i=0;i<n;i+=step)g+=`<text x="${Xp(i).toFixed(1)}" y="${H-12}" class="cax" text-anchor="middle">${zoom<=60?fdateS(dp[i].t):fmonth(ym(dp[i].t))}</text>`;
  g+=`<path d="${path(dp)}" fill="none" stroke="#7a8b97" stroke-width="2.2" stroke-dasharray="6 4"/><path d="${path(dx)}" fill="none" stroke="${vals.some(v=>v<0)&&dx.some(d=>d.bank<0)?'#c0392b':'var(--bank)'}" stroke-width="3"/>`;
  const fi=dx.findIndex(d=>d.bank<0);
  if(fi>=0){const right=Xp(fi)>W*.6;g+=`<circle cx="${Xp(fi).toFixed(1)}" cy="${Yp(dx[fi].bank).toFixed(1)}" r="5.5" fill="#c0392b"/><text x="${(Xp(fi)+(right?-9:9)).toFixed(1)}" y="${(Yp(dx[fi].bank)+16).toFixed(1)}" class="clb" text-anchor="${right?'end':'start'}" fill="#c0392b">Overdrawn from ${fdate(dx[fi].t)}</text>`}
  if(clip)g+=`<text x="${W-16}" y="${H-24}" class="clb" text-anchor="end" fill="#c0392b">Off the chart: lowest ${GBP(rawLo)}</text>`;
  return g+'</svg>'}
function growthChart(rP,rX){
  const n=rX.length;if(!n)return'';
  const W=900,H=330,ox=62,pw=W-ox-14,cw=pw/n,x=i=>ox+(i+.5)*cw;
  const lv=[...rP,...rX].map(r=>r.left),vmax=Math.max(...lv,500),vmin=Math.min(...lv,-500),p1t=18,p1b=120;
  const y1=v=>p1t+(vmax-v)/(vmax-vmin)*(p1b-p1t);
  let g=`<svg viewBox="0 0 ${W} ${H}" class="cc"><text x="${ox}" y="11" class="clb">Left over each month</text><line x1="${ox}" x2="${W-14}" y1="${y1(0).toFixed(1)}" y2="${y1(0).toFixed(1)}" class="czero"/>`;
  const bw=Math.min(18,cw*.3);
  for(let i=0;i<n;i++)[[-bw*.55,rP[i].left,'#9fb0bb'],[bw*.55,rX[i].left,rX[i].left<0?'#c0392b':'#1d8a4e']].forEach(([o,v,c])=>{g+=`<rect x="${(x(i)+o-bw/2).toFixed(1)}" y="${Math.min(y1(v),y1(0)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1.5,Math.abs(y1(v)-y1(0))).toFixed(1)}" fill="${c}" rx="2"/>`});
  const bv=[...rP,...rX].flatMap(r=>[r.end,r.savTot]),bmax=Math.max(...bv,1000),bmin=Math.min(...bv,-500),p2t=170,p2b=H-34;
  const y2=v=>p2t+(bmax-v)/(bmax-bmin)*(p2b-p2t);
  g+=`<text x="${ox}" y="${p2t-8}" class="clb">Bank and savings at month end</text>`;
  const st=niceStep(bmax-bmin);for(let v=Math.ceil(bmin/st)*st;v<=bmax;v+=st)g+=`<line x1="${ox}" x2="${W-14}" y1="${y2(v).toFixed(1)}" y2="${y2(v).toFixed(1)}" class="cgrid"/><text x="${ox-6}" y="${(y2(v)+4).toFixed(1)}" class="cax" text-anchor="end">${GBP(v)}</text>`;
  if(bmin<0)g+=`<rect x="${ox}" y="${y2(0).toFixed(1)}" width="${pw}" height="${(p2b-y2(0)).toFixed(1)}" fill="#c0392b" opacity=".08"/>`;
  g+=`<line x1="${ox}" x2="${W-14}" y1="${y2(0).toFixed(1)}" y2="${y2(0).toFixed(1)}" class="czero"/>`;
  const pl=(R,key,c,d)=>`<path d="M${R.map((r,i)=>`${x(i).toFixed(1)},${y2(r[key]).toFixed(1)}`).join(' L')}" fill="none" stroke="${c}" stroke-width="2.6" ${d?'stroke-dasharray="6 4"':''}/>`;
  g+=pl(rP,'end','#7a8b97',1)+pl(rP,'savTot','#97c9b0',1)+pl(rX,'end',rX.some(r=>r.end<0)?'#c0392b':'var(--bank)')+pl(rX,'savTot','#1d8a4e');
  const last=rX[n-1];g+=`<text x="${(x(n-1)-4).toFixed(1)}" y="${(y2(last.end)-8).toFixed(1)}" class="clb" text-anchor="end" fill="${last.end<0?'#c0392b':'currentColor'}">Bank ${GBP(last.end)}</text>`;
  for(let i=0;i<n;i++)g+=`<text x="${x(i).toFixed(1)}" y="${H-12}" class="cax" text-anchor="middle">${fmonth(rX[i].k)}</text>`;
  return g+'</svg><div class="legend"><span><i style="border-color:#7a8b97;border-top-style:dashed"></i>Bank, plan</span><span><i style="border-color:#c0392b"></i>Bank, scenario</span><span><i style="border-color:#97c9b0;border-top-style:dashed"></i>Savings, plan</span><span><i style="border-color:#1d8a4e"></i>Savings, scenario</span></div>'}
function scenarioToPlan(){
  const sc=view.scen,p=clone(planFor(sc.from));
  p.income.forEach(i=>{if(sc.inc[i.id]!=null)i.amount=sc.inc[i.id]});p.vars.forEach(v=>{if(sc.vars[v.id]!=null)v.budget=sc.vars[v.id]});
  (p.transfers||[]).forEach(x=>{if(sc.xfer[x.id]!=null)x.amount=sc.xfer[x.id]});p.tax.forEach(t=>{if(sc.tax[t.id]!=null)t.adj=sc.tax[t.id]});
  p.savings.monthly=sc.sav;p.savings.sweep=!!sc.sweep;p.amexShare=sc.share;const d=p.debts.find(x=>x.id===sc.debtSel);if(d)d.extra=(d.extra||0)+sc.extra;return p}
function commitModal(){
  const sc=view.scen,np=scenarioToPlan(),ch=changesBetween(planFor(sc.from),np);if(sc.lump>0)ch.push(`Lump sum ${GBP(sc.lump)} on ${fdate(parseISO(sc.lumpDate))}`);
  return`<div class="modal"><div><h2>Make this my plan</h2><p class="small ink2">You changed these on What if:</p>${ch.length?`<div class="list">${ch.map(c=>`<div class="item"><span>${esc(c)}</span></div>`).join('')}</div>`:`<p class="muted">You haven't changed anything yet.</p>`}
   <div class="note" style="margin:12px 0"><b>Starts from ${fmonthLong(sc.from)}.</b> Every month before it keeps the plan it had, and so do the comparisons made against it.</div>
   <div class="row"><button class="btn" data-act="commit" ${ch.length?'':'disabled'}>Apply from ${fmonth(sc.from)}</button><button class="btn ghost" data-act="closemodal">Cancel</button></div></div></div>`}
function commitScenario(){
  const sc=view.scen,np=scenarioToPlan();commitPlan(np,sc.from,'From What if',ME.name||'');
  if(sc.lump>0)(STATE.lumps=STATE.lumps||[]).push({id:uid(),debt:sc.debtSel,amount:sc.lump,date:sc.lumpDate,from:sc.lumpFrom});
  view.modal=null;view.scen=null;resetHist();invalidate();persistAll();toast('Plan saved from '+fmonthLong(sc.from));tab='today';render()}
