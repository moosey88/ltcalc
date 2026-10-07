/* ===== Day to day ===== */
const merchKey=t=>{const w=(t||'').toLowerCase().replace(/[^a-z& ]+/g,' ').split(/\s+/).filter(x=>x.length>2&&!/^(the|ltd|plc|uk|card|payment|purchase|visa)$/.test(x));return w.slice(0,2).join(' ')||'other'};
const ruleOf=D=>(STATE.rules||[]).find(r=>D.includes(r.k.toUpperCase()));
const catRule=D=>{const r=ruleOf(D);return r?r.c:''};
const bkey=b=>(b.match||b.name.replace(/\(.*?\)/g,'').trim()||'').toUpperCase();
/* bank-specific knowledge: who pays in, which transfers are movements between your own accounts, which payments are debts */
function bankClass(D,amount){
  if(/PAYMENT RECEIVED|THANK YOU/.test(D))return{c:'_amexpay'};
  if(/ADMIRAL MOTO/.test(D))return{c:'v_kids'};
  if(amount>0){
    if(/(NIAMH|ERIN).*(INSUR)|CAR INSUR/.test(D))return{c:'v_kids'};
    if(/APEX BUSINESS COMP/.test(D)&&Math.abs(amount-479.16)<0.01)return{c:'_inc',sc:'i_dirloan'};
    if(/APEX BUSINESS COMP/.test(D))return{c:'_inc',sc:'i_annie'};
    if(/FROM A\/C 67511279/.test(D))return{c:'_inc',sc:'i_sander'};
    if(/NIAMH.*PHONE/.test(D))return{c:'_inc',sc:'i_niamh'};
    if(/FROM A\/C (67716245|67652417)|NSPB|NS&I/.test(D))return{c:'_skip'};
    if(/OROURKE|NIAMH|ERIN/.test(D))return{c:'_inc',sc:'i_other'};
    return null}
  if(/AMERICAN EXP|AMEX PAY/.test(D))return{c:'_amexpay'};
  if(/TO A\/C 67511279/.test(D))return{c:'v_scash'};
  if(/TO A\/C (67716245|67652417|24818771)/.test(D))return{c:'_skip'};
  if(/SANDER ELAND LAST/.test(D))return{c:'v_scash'};
  if(/ANNIE FIRST|ANNIE STARLING|ANNALISA|ANNIE NEW|D STARLING/.test(D))return{c:Math.abs(amount)>=3000?'_skip':'v_acash'};
  if(/NS&I|PREMIUM BOND|ROUND UP TO 6245/.test(D))return/ROUND UP/.test(D)?{c:'v_round'}:{c:'_skip'};
  if(/HALIFAX|MBNA|HMRC|LLOYDS STANDARD|LLOYDS BANK|VIRGIN MONEY|IKANO|NOVUNA|BARCLAYCARD|B CARD|B\/CARD|V12 RETAIL FINANCE/.test(D))return{c:'_skip'};
  if(/ZURICH|ANIMAL FRIENDS|ADMIRAL|EE LIMITED|DAVID LLOYD|EDF ENERGY|TV LICENCE/.test(D))return{c:'_skip'};
  if(/KLARNA.*(TICKET|TICK ET)/.test(D))return{c:'v_ent'};
  if(/AIRBNB/.test(D))return{c:'v_hol'};
  if(/PARENTPAY|ERIN OROURKE|NIAMH CASH/.test(D))return{c:'v_kids'};
  return null}
/* shops, venues and people, in the order they should win; only used when nothing more specific has matched */
const MERCH_RULES=[
 [/BARCELONA|BOSTON US|LYNTON|LYNMOUTH|GLASTONBURY|SWANAGE|WAREHAM|LULWORTH|SOUTHWOLD|LLANRWST|ABERCONWY|SANDBANKS|\bSTN AIRPORT|STANSTED|CAER RHUN|DUTY FREE/,'v_hol'],
 [/CATHCART (AND|&) WINN|PET DRUGS|PET LUV|PETS AT HOME|VETS|LISA MEDLER/,'v_pets'],
 [/YOLANDA|OSTEO|ANKHWAY|BARBER|MASSAGE|PHARMAC|CHEMIST|HOLLAND AND BARRETT|SUPERDRUG|SAUNA|BEAUTY|COSMETICS|NHS BUSINESS|HEATH END/,'v_well'],
 [/NIRVANA|LOUISE[- ]CARR|THEATRE|TICKETMASTER|SKIDDLE|SNOOKER|FUNWORLD|ZIPWORLD|WATTS GALLERY|NATIONAL TRUST|PRIME VIDEO|APPLE\.COM\/BILL|NIAMH TICKETS/,'v_ent'],
 [/SOTON|UCAS|GRAD PHOTO|\b(ERIN|NIAMH)\b.*(VIA MOBILE|CASH|FARE|BOOKS|WAGES|SHOPPING)|B HUGHES BERNADETT|NIAMH UNI/,'v_kids'],
 [/TANIA OLDREIVE|IRONING|GREG WINDOW|LAWN CARE|GARDEN CEN|GARDEN CENTRE|ROBERT DYAS|B & Q|SQUIRE/,'v_home'],
 [/KWIK FIT|AD CAR CARE|DVSA|RINGGO|RINGO|APCOA|JUSTPARK|CAR PARK|TFL|SWRAILWAY|LIME\*|POD POINT|HAMPSHIRE HOSPITALS|FERRY/,'v_car'],
 [/ENTERPRISE FUND|HOME HELP HEROES|MORGAN STANLEY|URGENT TR/,'_skip'],
 [/LOCAL TREASURES|JACK MCGOVERN/,'v_home'],
 [/BAYER CAR|CHOICE AUTO/,'v_car'],
 [/EVERYON ?E ?ACTIVE/,'_skip'],
 [/SOUTHAMPTON UNIVERSITY|NIAMH O ROURKE/,'v_kids'],
 [/DAYLEWIS/,'v_well'],
 [/GATWICK|\bNCP\b|PAYBYPHONE|RUSHMOOR BOROUGH|NORTH HANTS &|BASINGSTOKE AND NORTH/,'v_car'],
 [/TRIP\.COM|HOORA|BOTEL LOOE/,'v_hol'],
 [/MODERN MILKMAN|CO OP GROUP|FARNHAM FOOD WINE|BUDGENS|COSTCUTTER|LONDIS|NISA|FOODSTORE|W M MORRISON|MCALLISTERS|COOP LATITUDE|BON PREU|SF CONNECT|FARNHAM CONNECT/,'v_shop','topup'],
 [/KEBAB|CHIPS|FISH|PLAIC|PAPAJOHN|BURGER KING|MC ?DONALD|TAKEAWAY|SNACK VAN|ICE CREAM|SCOOPIES|KIOSK|CORNISH BAKERY|DELI|CURRY|OMC ALDERSHOT|LOAF/,'v_take'],
 [/RESTAURANT|RESTA\b|LOUNGE|MILLER &|TANDOORI|WAGAMAMA|ZIZZI|PIZZA|DOJO|ZETTLE|SUMUP|\bSQ \*|SQ [A-Z]|CAFE|COFFEE|\bPUB\b|\bINN\b|ARMS|BELLS?\b|MITRE|BARLEY MOW|FORESTERS|OATSHEAF|OLD BELL|CROSS KEYS|RAILWAY|GREENHOUSE|DINING|GIGI|HUNDRED MONKEYS|FABLES|CLINTONS|WILDWOOD|IVY HOUSE|WETHERSPOON|MESON|MOJITO|HOTSQUASH|CONTEMPEE|BALLERZ|THE GORGE|HASKINS|MOWLEM|STARBUCKS|COSTA|NANDO/,'v_rest'],
 [/T J MORRIS|UA UK|OFFICE |SPORTSDIRECT|SPORTS DIRECT|SPOTS|NEW LOOK|H & M|\bHM \w|DUNE|TK ?MAXX|T K MAXX|PANDORA|CREW CLOTHING|NEW BALANCE|CASTORE|DECATHLON|C&A|OLIVER BONAS|J D SPORTS|JD SPORTS|ANGEL BOUTIQUE|MARKS&SPENCER|\bM&S|LULUOM|SERRY|TOMS TRUNKS|PURDY|WEDDING SHOP|CARD FACTORY|WH SMITH|KLARNA|OPTIC KLEER|BERKELEY SPORTS|HOBBYCRAFT|COFFE MACHINE|COFFEE MACHINE|TIMPSON|PULLINGERS|TECH FOG|EMPOWERED/,'v_gen'],
 [/INTEREST CHARGE|INTEREST \w+ A\/C|MEMBERSHIP FEE|MICROSOFT|RING (BASIC|SOLO) PLAN|WISE PLAN|SYMBIOS/,'v_other']];
function merchClass(D){for(const r of MERCH_RULES)if(r[0].test(D))return r[2]?{c:r[1],sc:r[2]}:{c:r[1]};return null}
/* a refund goes back to the category the shop was last paid from */
function refundCat(D){const key=merchKey(D.replace(/REFUND|RETURN|REVERSAL|CREDIT|VOUCHER|CHARGEBACK/g,' ')).toUpperCase();if(!key||key==='OTHER')return null;
  const hit=Object.values(TX).flat().filter(t=>t.a<0&&t.c&&isSpendCat(t.c)&&(t.t||'').toUpperCase().includes(key)).sort((x,y)=>x.d<y.d?1:-1)[0];
  if(hit)return{c:hit.c,sc:hit.sc};const r=ruleOf(D.replace(/REFUND|RETURN|REVERSAL/g,''));return r?{c:r.c,sc:r.s}:null}
function classifyWhy(desc,amount){
  const D=(desc||'').toUpperCase(),P=curPlan();
  const bk=bankClass(D,amount);
  if(bk){let why='Known payee';if(bk.c==='_inc'&&bk.sc){const i=P.income.find(x=>x.id===bk.sc);why='Matches your income'+(i?': '+i.name.trim():'')}else if(bk.c==='_amexpay')why='Amex payment';else if(bk.c==='v_acash'||bk.c==='v_scash'){const x=(P.transfers||[]).find(t=>t.catId===bk.c);why='Spending money transfer';if(x&&Math.abs(Math.abs(amount)-x.amount)>1)return{...bk,how:'check',why:'Not the usual '+GBP(x.amount)+'. An extra, or a mistake?'}}else if(bk.c==='v_round')why='Round-up to savings';else if(bk.c==='_skip'){why='Known bill, debt or transfer';if(/IKANO/.test(D)&&!P.debts.some(x=>/IKEA|IKANO/i.test(x.name+x.match)&&x.pay>0))return{...bk,how:'check',why:'Looks like your Ikea loan, but no payment is set on it. Add one on Debts?'}}return{...bk,how:'known',why}}
  if(amount>0){if(/REFUND|RETURN|REVERSAL|CREDIT VOUCHER|CHARGEBACK/.test(D)&&!/APEX|SALARY|WAGES/.test(D)){const r=refundCat(D);return{...(r||{c:''}),how:'refund',why:r?'Looks like a refund to a shop you pay':'Looks like a refund, but no matching shop found'}}
    const r=refundCat(D);if(r)return{...r,how:'refund',why:'Money in from a shop you pay: refund, not income?'};
    return{c:'_inc',how:'in',why:'Money in from an unfamiliar payer. Income?'}}
  if(/CASH WITHDRAWAL|\bATM\b|CASHPOINT|CASH MACHINE/.test(D))return{c:'_cashout',how:'known',why:'Cash withdrawal'};
  if(/CASH DEPOSIT|CASH IN BRANCH/.test(D))return{c:'_cashin',how:'known',why:'Cash paid in'};
  if(/AMERICAN EXPRESS|\bAMEX\b/.test(D))return{c:'_amexpay',how:'known',why:'Amex payment'};
  const r=ruleOf(D);if(r)return{c:r.c,sc:r.s,how:'rule',why:'Your rule: '+r.k.toLowerCase()};
  if(/\b(SHELL|BP|ESSO|TEXACO|JET)\b/.test(D)&&/\bCD\b|CARD/.test(D)&&!/COFFEE|CAFE|DELI/.test(D))return{c:'_skip',how:'builtin',why:'Fuel station: left out of the household budget. Change it if this was food or coffee.'};
  const bl=P.bills.find(b=>bkey(b)&&keyHit(D,bkey(b)));if(bl)return{c:'_skip',how:'bill',why:'Matches your bill: '+bl.name.replace(/\(.*?\)/g,'').trim()};
  const db=P.debts.find(x=>keyHit(D,(x.match||x.name.split(' ')[0])));if(db)return{c:'_skip',how:'bill',why:'Matches your debt: '+db.name};
  if(/SAVINGS|PREMIUM BOND/.test(D))return{c:'_skip',how:'known',why:'Savings transfer'};
  const m=merchClass(D);if(m)return{...m,how:'builtin',why:'Built-in guess from the name'};
  return{c:'',how:'none',why:'Not seen before'}}
function classifyFull(desc,amount){const r=classifyWhy(desc,amount);return r.sc!==undefined?{c:r.c,sc:r.sc}:{c:r.c}}
function classify(desc,amount){return classifyFull(desc,amount).c}
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
  const entShop=sum(rec.rows.filter(t=>t.c==='v_shop'&&t.sc==='entertain'),t=>-t.a);
  const dups=rec.rows.filter(t=>t.maybe&&t.maybe.length);
  return banners()+intro('Fill this in as you spend. Upload bank and Amex files on the Today tab. Every entry is kept by month, so nothing is lost when budgets change. Earlier months come from your sheet.')+`
  <div class="grid">
   <div class="panel c12"><h2>Add spending</h2>
    <div class="entry"><label>Date<input type="date" id="e_date" value="${todayISO()}"></label><label>Amount £<input type="number" step="0.01" min="0" id="e_amt" placeholder="0.00"></label>
     <label>Type<select id="e_type"><option value="spend">Spending</option><option value="refund">Refund (money back)</option></select></label><label>Category<select id="e_cat"><option value="">Choose…</option>${catOptions('','',activeVars().filter(v=>!xcat.has(v.id)))}<option value="_unplanned">Unplanned bill</option></select></label>
     <label>Paid with<select id="e_pay"><option value="bank">Bank card</option><option value="amex">Amex</option><option value="cash">Household cash</option></select></label>
     <label>Note<input type="text" id="e_note" placeholder="optional"></label><button class="btn" data-act="addtx">Add</button></div>
    <p class="small muted" style="margin-bottom:0">Choose Refund when a shop pays money back: it comes into the bank and reduces that category's spending, and is not counted as income. Spending is joint, so there is no "who". If you also upload the NatWest file, the matching entry is merged so nothing is counted twice.</p></div>
   ${unsortedPanel(m,false)}
   ${dups.map(t=>`<div class="panel c12" style="border-color:var(--warn);grid-column:span 12"><h3>Is this the same purchase?</h3><div class="row" style="justify-content:space-between"><span><b>On the bank file:</b> ${esc(t.t)}, ${fdate(parseISO(t.d))}, ${GBP2(t.a)}<br><b>Typed:</b> ${t.maybe.map(id=>{const x=rec.rows.find(r=>r.id===id);return x?esc(x.t||'(no note)')+', '+fdate(parseISO(x.d)):''}).join(' or ')}</span><span class="row"><button class="btn" data-act="merge" data-id="${esc(t.id)}">Same, merge them</button><button class="btn ghost" data-act="keepboth" data-id="${esc(t.id)}">Different, keep both</button></span></div></div>`).join('')}
   ${ledgerBlock(m,rec,rowsV,bud,by,unc,totB,totS,src,isNow,dom,n,P)}
   ${collapsePanel('ticks','Tick off '+fmonthLong(m)+' (all items)',tickPanel(m),'money in, bills, debts and transfers')}
   ${collapsePanel('incomein','Money in, '+fmonthLong(m),incomePanel(m,P,src).replace('class="panel c12"','class="inner"'),'expected against what arrived')}
   <div class="panel c12"><div class="row" style="justify-content:space-between"><h2>Every category and what is in it</h2><button class="btn ghost sm" data-act="toggle" data-v="cats">${view.open.cats?'Hide':'Show'}</button></div>${view.open.cats?`<p class="small ink2" style="margin-top:0">Click a category to open it. Payments are grouped by shop, with how each was paid.</p>
    ${allVars().filter(v=>(by[v.id]||0)!==0||rec.rows.some(t=>t.c===v.id)||(v.id==='v_ent'&&entShop>0)).map(v=>catAccordion(v.id==='v_ent'&&entShop>0?{...v,note:`Also ${GBP2(entShop)} of entertaining food shops, counted under Shopping › Entertaining so the grocery budget is honest. Not added again here.`}:v,rec.rows.filter(t=>t.c===v.id),by[v.id]||0,bud[v.id],m,src)).join('')||'<p class="muted">Nothing here yet.</p>'}
    ${(()=>{const u=rec.rows.filter(t=>!t.c&&t.a<0);return u.length?catAccordion({id:'_unsorted',name:'Unsorted'},u,unc,0,m,src):''})()}`:''}</div>
  </div>`}

const collapsePanel=(key,title,inner,sub)=>`<div class="panel c12"><div class="row" style="justify-content:space-between"><h2>${esc(title)} <span class="muted small">${esc(sub||'')}</span></h2><button class="btn ghost sm" data-act="toggle" data-v="${key}">${view.open[key]?'Hide':'Show'}</button></div>${view.open[key]?inner:''}</div>`;
const catLabel=t=>t.c==='_inc'?'Money in':t.c==='_skip'?'Bill or transfer':t.c==='_amexpay'?'Amex payment':t.c==='_cashout'?'Cash':t.c?((allVars().find(v=>v.id===t.c)||{}).name||'Other'):'Unsorted';
function ledgerBlock(m,rec,rowsV,bud,by,unc,totB,totS,src,isNow,dom,n,P){
  const rows=rec.rows.slice().sort((x,y)=>x.d<y.d?1:x.d>y.d?-1:0),days={};rows.forEach(t=>(days[t.d]=days[t.d]||[]).push(t));
  const pend=expectedItems(m).filter(it=>!tickRow(m,it.id)&&!bankRowFor(it,m)),dueNow=pend.filter(it=>it.day<=(isNow?dom:99));
  const ledger=src==='none'?`<p class="muted">Nothing for ${fmonthLong(m)} yet.</p>`:Object.keys(days).sort().reverse().map(dt=>`<div class="dayh">${fdate(parseISO(dt))}</div><table class="ledg"><tbody>${days[dt].map(t=>`<tr><td>${esc((t.t||'(no note)').replace(/^(Paid|Received): /,'').slice(0,60))}${t.a>0&&t.c&&isSpendCat(t.c)?' <span class="pill good">refund</span>':''}${t.s==='tick'?' <span class="pill good">ticked</span>':t.s==='man'?' <span class="pill info">typed</span>':t.ticked?' <span class="pill good">bank ✓</span>':''}${t.p==='amex'||t.s==='amex'?' <span class="pill info">Amex</span>':''}</td><td class="muted small">${esc(catLabel(t))}</td><td class="n ${t.a>0?'pos':''}">${t.a>0?'+':'−'}${GBP2(Math.abs(t.a))}</td><td class="n">${src==='app'&&(t.s==='man'||t.s==='tick')?`<button class="btn ghost sm" data-act="deltx" data-m="${m}" data-id="${esc(t.id)}" aria-label="Remove">✕</button>`:''}</td></tr>`).join('')}</tbody></table>`).join('');
  const rail=`<div class="rail"><div class="panel"><h3 style="margin:0 0 6px">Budgets, ${fmonthLong(m)}</h3>${rowsV.map(v=>{const b=bud[v.id],a=by[v.id]||0,pace=b*dom/n;return`<div class="rb"><div class="row" style="justify-content:space-between"><span>${esc(v.name)}</span><span class="small ${a>b&&b?'neg':'muted'}">${GBP(a)}${b?' / '+GBP(b):''}</span></div>${b?`<div class="bar"><i class="${a>b?'r':a>pace*1.1?'w':'g'}" style="width:${Math.min(100,a/b*100)}%"></i></div>`:''}</div>`}).join('')}
    ${unc>0?`<div class="rb"><div class="row" style="justify-content:space-between"><span><b>Unsorted</b></span><span class="small neg">${GBP(unc)}</span></div></div>`:''}
    <div class="row rtot" style="justify-content:space-between"><b>Total</b><b class="${totS>totB?'neg':''}">${GBP(totS)} / ${GBP(totB)}</b></div>${isNow?`<p class="small muted" style="margin:4px 0 0">Day ${dom} of ${n}: pace ${GBP(totB*dom/n)}</p>`:''}</div>
   ${src==='app'||isNow?`<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Still to tick (${pend.length})</h3>${dueNow.length?`<button class="btn ghost sm" data-act="tickall" data-m="${m}">Tick all due</button>`:''}</div>
    ${pend.slice(0,12).map(it=>`<div class="row tk" style="justify-content:space-between"><span>${tickBox(it.kind,it.id,m)} ${esc(it.name)}</span><span class="small muted">${ord(it.day)} · ${GBP2(it.amt)}</span></div>`).join('')||'<p class="small muted" style="margin:4px 0 0">Everything is ticked or on the bank file.</p>'}${pend.length>12?`<p class="small muted" style="margin:4px 0 0">${pend.length-12} more in the full list below.</p>`:''}</div>`:''}</div>`;
  return`<div class="c12 dd"><div class="panel"><div class="row" style="justify-content:space-between"><h2>Day by day, ${fmonthLong(m)}</h2><div class="row"><button class="btn ghost sm" data-act="mprev" aria-label="Previous month">‹</button><button class="btn ghost sm" data-act="mnext" aria-label="Next month">›</button></div></div>${src==='sheet'?'<p class="small muted" style="margin-top:0">From your sheet. Budgets are what you planned then.</p>':''}${ledger}</div>${rail}</div>`}
function uploadPanel(){return`<div class="panel c4 upl"><h2>Upload a statement</h2><div class="fileBox"><select id="impSrc"><option value="nw">NatWest current account</option><option value="amex">Amex card</option></select><input type="file" id="impFile" accept=".csv,text/csv,.pdf,application/pdf" multiple><p id="impMsg" class="small" style="margin:4px 0 0"></p></div>
    <p class="small muted" style="margin:6px 0 0">CSV or PDF statements from NatWest or Amex (pick several at once). PDFs are read on your device and identified automatically. The same file twice is safe. <b>Amex has two cardholders: only ${esc(amexJointName())}\'s spending is joint and counted. The other cardholder\'s is personal and left out.</b></p></div>`}
/* every budget this month, with progress: used on Today */
function budgetsPanel(m){
  const bud=budgetsOf(m),{by,unc,src}=catTotalsFor(m),P=planFor(m),xcat=new Set((P.transfers||[]).map(x=>x.catId)),isNow=m===thisMonthK(),n=dim(+m.slice(0,4),monthOf(m)-1),dom=isNow?+todayISO().slice(8):n;
  const rowsV=allVars().filter(v=>src==='sheet'||!xcat.has(v.id)).filter(v=>bud[v.id]>0||by[v.id]>0),totB=sum(rowsV,v=>bud[v.id]),totS=sum(rowsV,v=>by[v.id]||0)+unc;
  return`<div class="panel c12"><div class="row" style="justify-content:space-between"><h2>All budgets, ${fmonthLong(m)}</h2><span class="small muted">${isNow?`Day ${dom} of ${n}: on pace you would have spent ${GBP(totB*dom/n)}`:''}</span></div>
   <div class="tblwrap"><table><thead><tr><th>Category</th><th class="n">Spent</th><th class="n">Budget</th><th class="n">Left</th><th>Progress</th></tr></thead><tbody>
   ${rowsV.map(v=>{const b=bud[v.id],a=by[v.id]||0,pc=b?a/b*100:0,pace=b*dom/n;return`<tr><td>${esc(v.name)}</td><td class="n">${GBP(a)}</td><td class="n">${b?GBP(b):'none'}</td><td class="n ${a>b&&b?'neg':''}">${b?GBP(b-a):'–'}</td><td style="min-width:120px">${b?`<div class="bar"><i class="${a>b?'r':a>pace*1.1?'w':'g'}" style="width:${Math.min(100,pc)}%"></i></div>`:''}</td></tr>`}).join('')}
   ${unc>0?`<tr><td><b>Unsorted</b> <span class="pill warn">sort me</span></td><td class="n">${GBP(unc)}</td><td class="n muted">none</td><td></td><td></td></tr>`:''}
   <tr class="tot"><td>Total</td><td class="n">${GBP(totS)}</td><td class="n">${GBP(totB)}</td><td class="n ${totS>totB?'neg':''}">${GBP(totB-totS)}</td><td></td></tr></tbody></table></div>
   <p class="small muted" style="margin:6px 0 0">Open Day to day to see what is inside each category. Transfers to personal accounts are planned on Budgets.</p></div>`}
function incomePanel(m,P,src){
  const h=normHist(m),bankIn=sum((TX[m]||[]).filter(t=>t.c==='_inc'&&t.a>0),t=>t.a);
  if(src==='sheet'&&h){const rows=Object.entries(h.wages).map(([n,w])=>[n,w.f,w.a]);if(h.otherIn||h.otherInF)rows.push(['other money in',h.otherInF,h.otherIn]);
    return`<div class="panel c12"><h2>Money in, ${fmonthLong(m)} <span class="muted small">from your sheet</span></h2><div class="tblwrap"><table><thead><tr><th>Source</th><th class="n">Expected</th><th class="n">Actual</th><th class="n">Difference</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="n">${GBP(r[1])}</td><td class="n">${GBP(r[2])}</td><td class="n ${r[2]<r[1]?'neg':''}">${GBP(r[2]-r[1])}</td></tr>`).join('')}</tbody></table></div></div>`}
  const pl=sum(P.income,i=>i.amount),ac=incActualTotal(m,P);
  return`<div class="panel c12"><h2>Money in, ${fmonthLong(m)} <span class="muted small">expected against what actually arrived</span></h2><div class="tblwrap"><table><thead><tr><th>Source</th><th class="n">Expected</th><th class="n">Actual received</th><th class="n">Difference</th></tr></thead><tbody>${P.income.map(i=>{const a=STATE.incAct&&STATE.incAct[m]?STATE.incAct[m][i.id]:null,d=incFor(m,i)-i.amount;return`<tr><td>${esc(i.name)}${i.varies?' <span class="pill info">varies</span>':''}</td><td class="n">${GBP2(i.amount)}</td><td class="n">${F('state',`incAct.${m}.${i.id}`,'num',a,'style="width:110px" placeholder="'+i.amount+'"',true)}</td><td class="n ${d<0?'neg':''}">${a==null?'–':GBP2(d)}</td></tr>`}).join('')}
   <tr class="tot"><td>Total</td><td class="n">${GBP2(pl)}</td><td class="n">${GBP2(ac)}</td><td class="n ${ac<pl?'neg':''}">${GBP2(ac-pl)}</td></tr></tbody></table></div>
   <p class="small muted" style="margin-bottom:0">Leave a box empty to use the expected amount. Typing what actually arrived updates the forecast and Left over from that month on, and Plan vs actual.${bankIn?` Your bank file shows ${GBP2(bankIn)} paid in this month, to check against.`:''} To change what you expect every month, edit Money in on the Budgets tab.</p></div>`}
function catAccordion(v,rows,total,budget,m,src){
  const open=view.open['cat_'+v.id],spend=rows.filter(t=>t.a<0||v.id!=='_unsorted');
  const groups={};rows.forEach(t=>{const k=merchKey(t.t);(groups[k]=groups[k]||[]).push(t)});
  const sums=(v.subs||[]).map(s=>[s.name,sum(rows.filter(t=>t.sc===s.id),t=>-t.a)]).filter(x=>x[1]);const un=(v.subs||[]).length?sum(rows.filter(t=>!t.sc),t=>-t.a):0;
  const inner=open?`${sums.length?`<p class="small ink2" style="margin:6px 12px">${sums.map(x=>`${esc(x[0])} <b>${GBP2(x[1])}</b>`).join(' · ')}${un>0?` · Not split <b>${GBP2(un)}</b>`:''}</p>`:''}${v.note?`<p class="small ink2" style="margin:6px 12px">${v.note}</p>`:''}<div class="sub"><table><thead><tr><th>Date</th><th>What</th><th>Paid with</th><th class="n">£</th>${src==='app'?'<th></th>':''}</tr></thead><tbody>
   ${Object.entries(groups).sort((a,b)=>sum(b[1],t=>-t.a)-sum(a[1],t=>-t.a)).map(([k,g])=>`<tr class="mer"><td colspan="3">${esc(k)} <span class="muted small" style="font-weight:400">· ${g.length} payment${g.length>1?'s':''}</span></td><td class="n">${GBP2(-sum(g,t=>t.a))}</td>${src==='app'?'<td></td>':''}</tr>`+g.sort((a,b)=>a.d<b.d?1:-1).map(t=>`<tr><td style="padding-left:18px">${src==='sheet'?'':fdate(parseISO(t.d))}</td><td>${esc(t.t||'')}${t.sc?` <span class="pill info">${esc(subName(t.c,t.sc))}</span>`:''}</td><td>${t.s==='man'?(t.p==='amex'?'Amex (typed)':t.p==='cash'?'Cash':'Bank card (typed)'):t.s==='amex'?'Amex file':t.s==='nw'?'NatWest file':'Sheet'}</td><td class="n">${GBP2(-t.a)}</td>${src==='app'?`<td><span class="row">${catSelect(t.id,m,t.c,t.sc)}<button class="btn danger sm" data-act="deltx" data-m="${m}" data-id="${esc(t.id)}" aria-label="Delete">✕</button></span></td>`:''}</tr>`).join('')).join('')}</tbody></table></div>`:'';
  return`<div class="cat"><div class="hd" data-act="toggle" data-v="cat_${v.id}"><span>${open?'▾':'▸'}</span><b>${esc(v.name)}</b><span class="muted small n">${rows.length} payment${rows.length===1?'':'s'}</span><b class="n">${GBP(total)}</b><span class="n muted">${budget?'of '+GBP(budget):'no budget'}</span>${budget?`<div class="bar"><i class="${total>budget?'r':'g'}" style="width:${Math.min(100,total/budget*100)}%"></i></div>`:'<span></span>'}</div>${inner}</div>`}
/* ---- adding, sorting, merging ---- */
function addTx(){
  const d=$('#e_date').value,amt=parseFloat($('#e_amt').value),cv=$('#e_cat').value,c=cv.split(':')[0],sc=cv.split(':')[1],p=$('#e_pay').value,note=$('#e_note').value.trim();
  if(!d||!(amt>0)||!c){toast('Add a date, an amount and a category');return}
  const refund=($('#e_type')||{}).value==='refund';if(refund&&c==='_unplanned'){toast('Pick the category the money came back to');return}
  const k=d.slice(0,7);const id='m_'+uid();
  (TX[k]=TX[k]||[]).push({id,d,t:refund?('Refund: '+(note||'')).trim():note,a:refund?amt:-amt,refund:refund||undefined,c:c==='_unplanned'?'':c,sc:sc||undefined,s:'man',p,unplanned:c==='_unplanned'||undefined});
  if(c==='_unplanned'){STATE.notes[id]={kind:'oneoff',text:note||'Unplanned bill'}}
  audit(refund?'Added refund':'Added transaction',`${GBP2(amt)} ${note||''} on ${d}, ${c==='_unplanned'?'unplanned bill':(catName({vars:allVars()},c)||c)}, paid by ${p}`);
  view.m=k;saveTx(k);invalidate();persistAll();toast('Added');render()}
function sortTx(id,k,cv){
  const t=(TX[k]||[]).find(x=>x.id===id);if(!t)return;const c=cv.split(':')[0],sc=cv.split(':')[1];audit('Re-categorised',`${GBP2(Math.abs(t.a))} "${(t.t||'').slice(0,40)}" (${t.d}): ${t.c?(catName({vars:allVars()},t.c)||t.c):'unsorted'} to ${c?(catName({vars:allVars()},c)||c):'unsorted'}`);t.c=c;t.sc=sc||undefined;
  const kw=merchKey(cleanD(t.t)).toUpperCase();
  if(c&&kw&&kw!=='OTHER'&&t.s!=='man'){if(!STATE.rules.find(r=>r.k===kw))STATE.rules.push({k:kw,c,s:sc});
    TX[k].forEach(x=>{if(!x.c&&x.s!=='man'&&x.a<0&&(x.t||'').toUpperCase().includes(kw)){x.c=c;x.sc=sc||undefined}})}
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
/* Amex has two cardholders. Only the joint cardholder's spending counts towards the household. */
const amexJointName=()=>String(STATE.amexJoint||'Annalisa').trim();
const amexIsJoint=name=>{const j=amexJointName().toUpperCase();return !!j&&String(name).toUpperCase().includes(j)};
function importText(text,src){
  const rows=parseCSV(text);if(rows.length<2)return'That file has no rows.';
  const H=rows[0].map(h=>h.trim().toLowerCase()),iD=H.findIndex(h=>h.includes('date')),iDesc=H.findIndex(h=>h==='description'||h.includes('descr')),iV=H.findIndex(h=>h==='value'||h==='amount'),iB=H.findIndex(h=>h==='balance'),iW=H.findIndex(h=>h==='cardmember');
  if(iD<0||iDesc<0||iV<0)return'Could not find Date, Description and Value or Amount columns. Is this a NatWest or Amex CSV?';
  const parsed=[];rows.slice(1).forEach(r=>{const d=toISO(r[iD]||'');let a=num(r[iV]);if(!d||a==null)return;if(src==='amex')a=-a;parsed.push({d,t:(r[iDesc]||'').trim().replace(/\s+/g,' '),a,b:iB>=0?num(r[iB]):null,who:iW>=0?(amexIsJoint(r[iW]||'')?'A':'S'):undefined})});
  if(!parsed.length)return'No valid rows found.';
  return importRows(parsed,src)}
/* shared by CSV and PDF: parsed is [{d,t,a,b,who}] */
function importRows(parsed,src){
  /* the same line may arrive from a CSV and a PDF with different wording: match on date, amount and balance */
  const cnt={};Object.values(TX).flat().filter(t=>t.s===src).forEach(t=>{const k=t.d+'|'+t.a+'|'+(src==='nw'?t.b:(t.who||''));cnt[k]=(cnt[k]||0)+1});
  const cnt2={};if(src==='nw')Object.values(TX).flat().filter(t=>t.s==='nw').forEach(t=>{const k=t.d+'|'+t.a;cnt2[k]=(cnt2[k]||0)+1});
  parsed=parsed.filter(x=>{if(src==='nw'&&x.b==null){const k=x.d+'|'+x.a;if(cnt2[k]>0){cnt2[k]--;x.dupe=true}return true}
    const k=x.d+'|'+x.a+'|'+(src==='nw'?x.b:(x.who||''));if(cnt[k]>0){cnt[k]--;x.dupe=true}return true});
  const seen={};parsed.forEach(x=>{const key=x.d+'|'+x.t+'|'+x.a+'|'+x.b;seen[key]=(seen[key]||0)+1;x.id=src+'_'+key+'#'+seen[key]});
  let added=0,skipped=0,merged=0,asked=0;const pay=src==='amex'?'amex':'bank';
  const have=new Set(Object.values(TX).flat().filter(t=>t.s===src).map(t=>t.id));
  parsed.forEach(x=>{if(have.has(x.id)||x.dupe){skipped++;return}
    const k=x.d.slice(0,7),arr=TX[k]=TX[k]||[];const own=x.who==='S'&&x.a<0&&!/PAYMENT RECEIVED/i.test(x.t),cf=own?{c:'_skip',how:'known',why:'Other cardholder, personal'}:classifyWhy(x.t,x.a);let c=cf.c;
    const cands=x.a<0?arr.filter(t=>t.s==='man'&&t.p===pay&&!t.m&&Math.abs(t.a-x.a)<0.005&&dayGap(t.d,x.d)<=3):[];
    let row={id:x.id,d:x.d,t:x.t,a:x.a,b:x.b,c,sc:cf.sc,who:x.who,s:src,p:pay,how:cf.how,why:cf.why};if(!own&&x.who!=='S'&&cf.how)row.rv='p';
    if(cands.length===1){const mt=cands[0];row.c=mt.c||c;row.sc=mt.c?mt.sc:row.sc;row.note=mt.t;row.how='typed';row.why='Matched your entry: '+(mt.t||'typed').slice(0,28);arr.splice(arr.indexOf(mt),1);merged++}
    else if(cands.length>1){row.maybe=cands.map(t=>t.id);asked++}
    arr.push(row);added++;
    if(c==='_cashout'||c==='_cashin'){const typ=c==='_cashout'?'out':'deposit',amt=Math.abs(x.a);
      if(!(STATE.cash||[]).some(e=>e.type===typ&&Math.abs(e.a-amt)<0.005&&dayGap(e.d,x.d)<=3))(STATE.cash=STATE.cash||[]).push({id:'c_'+uid(),d:x.d,type:typ,a:amt,who:'',note:'From the bank file',auto:true})}});
  Object.keys(parsed.reduce((o,x)=>(o[x.d.slice(0,7)]=1,o),{})).forEach(k=>saveTx(k));
  let msg=`Added ${added} new lines (${merged} matched to entries you typed, ${skipped} already there${asked?`, ${asked} need your say-so`:''}).`;
  if(src==='amex'){const oth=parsed.filter(x=>x.who==='S'&&x.a<0&&!/PAYMENT RECEIVED/i.test(x.t)),jt=parsed.filter(x=>x.who==='A'&&x.a<0);
    msg+=parsed.some(x=>x.who!==undefined)?` Counted ${jt.length} ${esc(amexJointName())} (joint) card lines, ${GBP2(-sum(jt,x=>x.a))}. Left out ${oth.length} lines from the other cardholder, ${GBP2(-sum(oth,x=>x.a))}, because that spending is personal.${!jt.length?' No lines matched "'+esc(amexJointName())+'", so check the cardholder name in Settings.':''}`:' This file has no Cardmember column, so every line was counted as joint. Download the version that lists the cardmember.'}
  const rc=reconcileTicks();
  if(src==='nw'){const wb=parsed.filter(x=>x.b!=null);
    if(wb.length){const asc=wb[0].d<wb[wb.length-1].d,ld=wb.map(x=>x.d).sort().pop(),same=wb.filter(x=>x.d===ld),lastRow=asc?same[same.length-1]:same[0];
      if(STATE.bank==null||!STATE.asOf||ld>=STATE.asOf){applyBalance(lastRow.b,ld,'file');msg+=` Balance set to ${GBP2(lastRow.b)} as of ${fdate(parseISO(ld))}.`}}}
  audit('Uploaded '+(src==='amex'?'Amex':'NatWest')+' file',`${added} new lines, ${skipped} already there, ${merged} matched to typed entries`);
  if(rc.matched||rc.diff)msg+=` ${rc.matched} of your ticked items matched a bank line${rc.diff?`, ${rc.diff} with a different amount`:''}.`;
  const an=anomalies().filter(x=>x.sev!=='info').length;if(an)msg+=` ${an} thing${an>1?'s':''} to check in the Weekly check below.`;
  invalidate();persistAll();return msg}
