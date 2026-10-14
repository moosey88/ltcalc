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
const TABS=[['today','Today',vToday,'Every day'],['forecast','Forecast',vForecast,'Every day'],['daily','Day to day',vDaily,'Every day'],['cash','Cash and bank',vCash,'Every day'],
 ['where','Where it goes',vWhere,'Understand'],['patterns','Patterns',vPatterns,'Understand'],['pva','Plan vs actual',vPva,'Understand'],['whatif','What if',vWhatIf,'Understand'],['networth','Net worth',vNetworth,'Understand'],['retire','Retirement',vRetire,'Understand'],
 ['budgets','Budgets',vBudgets,'Commitments'],['debts','Debts',vDebts,'Commitments'],['goals','Goals and holidays',vGoals,'Commitments'],['tax','Tax',vTax,'Commitments'],['amex','Amex',vAmex,'Commitments'],
 ['improve','Improvements',vImprove,'Help and settings'],['guide','Guide',vGuide,'Help and settings'],['settings','Settings',vSettings,'Help and settings']];
function render(){
  const groups=[...new Set(TABS.map(t=>t[3]))];
  $('#nav').innerHTML='<div class="navg">'+groups.map(g=>`<div class="ng"><small>${g}</small><div>${TABS.filter(t=>t[3]===g).map(([k,l])=>`<button role="tab" data-tab="${k}" aria-selected="${tab===k}">${l}${k==='today'&&reviewCount()?` <span class="nbadge">${reviewCount()}</span>`:''}</button>`).join('')}</div></div>`).join('')+'</div>';
  let html;try{html=TABS.find(x=>x[0]===tab)[2]()}catch(e){console.error(e);html=`<div class="panel"><h2>Something went wrong on this tab</h2><p class="small muted">${esc(e.message)}</p></div>`}
  $('#main').innerHTML=html;try{applyTips()}catch(e){}
  if(view.modal==='commit')$('#main').insertAdjacentHTML('beforeend',commitModal())}
function go(t){tab=t;view.modal=null;render();window.scrollTo(0,0)}
function afterState(path,v){
  const m=path.match(/^debtBal\.(.+)$/);
  if(m){const id=m[1];const dn=(curPlan().debts.find(x=>x.id===id)||{}).name||id;audit('Debt balance changed',`${dn}: ${v==null?'cleared':GBP2(v)}`);if(v!=null){(STATE.debtLog[id]=STATE.debtLog[id]||[]).push({d:todayISO(),b:v});if(STATE.debtStart[id]==null)STATE.debtStart[id]=v}}
  if(path==='ru.bal'){ruInit().at=todayISO();audit('Round-up savings balance changed',v==null?'cleared':GBP2(v))}
  const a=path.match(/^assets\.(\d+)\.value$/);if(a){STATE.assets[+a[1]].updated=todayISO();audit('Asset value changed',`${STATE.assets[+a[1]].name}: ${v==null?'cleared':GBP2(v)}`)}}
function parseVal(el){const t=el.dataset.t;if(t==='bool')return el.checked;if(t==='flag')return el.value==='1';
  if(t==='num'){if(el.value==='')return el.dataset.nul?null:0;return parseFloat(el.value)}return el.value}
document.addEventListener('mousemove',e=>{const sv=e.target.closest&&e.target.closest('svg.cash'),tip=document.getElementById('scTip');if(!tip)return;
  if(!sv||!view.scTip){tip.hidden=true;const l=document.getElementById('cgl');if(l)l.style.display='none';return}
  const T=view.scTip,r=sv.getBoundingClientRect(),vx=(e.clientX-r.left)/r.width*T.W;if(vx<T.ox||vx>T.ox+T.pw){tip.hidden=true;return}
  const i=Math.max(0,Math.min(T.n-1,Math.round((vx-T.ox)/T.pw*(T.n-1)))),d=T.days[i],l=document.getElementById('cgl'),xp=T.ox+i/Math.max(1,T.n-1)*T.pw;
  if(l){l.setAttribute('x1',xp);l.setAttribute('x2',xp);l.style.display=''}
  const diff=d.x-d.p;tip.innerHTML=`<b>${fdate(d.t)}</b><br>This scenario <b class="${d.x<0?'neg':''}">${GBP2(d.x)}</b><br>Current plan ${GBP2(d.p)}${Math.abs(diff)>=0.5?`<br>Difference ${GBP2(diff)}`:''}${d.ev.length?'<hr>'+d.ev.slice(0,8).map(x=>`${esc(String(x[0]).slice(0,26))} <b>${GBP2(x[1])}</b>`).join('<br>'):''}`;
  tip.hidden=false;const cb=tip.parentElement.getBoundingClientRect(),left=e.clientX-cb.left+14;tip.style.left=Math.min(left,cb.width-190)+'px';tip.style.top=Math.max(0,e.clientY-cb.top-20)+'px'});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act],[data-tab],[data-go],[data-reset]');if(!b)return;
  if(b.dataset.tab){go(b.dataset.tab);return}
  if(b.dataset.go){go(b.dataset.go);return}
  const a=b.dataset.act,d=b.dataset;
  if(b.tagName==='INPUT'&&b.type==='checkbox')return;
  if(a==='win'){view.win=+d.w;render()}
  else if(a==='period'){view.period=d.v;render()}
  else if(a==='toggle'){view.open[d.v]=!view.open[d.v];render()}
  else if(a==='rutoggle'){view.ruOpen=!view.ruOpen;render()}
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
  else if(a==='ddchip'){const D=view.dd=view.dd||{};D.chip=d.c;if(d.c==='month')view.m=thisMonthK();if(d.c==='last'){D.chip='month';view.m=addMonthsK(thisMonthK(),-1)}render()}
  else if(a==='rownote'){view.ne=d.id;render();const i=document.getElementById('ne_in');if(i)i.focus()}
  else if(a==='rownotesave'){const i=document.getElementById('ne_in'),t=(TX[d.m]||[]).find(x=>x.id===d.id);if(t&&i){const v=i.value.trim();if(v)t.note=v;else delete t.note;audit('Note on a transaction',`${(t.t||'').slice(0,30)}: ${v||'cleared'}`);saveTx(d.m)}view.ne=null;invalidate();persistAll();render()}
  else if(a==='rvok'){const row=b.closest('.rvr'),sel=row&&row.querySelector('select'),lc=document.getElementById('rvLearn');if(approveRow(d.m,d.id,sel?sel.value:null,lc?lc.checked:true)===false)return;invalidate();persistAll();render()}
  else if(a==='fmon'){view.fm=d.m;render()}
  else if(a==='rvall'){reviewApproveAll()}
  else if(a==='retbiz'){STATE.assets.push({id:'a_'+uid(),group:'other',owner:'',name:'New business',value:null});persistAll();render()}
  else if(a==='tickall'){tickAllDue(d.m)}
  else if(a&&a.indexOf('fx_')===0){fxApply(a,d,b)}
  else if(a==='sczoom'){view.scZoom=+d.z;scPaint()}
  else if(a==='scflags'){view.scFlags=!view.scFlags;scPaint()}
  else if(a==='schide'){view.scHide=!view.scHide;scPaint()}
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
  else if(a==='discard'){DRAFT=null;DRAFTBASE=null;render()}
  else if(a==='trycut'){scInit();planFor(nextMonthK()).vars.forEach(v=>{if(v.kind==='want')view.scen.vars[v.id]=Math.round(v.budget*(1-view.cut/100))});go('whatif')}
  else if(a==='fixline'){view.fixShow=view.fixShow||{today:1,mix:1};view.fixShow[d.id]=view.fixShow[d.id]?0:1;const F=fixSetup(),el=document.getElementById('fixDyn');if(F&&el)el.innerHTML=fixDyn(F);else render()}
  else if(a==='fixload'){const F=fixSetup();if(F){view.fixV=fixPreset(F,d.id);view.fixShow=view.fixShow||{today:1,mix:1};view.fixShow.mix=1;view.fixShow[d.id.toLowerCase()]=1;render()}}
  else if(a==='fixreset'){const F=fixSetup();if(F){view.fixV=fixDefault(F);render()}}
  else if(a==='fixopen'){view.fixOpen=view.fixOpen===false;render()}
  else if(a==='cashintoggle'){view.cashIn=!view.cashIn;render()}
  else if(a==='cashinadd'){const v=parseFloat($('#ci_a').value),dt=$('#ci_d').value;if(!(v>0)||!dt){toast('Type the amount and date');return}
    const inc=(planFor(d.m).income.find(x=>x.id===d.id)||{}).name||'income';(STATE.cash=STATE.cash||[]).push({id:'c_'+uid(),d:dt,type:'in',a:v,who:'Sander',note:$('#ci_n').value.trim()||'Cash from Sander',inc:d.id});
    audit('Cash received',`${GBP2(v)} towards ${inc} on ${dt}`);invalidate();persistAll();toast('Added to your cash pot');render()}
  else if(a==='cashindel'){const e=(STATE.cash||[]).find(x=>x.id===d.id);if(e){audit('Cash received removed',`${GBP2(e.a)} on ${e.d}`);STATE.cash=STATE.cash.filter(x=>x.id!==d.id);invalidate();persistAll();render()}}
  else if(a==='ertoggle'){view.erOpen=view.erOpen||{};view.erOpen[d.id]=!view.erOpen[d.id];render()}
  else if(a==='testdebt'){scInit();view.scen.debtSel=d.id;const e=(view.er||{})[d.id];if(e){view.scen.extra=e.extra||0;view.scen.lump=e.lump||0;if(e.date)view.scen.lumpDate=e.date}go('whatif')}
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
  if(d.fx)return;
  if(d.pcat){const t=(TX[d.m]||[]).find(x=>x.id===d.pcat);if(t){const c=el.value.split(':')[0],sc=el.value.split(':')[1];audit('Re-categorised in patterns',`${GBP2(Math.abs(t.a))} "${(t.t||'').slice(0,40)}" to ${c==='_skip'?'Bill, debt or transfer':(catName({vars:allVars()},c)||c)}`);t.c=c;t.sc=sc||undefined;t.how='typed';t.why='You chose this category';delete t.rv;saveTx(d.m);invalidate();toast('Category changed');render()}return}
  if(d.er){const E=(view.er=view.er||{}),e=E[d.id]=E[d.id]||{extra:0,lump:0};e[d.er]=d.er==='date'?el.value:(parseFloat(el.value)||0);render();return}
  if(d.dd){const D=view.dd=view.dd||{chip:'month'};D[d.dd]=el.value;if(d.dd==='from'||d.dd==='to')D.chip='custom';render();return}
  if(d.r){const v=parseVal(el);if(d.r==='plan'){setPath(draft(),d.p,v);invalidate()}else{setPath(STATE,d.p,v);afterState(d.p,v);invalidate();persistAll()}updateDraftBar();if(tab==='retire'){const ae=document.activeElement,key=ae&&ae.dataset&&ae.dataset.p;render();if(key){const n=document.querySelector('[data-p="'+key+'"]');if(n)n.focus()}return}softRender();return}
  if(d.cat!==undefined){sortTx(d.cat,d.m,el.value);return}
  if(el.id==='fCompare'){view.compare=el.value;render();return}
  if(el.id==='fCat'){view.cat=el.value;render();return}
  if(d.act==='tick'){toggleTick(d.kind,d.id,d.m);return}
  if(d.act==='flagexcl'){const s=new Set(STATE.flagExcl||[]);el.checked?s.add(d.v):s.delete(d.v);STATE.flagExcl=[...s];persistAll();return}
  if(el.id==='impFile'&&el.files[0]){const msg=$('#impMsg');msg.textContent='Reading…';const out=[];try{for(const f of el.files){if(/\.pdf$/i.test(f.name)||f.type==='application/pdf'){try{out.push(await importPdfFile(f))}catch(err){out.push(f.name+': '+err.message)}}else out.push(importText(await f.text(),$('#impSrc').value))}toast('Imported');render();const m2=$('#impMsg');if(m2)m2.innerHTML=out.map(esc).join('<br>')}catch(err){msg.textContent='Could not read that file: '+err.message}}
});
document.addEventListener('input',e=>{
  const el=e.target,d=el.dataset;
  if(d.fx){fixInput(el);return}
  if(d.out){const o=document.getElementById(d.out);if(o)o.textContent=pct(+el.value);return}
  if(d.tickamt){setTickAmt(d.m,d.tickamt,parseFloat(el.value));return}
  const id=d.sl||d.sn;if(!id)return;
  if(id==='cut'){view.cut=+el.value;$('#o_cut').textContent=pct(view.cut);const w=sum(planLines().L.filter(x=>x.k==='want'),x=>x.v);$('#cutRes').innerHTML=cutResult(w);return}
  if(id==='debtAmt'){view.debtAmt=+el.value;$('#o_debtAmt').textContent=GBP(view.debtAmt);const t=$('#debtEff');if(t)t.innerHTML=debtEffectTable(debtEffects(view.debtAmt));return}
  if(id==='sweepbox'&&view.scen){view.scen.sweep=el.checked;cancelAnimationFrame(view.raf);view.raf=requestAnimationFrame(()=>{scPaint()});return}
  if(!view.scen)return;const sc=view.scen;let v=el.value;
  if(d.sn){if(v==='')return;v=String(Math.max(0,+v));const r=document.getElementById(id);if(r){if(+v>+r.max)r.max=v;r.value=v}}
  else{const nb=document.getElementById('n_'+id);if(nb&&document.activeElement!==nb)nb.value=v}
  if(id==='debtSel'||id==='lumpDate'||id==='lumpFrom'||id==='from')sc[id]=v;
  else{const n=+v;if(id.startsWith('inc_'))sc.inc[id.slice(4)]=n;else if(id.startsWith('var_'))sc.vars[id.slice(4)]=n;else if(id.startsWith('xf_'))sc.xfer[id.slice(3)]=n;else if(id.startsWith('tax_'))sc.tax[id.slice(4)]=n;else sc[id]=n;
    const o=$('#o_'+id);if(o)o.textContent=id==='share'||id.startsWith('tax_')?pct(n):GBP(n);const rb=document.getElementById('r_'+id);if(rb)rb.hidden=Math.abs(n-(+rb.dataset.base))<1e-9}
  cancelAnimationFrame(view.raf);view.raf=requestAnimationFrame(()=>{scPaint()})});
$('#themeBtn').addEventListener('click',()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=dark?'light':'dark'});
(function boot(){
  const had=loadLocal();try{splitIkea();reconcileTicks();fixWeakClass();fixAdmiral();mergeTypedCredits()}catch(e){}ensureSnapshot();render();if(had)setSync('Loaded from this device','');
  connectDb().catch(()=>{})})();
