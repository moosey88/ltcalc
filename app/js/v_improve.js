/* ===== Improvements: anyone can note what is not working or what would help ===== */
const IMP_TYPES=[['wrong','Something is wrong'],['data','A number or category looks wrong'],['idea','An idea or missing feature'],['confusing','I do not understand this']];
function vImprove(){
  const L=STATE.improvements=STATE.improvements||[],open=L.filter(x=>x.status!=='done'),done=L.filter(x=>x.status==='done'),who=ME.name||STATE.impName||'';
  const row=x=>`<div class="item" style="align-items:flex-start"><span><span class="pill ${x.type==='wrong'?'bad':x.type==='data'?'warn':'info'}">${esc((IMP_TYPES.find(t=>t[0]===x.type)||[0,'Note'])[1])}</span>${x.where?` <span class="pill info">${esc(x.where)}</span>`:''} ${esc(x.text)}<br><span class="small muted">${esc(x.by||'Someone')}, ${fdate(parseISO(x.d))}</span></span><span class="row"><button class="btn ghost sm" data-act="impdone" data-id="${x.id}">${x.status==='done'?'Reopen':'Done'}</button><button class="btn danger sm" data-act="impdel" data-id="${x.id}" aria-label="Delete">✕</button></span></div>`;
  return intro('A shared list of what is not working, what looks wrong, or what you wish it did. Anyone can add to it. Nothing here changes your data.')+`<div class="grid">
   <div class="panel c12"><h2>Add a note</h2><div class="entry">
    <label>What kind<select id="imp_type">${IMP_TYPES.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join('')}</select></label>
    <label>Which tab<select id="imp_where"><option value="">Not sure</option>${TABS.map(t=>`<option>${t[1]}</option>`).join('')}</select></label>
    <label>Your name<input type="text" id="imp_by" value="${esc(who)}" placeholder="Annie or Sander"></label>
    <label style="flex:2 1 320px">What happened or what would help<input type="text" id="imp_text" placeholder="For example: the Amex total on Today looks too high"></label>
    <button class="btn" data-act="impadd">Add</button></div></div>
   <div class="panel c12"><div class="row" style="justify-content:space-between"><h2>Open <span class="muted small">${open.length}</span></h2><button class="btn ghost sm" data-act="impcopy">Copy the open list</button></div>
    ${open.length?`<div class="list">${open.slice().reverse().map(row).join('')}</div>`:'<p class="muted small">Nothing open. Add a note above when something is not right.</p>'}
    <textarea id="impOut" rows="5" style="width:100%;margin-top:8px;display:none" readonly></textarea></div>
   ${done.length?`<div class="panel c12"><h2>Done <span class="muted small">${done.length}</span></h2><div class="list">${done.slice().reverse().map(row).join('')}</div></div>`:''}</div>`}
function impAdd(){
  const text=($('#imp_text').value||'').trim();if(!text){toast('Write what happened first');return}
  const by=($('#imp_by').value||'').trim();STATE.impName=by;
  (STATE.improvements=STATE.improvements||[]).push({id:uid(),d:todayISO(),by,type:$('#imp_type').value,where:$('#imp_where').value,text,status:'open'});
  persistAll();toast('Added');render()}
