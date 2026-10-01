/* ===== shared UI pieces: editable fields, draft plan, filters ===== */
const view={win:90,m:thisMonthK(),cut:20,period:'latest',compare:'prev',pat:'12',cat:'all',raf:null,open:{},scen:null,planMode:null,nwOpen:{}};
let FC=null,FCkey='';
const fcKey=()=>JSON.stringify([STATE.bank,STATE.asOf,STATE.debtBal,STATE.general,STATE.lumps,STATE.amexOwed,VERSIONS.map(v=>v.at),Object.keys(TX).map(k=>k+TX[k].length)]);
function fc(){const k=fcKey();if(FC&&FCkey===k)return FC;FC=simulate();FCkey=k;return FC}
const invalidate=()=>{FC=null};
/* plan fields are edited on a draft, then saved from a chosen month on */
function draft(){if(!DRAFT)DRAFT=clone(planFor(nextMonthK()));return DRAFT}
const editing=()=>DRAFT!==null;
function draftDirty(){return DRAFT&&JSON.stringify(DRAFT)!==JSON.stringify(planFor(nextMonthK()))}
function F(root,path,type,val,extra='',nul=false){
  const a=`data-r="${root}" data-p="${path}" data-t="${type}" ${nul?'data-nul="1"':''}`;
  if(type==='bool')return`<input type="checkbox" ${a} ${val?'checked':''} ${extra}>`;
  if(type==='num')return`<input type="number" step="any" ${a} value="${val??''}" ${extra}>`;
  if(type==='date')return`<input type="date" ${a} value="${val||''}" ${extra}>`;
  return`<input type="text" ${a} value="${esc(val)}" ${extra}>`}
const SEL=(root,path,val,opts,t='str')=>`<select data-r="${root}" data-p="${path}" data-t="${t}">${opts.map(([k,l])=>`<option value="${k}" ${String(val)===String(k)?'selected':''}>${l}</option>`).join('')}</select>`;
const KSEL=(root,path,val)=>SEL(root,path,val,[['need','Need'],['want','Want']]);
const delBtn=(root,l,i)=>`<button class="btn danger sm" data-act="del" data-root="${root}" data-list="${l}" data-i="${i}" aria-label="Remove">✕</button>`;
const intro=t=>`<p class="intro">${t}</p>`;
function slider(id,label,val,min,max,step,hint,fmt){return`<div class="sl"><label for="${id}">${label}</label><output id="o_${id}">${(fmt||GBP)(val)}</output><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" data-sl="${id}">${hint?`<span class="hint">${hint}</span>`:''}</div>`}
function getRoot(r){return r==='plan'?draft():r==='state'?STATE:null}
function setPath(o,path,val){const ks=path.split('.');for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null)o[ks[i]]={};o=o[ks[i]]}o[ks[ks.length-1]]=val}
function draftBar(){return`<div id="draftHost">${draftBarInner()}</div>`}
function draftBarInner(){
  if(!editing()||!draftDirty())return'';
  const nm=nextMonthK(),cm=thisMonthK(),start=isStartPlan();
  const opts=start?`<option value="correct">Correct the starting plan</option><option value="${nm}">From ${fmonthLong(nm)}</option>`:`<option value="${nm}">From ${fmonthLong(nm)} (next month)</option><option value="${cm}">From this month, ${fmonthLong(cm)}</option><option value="correct">Fix a mistake in the current plan</option>`;
  return`<div class="draftbar"><span><b>You have unsaved plan changes.</b> Past months are never changed.</span><span class="row"><label class="small">Starts <select id="draftFrom">${opts}</select></label><button class="btn" data-act="savedraft">Save plan</button><button class="btn ghost" data-act="discard">Discard</button></span></div>`}
function saveDraft(){
  const sel=$('#draftFrom'),from=sel?sel.value:nextMonthK();
  if(from==='correct'){commitPlan(DRAFT,thisMonthK(),'Corrected',ME.name||'',true)}
  else commitPlan(DRAFT,from,'Plan changed',ME.name||'');
  DRAFT=null;resetHist();invalidate();persistAll();toast('Plan saved'+(from==='correct'?'':' from '+fmonthLong(from)));render()}
/* plain lists of changes between two plans, for the "make this my plan" box */
function changesBetween(a,b){const out=[];
  b.vars.forEach(v=>{const o=a.vars.find(x=>x.id===v.id);if(o&&o.budget!==v.budget)out.push(`${v.name}: ${GBP(o.budget)} → ${GBP(v.budget)} a month`)});
  b.income.forEach(v=>{const o=a.income.find(x=>x.id===v.id);if(o&&o.amount!==v.amount)out.push(`${v.name}: ${GBP(o.amount)} → ${GBP(v.amount)}`)});
  (b.transfers||[]).forEach(v=>{const o=(a.transfers||[]).find(x=>x.id===v.id);if(o&&o.amount!==v.amount)out.push(`${v.name}: ${GBP(o.amount)} → ${GBP(v.amount)}`)});
  b.debts.forEach(v=>{const o=a.debts.find(x=>x.id===v.id);if(o&&(o.extra||0)!==(v.extra||0))out.push(`${v.name} extra: ${GBP(o.extra||0)} → ${GBP(v.extra||0)} a month`)});
  if(a.savings.monthly!==b.savings.monthly)out.push(`Savings: ${GBP(a.savings.monthly)} → ${GBP(b.savings.monthly)} a month`);
  b.tax.forEach(v=>{const o=a.tax.find(x=>x.id===v.id);if(o&&o.adj!==v.adj)out.push(`${v.name}: ${v.adj}% of last year`)});
  if((a.amexShare||0)!==(b.amexShare||0))out.push(`Amex share: ${a.amexShare||0}% → ${b.amexShare||0}%`);
  return out}
/* period filters used by Day to day, Where it goes and Plan vs actual */
const PERIODS=[['latest','Latest month with data'],['this','This month'],['last','Last month'],['3','Last 3 months'],['6','Last 6 months'],['12','Last 12 months'],['year','This year'],['lastyear','Last year']];
const COMPARES=[['last','Last month'],['prev','The period before'],['ly','Same period last year'],['avg3','Average of the last 3 months'],['avg12','Average of the last 12 months'],['none','Nothing']];
function filterBar(opts={}){
  const ps=(opts.periods||PERIODS).map(([k,l])=>`<button data-act="period" data-v="${k}" aria-pressed="${view.period===k}">${l}</button>`).join('');
  const cs=COMPARES.map(([k,l])=>`<option value="${k}" ${view.compare===k?'selected':''}>${l}</option>`).join('');
  const cats=`<option value="all">All categories</option>`+allVars().map(v=>`<option value="${v.id}" ${view.cat===v.id?'selected':''}>${esc(v.name)}</option>`).join('');
  return`<div class="panel filters" style="margin-bottom:16px"><div><div class="lbl">Period</div><div class="tabs2" style="flex-wrap:wrap">${ps}</div></div>
   <div><div class="lbl">Compare with</div><select id="fCompare">${cs}</select></div>
   ${opts.noCat?'':`<div><div class="lbl">Category</div><select id="fCat">${cats}</select></div>`}</div>`}
function compareMonths(p){
  const ks=periodMonths(p);if(view.compare==='none')return null;
  if(view.compare==='last')return shiftMonths(ks,-1);
  if(view.compare==='prev')return shiftMonths(ks,-ks.length);
  if(view.compare==='ly')return shiftYear(ks,-1);
  const lastK=addMonthsK(thisMonthK(),-1);
  if(view.compare==='avg3')return[0,1,2].map(i=>addMonthsK(lastK,-i));
  if(view.compare==='avg12')return Array.from({length:12},(_,i)=>addMonthsK(lastK,-i));
  return null}
const shiftMonths=(ks,n)=>ks.map(k=>addMonthsK(k,n));
function periodLabel(ks){return ks.length===1?fmonthLong(ks[0]):fmonth(ks[0])+' to '+fmonth(ks[ks.length-1])}
function chgCell(a,b,goodDown=true){const d=a-b;if(Math.abs(d)<1)return'<span class="muted">–</span>';
  const p=b>0?`(${Math.round(Math.abs(d)/b*100)}%)`:'(new)';return`<span class="${(d<0)===goodDown?'pos':'neg'}">${d<0?'▼':'▲'} ${GBP(Math.abs(d))} <span class="small">${p}</span></span>`}

function periodBar(){return`<div class="tabs2" style="flex-wrap:wrap;margin-bottom:12px">${PERIODS.map(([k,l])=>`<button data-act="period" data-v="${k}" aria-pressed="${view.period===k}">${l}</button>`).join('')}</div>`}
