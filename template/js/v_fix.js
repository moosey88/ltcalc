/* ===== Overdraft help: what pushes the bank down, levers that move the chart live, and three ready-made fixes =====
   Debt payments and pay-day timing are fixed, so they are never offered as levers. Everything runs through the same forecast engine. */
const r50=v=>Math.round(v/50)*50,r5=v=>Math.round(v/5)*5;
function fixSetup(){
  const S=fc(),buf=STATE.buffer||0,low=S.lowBank;if(!low||low.v>=buf)return null;
  const thisK=thisMonthK(),lowK=ym(low.t),until=addMonthsK(lowK,2),P=planFor(lowK);
  const trs=(P.transfers||[]).filter(t=>t.amount>=200).sort((a,b)=>b.amount-a.amount);
  const yb=P.bills.filter(b=>(b.freq||'monthly')==='yearly'&&!b.spread&&b.amount>=300&&[monthOf(lowK),monthOf(addMonthsK(lowK,-1))].includes(b.month||12)).sort((a,b)=>b.amount-a.amount)[0];
  const vs=P.vars.filter(v=>v.budget>=100);
  return{S,buf,low,lowK,until,thisK,P,trs,yb,vs,hasSweep:!!(planFor(thisK).savings&&planFor(thisK).savings.sweep),key:(typeof FCkey!=='undefined'?FCkey:'')+lowK}}
const fixDefault=F=>({sweep:false,amex:false,xmas:F.yb?F.yb.amount:0,xf:Object.fromEntries(F.trs.map(t=>[t.id,t.amount])),trim:0});
const fixPreset=(F,n)=>{const V=fixDefault(F);V.sweep=F.hasSweep;if(F.trs[0])V.xf[F.trs[0].id]=r50(F.trs[0].amount*2/3);
  if(n==='A'){if(F.yb)V.xmas=r5(F.yb.amount*.5);V.trim=15}else if(n==='B'){V.amex=!!F.yb}else if(n==='C'){if(F.yb)V.xmas=r5(F.yb.amount*.7);V.amex=!!F.yb}return V};
function fixMod(F,V){return(p,k)=>{
  if(V.sweep&&k<=F.until)p.savings.sweep=false;
  if(k>F.thisK&&k<=F.until)(p.transfers||[]).forEach(x=>{if(V.xf[x.id]!=null)x.amount=V.xf[x.id]});
  if(F.yb&&k>=F.thisK&&k<=F.until&&monthOf(k)===(F.yb.month||12)){const b=(p.bills||[]).find(z=>z.id===F.yb.id);
    if(b){if(V.amex){p.bills=p.bills.filter(z=>z.id!==b.id);if(V.xmas>0){const y=+k.slice(0,4),mo=monthOf(k)-1;p.oneoffs=(p.oneoffs||[]).concat([{id:'fx_'+b.id,name:b.name,amount:V.xmas,date:`${k}-${String(Math.min((((p.amex||{}).closeDay)||5)+1,dim(y,mo))).padStart(2,'0')}`,pay:'amex'}])}}
      else if(V.xmas<=0)p.bills=p.bills.filter(z=>z.id!==b.id);else b.amount=V.xmas}}
  if(V.trim>0&&k===F.lowK)p.vars.forEach(v=>{if(v.budget>=100)v.budget=r5(v.budget*(1-V.trim/100))})}}
function fixRun(F,V){
  const X=simulate({planOf:k=>{const p=JSON.parse(JSON.stringify(planFor(k)));fixMod(F,V)(p,k);return p}}),ds=X.days.filter(d=>ym(d.t)<=F.until),lo=ds.reduce((a,b)=>b.bank<a.bank?b:a,ds[0]);
  return{lo,neg:ds.filter(d=>d.bank<0).length,days:ds}}
const FIXLINES=[['today','Today','var(--bad)'],['mix','Your levers','var(--bank)'],['a','Fix A: cut it','var(--want)'],['b','Fix B: push it','var(--debt)'],['c','Fix C: bridge','var(--good)']];
function fixCache(F){if(view.fixC&&view.fixC.key===F.key)return view.fixC;
  const C={key:F.key,today:fixRun(F,fixDefault(F)),a:fixRun(F,fixPreset(F,'A')),b:fixRun(F,fixPreset(F,'B')),c:fixRun(F,fixPreset(F,'C'))};view.fixC=C;return C}
function fixDyn(F){
  const V=view.fixV,C=fixCache(F),mix=fixRun(F,V),vis=view.fixShow=view.fixShow||{today:1,mix:1};
  const rows=C.today.days.map((d,i)=>({t:d.t,today:d.bank,mix:mix.days[i]&&mix.days[i].bank,a:C.a.days[i]&&C.a.days[i].bank,b:C.b.days[i]&&C.b.days[i].bank,c:C.c.days[i]&&C.c.days[i].bank}));
  const ser=FIXLINES.filter(([k])=>vis[k]).map(([k,n,c])=>({k,c,name:n,dash:k==='today'?1:0})),dl=mix.lo.bank-C.today.lo.bank;
  const chips=FIXLINES.map(([k,n,c])=>`<button class="chip ${vis[k]?'on':''}" data-act="fixline" data-id="${k}" style="border-left:6px solid ${c}" title="Show or hide this line">${vis[k]?'✓ ':''}${n}</button>`).join('');
  const cls=v=>v<0?'neg':v<F.buf?'warnc':'pos';
  return`<div class="kpis" style="margin:0 0 8px"><div class="kpi"><span>Lowest point today</span><b class="${cls(C.today.lo.bank)}" style="font-size:1.25rem">${GBP(C.today.lo.bank)}</b><small>${fdate(C.today.lo.t)} · ${C.today.neg} overdrawn day${C.today.neg===1?'':'s'}</small></div>
   <div class="kpi" style="border-color:var(--bank)"><span>Lowest point with your levers</span><b class="${cls(mix.lo.bank)}" style="font-size:1.25rem">${GBP(mix.lo.bank)}</b><small>${fdate(mix.lo.t)} · ${mix.neg} overdrawn day${mix.neg===1?'':'s'}${dl>0.5?` · <span class="pos">${GBP(dl)} better</span>`:''}</small></div></div>
   <div class="row" style="gap:6px;margin-bottom:4px">${chips}</div>${lineChart('cfix',rows,{label:'Bank balance: today, your levers and the ready-made fixes',buffer:F.buf,series:ser})}
   <div class="small muted">Lines: ${FIXLINES.filter(([k])=>vis[k]).map(([k,n,c])=>`<span style="color:${c}">━</span> ${n}`).join(' · ')}. Tap a button above to show or hide a line.</div>`}
function fixPanel(){
  let F;try{F=fixSetup()}catch(e){return''}if(!F)return'';
  if(!view.fixV||view.fixKey!==F.key){view.fixV=fixDefault(F);view.fixKey=F.key;view.fixShow={today:1,mix:1}}
  const V=view.fixV,C=fixCache(F),base=C.today,op=view.fixOpen!==false,need=F.buf-F.low.v;
  const eff=m=>{const W=fixDefault(F);m(W);return fixRun(F,W).lo.bank-base.lo.bank},push=[];
  if(F.yb)push.push([`${F.yb.name} ${GBP(F.yb.amount)}`,eff(W=>{W.xmas=0})]);
  if(F.hasSweep)push.push(['Surplus moved to savings',eff(W=>{W.sweep=true})]);
  if(F.trs[0])push.push([`${F.trs[0].name} ${GBP(F.trs[0].amount)} against ${GBP(r50(F.trs[0].amount*2/3))}`,eff(W=>{W.xf[F.trs[0].id]=r50(F.trs[0].amount*2/3)})]);
  push.sort((a,b)=>b[1]-a[1]);const mx=Math.max(1,...push.map(p=>p[1]));
  const sl=(key,label,val,max,step,fmt,hint)=>`<div class="sl"><label>${label}</label><b id="fxl_${key}">${fmt(val)}</b><input type="range" min="0" max="${max}" step="${step}" value="${val}" data-fx="${key}" aria-label="${esc(label)}" style="grid-column:1/-1">${hint?`<div class="small muted" style="grid-column:1/-1">${hint}</div>`:''}</div>`;
  const levers=`${F.hasSweep?`<label class="small" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 12px"><input type="checkbox" data-fx="sweep" ${V.sweep?'checked':''}> <span><b>Stop the month-end sweep to savings</b> until ${fmonth(F.until)}<br><span class="muted">Keeps that cash in the bank. <span class="pill info">pull</span></span></span></label>`:''}
   ${F.yb?sl('xmas',esc(F.yb.name),V.xmas,F.yb.amount,50,GBP,`Planned ${GBP(F.yb.amount)}. Drag down to cut it. <span class="pill info">cut</span>`):''}
   ${F.yb?`<label class="small" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 12px"><input type="checkbox" data-fx="amex" ${V.amex?'checked':''}> <span><b>Put ${esc(F.yb.name.split(' ')[0])} on the Amex</b><br><span class="muted">Bought just after the statement closes on the ${ord(((F.P.amex||{}).closeDay)||5)}, so it is paid on the following month's statement. <span class="pill info">push</span></span></span></label>`:''}
   ${F.trs.map(t=>sl('xf_'+t.id,esc(t.name),V.xf[t.id],t.amount*1.2,50,GBP,`Planned ${GBP(t.amount)} a month. Applies ${fmonth(addMonthsK(F.thisK,1))} to ${fmonth(F.until)}. <span class="pill info">cut</span>`)).join('')}
   ${F.vs.length?sl('trim','Everyday budgets in '+fmonth(F.lowK),V.trim,30,5,v=>v?'−'+v+'%':'no change','Shopping, general, takeaways and so on. <span class="pill info">cut</span>'):''}`;
  const fr=[['A','Cut it','Cut Christmas, everyday spending and spending money.'],['B','Push it','Keep the full amount and move it onto the Amex.'],['C','Bridge','A smaller cut, and move it onto the Amex.']].map(([k,n,d])=>{const R=C[k.toLowerCase()];
    return`<tr><td><b>Fix ${k}: ${n}</b><div class="small muted">${d}</div></td><td class="n"><b class="${R.lo.bank<0?'neg':R.lo.bank<F.buf?'warnc':'pos'}">${GBP(R.lo.bank)}</b><div class="small muted">${fdate(R.lo.t)}</div></td><td class="n">${R.neg}</td><td class="n"><button class="btn ghost sm" data-act="fixload" data-id="${k}">Set the levers to this</button></td></tr>`}).join('');
  return`<div class="panel c12" style="border-color:var(--bad)"><div class="row" style="justify-content:space-between"><h2>${base.lo.bank<0?'Overdrawn':'Under your buffer'} from ${fdate((base.days.find(d=>d.bank<F.buf)||base.lo).t)}: what pushes it, and how to fix it</h2><button class="btn ghost sm" data-act="fixopen">${op?'Hide':'Show'}</button></div>
   <p class="small ink2" style="margin:2px 0 8px">The lowest point is <b class="neg">${GBP(F.low.v)}</b> on ${fdate(F.low.t)}. To stay above your ${GBP(F.buf)} buffer you need about <b>${GBP(need)}</b> more cash through ${fmonthLong(F.lowK)}. Debt payments and pay-day timing are fixed, so they are not offered here.</p>
   ${op?`<div class="lbl">What is pushing it down <span class="muted small">(how much higher the lowest point would be without each one)</span></div>
   <div class="list">${push.map(([n,v])=>`<div class="item"><span>${esc(n)}<span class="bar" style="display:block;height:6px;width:${Math.round(Math.max(0,v)/mx*100)}%;max-width:220px;margin-top:3px"><i class="pd" style="width:100%"></i></span></span><b>${v>0?GBP(v):'–'}</b></div>`).join('')||'<p class="muted small">Nothing you can change stands out.</p>'}</div>
   <p class="small muted" style="margin:4px 0 12px">These overlap, so they do not add up to ${GBP(need)}.</p>
   <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start"><div style="flex:1 1 300px;min-width:260px"><div class="lbl">Your levers <span class="muted small">move them and the chart updates at once. Nothing is saved.</span></div><div class="slcols" style="display:block">${levers}</div>
    <div class="row" style="margin-top:4px"><button class="btn ghost sm" data-act="fixreset">Back to today</button></div></div>
    <div id="fixDyn" style="flex:2 1 440px;min-width:300px;position:sticky;top:8px">${fixDyn(F)}</div></div>
   <div class="lbl" style="margin-top:14px">Three ready-made fixes</div>
   <div class="tblwrap"><table><thead><tr><th>Fix</th><th class="n">Lowest point</th><th class="n">Overdrawn days</th><th></th></tr></thead><tbody><tr><td><b>Today</b></td><td class="n"><b class="neg">${GBP(base.lo.bank)}</b><div class="small muted">${fdate(base.lo.t)}</div></td><td class="n">${base.neg}</td><td></td></tr>${fr}</tbody></table></div>
   <p class="small muted" style="margin:8px 0 0">To use a fix, make the same changes on Budgets (spending money, everyday budgets, the month-end sweep) and book the big bill on the Amex when you spend it. The Amex statement still has to be paid: the app keeps enough in the bank for it.</p>
   <div class="row" style="margin-top:8px"><button class="btn ghost sm" data-go="budgets">Open Budgets</button><button class="btn ghost sm" data-go="whatif">Open What if</button></div>`:''}</div>`}
/* live updates from the levers */
function fixInput(el){let F;try{F=fixSetup()}catch(e){return}if(!F||!view.fixV)return;const V=view.fixV,k=el.dataset.fx;
  if(k==='sweep')V.sweep=el.checked;else if(k==='amex')V.amex=el.checked;else if(k==='xmas'){V.xmas=+el.value;const o=document.getElementById('fxl_xmas');if(o)o.textContent=GBP(V.xmas)}
  else if(k==='trim'){V.trim=+el.value;const o=document.getElementById('fxl_trim');if(o)o.textContent=V.trim?'−'+V.trim+'%':'no change'}
  else if(k.startsWith('xf_')){const id=k.slice(3);V.xf[id]=+el.value;const o=document.getElementById('fxl_'+k);if(o)o.textContent=GBP(V.xf[id])}
  const d=document.getElementById('fixDyn');if(d)d.innerHTML=fixDyn(F)}
