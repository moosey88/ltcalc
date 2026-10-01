/* ===== Net worth ===== */
const SEED_ASSETS=()=>[
 {id:'a_home',group:'property',owner:'',name:'Home',value:null},
 ...[1,2,3].map(i=>({id:'a_pa'+i,group:'pension',owner:'Annie',name:'Pension pot '+i,value:null})),
 ...[1,2,3].map(i=>({id:'a_ps'+i,group:'pension',owner:'Sander',name:'Pension pot '+i,value:null})),
 {id:'a_pbA',group:'savings',owner:'Annie',name:'Premium bonds, Annie',value:null},{id:'a_pbS',group:'savings',owner:'Sander',name:'Premium bonds, Sander',value:null},
 {id:'a_car',group:'vehicle',owner:'',name:"Annie's car",value:null},{id:'a_van',group:'vehicle',owner:'',name:'The van',value:null}];
function nwFigures(){
  if(!STATE.assets||!STATE.assets.length)STATE.assets=SEED_ASSETS();
  const A=STATE.assets,g=gr=>sum(A.filter(a=>a.group===gr),a=>a.value||0);
  const savPots=(STATE.general||0)+sum(Object.values(STATE.goalSaved||{}))+sum(Object.values(STATE.taxSaved||{}));
  const auto={bank:(STATE.bank||0)+sinceBalance(),cash:cashBalance(),pots:savPots};
  const home=g('property'),pens=g('pension'),sav=g('savings')+auto.bank+auto.cash+auto.pots,veh=g('vehicle')+g('other');
  const P=curPlan(),debts=P.debts.map(d=>({d,bal:STATE.debtBal[d.id]||0})),amex=amexOwedNow();
  const mort=sum(debts.filter(x=>x.d.type==='mortgage'),x=>x.bal),other=sum(debts.filter(x=>x.d.type!=='mortgage'),x=>x.bal)+amex;
  const assets=home+pens+sav+veh,liab=mort+other;
  return{auto,home,pens,sav,veh,debts,amex,mort,other,assets,liab,net:assets-liab,noPens:assets-pens-liab,reach:assets-pens-home-other,equity:home-mort}}
function ensureSnapshot(force){
  const f=nwFigures(),k=thisMonthK();STATE.nwSnaps=STATE.nwSnaps||[];const ex=STATE.nwSnaps.find(s=>s.k===k);
  if(!ex){STATE.nwSnaps.push({k,v:Math.round(f.net),a:Math.round(f.assets),l:Math.round(f.liab)});STATE.nwSnaps.sort((a,b)=>a.k<b.k?-1:1);return true}
  if(force){ex.v=Math.round(f.net);ex.a=Math.round(f.assets);ex.l=Math.round(f.liab);return true}return false}
function vNetworth(){
  const f=nwFigures(),snaps=(STATE.nwSnaps||[]).slice(),A=STATE.assets;
  const series=snaps.map(s=>({t:parseISO(s.k+'-01'),v:s.v}));
  const prev=snaps.length>1?snaps[snaps.length-2].v:null;
  const rowsFor=(gr)=>A.map((a,i)=>({a,i})).filter(x=>x.a.group===gr);
  const stale=(a,months)=>a.updated&&monthsBetween(parseISO(a.updated),Date.now())>=months;
  const arow=({a,i},indent)=>`<tr><td style="${indent?'padding-left:30px':''}">${F('state',`assets.${i}.name`,'str',a.name,'style="min-width:150px"')}</td><td class="n">${F('state',`assets.${i}.value`,'num',a.value,'style="width:110px"',true)}</td><td class="small muted">${a.updated?fdate(parseISO(a.updated))+(stale(a,a.group==='property'?12:6)?' <span class="pill warn">update?</span>':''):'not entered'}</td><td>${delBtn('state','assets',i)}</td></tr>`;
  const grp=(t)=>`<tr class="grp"><td colspan="4">${t}</td></tr>`;
  const person=o=>{const rs=A.map((a,i)=>({a,i})).filter(x=>x.a.group==='pension'&&x.a.owner===o),t=sum(rs,x=>x.a.value||0),op=view.nwOpen[o]!==false;
    return`<tr data-act="nwtoggle" data-v="${o}" style="cursor:pointer"><td><b>${op?'▾':'▸'} ${o}, ${rs.length} pots</b></td><td class="n"><b>${GBP(t)}</b></td><td></td><td></td></tr>${op?rs.map(r=>arow(r,true)).join(''):''}`};
  const chart=series.length>=2?lineChart('cnw',series.map(s=>({t:s.t,v:s.v})),{label:'Net worth over time',years:series.length>14,series:[{k:'v',c:'var(--save)',name:'Net worth'}]}):'<p class="muted">The history chart starts once there are two monthly snapshots. One is saved automatically each month, or press the button.</p>';
  return banners()+intro('What you own, minus what you owe. Debts, savings, cash and the bank fill in from the other tabs. Only things nothing else knows about (the house, pensions, vehicles, premium bonds) are typed here.')+`
  <div class="kpis"><div class="kpi"><span>Net worth</span><b>${GBP(f.net)}</b><small>${prev==null?'first snapshot':`<span class="${f.net-prev>=0?'pos':'neg'}">${f.net-prev>=0?'+':''}${GBP(f.net-prev)}</span> since last snapshot`}</small></div>
   <div class="kpi"><span>Own</span><b>${GBP(f.assets)}</b><small>assets</small></div><div class="kpi"><span>Owe</span><b>${GBP(f.liab)}</b><small>liabilities</small></div>
   <div class="kpi"><span>Without pensions</span><b>${GBP(f.noPens)}</b><small>pensions are locked away</small></div><div class="kpi"><span>Without house or pensions</span><b>${GBP(f.reach)}</b><small>what you could actually reach</small></div></div>
  <div class="grid">
   <div class="panel c8"><div class="row" style="justify-content:space-between"><h2>Net worth over time</h2><button class="btn ghost sm" data-act="snapshot">Save today's snapshot</button></div>${chart}<p class="small muted" style="margin:8px 0 0">A snapshot is saved automatically once a month from whatever is entered at the time, so the history builds itself.</p></div>
   <div class="panel c4"><h2>What to notice</h2><div class="list">
    <div class="item"><span class="l">Equity in the house<br><small class="muted">value minus mortgage</small></span><b>${f.home?GBP(f.equity):'–'}</b></div>
    <div class="item"><span class="l">Loan against the house<br><small class="muted">mortgage ÷ value</small></span><b>${f.home?pct(f.mort/f.home*100):'–'}</b></div>
    <div class="item"><span class="l">Cash and savings<br><small class="muted">bank, cash, pots, premium bonds</small></span><b>${GBP(f.sav)}</b></div>
    <div class="item"><span class="l">Loans, tax and Amex owed<br><small class="muted">everything except the mortgage</small></span><b>${GBP(f.other)}</b></div></div>
    <div class="note" style="margin-top:10px">${f.sav>=f.other?`Your cash and savings could clear every debt other than the mortgage, with ${GBP(f.sav-f.other)} to spare.`:`Your cash and savings are ${GBP(f.other-f.sav)} short of clearing every debt other than the mortgage. [Likely] That is the number to watch if you want to be debt free apart from the house.`}</div></div>
   <div class="panel c7"><h2>What you own</h2><div class="tblwrap"><table><thead><tr><th>Asset</th><th class="n">Value £</th><th>Updated</th><th></th></tr></thead><tbody>
    ${grp('Property')}${rowsFor('property').map(r=>arow(r)).join('')}
    ${grp('Pensions')}${person('Annie')}${person('Sander')}
    ${grp('Cash and savings')}<tr><td>Bank account</td><td class="n">${GBP(f.auto.bank)}</td><td class="small muted">automatic</td><td></td></tr><tr><td>Household cash</td><td class="n">${GBP(f.auto.cash)}</td><td class="small muted">automatic</td><td></td></tr><tr><td>Savings pots (goals, tax and general)</td><td class="n">${GBP(f.auto.pots)}</td><td class="small muted">automatic</td><td></td></tr>${rowsFor('savings').map(r=>arow(r)).join('')}
    ${grp('Vehicles and other')}${[...rowsFor('vehicle'),...rowsFor('other')].map(r=>arow(r)).join('')}</tbody></table></div>
    <div class="row" style="margin-top:8px"><button class="btn ghost sm" data-act="addasset">+ Add an asset</button><span class="small muted">Amber "update?" appears after 6 months, or 12 for the house. State pensions are not counted.</span></div></div>
   <div class="panel c5"><h2>What you owe</h2><div class="tblwrap"><table><thead><tr><th>Liability</th><th class="n">Owed</th></tr></thead><tbody>${f.debts.map(x=>`<tr><td>${esc(x.d.name)}</td><td class="n">${x.bal?GBP(x.bal):'<span class="muted">add on Debts</span>'}</td></tr>`).join('')}<tr><td>Amex balance</td><td class="n">${GBP(f.amex)}</td></tr><tr class="tot"><td>Total owed</td><td class="n">${GBP(f.liab)}</td></tr></tbody></table></div>
    <p class="small muted">Debts are entered once, on the Debts tab. Update a balance there and this list, the net worth and the history follow.</p>
    <div class="lbl" style="margin:12px 0 6px">What you own, by type</div><div class="split"><span style="background:var(--need);width:${f.assets?f.home/f.assets*100:0}%" title="Property"></span><span style="background:var(--debt);width:${f.assets?f.pens/f.assets*100:0}%" title="Pensions"></span><span style="background:var(--save);width:${f.assets?f.sav/f.assets*100:0}%" title="Cash and savings"></span><span style="background:var(--want);width:${f.assets?f.veh/f.assets*100:0}%" title="Vehicles"></span><span style="background:var(--surface2);flex:1"></span></div>
    <div class="legend"><span><b class="sw" style="background:var(--need)"></b>Property</span><span><b class="sw" style="background:var(--debt)"></b>Pensions</span><span><b class="sw" style="background:var(--save)"></b>Cash and savings</span><span><b class="sw" style="background:var(--want)"></b>Vehicles</span></div></div>
  </div>`}
