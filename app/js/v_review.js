/* ===== Review new transactions: approve the app's suggested categories, fix the unsure ones ===== */
const RV_SURE=new Set(['known','rule','bill','typed']);
const rvLabel=t=>t.c==='_skip'?'Bill, debt or transfer':t.c==='_inc'?'Money in':t.c==='_amexpay'?'Amex payment':t.c==='_cashout'||t.c==='_cashin'?'Cash':t.c?(subName(t.c,t.sc)?subName(t.c,t.sc):((allVars().find(v=>v.id===t.c)||{}).name||t.c)):'Not sorted';
function reviewRows(){const out=[];Object.keys(TX).sort().reverse().forEach(m=>(TX[m]||[]).slice().sort((a,b)=>a.d<b.d?1:-1).forEach(t=>{if(t.rv==='p')out.push({t,m})}));return out}
const reviewCount=()=>reviewRows().length;
const rvLook=t=>!RV_SURE.has(t.how)||t.c===''||t.c==null;
const rvName=t=>{const s=cleanD(t.t).toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase());return s.length>38?s.slice(0,37)+'…':s};
function learnRule(t,c,sc){const kw=merchKey(cleanD(t.t)).toUpperCase();if(c&&kw&&kw!=='OTHER'&&t.s!=='man'&&kw.length>2&&!STATE.rules.find(r=>r.k===kw))STATE.rules.push({k:kw,c,s:sc})}
function reviewRow(r){const t=r.t,look=rvLook(t),sel=t.c?t.c+(t.sc?':'+t.sc:''):'';
  const opts=`<option value="">Choose…</option>${catOptions(t.c&&t.c[0]!=='_'?t.c:'',t.sc)}<option value="_skip" ${t.c==='_skip'?'selected':''}>Bill, debt or transfer</option><option value="_inc" ${t.c==='_inc'?'selected':''}>Money in (income)</option>`;
  const flagc=!t.c?'var(--bad)':look?'var(--warn)':'var(--good)';
  return`<div class="rvr ${look?(!t.c?'bad':'warn'):'ok'}"><span class="dt">${fdate(parseISO(t.d))}</span><span class="nm">${look?'<b>':''}${esc(rvName(t))}${look?'</b>':''}</span>
   <span class="cat">${look?`<select>${opts}</select>`:esc(rvLabel(t))}</span><span class="why"><i class="flag" style="background:${flagc}"></i>${esc(t.why||'')}</span>
   <span class="am ${t.a>0?'pos':''}">${t.a>0?'+':'−'}${GBP2(Math.abs(t.a))}</span><span class="act">${look?`<button class="btn" data-act="rvok" data-m="${r.m}" data-id="${esc(t.id)}">Approve</button>`:`<button class="chk" data-act="rvok" data-m="${r.m}" data-id="${esc(t.id)}" aria-label="Approve" title="Approve">✓</button>`}</span></div>`}
function reviewPanel(){const rows=reviewRows();if(!rows.length)return'';
  const look=rows.filter(r=>rvLook(r.t)),sure=rows.filter(r=>!rvLook(r.t));
  return`<div class="panel c8 rvp"><div class="row" style="justify-content:space-between"><h2>Review new transactions ${look.length?`<span class="pill warn">${look.length} need a look</span>`:'<span class="pill good">all look right</span>'}</h2></div>
  <p class="small muted" style="margin:4px 0 0">Each line shows where the suggested category came from. Until you approve, it already counts under that category. Amber means the app is not sure.</p>
  <div class="scrollbox" style="max-height:420px">
  ${look.length?`<div class="rvsec"><span class="lbl">Needs a look (${look.length})</span><label class="small muted"><input type="checkbox" id="rvLearn" checked> Remember my choices for next time</label></div>${look.slice(0,40).map(reviewRow).join('')}`:''}
  ${sure.length?`<div class="rvsec"><span class="lbl">Looks right (${sure.length})</span><button class="btn" data-act="rvall">Approve all ${sure.length}</button></div>${sure.slice(0,60).map(reviewRow).join('')}`:''}
  </div></div>`}
function approveRow(m,id,cv,learn){const t=(TX[m]||[]).find(x=>x.id===id);if(!t)return;
  if(cv!=null&&cv!==''){const c=cv.split(':')[0],sc=cv.split(':')[1];if(c!==t.c||(sc||undefined)!==t.sc){audit('Re-categorised in review',`${GBP2(Math.abs(t.a))} "${(t.t||'').slice(0,40)}": ${rvLabel(t)} to ${c==='_skip'?'Bill, debt or transfer':c==='_inc'?'Money in':(catName({vars:allVars()},c)||c)}`);t.c=c;t.sc=sc||undefined}if(learn)learnRule(t,t.c,t.sc)}
  else if(!t.c){toast('Choose a category first');return false}
  delete t.rv;t.how=t.how||'approved';saveTx(m)}
function reviewApproveAll(){let n=0;const touched=new Set();reviewRows().filter(r=>!rvLook(r.t)).forEach(r=>{delete r.t.rv;touched.add(r.m);n++});touched.forEach(m=>saveTx(m));audit('Approved suggested categories',n+' lines');invalidate();persistAll();toast(n+' approved');render()}
/* one-off repair: payments wrongly filed as a bill (a short keyword such as "car" matched "card") */
function fixWeakClass(){let any=false;const P=curPlan();
  const weak=D=>P.bills.some(b=>{const k=bkey(b);return k&&D.includes(k)&&!keyHit(D,k)})&&!P.bills.some(b=>bkey(b)&&keyHit(D,bkey(b)));
  Object.keys(TX).forEach(m=>{let ch=false;(TX[m]||[]).forEach(t=>{
    if(t.cf||t.c!=='_skip'||(t.s!=='nw'&&t.s!=='amex'))return;t.cf=1;
    const D=(t.t||'').toUpperCase();if(!weak(D)||bankClass(D,t.a))return;const r=classifyWhy(t.t,t.a);
    if(r.c!=='_skip'){t.c=r.c;t.sc=r.sc;t.how=r.how;t.why=r.why;t.rv='p';ch=true}});
    if(ch){saveTx(m);any=true}});if(any)invalidate();return any}

/* a refund you typed and the same credit arriving on the bank file are one thing: keep the bank line, with your category and note */
function mergeTypedCredits(){let any=false;Object.keys(TX).forEach(m=>{const arr=TX[m]||[];let ch=false;
  arr.filter(t=>t.s==='man'&&t.a>0&&t.p==='bank').forEach(t=>{const hit=Object.values(TX).flat().find(x=>x.s==='nw'&&x.a>0&&Math.abs(x.a-t.a)<.005&&Math.abs(parseISO(x.d)-parseISO(t.d))<=4*DAY&&!x.mergedFrom);
    if(hit){if(t.c)hit.c=t.c;if(t.sc)hit.sc=t.sc;hit.note=hit.note||(t.t&&t.t!==hit.t?t.t:undefined);hit.mergedFrom=t.id;hit.how='typed';hit.why='Matched your refund entry';arr.splice(arr.indexOf(t),1);ch=true}});
  if(ch){saveTx(m);any=true}});if(any)invalidate();return any}
