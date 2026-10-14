/* ===== Overdraft help: what pushes the bank down, levers you can switch, and three ready-made fixes =====
   Debt payments and pay-day timing are fixed, so they are never offered as fixes. Everything is run through the same forecast engine. */
const r50=v=>Math.round(v/50)*50,r5=v=>Math.round(v/5)*5;
function fixSetup(){
  const S=fc(),buf=STATE.buffer||0,low=S.lowBank;if(!low||low.v>=buf)return null;
  const thisK=thisMonthK(),lowK=ym(low.t),until=addMonthsK(lowK,2),P=planFor(lowK),L={};
  if(planFor(thisK).savings&&planFor(thisK).savings.sweep)L.sweep={label:'Stop the month-end sweep to savings',sub:`Keep that cash in the bank until ${fmonth(until)}.`,tag:'pull',
    mod:(p,k)=>{if(k<=until)p.savings.sweep=false}};
  const tr=[...(P.transfers||[])].sort((a,b)=>b.amount-a.amount)[0];
  if(tr&&tr.amount>=400){const to=r50(tr.amount*2/3);L.xfer={label:`${tr.name} ${GBP(tr.amount)} to ${GBP(to)}`,sub:`${fmonth(addMonthsK(thisK,1))} to ${fmonth(until)}.`,tag:'cut',
    mod:(p,k)=>{if(k>thisK&&k<=until)(p.transfers||[]).forEach(x=>{if(x.id===tr.id)x.amount=to})},full:(p,k)=>{if(k>thisK&&k<=until)(p.transfers||[]).forEach(x=>{if(x.id===tr.id)x.amount=to})}}}
  const yb=P.bills.filter(b=>(b.freq||'monthly')==='yearly'&&!b.spread&&b.amount>=300&&[monthOf(lowK),monthOf(addMonthsK(lowK,-1))].includes(b.month||12)).sort((a,b)=>b.amount-a.amount)[0];
  const dueIn=(p,b)=>(p.bills||[]).find(x=>x.id===b.id);
  const amexMove=(p,k,b,amt)=>{const x=dueIn(p,b);if(!x||monthOf(k)!==(b.month||12))return;p.bills=p.bills.filter(z=>z.id!==b.id);const y=+k.slice(0,4),mo=monthOf(k)-1;p.oneoffs=(p.oneoffs||[]).concat([{id:'fx_'+b.id,name:b.name,amount:amt,date:`${k}-${String(Math.min((((planFor(k).amex||{}).closeDay)||5)+1,dim(y,mo))).padStart(2,'0')}`,pay:'amex'}])};
  const cutBill=(p,k,b,f)=>{const x=dueIn(p,b);if(x&&monthOf(k)===(b.month||12)&&k>=thisK&&k<=until)x.amount=r5(x.amount*f)};
  if(yb){L.amex={label:`${yb.name} on the Amex`,sub:`Bought just after the statement closes on the ${ord(((planFor(lowK).amex||{}).closeDay)||5)}, so it is paid on the following month's statement instead of straight from the bank.`,tag:'push',mod:(p,k)=>{if(k>=thisK&&k<=until)amexMove(p,k,yb,yb.amount)},amt:yb.amount};
    L.ycut={label:`${yb.name} ${GBP(yb.amount)} to ${GBP(r5(yb.amount*.7))}`,sub:'A 30% cut.',tag:'cut',mod:(p,k)=>cutBill(p,k,yb,.7)};
    L.ycut50={label:`${yb.name} ${GBP(yb.amount)} to ${GBP(r5(yb.amount*.5))}`,sub:'A 50% cut.',tag:'cut',mod:(p,k)=>cutBill(p,k,yb,.5),hide:true};
    L.ycutAmex={label:'',mod:(p,k)=>{if(k>=thisK&&k<=until){cutBill(p,k,yb,.7);const x=dueIn(p,yb);if(x)amexMove(p,k,yb,x.amount)}},hide:true};
    L.yfull={mod:(p,k)=>{if(k>=thisK&&k<=until&&monthOf(k)===(yb.month||12))p.bills=p.bills.filter(z=>z.id!==yb.id)},hide:true,name:yb.name,amount:yb.amount}}
  const vs=P.vars.filter(v=>v.budget>=100);const trims=vs.map(v=>[v.id,r5(v.budget*.85)]);const tsave=sum(vs,v=>v.budget)-sum(trims,t=>t[1]);
  if(tsave>=50)L.trims={label:`${fmonth(lowK)} everyday trims`,sub:`${vs.map(v=>v.name.split(' ')[0]+' '+GBP(trims.find(t=>t[0]===v.id)[1])).join(', ')} (${GBP(-tsave,true)}).`,tag:'cut',
    mod:(p,k)=>{if(k===lowK)trims.forEach(([id,b])=>{const v=p.vars.find(x=>x.id===id);if(v)v.budget=b})}};
  return{S,buf,low,lowK,until,thisK,L,tr,yb,tsave};
}
function fixRun(F,mods){
  const fns=mods.map(id=>F.L[id]&&F.L[id].mod).filter(Boolean);
  const X=simulate({planOf:k=>{const p=JSON.parse(JSON.stringify(planFor(k)));fns.forEach(f=>f(p,k));return p}}),ds=X.days.filter(d=>ym(d.t)<=F.until),lo=ds.reduce((a,b)=>b.bank<a.bank?b:a,ds[0]);
  return{lo,neg:ds.filter(d=>d.bank<0).length,days:ds,X}}
function fixPanel(){
  let F;try{F=fixSetup()}catch(e){return''}if(!F)return'';
  const O=view.fixOn=view.fixOn||{sweep:true,xfer:true,amex:true},base=fixRun(F,[]),on=Object.keys(F.L).filter(k=>!F.L[k].hide&&O[k]),cur=fixRun(F,on);
  const eff=id=>fixRun(F,[id]).lo.bank-base.lo.bank;
  const fixes=[['A','Cut it','Cut Christmas, everyday spending and spending money.',['sweep','xfer','ycut50','trims']],['B','Push it','Keep the full amount, move it onto the Amex.',['sweep','xfer','amex']],['C','Bridge','A smaller cut, and move it onto the Amex.',['sweep','xfer','ycutAmex']]].map(([k,n,d,ids])=>({k,n,d,ids:ids.filter(i=>F.L[i]),r:fixRun(F,ids.filter(i=>F.L[i]))}));
  const rows=base.days.map((d,i)=>({t:d.t,today:d.bank,a:fixes[0].r.days[i]&&fixes[0].r.days[i].bank,b:fixes[1].r.days[i]&&fixes[1].r.days[i].bank,c:fixes[2].r.days[i]&&fixes[2].r.days[i].bank}));
  const sweptAmt=sum(F.S.events.filter(e=>e.k==='save'&&ym(e.t)<=F.lowK),e=>-e.a);
  const push=[];
  if(F.L.yfull)push.push([`${F.L.yfull.name} ${GBP(F.L.yfull.amount)}`,eff('yfull')]);
  if(F.L.sweep)push.push([`Surplus moved to savings${sweptAmt>0?' ('+GBP(sweptAmt)+')':''}`,eff('sweep')]);
  if(F.L.xfer)push.push([`${F.tr.name} ${GBP(F.tr.amount)} against ${GBP(r50(F.tr.amount*2/3))}`,eff('xfer')]);
  push.sort((a,b)=>b[1]-a[1]);const mx=Math.max(1,...push.map(p=>p[1]));
  const need=F.buf-F.low.v,fmtL=v=>`<b class="${v<0?'neg':v<F.buf?'warnc':'pos'}">${GBP(v)}</b>`,op=view.fixOpen!==false;
  const lev=Object.entries(F.L).filter(([k,l])=>!l.hide).map(([k,l])=>`<tr><td><b>${esc(l.label)}</b> <span class="pill ${l.tag==='push'?'info':'info'}">${l.tag}</span><div class="small muted">${esc(l.sub||'')}</div></td><td><label class="row" style="gap:6px"><input type="checkbox" data-act="fixtog" data-id="${k}" ${O[k]?'checked':''} aria-label="${esc(l.label)}"></label></td><td class="n ${eff(k)>0?'pos':'muted'}">${eff(k)>0?'+'+GBP(eff(k)):'–'}</td></tr>`).join('');
  const frows=fixes.map(f=>`<tr><td><b>Fix ${f.k}: ${f.n}</b><div class="small muted">${esc(f.d)}</div></td><td class="n"><b class="${f.r.lo.bank<0?'neg':f.r.lo.bank<F.buf?'warnc':'pos'}">${GBP(f.r.lo.bank)}</b><div class="small muted">${fdate(f.r.lo.t)}</div></td><td class="n">${f.r.neg}</td></tr>`).join('');
  const chart=lineChart('cfix',rows,{label:'Bank balance: today and the three fixes',buffer:F.buf,series:[{k:'today',c:'var(--bad)',name:'Today'},{k:'a',c:'var(--bank)',name:'Fix A'},{k:'b',c:'var(--debt)',name:'Fix B',dash:1},{k:'c',c:'var(--good)',name:'Fix C'}]});
  return`<div class="panel c12" style="border-color:var(--bad)"><div class="row" style="justify-content:space-between"><h2>${base.lo.bank<0?'Overdrawn':'Under your buffer'} from ${fdate((base.days.find(d=>d.bank<F.buf)||base.lo).t)}: what pushes it, and how to fix it</h2><button class="btn ghost sm" data-act="fixopen">${op?'Hide':'Show'}</button></div>
   <p class="small ink2" style="margin:2px 0 8px">The lowest point is ${fmtL(F.low.v)} on ${fdate(F.low.t)}. To stay above your ${GBP(F.buf)} buffer you need about <b>${GBP(need)}</b> more cash through ${fmonthLong(F.lowK)}. Debt payments and pay-day timing are fixed, so they are never offered here.</p>
   ${op?`<div class="lbl">What is pushing it down <span class="muted small">(how much higher the lowest point would be without each one)</span></div>
   <div class="list">${push.map(([n,v])=>`<div class="item"><span>${esc(n)}<span class="bar" style="display:block;height:6px;width:${Math.round(v/mx*100)}%;max-width:220px;margin-top:3px"><i class="pd" style="width:100%"></i></span></span><b>${v>0?GBP(v):'–'}</b></div>`).join('')||'<p class="muted small">Nothing you can change stands out.</p>'}</div>
   <p class="small muted" style="margin:4px 0 12px">push = pay later, pull = keep cash in the bank, cut = spend less. These overlap, so they do not add up to ${GBP(need)}.</p>
   <div class="lbl">Build your own mix <span class="muted small">tick the changes you want to try. Nothing is saved or changed in your plan.</span></div>
   <div class="tblwrap"><table><thead><tr><th>Change</th><th>Try it</th><th class="n">Lowest point rises by (on its own)</th></tr></thead><tbody>${lev}</tbody></table></div>
   <p class="small" style="margin:6px 0 12px"><b>Your mix</b> (the ticked changes together): the lowest point is ${fmtL(cur.lo.bank)} on ${fdate(cur.lo.t)}, with ${cur.neg} overdrawn day${cur.neg===1?'':'s'} up to ${fmonthLong(F.until)}.</p>
   <div class="lbl">Three ready-made fixes</div>
   <div class="tblwrap"><table><thead><tr><th>Fix</th><th class="n">Lowest point</th><th class="n">Overdrawn days</th></tr></thead><tbody><tr><td><b>Today</b></td><td class="n"><b class="neg">${GBP(base.lo.bank)}</b><div class="small muted">${fdate(base.lo.t)}</div></td><td class="n">${base.neg}</td></tr>${frows}</tbody></table></div>
   <div style="margin-top:8px">${chart}</div>
   <p class="small muted" style="margin:8px 0 0">To use a fix: change the spending money and everyday budgets on Budgets, untick the month-end surplus sweep on Budgets, and book ${F.yb?esc(F.yb.name):'the big yearly bill'} on the Amex when you spend it. The Amex statement still has to be paid: the app keeps enough in the bank for it.</p>
   <div class="row" style="margin-top:8px"><button class="btn ghost sm" data-go="budgets">Open Budgets</button><button class="btn ghost sm" data-go="whatif">Open What if</button></div>`:''}</div>`}
