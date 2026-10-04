/* ===== Retirement: when can we stop, and what does cash flow look like from our assets? All figures in today's money ===== */
const RET_DEF={sBorn:1988,aBorn:1978,spend:null,save:null,contrib:0,rp:3.5,rc:0.5,infl:2.5,spaS:68,spaA:67,spFull:12500,spPct:100,taxP:12,until:95,annieAge:null,swr:3.5,biz:{}};
function retParams(){
  STATE.ret=Object.assign({},RET_DEF,STATE.ret||{});const R=STATE.ret,P=curPlan(),f=nwFigures(),nk=nextMonthK();
  let nonDebt=0;for(let i=0;i<12;i++){const m=planMonth(addMonthsK(nk,i),planFor(addMonthsK(nk,i)));nonDebt+=m.bills+m.yearly+m.vars+m.xfer+m.one}
  const A=STATE.assets||[],pen=o=>sum(A.filter(a=>a.group==='pension'&&(a.owner===o||(o==='Annie'&&!a.owner))),a=>a.value||0);
  const debts=P.debts.filter(d=>(d.pay||0)>0&&(STATE.debtBal[d.id]||0)>0).map(d=>{const a=amort(STATE.debtBal[d.id],d.apr,d.pay,d.extra,0,-1);return{name:d.name,pay:(d.pay||0)+(d.extra||0),n:a&&a.n!=null?a.n:600}});
  const unpaid=P.debts.filter(d=>!(d.pay>0)&&(STATE.debtBal[d.id]||0)>0).map(d=>({name:d.name,bal:STATE.debtBal[d.id]}));
  const biz=A.filter(a=>a.group==='other'||/ltd|handyman|business/i.test(a.name)).map(a=>{const s=R.biz[a.id]||{};return{id:a.id,name:a.name,value:a.value||0,mode:s.mode||((a.value>0&&!/shares/i.test(a.name))?'sell':'ignore'),income:s.income||0,tax:s.tax!=null?s.tax:(s.mode==='income'?20:18)}});
  return{...R,spendM:R.spend!=null?R.spend:Math.round(nonDebt/12/10)*10,saveM:R.save!=null?R.save:(P.savings.monthly||0),liq0:f.sav,penA0:pen('Annie'),penS0:pen('Sander'),debts,unpaid,biz,nonDebtM:nonDebt/12,home:f.home}}
function retSim(p,Y){
  const rows=[];let liq=p.liq0,pA=p.penA0,pS=p.penS0,fail=null;const T=Math.max(1,p.sBorn+p.until-2026);
  for(let t=1;t<=T;t++){const yr=2026+t,aS=yr-p.sBorn,aA=yr-p.aBorn,df=Math.pow(1+p.infl/100,t);
    let row={yr,aS,aA,need:0,sp:0,biz:0,fromLiq:0,fromPen:0,working:yr<Y};
    if(yr<Y){liq=liq*(1+p.rc/100)+p.saveM*12;pA=pA*(1+p.rp/100)+p.contrib*12;pS=pS*(1+p.rp/100)}
    else{liq*=1+p.rc/100;pA*=1+p.rp/100;pS*=1+p.rp/100;
      if(yr===Y)p.biz.filter(b=>b.mode==='sell').forEach(b=>liq+=b.value*(1-b.tax/100));
      const debt=sum(p.debts,d=>d.pay*12*Math.min(12,Math.max(0,d.n-12*(t-1)))/12)/df;
      const need=p.spendM*12+debt,sp=(aS>=p.spaS?p.spFull*p.spPct/100:0)+(aA>=p.spaA?p.spFull*p.spPct/100:0),bz=sum(p.biz.filter(b=>b.mode==='income'),b=>b.income*(1-b.tax/100));
      let short=need-sp-bz;row.need=need;row.sp=sp;row.biz=bz;
      if(short<0)liq+=-short;else{const take=Math.min(liq,short);liq-=take;short-=take;row.fromLiq=take;
        if(short>0){const accA=aA>=57?pA:0,accS=aS>=57?pS:0,pool=accA+accS,g=Math.min(short/(1-p.taxP/100),pool);
          if(pool>0){pA-=g*accA/pool;pS-=g*accS/pool}short-=g*(1-p.taxP/100);row.fromPen=g}
        if(short>1&&!fail)fail={yr,aS,aA,short}}}
    row.liq=liq;row.pens=pA+pS;rows.push(row)}
  return{rows,ok:!fail,fail}}
function retEarliest(p){for(let Y=2027;Y<=p.aBorn+75;Y++)if(retSim(p,Y).ok)return Y;return null}
const retTweak=(p,o)=>Object.assign({},p,o);
function retChart(rows,Y){
  const W=900,H=230,ox=62,oy=10,pw=W-ox-12,ph=H-oy-30,mx=Math.max(...rows.map(r=>r.liq+r.pens),1)*1.05,st=niceStep(mx),bw=pw/rows.length;
  let g=`<svg viewBox="0 0 ${W} ${H}" class="cc">`;
  for(let v=0;v<=mx;v+=st)g+=`<line x1="${ox}" x2="${W-12}" y1="${(oy+(1-v/mx)*ph).toFixed(1)}" y2="${(oy+(1-v/mx)*ph).toFixed(1)}" class="cgrid"/><text x="${ox-6}" y="${(oy+(1-v/mx)*ph+4).toFixed(1)}" class="cax" text-anchor="end">${GBP(v)}</text>`;
  rows.forEach((r,i)=>{const x=ox+i*bw,hl=r.liq/mx*ph,hp=r.pens/mx*ph;
    g+=`<rect x="${(x+1).toFixed(1)}" y="${(oy+ph-hl).toFixed(1)}" width="${Math.max(1,bw-2).toFixed(1)}" height="${hl.toFixed(1)}" fill="var(--bank)"/><rect x="${(x+1).toFixed(1)}" y="${(oy+ph-hl-hp).toFixed(1)}" width="${Math.max(1,bw-2).toFixed(1)}" height="${hp.toFixed(1)}" fill="var(--debt)" opacity=".85"/>`;
    if(i%5===0)g+=`<text x="${(x+bw/2).toFixed(1)}" y="${H-12}" class="cax" text-anchor="middle">${r.yr}</text><text x="${(x+bw/2).toFixed(1)}" y="${H-1}" class="cax" text-anchor="middle" style="font-size:9px">${r.aS}/${r.aA}</text>`});
  const i=rows.findIndex(r=>r.yr===Y);if(i>=0){const x=ox+i*bw;g+=`<line x1="${x}" x2="${x}" y1="${oy}" y2="${oy+ph}" stroke="#c0392b" stroke-width="2" stroke-dasharray="5 4"/><text x="${x+4}" y="${oy+12}" class="clb" fill="#c0392b">Stop work</text>`}
  return g+'</svg>'}
function vRetire(){
  const p=retParams(),R=STATE.ret,early=retEarliest(p),chosenY=R.annieAge!=null?p.aBorn+R.annieAge:(early||p.aBorn+60),sim=retSim(p,chosenY),sim0=sim.rows;
  const atRet=sim0.find(r=>r.yr===chosenY),prev=sim0.find(r=>r.yr===chosenY-1)||{liq:p.liq0,pens:p.penA0+p.penS0};
  const bizV=sum(p.biz.filter(b=>b.mode!=='ignore'),b=>b.value),assetsAt=(prev.liq+prev.pens),sust=(assetsAt+sum(p.biz.filter(b=>b.mode==='sell'),b=>b.value*(1-b.tax/100)))*p.swr/100;
  const need0=p.spendM*12,lastOk=sim.ok?'Money lasts to Sander age '+p.until:'Money runs short in '+sim.fail.yr+' (Annie '+sim.fail.aA+', Sander '+sim.fail.aS+')';
  const sens=[['Save £500 a month more',retTweak(p,{saveM:p.saveM+500})],['Save £1,000 a month more',retTweak(p,{saveM:p.saveM+1000})],['Spend 10% less in retirement',retTweak(p,{spendM:p.spendM*.9})],['Spend 20% less in retirement',retTweak(p,{spendM:p.spendM*.8})],['Investments grow 1% more a year',retTweak(p,{rp:p.rp+1})],['Investments grow 1% less a year',retTweak(p,{rp:p.rp-1})],['Put £500 a month into pensions as well',retTweak(p,{contrib:p.contrib+500})]].map(([l,q])=>[l,retEarliest(q)]);
  const rowsT=sim0.filter(r=>r.yr>=chosenY&&((r.yr-chosenY)%5===0||r.yr===2026+sim0.length)).slice(0,14);
  const inp=(l,path,val,x='')=>`<label class="rinp"><span>${l}</span>${F('state','ret.'+path,'num',val,'style="width:90px"'+x)}</label>`;
  const bizRows=p.biz.map(b=>`<tr><td>${F('state',`assets.${STATE.assets.findIndex(a=>a.id===b.id)}.name`,'str',b.name,'style="min-width:150px"')}</td><td class="n">${F('state',`assets.${STATE.assets.findIndex(a=>a.id===b.id)}.value`,'num',b.value||'','style="width:100px"',true)}</td>
    <td>${SEL('state',`ret.biz.${b.id}.mode`,b.mode,[['sell','Sell when we stop work'],['income','Keep it, it pays us an income'],['ignore','Leave it out of the plan']])}</td><td class="n">${b.mode==='income'?F('state',`ret.biz.${b.id}.income`,'num',b.income||'','style="width:90px"',true):'<span class="muted">–</span>'}</td><td class="n">${b.mode==='ignore'?'<span class="muted">–</span>':F('state',`ret.biz.${b.id}.tax`,'num',b.tax,'style="width:60px"')+' %'}</td></tr>`).join('');
  return intro('When could you both stop work, and what would your money look like then? Everything is in today\'s money, so a pound in 2050 means what a pound buys today. These are projections from your own numbers, not advice. Change anything and it recalculates.')+`<div class="grid">
   <div class="kpis c12" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
    <div class="kpi"><span>Earliest we could both stop</span><b class="${early?'pos':'neg'}">${early?early:'not yet'}</b><small>${early?`Annie ${early-p.aBorn}, Sander ${early-p.sBorn}. Lasts to Sander ${p.until}.`:`Not by Annie age 75 on these numbers. See what moves it below.`}</small></div>
    <div class="kpi"><span>If we stop in</span><b>${chosenY}</b><small>Annie ${chosenY-p.aBorn}, Sander ${chosenY-p.sBorn}. ${lastOk}.</small></div>
    <div class="kpi"><span>Savings and pensions then</span><b>${GBP(assetsAt)}</b><small>Savings ${GBP(prev.liq)}, pensions ${GBP(prev.pens)}${bizV?`, plus businesses worth ${GBP(bizV)} today`:''}</small></div>
    <div class="kpi"><span>Safe yearly income from assets</span><b>${GBP(sust)}</b><small>${p.swr}% of savings, pensions and any business sale. You need ${GBP(need0)} a year plus debts.</small></div></div>
   <div class="panel c12"><h2>The assumptions <span class="muted small">change any of them</span></h2><div class="rgrid">
    <label class="rinp"><span>Annie stops work at age</span>${F('state','ret.annieAge','num',R.annieAge==null?'':R.annieAge,'style="width:80px" placeholder="'+(early?early-p.aBorn:60)+'"',true)}</label>
    ${inp('Spending in retirement, £ a month',"spend",p.spendM,' placeholder="'+Math.round(p.nonDebtM)+'"')}
    ${inp('We save, £ a month until then',"save",p.saveM)}${inp('Extra into pensions, £ a month',"contrib",p.contrib)}
    ${inp('Growth, pensions and investments, % above inflation',"rp",p.rp)}${inp('Growth, savings and bonds, % above inflation',"rc",p.rc)}${inp('Inflation %',"infl",p.infl)}
    ${inp('State pension each, £ a year (full rate)',"spFull",p.spFull)}${inp('Share of full pension %',"spPct",p.spPct)}${inp('Annie state pension age',"spaA",p.spaA)}${inp('Sander state pension age',"spaS",p.spaS)}
    ${inp('Tax on pension withdrawals, %',"taxP",p.taxP)}${inp('Plan until Sander is',"until",p.until)}${inp('Safe withdrawal %',"swr",p.swr)}</div>
    <p class="small muted" style="margin:8px 0 0">Born: Sander ${p.sBorn} (38 in Nov 2026), Annie ${p.aBorn} (49 in Apr 2027). Pensions can be taken from 57. Spending in retirement starts from your current budgets excluding debts and savings (${GBP(p.nonDebtM)} a month). Debt payments are added until each debt ends. The state pension is set at about the current full rate, so check each age and your forecast on gov.uk. Home value is not spent.${p.unpaid.length?` Not included because no payment is set: ${p.unpaid.map(u=>esc(u.name)+' '+GBP(u.bal)).join(', ')}.`:''}</p></div>
   <div class="panel c12"><h2>Your businesses <span class="muted small">count as assets here and on Net worth</span></h2>
    <div class="tblwrap"><table><thead><tr><th>Business or other asset</th><th class="n">Worth today £</th><th>What happens at retirement</th><th class="n">Pays us £ a year</th><th class="n">Tax on it</th></tr></thead><tbody>${bizRows||'<tr><td colspan="5" class="muted">No businesses added yet.</td></tr>'}</tbody></table></div>
    <div class="row" style="margin-top:8px"><button class="btn ghost sm" data-act="retbiz">Add a business</button><span class="small muted">A sale is taxed at the rate shown (18% is the usual capital gains rate for a business owner), then added to savings. A business that keeps paying you counts as income each year after you stop. Value it as what you could sell it for, not what you paid.</span></div></div>
   <div class="panel c12"><h2>What your money does, year by year</h2>${retChart(sim0,chosenY)}<div class="legend"><span><i style="border-color:var(--bank)"></i>Savings</span><span><i style="border-color:var(--debt)"></i>Pensions</span><span class="small muted">Under each year: Sander / Annie age. The red line is when work stops.</span></div></div>
   <div class="panel c7"><h2>Cash flow once we stop <span class="muted small">a year, today's money</span></h2><div class="tblwrap"><table><thead><tr><th>Year</th><th class="n">Ages</th><th class="n">We spend</th><th class="n">State pension</th><th class="n">Business</th><th class="n">From savings</th><th class="n">From pensions</th><th class="n">Left</th></tr></thead><tbody>
    ${rowsT.map(r=>`<tr><td>${r.yr}</td><td class="n">${r.aS}/${r.aA}</td><td class="n">${GBP(r.need)}</td><td class="n">${GBP(r.sp)}</td><td class="n">${r.biz?GBP(r.biz):'–'}</td><td class="n">${GBP(r.fromLiq)}</td><td class="n">${GBP(r.fromPen)}</td><td class="n b">${GBP(r.liq+r.pens)}</td></tr>`).join('')}</tbody></table></div></div>
   <div class="panel c5"><h2>What brings it forward</h2><div class="tblwrap"><table><thead><tr><th>If we…</th><th class="n">Earliest</th></tr></thead><tbody><tr class="tot"><td>As it stands</td><td class="n">${early||'not yet'}</td></tr>${sens.map(([l,y])=>`<tr><td>${l}</td><td class="n ${y&&early&&y<early?'pos':y&&early&&y>early?'neg':''}">${y||'not yet'}${y&&early&&y!==early?` <span class="small">(${y<early?'':'+'}${y-early} yr)</span>`:''}</td></tr>`).join('')}</tbody></table></div><p class="small muted" style="margin:6px 0 0">The date is the first year stopping work leaves your savings and pensions lasting to Sander ${p.until}, with spending, debts and state pensions as set above.</p></div>
  </div>`}
