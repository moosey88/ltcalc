/* ===== Day to day ===== */
const merchKey=t=>{const w=(t||'').toLowerCase().replace(/[^a-z& ]+/g,' ').split(/\s+/).filter(x=>x.length>2&&!/^(the|ltd|plc|uk|card|payment|purchase|visa)$/.test(x));return w.slice(0,2).join(' ')||'other'};
const catRule=D=>{const r=(STATE.rules||[]).find(r=>D.includes(r.k.toUpperCase()));return r?r.c:''};
const bkey=b=>(b.match||b.name.split(' ')[0]||'').toUpperCase();
function classify(desc,amount){
  const D=(desc||'').toUpperCase(),P=curPlan();
  if(amount>0)return /REFUND|RETURN/.test(D)?catRule(D)||'_inc':'_inc';
  if(/CASH WITHDRAWAL|\bATM\b|CASHPOINT|CASH MACHINE/.test(D))return'_cashout';
  if(/CASH DEPOSIT|CASH IN BRANCH/.test(D))return'_cashin';
  if(/AMERICAN EXPRESS|\bAMEX\b/.test(D))return'_amexpay';
  const r=catRule(D);if(r)return r;
  if(P.bills.some(b=>bkey(b)&&D.includes(bkey(b))))return'_skip';
  if(P.debts.some(d=>D.includes((d.match||d.name.split(' ')[0]).toUpperCase())))return'_skip';
  if(/SAVINGS|PREMIUM BOND/.test(D))return'_skip';
  return''}
function monthRecords(k){
  if(TX[k]&&TX[k].length)return{src:'app',rows:TX[k]};
  const h=normHist(k);if(h&&h.hasActual)return{src:'sheet',rows:h.lines.map((l,i)=>({id:'h'+k+i,d:k+'-01',t:l.n||'(no note)',a:-l.a,c:l.c,s:'sheet',p:'bank'}))};
  return{src:'none',rows:[]}}
function budgetsOf(k){
  const h=normHist(k);if(h&&h.hasActual){const o={};allVars().forEach(v=>o[v.id]=h.vars[v.id]?h.vars[v.id].f:0);return o}
  const P=planFor(k),o={};allVars().forEach(v=>{const x=P.vars.find(y=>y.id===v.id);o[v.id]=x?x.budget:0});return o}
function catTotalsFor(k){const rec=monthRecords(k);const by={};let unc=0;rec.rows.forEach(t=>{if(!isSpendCat(t.c))return;if(!t.c){unc+=-t.a;return}by[t.c]=(by[t.c]||0)-t.a});
  const h=normHist(k);if(rec.src==='sheet'&&h)allVars().forEach(v=>{by[v.id]=h.vars[v.id]?h.vars[v.id].a:0});return{by,unc,src:rec.src}}
function vDaily(){
  const m=view.m,rec=monthRecords(m),bud=budgetsOf(m),{by,unc,src}=catTotalsFor(m);
  const P=planFor(m),xcat=new Set((P.transfers||[]).map(x=>x.catId)),isNow=m===thisMonthK(),y=+m.slice(0,4),mo=monthOf(m)-1,n=dim(y,mo),dom=isNow?+todayISO().slice(8):n;
  const rowsV=allVars().filter(v=>src==='sheet'||!xcat.has(v.id)).filter(v=>bud[v.id]>0||by[v.id]>0);
  const totB=sum(rowsV,v=>bud[v.id]),totS=sum(rowsV,v=>by[v.id]||0)+unc;
  const dups=rec.rows.filter(t=>t.maybe&&t.maybe.length);
  return banners()+intro('Fill this in as you spend, or upload a NatWest or Amex file. Every entry is kept by month, so nothing is lost when budgets change. Earlier months come from your sheet.')+`
  <div class="grid">
   <div class="panel c12"><h2>Add spending</h2>
    <div class="entry"><label>Date<input type="date" id="e_date" value="${todayISO()}"></label><label>Amount £<input type="number" step="0.01" min="0" id="e_amt" placeholder="0.00"></label>
     <label>Category<select id="e_cat"><option value="">Choose…</option>${P.vars.filter(v=>!xcat.has(v.id)).map(v=>`<option value="${v.id}">${esc(v.name)}</option>`).join('')}<option value="_unplanned">Unplanned bill</option></select></label>
     <label>Paid with<select id="e_pay"><option value="bank">Bank card</option><option value="amex">Amex</option><option value="cash">Household cash</option></select></label>
     <label>Note<input type="text" id="e_note" placeholder="optional"></label><button class="btn" data-act="addtx">Add</button></div>
    <p class="small muted" style="margin-bottom:0">Spending is joint, so there is no "who". If you also upload the NatWest file, the matching entry is merged so nothing is counted twice.</p></div>
   ${unsortedPanel(m,false)}
   ${dups.map(t=>`<div class="panel c12" style="border-color:var(--warn);grid-column:span 12"><h3>Is this the same purchase?</h3><div class="row" style="justify-content:space-between"><span><b>On the bank file:</b> ${esc(t.t)}, ${fdate(parseISO(t.d))}, ${GBP2(t.a)}<br><b>Typed:</b> ${t.maybe.map(id=>{const x=rec.rows.find(r=>r.id===id);return x?esc(x.t||'(no note)')+', '+fdate(parseISO(x.d)):''}).join(' or ')}</span><span class="row"><button class="btn" data-act="merge" data-id="${esc(t.id)}">Same, merge them</button><button class="btn ghost" data-act="keepboth" data-id="${esc(t.id)}">Different, keep both</button></span></div></div>`).join('')}
   <div class="panel c7"><div class="row" style="justify-content:space-between"><h2>${fmonthLong(m)} against budget</h2><div class="row"><button class="btn ghost sm" data-act="mprev" aria-label="Previous month">‹</button><button class="btn ghost sm" data-act="mnext" aria-label="Next month">›</button></div></div>
    ${src==='none'?`<p class="muted">Nothing for ${fmonthLong(m)} yet.</p>`:`${src==='sheet'?'<p class="small muted" style="margin-top:0">From your sheet. Budgets are what you planned then.</p>':''}<div class="tblwrap"><table><thead><tr><th>Category</th><th class="n">Spent</th><th class="n">Budget</th><th class="n">Left</th><th>Progress</th></tr></thead><tbody>
     ${rowsV.map(v=>{const b=bud[v.id],a=by[v.id]||0,pc=b?a/b*100:0,pace=b*dom/n;return`<tr><td>${esc(v.name)} <span class="pill ${v.kind==='need'?'info':'warn'}">${KIND[v.kind||'want'][0]}</span></td><td class="n">${GBP(a)}</td><td class="n">${b?GBP(b):'none'}</td><td class="n ${a>b&&b?'neg':''}">${b?GBP(b-a):'–'}</td><td style="min-width:110px">${b?`<div class="bar"><i class="${a>b?'r':a>pace*1.1?'w':'g'}" style="width:${Math.min(100,pc)}%"></i></div>`:''}</td></tr>`}).join('')}
     ${unc>0?`<tr><td><b>Unsorted</b> <span class="pill warn">sort me</span></td><td class="n">${GBP(unc)}</td><td class="n muted">none</td><td></td><td></td></tr>`:''}
     <tr class="tot"><td>Total</td><td class="n">${GBP(totS)}</td><td class="n">${GBP(totB)}</td><td class="n ${totS>totB?'neg':''}">${GBP(totB-totS)}</td><td></td></tr></tbody></table></div>
     <p class="small muted" style="margin-bottom:0">${isNow?`Day ${dom} of ${n}: on pace you would have spent ${GBP(totB*dom/n)}. `:''}${(P.transfers||[]).length&&src!=='sheet'?`Transfers to personal accounts (${GBP(sum(P.transfers,x=>x.amount))}) are planned separately on Budgets.`:''}</p>`}</div>
   <div class="panel c5"><h2>Upload a statement</h2><div class="fileBox"><p class="small" style="margin-top:0">Export the CSV from NatWest online banking or Amex, then choose it here. The same file twice is safe.</p>
    <div class="row" style="justify-content:center"><select id="impSrc"><option value="nw">NatWest current account</option><option value="amex">Amex card</option></select><input type="file" id="impFile" accept=".csv,text/csv" style="max-width:100%"></div><p id="impMsg" class="small" style="margin-bottom:0"></p></div>
    <p class="small muted">Account numbers are ignored. NatWest's latest balance becomes today's balance, and the bank check compares it with what you had entered.</p></div>
   <div class="panel c12"><h2>Every category and what is in it</h2><p class="small ink2" style="margin-top:0">Click a category to open it. Payments are grouped by shop, with how each was paid.</p>
    ${allVars().filter(v=>(by[v.id]||0)!==0||rec.rows.some(t=>t.c===v.id)).map(v=>catAccordion(v,rec.rows.filter(t=>t.c===v.id),by[v.id]||0,bud[v.id],m,src)).join('')||'<p class="muted">Nothing here yet.</p>'}
    ${(()=>{const u=rec.rows.filter(t=>!t.c&&t.a<0);return u.length?catAccordion({id:'_unsorted',name:'Unsorted'},u,unc,0,m,src):''})()}</div>
  </div>`}
function catAccordion(v,rows,total,budget,m,src){
  const open=view.open['cat_'+v.id],spend=rows.filter(t=>t.a<0||v.id!=='_unsorted');
  const groups={};rows.forEach(t=>{const k=merchKey(t.t);(groups[k]=groups[k]||[]).push(t)});
  const inner=open?`<div class="sub"><table><thead><tr><th>Date</th><th>What</th><th>Paid with</th><th class="n">£</th>${src==='app'?'<th></th>':''}</tr></thead><tbody>
   ${Object.entries(groups).sort((a,b)=>sum(b[1],t=>-t.a)-sum(a[1],t=>-t.a)).map(([k,g])=>`<tr class="mer"><td colspan="3">${esc(k)} <span class="muted small" style="font-weight:400">· ${g.length} payment${g.length>1?'s':''}</span></td><td class="n">${GBP2(-sum(g,t=>t.a))}</td>${src==='app'?'<td></td>':''}</tr>`+g.sort((a,b)=>a.d<b.d?1:-1).map(t=>`<tr><td style="padding-left:18px">${src==='sheet'?'':fdate(parseISO(t.d))}</td><td>${esc(t.t||'')}</td><td>${t.s==='man'?(t.p==='amex'?'Amex (typed)':t.p==='cash'?'Cash':'Bank card (typed)'):t.s==='amex'?'Amex file':t.s==='nw'?'NatWest file':'Sheet'}</td><td class="n">${GBP2(-t.a)}</td>${src==='app'?`<td><span class="row">${catSelect(t.id,m,t.c)}<button class="btn danger sm" data-act="deltx" data-m="${m}" data-id="${esc(t.id)}" aria-label="Delete">✕</button></span></td>`:''}</tr>`).join('')).join('')}</tbody></table></div>`:'';
  return`<div class="cat"><div class="hd" data-act="toggle" data-v="cat_${v.id}"><span>${open?'▾':'▸'}</span><b>${esc(v.name)}</b><span class="muted small n">${rows.length} payment${rows.length===1?'':'s'}</span><b class="n">${GBP(total)}</b><span class="n muted">${budget?'of '+GBP(budget):'no budget'}</span>${budget?`<div class="bar"><i class="${total>budget?'r':'g'}" style="width:${Math.min(100,total/budget*100)}%"></i></div>`:'<span></span>'}</div>${inner}</div>`}
/* ---- adding, sorting, merging ---- */
function addTx(){
  const d=$('#e_date').value,amt=parseFloat($('#e_amt').value),c=$('#e_cat').value,p=$('#e_pay').value,note=$('#e_note').value.trim();
  if(!d||!(amt>0)||!c){toast('Add a date, an amount and a category');return}
  const k=d.slice(0,7);const id='m_'+uid();
  (TX[k]=TX[k]||[]).push({id,d,t:note,a:-amt,c:c==='_unplanned'?'':c,s:'man',p,unplanned:c==='_unplanned'||undefined});
  if(c==='_unplanned'){STATE.notes[id]={kind:'oneoff',text:note||'Unplanned bill'}}
  view.m=k;saveTx(k);invalidate();persistAll();toast('Added');render()}
function sortTx(id,k,c){
  const t=(TX[k]||[]).find(x=>x.id===id);if(!t)return;t.c=c;
  const kw=merchKey(t.t).toUpperCase();
  if(c&&kw&&kw!=='OTHER'&&t.s!=='man'){if(!STATE.rules.find(r=>r.k===kw))STATE.rules.push({k:kw,c});
    TX[k].forEach(x=>{if(!x.c&&x.s!=='man'&&x.a<0&&(x.t||'').toUpperCase().includes(kw))x.c=c})}
  saveTx(k);invalidate();persistAll();render()}
/* ---- importing a file ---- */
function parseCSV(text){const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
    else if(c==='"')q=true;else if(c===','){row.push(cur);cur=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x.trim()))rows.push(row);row=[]}else cur+=c}
  if(cur||row.length){row.push(cur);if(row.some(x=>x.trim()))rows.push(row)}return rows}
function toISO(s){s=(s||'').trim().replace(/^'/,'');let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);if(m){let y=+m[3];if(y<100)y+=2000;return y+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0')}
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[0];m=s.match(/^(\d{1,2}) (\w{3})\w* (\d{4})$/);if(m){const mo=MON.findIndex(x=>x.toLowerCase()===m[2].toLowerCase());if(mo>=0)return m[3]+'-'+String(mo+1).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0')}return null}
const num=s=>{const v=parseFloat(String(s).replace(/[£,\s]/g,''));return isNaN(v)?null:v};
const dayGap=(a,b)=>Math.abs(parseISO(a)-parseISO(b))/DAY;
function importText(text,src){
  const rows=parseCSV(text);if(rows.length<2)return'That file has no rows.';
  const H=rows[0].map(h=>h.trim().toLowerCase()),iD=H.findIndex(h=>h.includes('date')),iDesc=H.findIndex(h=>h==='description'||h.includes('descr')),iV=H.findIndex(h=>h==='value'||h==='amount'),iB=H.findIndex(h=>h==='balance');
  if(iD<0||iDesc<0||iV<0)return'Could not find Date, Description and Value or Amount columns. Is this a NatWest or Amex CSV?';
  const parsed=[];rows.slice(1).forEach(r=>{const d=toISO(r[iD]||'');let a=num(r[iV]);if(!d||a==null)return;if(src==='amex')a=-a;parsed.push({d,t:(r[iDesc]||'').trim().replace(/\s+/g,' '),a,b:iB>=0?num(r[iB]):null})});
  if(!parsed.length)return'No valid rows found.';
  const seen={};parsed.forEach(x=>{const key=x.d+'|'+x.t+'|'+x.a+'|'+x.b;seen[key]=(seen[key]||0)+1;x.id=src+'_'+key+'#'+seen[key]});
  let added=0,skipped=0,merged=0,asked=0;const pay=src==='amex'?'amex':'bank';
  const have=new Set(Object.values(TX).flat().filter(t=>t.s===src).map(t=>t.id));
  parsed.forEach(x=>{if(have.has(x.id)){skipped++;return}
    const k=x.d.slice(0,7),arr=TX[k]=TX[k]||[];let c=classify(x.t,x.a);
    const cands=x.a<0?arr.filter(t=>t.s==='man'&&t.p===pay&&!t.m&&Math.abs(t.a-x.a)<0.005&&dayGap(t.d,x.d)<=3):[];
    let row={id:x.id,d:x.d,t:x.t,a:x.a,b:x.b,c,s:src,p:pay};
    if(cands.length===1){const mt=cands[0];row.c=mt.c||c;row.note=mt.t;arr.splice(arr.indexOf(mt),1);merged++}
    else if(cands.length>1){row.maybe=cands.map(t=>t.id);asked++}
    arr.push(row);added++;
    if(c==='_cashout'||c==='_cashin'){const typ=c==='_cashout'?'out':'deposit',amt=Math.abs(x.a);
      if(!(STATE.cash||[]).some(e=>e.type===typ&&Math.abs(e.a-amt)<0.005&&dayGap(e.d,x.d)<=3))(STATE.cash=STATE.cash||[]).push({id:'c_'+uid(),d:x.d,type:typ,a:amt,who:'',note:'From the bank file',auto:true})}});
  Object.keys(parsed.reduce((o,x)=>(o[x.d.slice(0,7)]=1,o),{})).forEach(k=>saveTx(k));
  let msg=`Added ${added} new lines (${merged} matched to entries you typed, ${skipped} already there${asked?`, ${asked} need your say-so`:''}).`;
  if(src==='nw'){const wb=parsed.filter(x=>x.b!=null);
    if(wb.length){const asc=wb[0].d<wb[wb.length-1].d,ld=wb.map(x=>x.d).sort().pop(),same=wb.filter(x=>x.d===ld),lastRow=asc?same[same.length-1]:same[0];
      if(!STATE.asOf||ld>=STATE.asOf){applyBalance(lastRow.b,ld,'file');msg+=` Balance set to ${GBP2(lastRow.b)} as of ${fdate(parseISO(ld))}.`}}}
  invalidate();persistAll();return msg}
