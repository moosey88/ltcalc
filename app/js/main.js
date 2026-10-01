/* ===== tabs, events, start-up ===== */
let tab='today',ptrDown=false,pendingRender=false;
/* edits don't re-draw the page while you are still typing: the draft bar updates at once, the rest when you leave the fields */
const inField=()=>{const a=document.activeElement;return!!(a&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&!['range','checkbox','radio','button','file'].includes(a.type))))};
function maybeRender(){if(pendingRender&&!ptrDown&&!inField()){pendingRender=false;render()}}
function softRender(){pendingRender=true;setTimeout(maybeRender,0)}
document.addEventListener('pointerdown',()=>{ptrDown=true},true);
document.addEventListener('pointerup',()=>{ptrDown=false;setTimeout(maybeRender,0)},true);
document.addEventListener('pointercancel',()=>{ptrDown=false},true);
document.addEventListener('focusout',()=>setTimeout(maybeRender,0));
function updateDraftBar(){const h=$('#draftHost');if(!h)return;const now=draftBarInner(),had=!!h.firstElementChild;if(!!now===had)return;h.innerHTML=now}
const TABS=[['today','Today',vToday,'Every day'],['daily','Day to day',vDaily,'Every day'],['cash','Cash and bank',vCash,'Every day'],
 ['where','Where it goes',vWhere,'Understand'],['patterns','Patterns',vPatterns,'Understand'],['pva','Plan vs actual',vPva,'Understand'],['whatif','What if',vWhatIf,'Understand'],['networth','Net worth',vNetworth,'Understand'],
 ['budgets','Budgets',vBudgets,'Commitments'],['debts','Debts',vDebts,'Commitments'],['goals','Goals and holidays',vGoals,'Commitments'],['tax','Tax',vTax,'Commitments'],['amex','Amex',vAmex,'Commitments'],
 ['improve','Improvements',vImprove,'Help and settings'],['guide','Guide',vGuide,'Help and settings'],['settings','Settings',vSettings,'Help and settings']];
function render(){
  const groups=[...new Set(TABS.map(t=>t[3]))];
  $('#nav').innerHTML='<div class="navg">'+groups.map(g=>`<div class="ng"><small>${g}</small><div>${TABS.filter(t=>t[3]===g).map(([k,l])=>`<button role="tab" data-tab="${k}" aria-selected="${tab===k}">${l}</button>`).join('')}</div></div>`).join('')+'</div>';
  let html;try{html=TABS.find(x=>x[0]===tab)[2]()}catch(e){console.error(e);html=`<div class="panel"><h2>Something went wrong on this tab</h2><p class="small muted">${esc(e.message)}</p></div>`}
  $('#main').innerHTML=html;
  if(view.modal==='commit')$('#main').insertAdjacentHTML('beforeend',commitModal())}
function go(t){tab=t;view.modal=null;render();window.scrollTo(0,0)}
function afterState(path,v){
  const m=path.match(/^debtBal\.(.+)$/);
  if(m){const id=m[1];const dn=(curPlan().debts.find(x=>x.id===id)||{}).name||id;audit('Debt balance changed',`${dn}: ${v==null?'cleared':GBP2(v)}`);if(v!=null){(STATE.debtLog[id]=STATE.debtLog[id]||[]).push({d:todayISO(),b:v});if(STATE.debtStart[id]==null)STATE.debtStart[id]=v}}
  const a=path.match(/^assets\.(\d+)\.value$/);if(a){STATE.assets[+a[1]].updated=todayISO();audit('Asset value changed',`${STATE.assets[+a[1]].name}: ${v==null?'cleared':GBP2(v)}`)}}
function parseVal(el){const t=el.dataset.t;if(t==='bool')return el.checked;if(t==='flag')return el.value==='1';
  if(t==='num'){if(el.value==='')return el.dataset.nul?null:0;return parseFloat(el.value)}return el.value}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act],[data-tab],[data-go],[data-reset]');if(!b)return;
  if(b.dataset.tab){go(b.dataset.tab);return}
  if(b.dataset.go){go(b.dataset.go);return}
  const a=b.dataset.act,d=b.dataset;
  if(b.tagName==='INPUT'&&b.type==='checkbox')return;
  if(a==='win'){view.win=+d.w;render()}
  else if(a==='period'){view.period=d.v;render()}
  else if(a==='toggle'){view.open[d.v]=!view.open[d.v];render()}
  else if(a==='nwtoggle'){view.nwOpen[d.v]=view.nwOpen[d.v]===false;render()}
  else if(a==='mprev'||a==='mnext'){view.m=addMonthsK(view.m,a==='mnext'?1:-1);render()}
  else if(a==='setbal'){const v=parseFloat($('#quickBal').value);if(!isNaN(v)){applyBalance(v,todayISO(),'typed');persistAll();render()}}
  else if(a==='chkbal'){const v=parseFloat($('#chkBal').value);if(!isNaN(v)){applyBalance(v,todayISO(),'typed');persistAll();toast('Balance saved');render()}}
  else if(a==='addtx')addTx();
  else if(a==='deltx'){const dt=(TX[d.m]||[]).find(t=>t.id===d.id);if(dt)audit('Deleted transaction',`${GBP2(Math.abs(dt.a))} "${(dt.t||'').slice(0,40)}" (${dt.d})`);TX[d.m]=(TX[d.m]||[]).filter(t=>t.id!==d.id);saveTx(d.m);invalidate();persistAll();render()}
  else if(a==='merge'||a==='keepboth'){const k=view.m,row=(TX[k]||[]).find(t=>t.id===d.id);if(row){if(a==='merge'&&row.maybe){const man=(TX[k]||[]).filter(t=>row.maybe.includes(t.id));
      const best=man.sort((x,y)=>dayGap(x.d,row.d)-dayGap(y.d,row.d))[0];if(best){row.c=best.c||row.c;TX[k]=TX[k].filter(t=>t.id!==best.id)}}delete row.maybe;saveTx(k);invalidate();persistAll();render()}}
  else if(a==='note')noteTx(d.id,d.kind);
  else if(a==='addcash'){const amt=parseFloat($('#c_amt').value),date=$('#c_date').value;if(!(amt>0)||!date){toast('Add a date and an amount');return}
    (STATE.cash=STATE.cash||[]).push({id:'c_'+uid(),d:date,type:$('#c_type').value,a:amt,who:$('#c_who').value,note:$('#c_note').value.trim()});invalidate();persistAll();render()}
  else if(a==='delcash'){STATE.cash=STATE.cash.filter(e=>e.id!==d.id);persistAll();render()}
  else if(a==='setopen'){STATE.cashOpening=parseFloat($('#c_open').value)||0;STATE.cashOpenDate=todayISO();STATE.cash=[];persistAll();toast('Opening cash set to today');render()}
  else if(a==='add'){addToDraft(d.list);render()}
  else if(a==='auditcopy'){const t=AUDIT.slice().reverse().map(e=>`${e.t}\t${e.by}\t${e.act}\t${e.detail}`).join('\n')||'Nothing recorded';const o=$('#auditOut');o.style.display='block';o.value=t;o.select();try{navigator.clipboard.writeText(t);toast('Copied')}catch(err){toast('Select and copy the text below')}}
  else if(a==='tickall'){tickAllDue(d.m)}
  else if(a==='impadd'){impAdd()}
  else if(a==='impdone'){const x=(STATE.improvements||[]).find(y=>y.id===d.id);if(x){x.status=x.status==='done'?'open':'done';persistAll();render()}}
  else if(a==='impdel'){STATE.improvements=(STATE.improvements||[]).filter(y=>y.id!==d.id);persistAll();render()}
  else if(a==='impcopy'){const t=(STATE.improvements||[]).filter(x=>x.status!=='done').map(x=>`- [${x.type}${x.where?', '+x.where:''}] ${x.text} (${x.by||'someone'}, ${x.d})`).join('\n')||'Nothing open';const o=$('#impOut');o.style.display='block';o.value=t;o.select();try{navigator.clipboard.writeText(t);toast('Copied')}catch(e){toast('Select and copy the text below')}}
  else if(a==='addsug'){const s=YEARLY_SUGGEST[+d.i];draft().bills.push({id:'yearly_'+uid(),name:s.n,amount:s.a,day:s.d,month:s.m,kind:s.k,freq:'yearly',spread:!!s.spread,match:''});render()}
  else if(a==='addsub'){const v=draft().vars[+d.i];(v.subs=v.subs||[]).push({id:'s_'+uid(),name:'New sub-category'});render()}
  else if(a==='delsub'){draft().vars[+d.i].subs.splice(+d.j,1);render()}
  else if(a==='addasset'){STATE.assets.push({id:'a_'+uid(),group:'other',owner:'',name:'New asset',value:null});persistAll();render()}
  else if(a==='del'){if(d.root==='state'){STATE[d.list].splice(+d.i,1);persistAll()}else draft()[d.list].splice(+d.i,1);render()}
  else if(a==='savedraft')saveDraft();
  else if(a==='discard'){DRAFT=null;render()}
  else if(a==='trycut'){scInit();planFor(nextMonthK()).vars.forEach(v=>{if(v.kind==='want')view.scen.vars[v.id]=Math.round(v.budget*(1-view.cut/100))});go('whatif')}
  else if(a==='testdebt'){scInit();view.scen.debtSel=d.id;go('whatif')}
  else if(a==='commitask'){view.modal='commit';render()}
  else if(a==='closemodal'){view.modal=null;render()}
  else if(a==='commit')commitScenario();
  else if(a==='screset'){scInit();render()}
  else if(b.dataset.reset){const id=b.dataset.reset,base=+b.dataset.base,sc=view.scen;if(sc){if(id.startsWith('inc_'))sc.inc[id.slice(4)]=base;else if(id.startsWith('var_'))sc.vars[id.slice(4)]=base;else if(id.startsWith('xf_'))sc.xfer[id.slice(3)]=base;else if(id.startsWith('tax_'))sc.tax[id.slice(4)]=base;else sc[id]=base;render()}}
  else if(a==='snapshot'){ensureSnapshot(true);persistAll();toast('Snapshot saved');render()}
  else if(a==='backup'){$('#bk').value=JSON.stringify({VERSIONS,STATE,TX},null,1)}
  else if(a==='restore'){try{const o=JSON.parse($('#bk').value);if(o.VERSIONS&&o.STATE){VERSIONS=o.VERSIONS;STATE=Object.assign(defaultState(),o.STATE);TX=o.TX||{};Object.keys(TX).forEach(saveTx);invalidate();persistAll();toast('Restored');render()}}catch(err){toast('That is not a valid backup')}}
  else if(a==='resetall'){if(view.confirmReset){try{Object.keys(localStorage).filter(k=>k.startsWith(LSK)).forEach(k=>localStorage.removeItem(k))}catch(e){}location.reload()}else{view.confirmReset=true;b.textContent='Press again to erase';}}
});
document.addEventListener('change',async e=>{
  const el=e.target,d=el.dataset;
  if(d.r){const v=parseVal(el);if(d.r==='plan'){setPath(draft(),d.p,v);invalidate()}else{setPath(STATE,d.p,v);afterState(d.p,v);invalidate();persistAll()}updateDraftBar();softRender();return}
  if(d.cat!==undefined){sortTx(d.cat,d.m,el.value);return}
  if(el.id==='fCompare'){view.compare=el.value;render();return}
  if(el.id==='fCat'){view.cat=el.value;render();return}
  if(d.act==='tick'){toggleTick(d.kind,d.id,d.m);return}
  if(d.act==='flagexcl'){const s=new Set(STATE.flagExcl||[]);el.checked?s.add(d.v):s.delete(d.v);STATE.flagExcl=[...s];persistAll();return}
  if(el.id==='impFile'&&el.files[0]){const msg=$('#impMsg');msg.textContent='Reading…';try{const text=await el.files[0].text();const r=importText(text,$('#impSrc').value);toast('Imported');render();const m2=$('#impMsg');if(m2)m2.textContent=r}catch(err){msg.textContent='Could not read that file: '+err.message}}
});
document.addEventListener('input',e=>{
  const el=e.target,d=el.dataset;
  if(d.out){const o=document.getElementById(d.out);if(o)o.textContent=pct(+el.value);return}
  if(d.tickamt){setTickAmt(d.m,d.tickamt,parseFloat(el.value));return}
  const id=d.sl||d.sn;if(!id)return;
  if(id==='cut'){view.cut=+el.value;$('#o_cut').textContent=pct(view.cut);const w=sum(planLines().L.filter(x=>x.k==='want'),x=>x.v);$('#cutRes').innerHTML=cutResult(w);return}
  if(id==='debtAmt'){view.debtAmt=+el.value;$('#o_debtAmt').textContent=GBP(view.debtAmt);const t=$('#debtEff');if(t)t.innerHTML=debtEffectTable(debtEffects(view.debtAmt));return}
  if(!view.scen)return;const sc=view.scen;let v=el.value;
  if(d.sn){if(v==='')return;v=String(Math.max(0,+v));const r=document.getElementById(id);if(r){if(+v>+r.max)r.max=v;r.value=v}}
  else{const nb=document.getElementById('n_'+id);if(nb&&document.activeElement!==nb)nb.value=v}
  if(id==='debtSel'||id==='lumpDate'||id==='lumpFrom'||id==='from')sc[id]=v;
  else{const n=+v;if(id.startsWith('inc_'))sc.inc[id.slice(4)]=n;else if(id.startsWith('var_'))sc.vars[id.slice(4)]=n;else if(id.startsWith('xf_'))sc.xfer[id.slice(3)]=n;else if(id.startsWith('tax_'))sc.tax[id.slice(4)]=n;else sc[id]=n;
    const o=$('#o_'+id);if(o)o.textContent=id==='share'||id.startsWith('tax_')?pct(n):GBP(n);const rb=document.getElementById('r_'+id);if(rb)rb.hidden=Math.abs(n-(+rb.dataset.base))<1e-9}
  cancelAnimationFrame(view.raf);view.raf=requestAnimationFrame(()=>{const r=$('#scRes');if(r)r.innerHTML=scResults()})});
$('#themeBtn').addEventListener('click',()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=dark?'light':'dark'});
(function boot(){
  const had=loadLocal();ensureSnapshot();render();if(had)setSync('Loaded from this device','');
  connectDb().catch(()=>{})})();
