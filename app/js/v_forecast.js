/* ===== Forecast: one month on a page, and exactly how much cash is left if we stick to the budgets ===== */
function vForecast(){
  const S=fc(),ms=S.months.slice(0,12),buf=STATE.buffer||0,now=thisMonthK();
  if(!view.fm||!ms.some(x=>x.k===view.fm))view.fm=ms[0].k;
  const i=ms.findIndex(x=>x.k===view.fm),mr=ms[i],m=mr.k,P=planFor(m),isNow=m===now,live=(STATE.bank||0)+sinceBalance();
  const start=i===0?live:ms[i-1].endBank,inc=mr.inc,vars=mr.vars,oth=mr.xfer+mr.sav+mr.ySet+(mr.goalOut||0),end=mr.endBank,bills=Math.max(0,start+inc-vars-oth-end);
  const y=+m.slice(0,4),mo=monthOf(m)-1,last=U(y,mo,dim(y,mo)),dom=isNow?+todayISO().slice(8):0;
  const md=S.days.filter(d=>ym(d.t)===m),low=md.length?md.reduce((a,b)=>b.bank<a.bank?b:a,md[0]):null;
  const items=expectedItems(m),st=it=>{if(!isNow)return'plan';const b=bankRowFor(it,m),tk=tickRow(m,it.id);return b?'bank':tk?'tick':it.day<=dom?'over':'due'};
  const dot=s=>`<i class="fdt ${s==='bank'||s==='tick'?'ok':s==='over'?'od':''}"></i>`;
  const line=it=>{const s=it.kind==='amex'?(isNow&&it.day<=dom&&false?'bank':'plan'):st(it),done=s==='bank'||s==='tick';return`<div class="fld ${done?'done':''}" title="${s==='over'?'Due, and not on the bank yet. Counted as leaving today.':s==='bank'?'On the bank file':s==='tick'?'You ticked it':'Still to come'}">${dot(s)}<span class="nm">${esc(it.name.replace(/\(.*?\)/g,'').trim())}</span><span class="fdy">${ord(it.day)}</span><span class="fill"></span><span class="am">${GBP(it.amt)}</span></div>`};
  const amxL=S.events.filter(e=>e.k==='amex'&&ym(e.t)===m).map(e=>{const s=S.stmts.find(x=>x.due===e.t);return{name:'Amex statement'+(s?' (closed '+fdate(s.close).replace(/ \d{2}$/,'')+')':''),amt:-e.a,day:+new Date(e.t).getUTCDate(),kind:'amex'}});
  const inL=items.filter(x=>x.kind==='inc'),outL=[...items.filter(x=>x.kind!=='inc'),...amxL],bud=budgetsOf(m),{by}=catTotalsFor(m),xcat=new Set((P.transfers||[]).map(x=>x.catId));
  const amxF=isNow||true?catAmexFor(m):{},vL=allVars().filter(v=>!xcat.has(v.id)&&bud[v.id]>0).map(v=>({n:v.name,b:bud[v.id],s:isNow?(by[v.id]||0):0}));
  const nOver=isNow?outL.filter(x=>st(x)==='over').length:0,overSum=sum(outL.filter(x=>isNow&&st(x)==='over'),x=>x.amt);
  const seg=`<div class="seg" role="tablist">${ms.map(x=>`<button data-act="fmon" data-m="${x.k}" class="${x.k===m?'on':''}">${fmonth(x.k)}</button>`).join('')}</div>`;
  const cell=(l,v,cls='')=>`<div class="c ${cls}"><span class="lbl">${l}</span><b>${v}</b></div>`;
  return banners()+intro('One month on a page: what is left in the bank if every budget is kept. Pick a month. Everything you tick or upload moves the figure.')+`<div class="grid"><div class="panel c12">${seg}
   <div class="strip">${cell(isNow?'Cash today':'Cash at start',GBP(start))}<span class="op">+</span>${cell(isNow?'Still coming in':'Money in',GBP(inc))}<span class="op">−</span>${cell(isNow?'Bills to pay':'Bills and debts',GBP(bills))}<span class="op">−</span>${cell(isNow?'Budgets to spend':'Budgets',GBP(vars))}<span class="op">−</span>${cell('Savings and spending money',GBP(oth))}<span class="op">=</span>${cell('Left on '+ord(dim(y,mo))+' '+MONL[mo].slice(0,3),GBP(end),'res '+(end<0?'neg':end<buf?'tight':'pos'))}</div>
   <p class="small ink2" style="margin:12px 0 0">${end<0?`<b class="neg">Overdrawn.</b> `:end<buf?`<b class="warnc">Under your ${GBP(buf)} buffer.</b> `:`<b class="pos">${GBP(end-buf)} above your ${GBP(buf)} buffer.</b> `}${low&&low.bank<end-1?`The lowest point is <b>${GBP(low.bank)}</b> on ${fdate(low.t)}.`:''}${nOver?` ${nOver} bill${nOver>1?'s':''} (${GBP(overSum)}) due but not on the bank yet ${nOver>1?'are':'is'} counted as leaving today.`:''}</p>
   <div class="cols3"><div><div class="lbl">Money in</div>${inL.map(line).join('')||'<p class="muted small">Nothing planned.</p>'}</div>
    <div><div class="lbl">Bills, debts and savings</div>${outL.map(line).join('')}</div>
    <div><div class="lbl">Everyday budgets</div><div class="bleg"><span><i class="d"></i>Bank card</span><span><i class="a"></i>Amex</span></div>${vL.map(v=>`<div style="padding:6px 0"><div class="fld" style="padding:0"><span class="nm">${esc(v.n)}</span><span class="fill"></span><span class="am ${v.s>v.b?'neg':''}">${GBP(v.b-v.s)} left</span></div>${budBar(v.s,v.b,amxF[v.id],v.b*.8)}${(amxF[v.id]||0)>0.005?`<div class="amxn">${GBP2(amxF[v.id])} on the Amex</div>`:''}</div>`).join('')}<p class="small muted" style="margin:8px 0 0">${isNow?'Spent so far against each budget.':'The planned budget for this month.'}</p></div></div></div>
   ${isNow?trackingPanel(S,trackingData()):''}
   ${yearPanel(S)}</div>`}
