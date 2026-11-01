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
  if(bk){let why='Known payee';if(bk.c==='_inc'&&bk.sc){const i=P.income.find(x=>x.id===bk.sc);why='Matches your income'+(i?': '+i.name.trim():'')}else if(bk.c==='_amexpay')why='Amex payment';else if(bk.c==='v_acash'||bk.c==='v_scash'){const x=(P.transfers||[]).find(t=>t.catId===bk.c);why='Spending money transfer'}else if(bk.c==='v_round')why='Round-up to savings';else if(bk.c==='_skip'){why='Known bill, debt or transfer';if(/IKANO/.test(D)&&!P.debts.some(x=>/IKEA|IKANO/i.test(x.name+x.match)&&x.pay>0))return{...bk,how:'check',why:'Looks like your Ikea loan, but no payment is set on it. Add one on Debts?'}}return{...bk,how:'known',why}}
  if(amount>0){if(/REFUND|RETURN|REVERSAL|CREDIT VOUCHER|CHARGEBACK/.test(D)&&!/APEX|SALARY|WAGES/.test(D)){const r=refundCat(D);return{...(r||{c:''}),how:'refund',why:r?'Looks like a refund to a shop you pay':'Looks like a refund, but no matching shop found'}}
    const r=refundCat(D);if(r)return{...r,how:'refund',why:'Money in from a shop you pay: refund, not income?'};
    return{c:'_inc',how:'in',why:'Money in from an unfamiliar payer. Income?'}}
  if(/CASH WITHDRAWAL|\bATM\b|CASHPOINT|CASH MACHINE/.test(D))return{c:'_cashout',how:'known',why:'Cash withdrawal'};
  if(/CASH DEPOSIT|CASH IN BRANCH/.test(D))return{c:'_cashin',how:'known',why:'Cash paid in'};
  if(/AMERICAN EXPRESS|\bAMEX\b/.test(D))return{c:'_amexpay',how:'known',why:'Amex payment'};
  const bl=P.bills.find(b=>bkey(b)&&keyHit(D,bkey(b)));if(bl)return{c:'_skip',how:'bill',why:'Matches your bill: '+bl.name.replace(/\(.*?\)/g,'').trim()};
  const r=ruleOf(D);if(r)return{c:r.c,sc:r.s,how:'rule',why:'Your rule: '+r.k.toLowerCase()};
  if(/\b(SHELL|BP|ESSO|TEXACO|JET)\b/.test(D)&&/\bCD\b|CARD/.test(D)&&!/COFFEE|CAFE|DELI/.test(D))return{c:'_skip',how:'builtin',why:'Fuel station: left out of the household budget. Change it if this was food or coffee.'};
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
  if(view.mRoll!==thisMonthK()){view.mRoll=thisMonthK();view.m=thisMonthK()}
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
     <label>Paid with<select id="e_pay"><option value="bank">Debit card</option><option value="amex">Amex</option><option value="cash">Household cash</option></select></label>
     <label>Note<input type="text" id="e_note" placeholder="optional"></label><button class="btn" data-act="addtx">Add</button></div>
    <p class="small muted" style="margin-bottom:0">Choose Refund when a shop pays money back: it comes into the bank and reduces that category's spending, and is not counted as income. Spending is joint, so there is no "who". If you also upload the NatWest file, the matching entry is merged so nothing is counted twice.</p></div>
   ${unsortedPanel(m,false)}
   ${dups.map(t=>`<div class="panel c12" style="border-color:var(--warn);grid-column:span 12"><h3>Is this the same purchase?</h3><div class="row" style="justify-content:space-between"><span><b>On the bank file:</b> ${esc(t.t)}, ${fdate(parseISO(t.d))}, ${GBP2(t.a)}<br><b>Typed:</b> ${t.maybe.map(id=>{const x=rec.rows.find(r=>r.id===id);return x?esc(x.t||'(no note)')+', '+fdate(parseISO(x.d)):''}).join(' or ')}</span><span class="row"><button class="btn" data-act="merge" data-id="${esc(t.id)}">Same, merge them</button><button class="btn ghost" data-act="keepboth" data-id="${esc(t.id)}">Different, keep both</button></span></div></div>`).join('')}
   ${ledgerBlock(m,rec,rowsV,bud,by,unc,totB,totS,src,isNow,dom,n,P)}
   ${collapsePanel('ticks','Tick off '+fmonthLong(m)+' (all items)',tickPanel(m),'money in, bills, debts and transfers')}
   ${incomePanel(m,P,src)}
   <div class="panel c12"><div class="row" style="justify-content:space-between"><h2>Every category and what is in it</h2><button class="btn ghost sm" data-act="toggle" data-v="cats">${view.open.cats?'Hide':'Show'}</button></div>${view.open.cats?`<p class="small ink2" style="margin-top:0">Click a category to open it. Payments are grouped by shop, with how each was paid.</p>
    ${allVars().filter(v=>(by[v.id]||0)!==0||rec.rows.some(t=>t.c===v.id)||(v.id==='v_ent'&&entShop>0)).map(v=>catAccordion(v.id==='v_ent'&&entShop>0?{...v,note:`Also ${GBP2(entShop)} of entertaining food shops, counted under Shopping › Entertaining so the grocery budget is honest. Not added again here.`}:v,rec.rows.filter(t=>t.c===v.id),by[v.id]||0,bud[v.id],m,src)).join('')||'<p class="muted">Nothing here yet.</p>'}
    ${(()=>{const u=rec.rows.filter(t=>!t.c&&t.a<0);return u.length?catAccordion({id:'_unsorted',name:'Unsorted'},u,unc,0,m,src):''})()}`:''}</div>
  </div>`}

const collapsePanel=(key,title,inner,sub)=>`<div class="panel c12"><div class="row" style="justify-content:space-between"><h2>${esc(title)} <span class="muted small">${esc(sub||'')}</span></h2><button class="btn ghost sm" data-act="toggle" data-v="${key}">${view.open[key]?'Hide':'Show'}</button></div>${view.open[key]?inner:''}</div>`;
const catLabel=t=>t.c==='_inc'?'Money in':t.c==='_skip'?'Bill or transfer':t.c==='_amexpay'?'Amex payment':t.c==='_cashout'?'Cash':t.c==='v_acash'?"Annie's spending money":t.c==='v_scash'?"Sander's spending money":t.c?((allVars().find(v=>v.id===t.c)||{}).name||'Other'):'Unsorted';
/* how much of each category this month was on the joint Amex (it leaves the bank later) */
function catAmexFor(k){const o={};(monthRecords(k).rows||[]).forEach(t=>{if(t.p==='amex'&&t.who!=='S'&&t.c&&isSpendCat(t.c))o[t.c]=(o[t.c]||0)-t.a});return o}
/* a budget bar in two colours: bank card (already left the bank) and Amex (leaves on the due date) */
const rndTag=id=>id==='v_round'?' <span class="pill good" title="Round-ups are spending, but the money goes into your round-up savings account, so you still have it">to savings</span>':'';
/* one pill-shaped bar. With a budget the pill fills as far as the budget is used; with none, whatever was spent fills it. Inside, Debit | Cash | Amex join with straight edges. */
function budBar(total,budget,amex,pace,cash){const am=Math.max(0,Math.min(total,amex||0)),ca=Math.max(0,Math.min(total-am,cash||0)),bk=Math.max(0,total-am-ca);
  if(!(total>0.004))return budget?'<div class="bar split"></div>':'';
  const pct=budget?Math.min(100,total/budget*100):100,sh=v=>(v/total*100).toFixed(2)+'%',tip=`Debit ${GBP2(bk)}${ca>0.004?', cash '+GBP2(ca):''}${am>0.004?', Amex '+GBP2(am):''}`;
  return`<div class="bar split ${budget?(total>budget?'over':total>pace*1.1?'ahead':''):'nob'}" title="${tip}"><span class="fill" style="width:${pct}%">${bk>0.004?`<i class="d" style="width:${sh(bk)}"></i>`:''}${ca>0.004?`<i class="k" style="width:${sh(ca)}"></i>`:''}${am>0.004?`<i class="a" style="width:${sh(am)}"></i>`:''}</span></div>`}
function catCashFor(k){const o={};(monthRecords(k).rows||[]).forEach(t=>{if(t.p==='cash'&&t.c&&isSpendCat(t.c)&&t.a<0)o[t.c]=(o[t.c]||0)-t.a});return o}
const cashNote=v=>v>0.005?`<div class="cshn">${GBP2(v)} in cash</div>`:'';
const amexDueText=t=>{const s=(amexStatementList().find(x=>t.d>=x.from&&t.d<=x.close));return s?'Amex · pays '+fdate(parseISO(s.due)).replace(/ \d{2}$/,''):'Amex'};
function ddRange(m){const D=view.dd,t=todayISO(),eom=k=>k+'-'+String(dim(+k.slice(0,4),monthOf(k)-1)).padStart(2,'0');
  if(D.chip==='today')return[t,t];if(D.chip==='week'){const dow=(new Date(parseISO(t)).getUTCDay()+6)%7,s=addDays(t,-dow);return[s,addDays(s,6)]}
  if(D.chip==='all')return['0000-01-01','9999-12-31'];if(D.chip==='custom')return[D.from||'0000-01-01',D.to||'9999-12-31'];return[m+'-01',eom(m)]}
const rowNote=t=>(t.note&&t.note!==t.t?t.note:'')||((STATE.notes||{})[t.id]||{}).text||'';
/* is this line backed by a real statement line? (bank file for Debit, Amex statement for Amex) */
function xrefCtx(){const all=Object.values(TX).flat(),cov=s=>all.filter(r=>r.s===s).reduce((a,r)=>r.d>a?r.d:a,'');return{all,covNW:cov('nw'),covAMX:cov('amex')}}
function xrefInfo(t,X){
  if(t.s==='tick')return null;
  if(t.p==='cash')return{k:'cash',txt:'Cash, nothing to check against'};
  if(t.s==='nw')return{k:'ok',txt:t.how==='typed'?'✓ matched to your entry':'✓ on the NatWest file'};
  if(t.s==='amex')return{k:'ok',txt:t.how==='typed'?'✓ matched to your entry':'✓ on the Amex statement'};
  if(t.s!=='man')return null;
  const pay=t.p==='amex'?'amex':'bank',opp=pay==='amex'?'nw':'amex',r=X.all.find(z=>z.s===opp&&(z.a<0)===(t.a<0)&&Math.abs(z.a-t.a)<.005&&z.how!=='typed'&&dayGap(z.d,t.d)<=4);
  if(r)return{k:'bad',txt:`⚠ the ${opp==='amex'?'Amex statement':'bank file'} has this, not the ${pay==='amex'?'Amex':'Debit'}`,fix:{id:t.id,m:t.d.slice(0,7),to:opp==='amex'?'amex':'bank',label:'Change to '+(opp==='amex'?'Amex':'Debit')}};
  const cov=pay==='amex'?X.covAMX:X.covNW;
  if(cov&&t.d<cov&&dayGap(cov,t.d)>=5)return{k:'bad',txt:`⚠ not on the ${pay==='amex'?'Amex statement':'bank file'} (it goes to ${fdate(parseISO(cov))})`};
  return{k:'wt',txt:'○ not on a statement yet'}}
/* a typed line was paid the other way: switch it and join it to the statement line that has it */
function xrefFix(id,m,to){
  const arr=TX[m]||[],t=arr.find(x=>x.id===id);if(!t)return;const opp=to==='amex'?'amex':'nw',X=xrefCtx();
  const r=X.all.find(z=>z.s===opp&&(z.a<0)===(t.a<0)&&Math.abs(z.a-t.a)<.005&&z.how!=='typed'&&dayGap(z.d,t.d)<=4);
  audit('Changed how it was paid',`${GBP2(Math.abs(t.a))} "${(t.t||'').slice(0,30)}" to ${to==='amex'?'Amex':'Debit'}`);
  if(r){r.note=t.t;if(t.c){r.c=t.c;r.sc=t.sc}r.how='typed';r.why='Matched your entry: '+(t.t||'typed').slice(0,28);arr.splice(arr.indexOf(t),1);const rm=r.d.slice(0,7);saveTx(m);if(rm!==m)saveTx(rm);else saveTx(m)}
  else{t.p=to==='amex'?'amex':'bank';saveTx(m)}
  invalidate();persistAll();toast('Matched to the statement');render()}
function ledgerBlock(m,rec,rowsV,bud,by,unc,totB,totS,src,isNow,dom,n,P){
  const D=view.dd=view.dd||{chip:'month'},[from,to]=ddRange(m),q=(D.q||'').trim().toLowerCase(),XC=xrefCtx();
  let base=(D.chip==='month'?rec.rows:Object.values(TX).flat()).filter(t=>!t.skip);
  const rows=base.filter(t=>t.d>=from&&t.d<=to&&(!D.cat||(D.cat==='_unsorted'?!t.c:t.c===D.cat))&&(!D.pay||(D.pay==='amex')===(t.p==='amex'||t.s==='amex'))&&(!D.chk||((xrefInfo(t,XC)||{}).k===D.chk))&&(!q||((t.t||'')+' '+rowNote(t)+' '+rvLabel(t)).toLowerCase().includes(q))).sort((x,y)=>x.d<y.d?1:x.d>y.d?-1:0);
  const days={};rows.forEach(t=>(days[t.d]=days[t.d]||[]).push(t));
  const pend=expectedItems(m).filter(it=>!tickRow(m,it.id)&&!bankRowFor(it,m)),dueNow=pend.filter(it=>it.day<=(isNow?dom:99)),amx=catAmexFor(m),csh=catCashFor(m);
  const nm=t=>esc(cleanD(t.t||'(no note)').replace(/^(PAID|RECEIVED): /,'').toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()).slice(0,60));
  const attn=t=>t.s!=='tick'&&((!t.c&&t.a<0)||t.rv==='p'||((xrefInfo(t,XC)||{}).k==='bad'));
  const row=t=>{const nt=rowNote(t),ed=view.ne===t.id,am=t.p==='amex'||t.s==='amex',x=xrefInfo(t,XC),pd=t.p==='cash'?'k':am?'a':'d',inc=t.a>0;
    const edit=src!=='sheet'&&t.id&&t.s!=='tick'&&(!t.c||allVars().some(v=>v.id===t.c));
    const cat=edit?`<select class="rcat ${t.c?'':'un'}" data-rc="${esc(t.id)}" data-m="${t.d.slice(0,7)}" aria-label="Category" title="Change the category of this one transaction. The merchant rule is not changed.">${t.c?'':'<option value="">Needs a category</option>'}${catOptions(t.c||'',t.sc)}</select>`:`<span class="catc ${inc?'in':''}">${esc(catLabel(t))}</span>`;
    return`<div class="lr"><i class="pd ${pd}" title="${pd==='k'?'Cash':pd==='a'?'Amex':'Debit'}"></i><div class="lm"><span class="nm">${nm(t)}</span>${t.a>0&&t.c&&isSpendCat(t.c)?' <span class="pill good">refund</span>':''}${t.s==='tick'?' <span class="pill good">ticked</span>':''}${t.rv==='p'?' <span class="fl" title="Waiting for your approval">check</span>':''}${forMonth(t)!==t.d.slice(0,7)?` <span class="fl2">counts towards ${fmonthLong(forMonth(t)).split(' ')[0]}</span>`:''}${x&&(x.k==='bad'||x.k==='wt'&&t.a<0)?` <span class="xr ${x.k}" title="${x.k==='bad'?'Does not match the statement':'Waiting for the next statement upload'}">${esc(x.txt)}</span>${x.fix?` <button class="btn ghost sm" data-act="xreffix" data-id="${esc(x.fix.id)}" data-m="${x.fix.m}" data-to="${x.fix.to}">${esc(x.fix.label)}</button>`:''}`:''}
     ${am?`<div class="small muted">${esc(amexDueText(t))}</div>`:''}
     ${ed?`<span class="rnrow"><input type="text" id="ne_in" value="${esc(nt)}" placeholder="Add a note" data-nid="${esc(t.id)}" data-m="${t.d.slice(0,7)}"><button class="btn sm" data-act="rownotesave" data-id="${esc(t.id)}" data-m="${t.d.slice(0,7)}">Save</button></span>`:`<div class="nt2">${nt?esc(nt):''}<button class="nbtn" data-act="rownote" data-id="${esc(t.id)}" title="${nt?'Change the note':'Add a note'}">${nt?'✎':'+ note'}</button></div>`}</div>
     <span class="lc">${cat}</span><span class="la ${inc?'pos':''}">${inc?'+':'−'}${GBP2(Math.abs(t.a))}</span><span class="lx">${t.fm||eomZone(t)?`<button class="btn ghost sm" data-act="fm" data-id="${esc(t.id)}" data-m="${t.d.slice(0,7)}" title="Choose which month this payment counts towards">${forMonth(t)===t.d.slice(0,7)?'→ '+fmonthLong(addMonthsK(t.d.slice(0,7),1)).slice(0,3):'← '+fmonthLong(t.d.slice(0,7)).slice(0,3)}</button>`:''}${(t.s==='man'||t.s==='tick')?`<button class="btn ghost sm" data-act="deltx" data-m="${t.d.slice(0,7)}" data-id="${esc(t.id)}" aria-label="Remove">✕</button>`:''}</span></div>`};
  const mode=D.mode||'cat',nAtt=rec.rows.filter(attn).length;
  const shown=mode==='att'?rows.filter(attn):rows;
  const showAll=(view.ddAll=view.ddAll||{});
  const ddOpen=(view.ddOpen=view.ddOpen||{}),unfilt=D.chip==='month'&&!(D.q||'').trim()&&!D.pay&&mode==='cat';
  const catRow=(id,name,L,b)=>{const isAm=t=>t.p==='amex'||t.s==='amex',a=-sum(L,t=>t.a),am=-sum(L.filter(isAm),t=>t.a),cs=-sum(L.filter(t=>t.p==='cash'),t=>t.a),op=!!ddOpen[id],real=id[0]!=='_',left=b-a;
    return`<div class="sr${op?' open':''}"><button class="sh" data-act="ddopen" data-id="${esc(id)}" aria-expanded="${op}"><span class="car">${op?'▾':'▸'}</span><span class="snm">${esc(name)} <span class="muted small">· ${L.length} payment${L.length===1?'':'s'}</span></span><span class="sbar">${real?budBar(a,b,am,0,cs):''}</span><span class="samt ${b&&a>b?'neg':''}">${GBP(a)}${b?' of '+GBP(b):''}</span><span class="slf ${b&&left<0?'neg':''}">${b?(left>=0?GBP(left)+' left':GBP(-left)+' over'):'no budget'}</span></button>${op?`<div class="sx">${L.map(row).join('')}</div>`:''}</div>`};
  let ledger,dayG;
  if(!shown.length)ledger=`<p class="muted">${mode==='att'?'Nothing needs attention.':'Nothing matches.'}</p>`;
  else if(mode==='cat'){
    const g={};shown.forEach(t=>{const k=!t.c?'_un':allVars().some(v=>v.id===t.c)?t.c:'_oth';(g[k]=g[k]||[]).push(t)});
    if(unfilt)allVars().forEach(v=>{if((bud[v.id]||0)>0&&!g[v.id])g[v.id]=[]});
    const tot=L=>-sum(L,t=>t.a),order=Object.keys(g).filter(k=>k[0]!=='_').sort((p,q)=>tot(g[q])-tot(g[p])||(bud[q]||0)-(bud[p]||0)),ids=order.concat(g._un?['_un']:[],g._oth?['_oth']:[]);
    const nm=k=>k==='_un'?'Needs a category':k==='_oth'?'Money in, bills and transfers':(allVars().find(x=>x.id===k)||{}).name||k;
    const allOpen=ids.length&&ids.every(k=>ddOpen[k]);
    const sumSp=order.reduce((p,k)=>p+tot(g[k]),0),sumB=unfilt?order.reduce((p,k)=>p+(bud[k]||0),0):0;
    ledger=`<div class="srh"><span class="muted small">${ids.length} categories. Tap one to see what is in it.</span><button class="btn ghost sm" data-act="ddopenall" data-v="${allOpen?0:1}" data-ids="${esc(ids.join(','))}">${allOpen?'Collapse all':'Expand all'}</button></div>`
      +ids.map(k=>catRow(k,nm(k),g[k].sort((x,y)=>x.d<y.d?1:-1),unfilt?(bud[k]||0):0)).join('')
      +(sumB?`<div class="srt"><b>Total</b><b class="${sumSp>sumB?'neg':''}">${GBP(sumSp)} of ${GBP(sumB)}</b></div>`:'')}
  else ledger=Object.keys(dayG=(()=>{const o={};shown.forEach(t=>(o[t.d]=o[t.d]||[]).push(t));return o})()).sort().reverse().map(dt=>{const L=dayG[dt],sp=-sum(L.filter(t=>t.c&&isSpendCat(t.c)),t=>t.a);return`<div class="dh"><span>${fdate(parseISO(dt))}</span><span>${sp>0?GBP2(sp):''}</span></div>${L.map(row).join('')}`}).join('');
  const sumAmx=sum(Object.values(amx),x=>x),sumCsh=sum(Object.values(csh),c=>c||0),left=totB-totS;
  const tile=(l,b,sm,cls)=>`<div class="tile2"><small>${l}</small><b class="${cls||''}">${b}</b><span>${sm}</span></div>`;
  const tiles=`<div class="tiles2">${tile('Spent in '+fmonthLong(m),GBP(totS),'of '+GBP(totB)+' budget',totS>totB?'neg':'')}${tile('How it was paid',`<span><i class="pd d"></i>${GBP(Math.max(0,totS-sumAmx-sumCsh))}</span><span><i class="pd k"></i>${GBP(sumCsh)}</span><span><i class="pd a"></i>${GBP(sumAmx)}</span>`,'debit, cash, Amex','pp')}${tile('Needs attention',nAtt,nAtt?'unsorted or waiting for approval':'all clear',nAtt?'neg':'')}${tile(left>=0?'Left this month':'Over budget by',GBP(Math.abs(left)),left>=0?'under budget':'above plan',left<0?'neg':'')}</div>`;
  const tab=(k,l)=>`<button class="chipb ${mode===k?'on':''}" data-act="ddmode" data-id="${k}">${l}</button>`;
  const filt=`<div class="ddt"><div class="chips">${tab('day','By day')}${tab('cat','By category')}${tab('att','Needs attention ('+nAtt+')')}</div>
   <div class="ddf2"><input type="text" data-dd="q" placeholder="Search shop or note" value="${esc(D.q||'')}" aria-label="Search"><select data-dd="chip" aria-label="Period">${(()=>{const tm=thisMonthK(),lm=addMonthsK(tm,-1),cur=D.chip==='month'?(m===tm?'month':m===lm?'last':'cur'):D.chip;return[['month','This month'],['last','Last month']].concat(cur==='cur'?[['cur',fmonthLong(m)]]:[]).concat([['today','Today'],['week','This week'],['all','All']]).map(([k,l])=>`<option value="${k}" ${cur===k?'selected':''}>${l}</option>`).join('')})()}</select><select data-dd="pay" aria-label="Paid with"><option value="">All payments</option><option value="amex" ${D.pay==='amex'?'selected':''}>Amex</option><option value="bank" ${D.pay==='bank'?'selected':''}>Debit</option></select><span class="small muted">${shown.length} line${shown.length===1?'':'s'}</span></div></div>`;
  const rail=`<div class="rail">
   ${src==='app'||isNow?`<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Still to tick (${pend.length})</h3>${dueNow.length?`<button class="btn ghost sm" data-act="tickall" data-m="${m}">Tick all due</button>`:''}</div>
    ${pend.slice(0,12).map(it=>`<div class="row tk" style="justify-content:space-between"><span>${tickBox(it.kind,it.id,m)} ${esc(it.name)}</span><span class="small muted">${ord(it.day)} · ${GBP2(it.amt)} <button class="btn ghost sm" data-act="skip" data-kind="${it.kind}" data-id="${it.id}" data-m="${m}" title="Remove it for this month only">Not this month</button></span></div>`).join('')||'<p class="small muted" style="margin:4px 0 0">Everything is ticked or on the bank file.</p>'}${pend.length>12?`<p class="small muted" style="margin:4px 0 0">${pend.length-12} more in the full list below.</p>`:''}</div>`:''}</div>`;
  return`<div class="c12 dd">${tiles}<div class="panel"><div class="row" style="justify-content:space-between"><h2>Day by day${D.chip==='month'?', '+fmonthLong(m):''}</h2>${D.chip==='month'?`<div class="row"><button class="btn ghost sm" data-act="mprev" aria-label="Previous month">‹</button><button class="btn ghost sm" data-act="mnext" aria-label="Next month">›</button></div>`:''}</div>${filt}${src==='sheet'&&D.chip==='month'?'<p class="small muted" style="margin-top:0">From your sheet. Budgets are what you planned then.</p>':''}${ledger}</div>${rail}</div>`}
function uploadPanel(){return`<div class="panel c4 upl"><h2>Upload a statement</h2><div class="fileBox"><select id="impSrc"><option value="nw">NatWest current account</option><option value="amex">Amex card</option></select><input type="file" id="impFile" accept=".csv,text/csv,.pdf,application/pdf" multiple><p id="impMsg" class="small" style="margin:4px 0 0"></p></div>
    <p class="small muted" style="margin:6px 0 0">CSV or PDF statements from NatWest or Amex (pick several at once). PDFs are read on your device and identified automatically. The same file twice is safe. <b>Amex has two cardholders: only ${esc(amexJointName())}\'s spending is joint and counted. The other cardholder\'s is personal and left out.</b></p></div>`}
/* every budget this month, with progress: used on Today */
function budgetsPanel(m){
  const amx=catAmexFor(m),csh=catCashFor(m),bud=budgetsOf(m),{by,unc,src}=catTotalsFor(m),P=planFor(m),xcat=new Set((P.transfers||[]).map(x=>x.catId)),isNow=m===thisMonthK(),n=dim(+m.slice(0,4),monthOf(m)-1),dom=isNow?+todayISO().slice(8):n;
  const rowsV=allVars().filter(v=>src==='sheet'||!xcat.has(v.id)).filter(v=>bud[v.id]>0||by[v.id]>0),totB=sum(rowsV,v=>bud[v.id]),totS=sum(rowsV,v=>by[v.id]||0)+unc;
  return`<div class="panel c12"><div class="row" style="justify-content:space-between"><h2>All budgets, ${fmonthLong(m)}</h2><span class="bleg"><span><i class="d"></i>Debit</span><span><i class="k"></i>Cash</span><span><i class="a"></i>Amex (leaves the bank later)</span></span><span class="small muted">${isNow?`Day ${dom} of ${n}: on pace you would have spent ${GBP(totB*dom/n)}`:''}</span></div>
   <div class="tblwrap"><table><thead><tr><th>Category</th><th class="n">Spent</th><th class="n">Budget</th><th class="n">Left</th><th>Progress</th></tr></thead><tbody>
   ${rowsV.map(v=>{const b=bud[v.id],a=by[v.id]||0,pc=b?a/b*100:0,pace=b*dom/n;return`<tr><td>${esc(v.name)}${rndTag(v.id)}</td><td class="n">${GBP(a)}</td><td class="n">${b?GBP(b):'none'}</td><td class="n ${a>b&&b?'neg':''}">${b?GBP(b-a):'–'}</td><td style="min-width:140px">${budBar(a,b,amx[v.id],pace,csh[v.id])}${cashNote(csh[v.id])}${(amx[v.id]||0)>0.005?`<div class="amxn">${GBP2(amx[v.id])} on the Amex</div>`:''}</td></tr>`}).join('')}
   ${unc>0?`<tr><td><b>Unsorted</b> <span class="pill warn">sort me</span></td><td class="n">${GBP(unc)}</td><td class="n muted">none</td><td></td><td></td></tr>`:''}
   <tr class="tot"><td>Total</td><td class="n">${GBP(totS)}</td><td class="n">${GBP(totB)}</td><td class="n ${totS>totB?'neg':''}">${GBP(totB-totS)}</td><td></td></tr></tbody></table></div>
   <p class="small muted" style="margin:6px 0 0">Open Day to day to see what is inside each category. Transfers to personal accounts are planned on Budgets.</p></div>`}
function incomePanel(m,P,src){
  const h=normHist(m),bankIn=sum(monthRows(m).filter(t=>t.c==='_inc'&&t.a>0),t=>t.a);
  if(src==='sheet'&&h){const rows=Object.entries(h.wages).map(([n,w])=>[n,w.f,w.a]);if(h.otherIn||h.otherInF)rows.push(['other money in',h.otherInF,h.otherIn]);
    return`<div class="panel c12"><h2>Money in, ${fmonthLong(m)} <span class="muted small">from your sheet</span></h2><div class="tblwrap"><table><thead><tr><th>Source</th><th class="n">Expected</th><th class="n">Actual</th><th class="n">Difference</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="n">${GBP(r[1])}</td><td class="n">${GBP(r[2])}</td><td class="n ${r[2]<r[1]?'neg':''}">${GBP(r[2]-r[1])}</td></tr>`).join('')}</tbody></table></div></div>`}
  const pl=sum(P.income,i=>i.amount),ac=incActualTotal(m,P);
  const dom=m===thisMonthK()?+todayISO().slice(8):m<thisMonthK()?99:0;
  const cashL=(STATE.cash||[]).filter(e=>cashIncOf(e)&&(e.d||'').slice(0,7)===m).sort((x,y)=>x.d<y.d?1:x.d>y.d?-1:0);
  const cashOf=id=>cashL.filter(e=>cashIncOf(e)===id),bankOf=id=>{const r=monthRows(m).filter(t=>t.c==='_inc'&&t.sc===id&&t.a>0);if(r.length)return sum(r,t=>t.a);const tk=tickRow(m,id);return tk&&!tk.skip&&tk.a>0?tk.a:0};
  const fromTag=id=>{const r=monthRows(m).filter(t=>t.c==='_inc'&&t.sc===id&&t.a>0&&t.d.slice(0,7)!==m);return r.length?` <span class="fl2" title="Paid at the end of last month, counted for this one">from ${+r[r.length-1].d.slice(8)} ${fmonthLong(addMonthsK(m,-1)).slice(0,3)}</span>`:''};
  const line=i=>{const bk=bankOf(i.id),cs=sum(cashOf(i.id),e=>e.a),tot=bk+cs,sk=(tickRow(m,i.id)||{}).skip,late=i.day<=dom;
    const st=sk?'<span class="pill">not this month</span>':tot>=i.amount-.5?(tot>i.amount+.5?`<span class="pill good">${GBP2(tot-i.amount)} over plan</span>`:'<span class="pill good">received</span>'):tot>0?`<span class="pill">${GBP2(i.amount-tot)} still to come</span>`:late?'<span class="pill">not arrived yet</span>':'<span class="pill">expected</span>';
    return`<tr><td>${esc(i.name)}${i.varies?' <span class="pill info">varies</span>':''}</td><td class="n">${GBP2(i.amount)}</td><td class="n">${bk>0?GBP2(bk)+fromTag(i.id):`<span class="muted small">${sk?'–':late?'waiting':'due the '+ord(i.day)}</span>`}</td><td class="n">${cs>0?GBP2(cs):'–'}</td><td class="n"><b>${tot>0?GBP2(tot):'–'}</b></td><td>${st}</td></tr>`};
  const cashRowsHtml=cashL.map(e=>`<tr><td>${fdate(parseISO(e.d))}</td><td>${esc(e.who||'')}</td><td>${esc(e.note||'')}</td><td class="n">${GBP2(e.a)}</td><td><button class="btn ghost sm" data-act="cashindel" data-id="${e.id}" aria-label="Remove">✕</button></td></tr>`).join('');
  return`<div class="panel c12"><h2>Contributions to the household, ${fmonthLong(m)} <span class="muted small">cash always counts, like a bank transfer</span></h2><div class="tblwrap"><table><thead><tr><th>Source</th><th class="n">Planned</th><th class="n"><i class="pd d"></i> Bank</th><th class="n"><i class="pd k"></i> Cash</th><th class="n">Total in</th><th></th></tr></thead><tbody>${P.income.map(line).join('')}
   <tr class="tot"><td>Total</td><td class="n">${GBP2(pl)}</td><td class="n">${GBP2(sum(P.income,i=>bankOf(i.id)))}</td><td class="n">${GBP2(sum(cashL,e=>e.a))}</td><td class="n">${GBP2(ac)}</td><td></td></tr></tbody></table></div>
   <h3 style="margin:14px 0 4px">Cash received, newest first</h3>
   ${cashL.length?`<div class="tblwrap"><table><tbody>${cashRowsHtml}</tbody></table></div>`:'<p class="small muted" style="margin:0 0 6px">No cash received this month.</p>'}
   <div class="row" style="gap:8px 12px;align-items:flex-end;margin-top:6px"><label class="small">Who<br><select id="ci_w"><option>Sander</option><option>Annie</option></select></label><label class="small">Amount £<br><input type="number" step="0.01" min="0" id="ci_a" style="width:100px" placeholder="0"></label><label class="small">Date<br><input type="date" id="ci_d" value="${m===thisMonthK()?todayISO():m+'-01'}" style="width:140px"></label><label class="small">What for<br><input type="text" id="ci_n" style="width:170px" placeholder="optional"></label><button class="btn" data-act="cashinadd" data-m="${m}">Add cash</button></div>
   <p class="small muted" style="margin-bottom:0">Cash goes into the household cash pot, so the forecast expects that much less in the bank. Money that has not arrived yet is shown as waiting, not as a shortfall.${bankIn?` Your bank file shows ${GBP2(bankIn)} paid in this month, to check against.`:''} To change what you expect every month, edit Money in on the Budgets tab.</p></div>`}
function catAccordion(v,rows,total,budget,m,src){
  const open=view.open['cat_'+v.id],spend=rows.filter(t=>t.a<0||v.id!=='_unsorted');
  const groups={};rows.forEach(t=>{const k=merchKey(t.t);(groups[k]=groups[k]||[]).push(t)});
  const sums=(v.subs||[]).map(s=>[s.name,sum(rows.filter(t=>t.sc===s.id),t=>-t.a)]).filter(x=>x[1]);const un=(v.subs||[]).length?sum(rows.filter(t=>!t.sc),t=>-t.a):0;
  const inner=open?`${sums.length?`<p class="small ink2" style="margin:6px 12px">${sums.map(x=>`${esc(x[0])} <b>${GBP2(x[1])}</b>`).join(' · ')}${un>0?` · Not split <b>${GBP2(un)}</b>`:''}</p>`:''}${v.note?`<p class="small ink2" style="margin:6px 12px">${v.note}</p>`:''}<div class="sub"><table><thead><tr><th>Date</th><th>What</th><th>Paid with</th><th class="n">£</th>${src==='app'?'<th></th>':''}</tr></thead><tbody>
   ${[rows.slice().sort((a,b)=>a.d<b.d?1:-1)].map(g=>g.sort((a,b)=>a.d<b.d?1:-1).map(t=>`<tr><td style="padding-left:18px">${src==='sheet'?'':fdate(parseISO(t.d))}</td><td>${esc(t.t||'')}${t.sc?` <span class="pill info">${esc(subName(t.c,t.sc))}</span>`:''}</td><td>${t.s==='man'?(t.p==='amex'?'Amex (typed)':t.p==='cash'?'Cash':'Bank card (typed)'):t.s==='amex'?'Amex file':t.s==='nw'?'NatWest file':'Sheet'}</td><td class="n">${GBP2(-t.a)}</td>${src==='app'?`<td><span class="row">${catSelect(t.id,m,t.c,t.sc)}<button class="btn danger sm" data-act="deltx" data-m="${m}" data-id="${esc(t.id)}" aria-label="Delete">✕</button></span></td>`:''}</tr>`).join('')).join('')}</tbody></table></div>`:'';
  return`<div class="cat"><div class="hd" data-act="toggle" data-v="cat_${v.id}"><span>${open?'▾':'▸'}</span><b>${esc(v.name)}</b><span class="muted small n">${rows.length} payment${rows.length===1?'':'s'}</span><b class="n">${GBP(total)}</b><span class="n muted">${budget?'of '+GBP(budget):'no budget'}</span>${budget?`<div class="bar"><i class="${total>budget?'r':'g'}" style="width:${Math.min(100,total/budget*100)}%"></i></div>`:'<span></span>'}</div>${inner}</div>`}
/* ---- adding, sorting, merging ---- */
function addTx(){
  const d=$('#e_date').value,amt=parseFloat($('#e_amt').value),cv=$('#e_cat').value,c=cv.split(':')[0],sc=cv.split(':')[1],p=$('#e_pay').value,note=$('#e_note').value.trim();
  if(!d||!(amt>0)||!c){toast('Add a date, an amount and a category');return}
  const refund=($('#e_type')||{}).value==='refund';if(refund&&c==='_unplanned'){toast('Pick the category the money came back to');return}
  const k=d.slice(0,7);const id='m_'+uid();
  (TX[k]=TX[k]||[]).push({id,d,t:refund?('Refund: '+(note||'')).trim():note,a:refund?amt:-amt,refund:refund||undefined,c:c==='_unplanned'?'':c,sc:sc||undefined,s:'man',p,unplanned:c==='_unplanned'||undefined});
  if(c==='_unplanned'){STATE.notes[id]={kind:'oneoff',text:note||'Unplanned bill'}}
  try{const mk=merchKey(note||'');if(mk&&c!=='_unplanned'){(STATE.payMem=STATE.payMem||{})[mk]=p}}catch(e){}
  audit(refund?'Added refund':'Added transaction',`${GBP2(amt)} ${note||''} on ${d}, ${c==='_unplanned'?'unplanned bill':(catName({vars:allVars()},c)||c)}, paid by ${p}`);
  view.m=k;saveTx(k);invalidate();persistAll();toast('Added');render()}
function recatTx(id,k,cv){
  const t=(TX[k]||[]).find(x=>x.id===id);if(!t||!cv)return;const c=cv.split(':')[0],sc=cv.split(':')[1];if(c===t.c&&(sc||undefined)===t.sc)return;
  audit('Re-categorised in day to day',`${GBP2(Math.abs(t.a))} "${(t.t||'').slice(0,40)}" (${t.d}): ${t.c?(catName({vars:allVars()},t.c)||t.c):'unsorted'} to ${catName({vars:allVars()},c)||c}`);
  t.c=c;t.sc=sc||undefined;t.how='typed';t.why='You chose this category';delete t.rv;saveTx(k);invalidate();persistAll();toast('Category changed');render()}
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
/* the same bank line can arrive twice: once from a file with no balance column, once from a file with it. Keep the balance copy and the best category. */
const HOW_RANK={typed:5,check:4,rule:3,known:3,bill:3,refund:3,builtin:2,none:0};
function healTwins(){let n=0;const near=(a,b)=>Math.abs(parseISO(a)-parseISO(b))<=2*DAY,touched=new Set();
  /* same amount, one line without a balance and one with: the same payment, as long as they are within two days of each other */
  const all=[];Object.keys(TX).forEach(k=>(TX[k]||[]).forEach(t=>{if(t.s==='nw'&&t.p==='bank')all.push({k,t})}));
  const byAmt={};all.forEach(x=>(byAmt[x.t.a]=byAmt[x.t.a]||[]).push(x));
  Object.values(byAmt).forEach(L=>{const nb=L.filter(x=>x.t.b==null),wb=L.filter(x=>x.t.b!=null);
    nb.forEach(o=>{let best=null,bg=9e9;wb.forEach(w=>{if(w.used||!near(o.t.d,w.t.d))return;const g=Math.abs(parseISO(o.t.d)-parseISO(w.t.d));if(g<bg){bg=g;best=w}});
      if(!best)return;best.used=1;const keep=best.t,old=o.t,pick=(HOW_RANK[old.how]||0)>=(HOW_RANK[keep.how]||0)?old:keep;
      if(pick===old){['c','sc','how','why','rv'].forEach(f=>{if(old[f]===undefined)delete keep[f];else keep[f]=old[f]})}
      if(old.note&&!keep.note)keep.note=old.note;
      TX[o.k].splice(TX[o.k].indexOf(old),1);touched.add(o.k);touched.add(best.k);n++})});
  touched.forEach(k=>saveTx(k));return n}
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
    const cands=arr.filter(t=>t.s==='man'&&t.p===pay&&!t.m&&Math.abs(t.a-x.a)<0.005&&dayGap(t.d,x.d)<=(x.a<0?3:4));
    let row={id:x.id,d:x.d,t:x.t,a:x.a,b:x.b,c,sc:cf.sc,who:x.who,s:src,p:pay,how:cf.how,why:cf.why};if(!own&&x.who!=='S'&&cf.how)row.rv='p';
    if(cands.length===1){const mt=cands[0];row.c=mt.c||c;row.sc=mt.c?mt.sc:row.sc;row.note=mt.t;row.how='typed';row.why='Matched your entry: '+(mt.t||'typed').slice(0,28);arr.splice(arr.indexOf(mt),1);merged++}
    else if(cands.length>1){row.maybe=cands.map(t=>t.id);asked++}
    arr.push(row);added++;
    if(c==='_cashout'||c==='_cashin'){const typ=c==='_cashout'?'out':'deposit',amt=Math.abs(x.a);
      if(!(STATE.cash||[]).some(e=>e.type===typ&&Math.abs(e.a-amt)<0.005&&dayGap(e.d,x.d)<=3))(STATE.cash=STATE.cash||[]).push({id:'c_'+uid(),d:x.d,type:typ,a:amt,who:'',note:'From the bank file',auto:true})}});
  const twins=src==='nw'?healTwins():0;
  Object.keys(parsed.reduce((o,x)=>(o[x.d.slice(0,7)]=1,o),{})).forEach(k=>saveTx(k));
  let msg=`Added ${added} new lines (${merged} matched to entries you typed, ${skipped} already there${asked?`, ${asked} need your say-so`:''}).`;
  if(twins)msg+=` Merged ${twins} bank line${twins>1?'s':''} that were in twice (same day and amount, once without a balance).`;
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
