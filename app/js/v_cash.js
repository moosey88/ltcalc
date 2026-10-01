/* ===== Cash and bank ===== */
function cashEvents(){
  const ev=[...(STATE.cash||[]).map(e=>({d:e.d,type:e.type,a:e.type==='deposit'?-e.a:e.a,who:e.who,note:e.note,id:e.id,led:true}))];
  Object.values(TX).flat().forEach(t=>{if(t.p==='cash'&&t.a<0&&t.d>=(STATE.cashOpenDate||'0'))ev.push({d:t.d,type:'spent',a:t.a,note:t.t,cat:t.c,id:t.id})});
  return ev.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0)}
function vCash(){
  const bal=cashBalance(),bank=STATE.bank,lc=liveCheck();
  const typed=Object.values(TX).flat().filter(t=>t.s==='man'&&t.p==='bank'&&t.d>(STATE.asOf||'0')&&t.a<0);
  const est=bank==null?null:bank+sum(typed,t=>t.a);
  let run=STATE.cashOpening||0;const evs=cashEvents().map(e=>{run+=e.a;return{...e,run}});
  const TYPE={in:['Cash came in','in'],out:['Taken out of bank','mv'],deposit:['Paid into bank','mv'],spent:['Cash spent','out']};
  return banners()+intro('Cash and the bank, side by side. A transfer between them changes each balance but not your total. Check the bank whenever you like: type the balance from your banking app, or upload a file.')+`
  <div class="kpis"><div class="kpi"><span>Bank (last known)</span><b>${bank==null?'–':GBP(bank)}</b><small>${bank==null?'add a balance':'as of '+fdate(parseISO(STATE.asOf))}</small></div>
   <div class="kpi"><span>Bank we expect today</span><b>${est==null?'–':GBP(est)}</b><small>last balance, plus ${typed.length} typed bank entr${typed.length===1?'y':'ies'} since</small></div>
   <div class="kpi" ${lc&&Math.abs(lc.diff)>=1?'style="border-color:var(--warn)"':''}><span>Last bank check</span><b class="${lc&&Math.abs(lc.diff)>=1?'warnc':''}">${lc?(Math.abs(lc.diff)<1?'Matches':GBP(lc.diff)):'–'}</b><small>${lc?(Math.abs(lc.diff)<1?'adds up':'not explained')+', '+fdate(parseISO(lc.d)):'no check yet'}</small></div>
   <div class="kpi"><span>Household cash</span><b>${GBP(bal)}</b><small>shared cash pot</small></div>
   <div class="kpi"><span>Total money</span><b>${GBP((bank||0)+bal)}</b><small>bank plus cash</small></div></div>
  <div class="grid">
   <div class="panel c5"><h2>Check the bank</h2>
    <p class="small ink2" style="margin-top:0">Type today's balance from your banking app. The app compares it with what your entries say it should be, and the difference is what you haven't entered.</p>
    <div class="row"><input type="number" step="0.01" id="chkBal" placeholder="Balance £" style="width:140px"><button class="btn" data-act="chkbal">Check</button></div>
    ${lc?`<div class="note" style="margin-top:12px">${lc.src==='file'?'File balance':'You typed'} ${GBP2(lc.est+lc.diff)} on ${fdate(parseISO(lc.d))}. Your entries expected ${GBP2(lc.est)}. <b class="${Math.abs(lc.diff)<1?'pos':'warnc'}">${Math.abs(lc.diff)<1?'It matches.':'Difference: '+GBP2(lc.diff)+'.'}</b> ${Math.abs(lc.diff)>=1?'A negative difference means more left the bank than you have written down: check for unsorted payments, a cash withdrawal not logged, or a bill that came out early.':''}</div>`:''}
    <div class="lbl" style="margin:14px 0 4px">Waiting for the bank</div>${typed.length?`<div class="list">${typed.slice(-6).map(t=>`<div class="item"><span class="l">${esc(t.t||'(no note)')}<br><small class="muted">${fdate(parseISO(t.d))}</small></span><b>${GBP2(t.a)}</b></div>`).join('')}</div>`:'<p class="small muted">Nothing typed since the last balance.</p>'}</div>
   <div class="panel c7"><h2>Household cash</h2>
    <div class="entry" style="margin-bottom:6px"><label>Date<input type="date" id="c_date" value="${todayISO()}"></label>
     <label>What happened<select id="c_type"><option value="in">Cash came in</option><option value="out">Taken out of bank</option><option value="deposit">Paid into bank</option></select></label>
     <label>Amount £<input type="number" step="0.01" id="c_amt"></label><label>Who<select id="c_who"><option>Annie</option><option>Sander</option></select></label>
     <label>What for<input type="text" id="c_note" placeholder="e.g. garden job"></label><button class="btn" data-act="addcash">Add</button></div>
    <p class="small muted" style="margin:0 0 10px">Cash you spend is entered on Day to day with "Household cash". Cash withdrawals and deposits on a NatWest file are logged here automatically.</p>
    <div class="tblwrap"><table><thead><tr><th>Date</th><th>What happened</th><th>Who</th><th>What for</th><th class="n">£</th><th class="n">Cash after</th><th></th></tr></thead><tbody>
     <tr><td colspan="5" class="muted">Opening cash${STATE.cashOpenDate?', '+fdate(parseISO(STATE.cashOpenDate)):''}</td><td class="n">${GBP2(STATE.cashOpening||0)}</td><td></td></tr>
     ${evs.slice(-40).map(e=>`<tr><td>${fdate(parseISO(e.d))}</td><td><span class="chip ${TYPE[e.type][1]}">${TYPE[e.type][0]}</span></td><td>${esc(e.who||'')}</td><td>${esc(e.note||'')}</td><td class="n ${e.a>=0?'pos':'neg'}">${e.a>=0?'+':''}${GBP2(e.a)}</td><td class="n">${GBP2(e.run)}</td><td>${e.led?`<button class="btn danger sm" data-act="delcash" data-id="${esc(e.id)}" aria-label="Remove">✕</button>`:''}</td></tr>`).join('')}</tbody></table></div>
    <div class="row" style="margin-top:10px"><label class="small">Cash in the pot now £ <input type="number" step="0.01" id="c_open" value="${STATE.cashOpening||0}" style="width:100px"></label><button class="btn ghost sm" data-act="setopen">Set opening cash to today</button></div></div>
  </div>`}
