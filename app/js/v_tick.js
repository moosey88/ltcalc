/* ===== Tick-off: mark income and bills as done without typing a transaction, then check them against the bank file ===== */
const tickRow=(m,id)=>(TX[m]||[]).find(t=>t.s==='tick'&&t.item===id);
/* everything the plan expects in a month: money in, bills, debts, personal transfers */
function expectedItems(m){
  const P=planFor(m),y=+m.slice(0,4),mo=monthOf(m)-1,n=dim(y,mo),out=[];
  P.income.forEach(i=>out.push({kind:'inc',id:i.id,name:i.name,amt:i.amount,day:Math.min(i.day,n),sign:1,c:'_inc',sc:i.id,varies:!!i.varies}));
  P.bills.forEach(b=>{const fr=b.freq||'monthly';
    const due=fr==='monthly'||(fr==='yearly'&&mo+1===(b.month||12))||(fr==='quarterly'&&((mo+1-(b.month||1))%3+3)%3===0);
    if(due)out.push({kind:'bill',id:b.id,name:b.name,amt:b.amount,day:Math.min(b.day,n),sign:-1,c:'_skip',key:bkey(b),variable:b.variable,yearly:fr!=='monthly'})});
  P.debts.filter(d=>(d.pay||0)>0).forEach(d=>out.push({kind:'debt',id:d.id,name:d.name,amt:d.pay+(d.extra||0),day:Math.min(d.day,n),sign:-1,c:'_skip',key:(d.match||d.name.split(' ')[0]).toUpperCase()}));
  (P.transfers||[]).forEach(x=>out.push({kind:'xfer',id:x.id,name:x.name,amt:x.amount,day:Math.min(x.day||2,n),sign:-1,c:x.catId}));
  if(P.savings&&P.savings.monthly>0)out.push({kind:'sav',id:'sav',name:'Transfer to savings (Premium Bonds and pots)',amt:P.savings.monthly,day:Math.min(P.savings.day||1,n),sign:-1,c:'_skip'});
  return out.sort((a,b)=>a.day-b.day)}
/* the real bank/Amex line behind an item, if one has been uploaded */
function bankRowFor(it,m){
  const rows=(TX[m]||[]).filter(t=>t.s!=='tick'&&t.s!=='man');
  const cl=rows.find(t=>t.item===it.id&&t.ticked&&t.a*it.sign>0);if(cl)return cl;
  if(it.kind==='inc'){const ok=t=>t.c==='_inc'&&t.a>0&&(!t.item||t.item===it.id),rel=t=>Math.abs(t.a-it.amt)/Math.max(1,it.amt);
    const c=rows.filter(t=>ok(t)&&t.sc===it.id&&(it.varies||rel(t)<=.5)).concat(rows.filter(t=>ok(t)&&t.sc!==it.id&&rel(t)<=.05));
    return c.sort((a,b)=>rel(a)-rel(b))[0]||null}
  if(it.kind==='sav')return rows.find(t=>t.a<0&&/NS&I|PREMIUM BOND|TO A\/C (67716245|67652417)/.test((t.t||'').toUpperCase()))||null;
  if(it.kind==='xfer')return rows.find(t=>t.c===it.c&&t.a<0&&Math.abs(-t.a-it.amt)<=it.amt*.3+1)||null;
  return it.key?rows.find(t=>t.a<0&&keyHit(t.t,it.key)&&Math.abs(-t.a-it.amt)<=it.amt*.3+1)||null:null}
function tickDate(m,it){const t=todayISO();return t.slice(0,7)===m?t:m+'-'+String(it.day).padStart(2,'0')}
function toggleTick(kind,id,m){
  const it=expectedItems(m).find(x=>x.kind===kind&&x.id===id);if(!it)return;
  const arr=TX[m]=TX[m]||[],ex=tickRow(m,id);
  audit(ex?'Unticked':'Ticked',`${it.name}, ${GBP2(it.amt)} (${fmonthLong(m)})`);
  if(ex)arr.splice(arr.indexOf(ex),1);
  else arr.push({id:'tk_'+m+'_'+id,d:tickDate(m,it),t:(it.kind==='inc'?'Received: ':'Paid: ')+it.name,a:it.sign*it.amt,c:it.c,sc:it.kind==='inc'?it.id:undefined,s:'tick',p:'bank',item:id,planned:it.amt});
  saveTx(m);invalidate();persistAll();render()}
/* tick every item that should have happened by today and is not on the bank file yet */
function tickAllDue(m){
  const dom=m===thisMonthK()?+todayISO().slice(8):99,arr=TX[m]=TX[m]||[];let n=0;
  expectedItems(m).forEach(it=>{if(it.day>dom||tickRow(m,it.id)||bankRowFor(it,m))return;
    arr.push({id:'tk_'+m+'_'+it.id,d:tickDate(m,it),t:(it.kind==='inc'?'Received: ':'Paid: ')+it.name,a:it.sign*it.amt,c:it.c,sc:it.kind==='inc'?it.id:undefined,s:'tick',p:'bank',item:it.id,planned:it.amt});n++});
  if(n){audit('Ticked everything due',`${n} items for ${fmonthLong(m)}`);saveTx(m);invalidate();persistAll()}
  toast(n?`Ticked ${n} items. Untick any that have not happened.`:'Nothing else is due yet');render()}
function setTickAmt(m,id,v){const r=tickRow(m,id);if(!r||!(v>=0))return;audit('Changed ticked amount',`${r.t.replace(/^(Paid|Received): /,'')}: ${GBP2(Math.abs(r.a))} to ${GBP2(v)}`);r.a=(r.a<0?-1:1)*v;saveTx(m);invalidate();persistAll()}
/* after a bank file is uploaded: swap each tick for the real line it matches */
/* repair: a bank line wrongly claimed by an item (same payer, very different amount) goes back to being a tick */
function repairTickClaims(){
  Object.keys(TX).forEach(m=>{let ch=false;
    TX[m].slice().forEach(b=>{if(b.s!=='nw'||!b.ticked)return;
      if(Math.abs(Math.abs(b.a)-b.tickAmt)>Math.max(1,b.tickAmt*.5)){
        const id=b.item,it=expectedItems(m).find(x=>x.id===id);
        if(it&&!tickRow(m,id))TX[m].push({id:'tk_'+m+'_'+id,d:b.d,t:(it.kind==='inc'?'Received: ':'Paid: ')+it.name,a:it.sign*b.tickAmt,c:it.c,sc:it.kind==='inc'?it.id:undefined,s:'tick',p:'bank',item:id,planned:it.amt});
        delete b.item;delete b.ticked;delete b.tickAmt;ch=true}});
    if(ch)saveTx(m)})}
function reconcileTicks(){
  let matched=0,diff=0;repairTickClaims();
  Object.keys(TX).forEach(m=>{
    const ticks=TX[m].filter(t=>t.s==='tick');if(!ticks.length)return;
    const items=expectedItems(m);
    let ch=false;
    ticks.forEach(r=>{const it=items.find(x=>x.id===r.item);if(!it)return;
      /* a payment that arrives in two or more lines (for example two Ikano debits) */
      if(it.key&&(it.kind==='bill'||it.kind==='debt')){const part=(TX[m]||[]).filter(t=>t.s==='nw'&&t.a<0&&!t.item&&keyHit(t.t,it.key)&&Math.abs(parseISO(t.d)-parseISO(r.d))<=12*DAY);
        if(part.length>1&&Math.abs(-sum(part,t=>t.a)-it.amt)<=Math.max(1,it.amt*.02)){TX[m].splice(TX[m].indexOf(r),1);part.forEach(t=>{t.item=it.id;t.ticked=true;t.tickAmt=-t.a});matched++;ch=true;return}}
      const b=bankRowFor(it,m);if(!b||Math.abs(parseISO(b.d)-parseISO(r.d))>12*DAY)return;
      TX[m].splice(TX[m].indexOf(r),1);b.item=it.id;b.ticked=true;b.tickAmt=Math.abs(r.a);matched++;ch=true;
      if(Math.abs(Math.abs(b.a)-Math.abs(r.a))>Math.max(1,Math.abs(r.a)*.02))diff++});
    if(ch)saveTx(m)});
  return{matched,diff}}
/* in-place fixes used by the Weekly check */
const fxRow=(r,lbl)=>`<span class="fxrow" ${r.chk?'style="opacity:.6"':''}><span class="small">${r.chk?'✓ ':''}${esc(lbl||(r.t||'entry').replace(/^(Paid|Received): /,'').slice(0,28))} (${fdate(parseISO(r.d))})</span> <span class="fxin"><input type="number" step="0.01" min="0" value="${Math.abs(r.a)}" aria-label="Amount"><button class="btn ghost sm" data-act="fx_amt" data-m="${r.d.slice(0,7)}" data-id="${esc(r.id)}">Save amount</button></span><button class="btn ghost sm" data-act="deltx" data-m="${r.d.slice(0,7)}" data-id="${esc(r.id)}">${r.s==='tick'?'Untick':'Remove'}</button></span>`;
const fxDismiss=key=>`<button class="btn ghost sm" data-act="fx_dismiss" data-key="${esc(key)}">Dismiss</button>`;
function fxApply(a,d,b){
  if(a==='fx_amt'){const r=(TX[d.m]||[]).find(x=>x.id===d.id),v=parseFloat(b.previousElementSibling.value);if(!r||!(v>=0))return;
    audit('Changed amount in weekly check',`${(r.t||'').slice(0,40)}: ${GBP2(Math.abs(r.a))} to ${GBP2(v)}`);r.a=(r.a<0?-1:1)*v;r.chk=1;saveTx(d.m);toast('Saved')}
  else if(a==='fx_accept'){const r=(TX[d.m]||[]).find(x=>x.id===d.id);if(!r)return;audit('Accepted bank amount',`${(r.t||'').slice(0,40)}: ${GBP2(r.tickAmt)} to ${GBP2(Math.abs(r.a))}`);r.tickAmt=Math.abs(r.a);saveTx(d.m)}
  else if(a==='fx_tick'){toggleTick(d.kind,d.id,d.m);return}
  else if(a==='fx_dismiss'){STATE.dismissed=STATE.dismissed||{};STATE.dismissed[d.key]=1;audit('Dismissed a weekly check item',d.key.slice(0,60))}
  else if(a==='fx_bal'){const v=parseFloat(b.previousElementSibling.value);if(isNaN(v))return;applyBalance(v,d.d,'typed')}
  invalidate();persistAll();render()}
/* things that do not add up */
function anomalies(){
  const out=[],now=thisMonthK(),prev=addMonthsK(now,-1),asOf=STATE.asOf||todayISO(),dom=+asOf.slice(8);
  [prev,now].forEach(m=>{
    const items=expectedItems(m),cur=m===now;
    TX[m]&&TX[m].filter(t=>t.s==='tick'&&!t.chk&&parseISO(t.d)<=parseISO(asOf)-3*DAY).forEach(t=>out.push({sev:'warn',m,t:`You ticked "${t.t.replace(/^(Paid|Received): /,'')}" (${GBP2(Math.abs(t.a))}, ${fdate(parseISO(t.d))}) but no matching line has appeared in the bank file (data to ${fdate(parseISO(asOf))}).`,act:'Fix the amount below, or untick it if it has not happened.',fix:fxRow(t)}));
    items.forEach(it=>{const b=bankRowFor(it,m),tk=tickRow(m,it.id);
      if(b&&b.ticked&&Math.abs(Math.abs(b.a)-b.tickAmt)>Math.max(1,b.tickAmt*.02))out.push({sev:'warn',m,t:`${it.name}: you ticked ${GBP2(b.tickAmt)} but the bank shows ${GBP2(Math.abs(b.a))} on ${fdate(parseISO(b.d))}.`,act:`Difference ${GBP2(Math.abs(b.a)-b.tickAmt)}.`,fix:`<button class="btn ghost sm" data-act="fx_accept" data-m="${m}" data-id="${esc(b.id)}">Accept the bank amount</button>`});
      else if(b&&!it.variable&&it.kind!=='inc'&&Math.abs(Math.abs(b.a)-it.amt)>Math.max(2,it.amt*.05))out.push({sev:'info',m,t:`${it.name}: the bank shows ${GBP2(Math.abs(b.a))}, your plan has ${GBP2(it.amt)}.`,act:'If this is the new normal, update the plan on Budgets.',fix:`<button class="btn ghost sm" data-go="budgets">Open Budgets</button>`,dk:`plan|${m}|${it.id}`});
      if(cur&&!b&&!tk&&it.day+2<=dom&&it.kind!=='xfer')out.push({sev:it.kind==='inc'?'bad':'warn',m,t:it.kind==='inc'?`${it.name} has not arrived. It was expected on the ${ord(it.day)} (${GBP2(it.amt)}).`:`${it.name} (${GBP2(it.amt)}, due the ${ord(it.day)}) has not left the bank yet.`,act:it.kind==='inc'?'Check with the payer, or tick it if it is in a different account.':'Tick it if you paid another way, or check the date.',fix:`<button class="btn ghost sm" data-act="fx_tick" data-kind="${it.kind}" data-id="${it.id}" data-m="${m}">${it.kind==='inc'?'Mark received':'Mark paid'}</button>`,dk:`due|${m}|${it.id}`})});
    const seen={};(TX[m]||[]).filter(t=>t.s==='nw'&&t.a<0&&-t.a>=20).forEach(t=>{const k=t.d+'|'+t.a+'|'+(t.t||'').replace(/\s+\d{2}[A-Z]{3}\d{2}/,'').slice(0,40);if(seen[k]&&seen[k]!==t.id)out.push({sev:'warn',m,t:`Possible double payment: ${GBP2(-t.a)} to "${(t.t||'').replace(/^(Card Transaction|Direct Debit|OnLine Transaction)\s*/,'').slice(0,40)}" on ${fdate(parseISO(t.d))} appears twice.`,act:'If it is a duplicate charge, ask the shop or bank.',fix:`<button class="btn ghost sm" data-act="deltx" data-m="${m}" data-id="${esc(t.id)}">Remove the second one</button>`+fxDismiss('dup|'+t.id)});seen[k]=t.id})});
  const lc=liveCheck();if(lc&&Math.abs(lc.diff)>=1)out.push({sev:Math.abs(lc.diff)>=50?'bad':'warn',m:now,t:`The bank balance on ${fdate(parseISO(lc.d))} was ${lc.diff>0?GBP2(lc.diff)+' higher':GBP2(-lc.diff)+' lower'} than your ticks and entries predicted (${GBP2(lc.est)} expected).`,act:bcExplain(lc)+(lc.pend&&lc.pend.length?' Your entries that are not on the file yet are listed below. If one is already on the file it is counted twice: remove yours.':'')});
  if(lc&&Math.abs(lc.diff)>=1){const o=out[out.length-1];o.fix=(lc.pend||[]).map(r=>fxRow(r)).join('')+(lc.unticked||[]).slice(0,6).map(i=>`<button class="btn ghost sm" data-act="fx_tick" data-kind="${i.kind}" data-id="${i.id}" data-m="${lc.d.slice(0,7)}">Tick: ${esc(i.name)} ${GBP2(i.amt)}</button>`).join('')+`<span class="fxrow"><span class="small">Or the typed balance was wrong:</span> <span class="fxin"><input type="number" step="0.01" value="${STATE.bank}"><button class="btn ghost sm" data-act="fx_bal" data-d="${lc.d}">Use this balance</button></span></span>`}
  const D=STATE.dismissed||{},keep=out.filter(x=>!(x.dk&&D[x.dk])&&!(x.t&&D[x.t]));
  const rank={bad:0,warn:1,info:2};return keep.sort((a,b)=>rank[a.sev]-rank[b.sev])}
function tickBox(kind,id,m){m=m||thisMonthK();const it=expectedItems(m).find(x=>x.kind===kind&&x.id===id);if(!it)return'';
  const b=bankRowFor(it,m),t=tickRow(m,id);
  return b?`<span class="pill good" title="Found on the bank file">✓ bank</span>`:`<input type="checkbox" data-act="tick" data-kind="${kind}" data-id="${id}" data-m="${m}" ${t?'checked':''} aria-label="Done this month: ${esc(it.name)}" title="${kind==='inc'?'Money received':'Paid'} this month">`}
function tickPanel(m){
  const items=expectedItems(m),dom=m===thisMonthK()?+todayISO().slice(8):99;
  const grp=(kind,title,lab)=>{const rows=items.filter(i=>i.kind===kind);if(!rows.length)return'';
    return`<tr class="mer"><td colspan="5">${title}</td></tr>`+rows.map(it=>{const b=bankRowFor(it,m),t=tickRow(m,it.id);
      const st=b?`<span class="chip in">✓ On the bank file${b.ticked?' (matched your tick)':''}</span>`:t?`<span class="chip in">✓ Ticked</span>`:it.day<=dom?`<span class="chip wait">${lab} yet</span>`:`<span class="chip mv">Expected</span>`;
      const amt=b?GBP2(Math.abs(b.a)):t?`<input type="number" step="0.01" class="num" style="width:96px" value="${Math.abs(t.a)}" data-tickamt="${it.id}" data-m="${m}" aria-label="Amount for ${esc(it.name)}">`:'about '+GBP2(it.amt);
      return`<tr><td style="width:34px">${tickBox(kind,it.id,m)}</td><td>${esc(it.name)}${it.variable?' <span class="pill warn">varies</span>':''}${it.yearly?' <span class="pill info">yearly</span>':''}</td><td class="small muted">${it.kind==='inc'?'due':'due'} the ${ord(it.day)}</td><td>${st}</td><td class="n">${amt}</td></tr>`}).join('')};
  return`<div class="panel c12"><div class="row" style="justify-content:space-between"><h2>Tick off ${fmonthLong(m)} <span class="muted small">money in, bills, debts and transfers</span></h2><button class="btn ghost sm" data-act="tickall" data-m="${m}">Tick everything due so far</button></div>
   <p class="small ink2" style="margin-top:0">Tick an item when it has happened, so you do not need to type it as a transaction. A tick counts straight away in the forecast. When you upload your NatWest file, each tick is swapped for the real bank line and anything that does not match is flagged below.</p>
   <div class="tblwrap"><table><tbody>${grp('inc','Money in','Not received')}${grp('bill','Bills','Not paid')}${grp('debt','Debts','Not paid')}${grp('xfer','Transfers to personal accounts','Not sent')}${grp('sav','Savings','Not moved')}</tbody></table></div></div>`}
function anomalyPanel(w){w=w||'c8';
  const a=anomalies(),pill={bad:'bad',warn:'warn',info:'info'},lab={bad:'Check now',warn:'Check',info:'FYI'};
  return`<div class="panel ${w} chk" ${a.some(x=>x.sev!=='info')?'style="border-color:var(--warn)"':''}><h2>Weekly check <span class="muted small">${a.length?a.length+' thing'+(a.length>1?'s':'')+' to look at':'everything matches'}</span></h2>
   ${a.length?`<div class="list scrollbox">${a.map(x=>`<div class="item" style="align-items:flex-start"><span><span class="pill ${pill[x.sev]}">${lab[x.sev]}</span> ${esc(x.t)}<br><span class="small muted">${esc(x.act)}</span>${x.fix?`<span class="fixes">${x.fix}${x.dk?fxDismiss(x.dk):''}</span>`:(x.dk?`<span class="fixes">${fxDismiss(x.dk)}</span>`:'')}</span></div>`).join('')}</div>`:'<p class="muted small" style="margin-bottom:0">After each upload the app compares your ticks, your plan and the bank file. Anything that does not add up will appear here.</p>'}</div>`}
