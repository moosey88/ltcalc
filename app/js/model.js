/* ===== data model: plan versions (change from a month onwards), state, categories ===== */
function defaultPlan(){return{
  income:[{id:'i_annie',name:'Annie salary (APEX)',amount:8333,day:1},{id:'i_dirloan',name:'Annie directors loan from APEX (covers MBNA)',amount:479.16,day:1},{id:'i_sander',name:'Sander (from his own account)',amount:1500,day:29,varies:true},{id:'i_niamh',name:'Niamh: phone contribution',amount:15,day:1}],
  bills:[
    {id:'b_ctax',name:'Council tax',amount:260,day:1,kind:'need',freq:'monthly',match:'waverley'},
    {id:'b_gas',name:'Gas & electric (Octopus)',amount:282,day:1,kind:'need',freq:'monthly',variable:true,match:'octopus'},
    {id:'b_water',name:'Water (South East Water)',amount:53,day:1,kind:'need',freq:'monthly',match:'south east'},
    {id:'b_bb',name:'Broadband and TV (Virgin Media)',amount:43.5,day:4,kind:'need',freq:'monthly',match:'virgin media'},
    {id:'b_phone',name:'Phones (Sky Mobile)',amount:131.89,day:25,kind:'need',freq:'monthly',match:'sky mobile'},
    {id:'b_vet',name:'Vet cover (Linvet)',amount:20,day:14,kind:'need',freq:'monthly',match:'linvet'},
    {id:'b_gym',name:'Gym (Everyone Active)',amount:69.99,day:1,kind:'want',freq:'monthly',match:'everyone active'},
    {id:'b_netflix',name:'Netflix',amount:18.99,day:22,kind:'want',freq:'monthly',match:'netflix'},
    {id:'b_phyl',name:'Phyliss (Tuckwell Chase)',amount:8.68,day:1,kind:'want',freq:'monthly',match:'tuckwell'},
    {id:'b_prime',name:'Amazon Prime',amount:8.99,day:9,kind:'want',freq:'monthly',match:'amazon prime'},
    {id:'b_spot',name:'Spotify',amount:21.99,day:5,kind:'want',freq:'monthly',match:'spotify'},
    {id:'b_homeserve',name:'Homeserve',amount:19.74,day:14,kind:'need',freq:'monthly',match:'homeserve'},
    {id:'b_cartax',name:'Car tax (Mini)',amount:23.18,day:1,kind:'need',freq:'monthly',match:'dvla'}],
  debts:[
    {id:'d_mort',name:'Mortgage (Halifax)',type:'mortgage',pay:1818.69,day:1,apr:3.78,extra:0,match:'halifax',note:'Rate inferred from your spreadsheet (about 3.78%) - check it'},
    {id:'d_tax',name:'HMRC tax on shares (not vested yet)',type:'tax',pay:1000,day:1,apr:0,extra:0,match:'hmrc',note:'About £40,000 still owed, to be confirmed'},
    {id:'d_mbna',name:'MBNA loan (Annie car)',type:'loan',pay:479.16,day:1,apr:null,extra:0,match:'mbna',note:'Annie is paid a directors loan of the same amount by APEX each month'},
    {id:'d_ikea',name:'Ikea repayment',type:'loan',pay:0,day:1,apr:0,extra:0}],
  vars:[
    {id:'v_shop',name:'Shopping',budget:650,kind:'need',cardOK:true,subs:[{id:'main',name:'Main shop'},{id:'topup',name:'Top-up shops'},{id:'entertain',name:'Entertaining'}]},
    {id:'v_home',name:'Home maintenance',budget:100,kind:'need',cardOK:true},
    {id:'v_round',name:'Roundups',budget:15,kind:'need',cardOK:false},
    {id:'v_gen',name:'General Merchandise',budget:200,kind:'want',cardOK:true},
    {id:'v_take',name:'Takeaways',budget:100,kind:'want',cardOK:true},
    {id:'v_rest',name:'Restaurants and cafes',budget:100,kind:'want',cardOK:true},
    {id:'v_ent',name:'Entertainment',budget:0,kind:'want',cardOK:true},
    {id:'v_kids',name:'Kids',budget:0,kind:'need',cardOK:true},
    {id:'v_pets',name:'Pets and grooming',budget:0,kind:'need',cardOK:true},
    {id:'v_hol',name:'Holiday and trips',budget:0,kind:'want',cardOK:true},
    {id:'v_well',name:'Wellbeing and personal care',budget:0,kind:'need',cardOK:true},
    {id:'v_car',name:'Car and travel',budget:0,kind:'need',cardOK:true},
    {id:'v_xmas',name:'Christmas and gifts',budget:0,kind:'want',cardOK:true},
    {id:'v_other',name:'Other',budget:0,kind:'want',cardOK:true}],
  transfers:[
    {id:'t_annie',name:'Annie spending money',amount:750,rule:'day',day:2,catId:'v_acash'},
    {id:'t_sander',name:'Sander spending money',amount:500,rule:'day',day:2,catId:'v_scash'}],
  savings:{monthly:2000,day:1},
  tax:[{id:'tx_main',name:'Personal tax bill',last:null,adj:100,date:'2027-04-30'}],
  goals:[],
  oneoffs:[],
  amex:{closeDay:5,dueDays:25,rate:1,pv:1.2},
  amexShare:0
}}
function defaultState(){return{
  bank:null,asOf:todayISO(),buffer:500,flagLimit:100,flagExcl:['v_shop','v_acash','v_scash'],
  cashOpening:0,cashOpenDate:todayISO(),cash:[],
  debtBal:{},debtStart:{},debtLog:{},goalSaved:{},taxSaved:{},general:0,
  assets:[],nwSnaps:[],notes:{},rules:null,rulesV:5,amexOwed:0,catMap:{},lumps:[],
  startedAt:todayISO(),incSeed:1,incAct:{}}}
const DEFAULT_RULES=[
 ['TESCO EXPRESS','v_shop','topup'],['SAINSBURYS LOCAL','v_shop','topup'],['SIMPLY FOOD','v_shop','topup'],['CO-OP','v_shop','topup'],
 ['TESCO','v_shop','main'],['SAINSBURY','v_shop','main'],['ASDA','v_shop','main'],['LIDL','v_shop','main'],['ALDI','v_shop','main'],['WAITROSE','v_shop','main'],['MORRISONS','v_shop','main'],['OCADO','v_shop','main'],['COSTCO','v_shop','main'],
 ['FESTIVAL','v_hol'],['BRITISH AIRWAYS','v_hol'],['RYANAIR','v_hol'],['EASYJET','v_hol'],['LE SHUTTLE','v_hol'],['EUROTUNNEL','v_hol'],['DUTY FREE','v_hol'],['HOLIDAY','v_hol'],
 ['VETS NOW','v_pets'],['WUFF','v_pets'],['SQUIRES','v_home'],['HALFORDS','v_home'],['BOOTS','v_gen'],['GO OUTDOORS','v_gen'],['KURT GEIGER','v_gen'],
 ['PAYPAL','v_gen'],
 ['ROUND UP','v_round'],['ROUNDUP','v_round'],
 ['AMAZON','v_gen'],['AMZN','v_gen'],['TEMU','v_gen'],['HOME BARGAINS','v_gen'],['DUNELM','v_gen'],['PRIMARK','v_gen'],['ARGOS','v_gen'],['EBAY','v_gen'],['NEXT','v_gen'],['PRIMARK','v_gen'],['CURRYS','v_gen'],['ETSY','v_gen'],
 ['DELIVEROO','v_take'],['JUST EAT','v_take'],['UBER EATS','v_take'],['DOMINO','v_take'],['MCDONALD','v_take'],['KFC','v_take'],['GREGGS','v_take'],
 ['COSTA','v_rest'],['STARBUCKS','v_rest'],['PRET','v_rest'],['NANDO','v_rest'],['PIZZA EXPRESS','v_rest'],['HARVESTER','v_rest'],
 ['CINEMA','v_ent'],['ODEON','v_ent'],['CINEWORLD','v_ent'],['TICKETMASTER','v_ent'],
 ['B&Q','v_home'],['SCREWFIX','v_home'],['WICKES','v_home'],['HOMEBASE','v_home'],
 ['PETS AT HOME','v_pets'],['VETS4PETS','v_pets'],['PARENTPAY','v_kids'],['MOONPIG','v_xmas'],['INTERFLORA','v_xmas']];
const ruleObjs=()=>DEFAULT_RULES.map(([k,c,s])=>({k,c,s}));
/* categories that only exist in your history (the sheet combined them, or they are no longer household spending) */
const LEGACY_VARS=[
 {id:'v_eat',name:'Takeout / Restaurants / Entertainment (combined in your sheet)',kind:'want',budget:0,legacy:true},
 {id:'v_petrol',name:'Petrol (before it became a business expense)',kind:'need',budget:0,legacy:true}];
/* ---- global stores ---- */
let VERSIONS=[{from:'2000-01',at:Date.now(),by:'start',note:'Starting plan, from your Sept 2026 sheet',plan:defaultPlan()}];
let STATE=defaultState();
let TX={};            // month -> [{id,d,t,a,c,s:'man'|'nw'|'amex',p:'bank'|'amex'|'cash',b,m}]
let HIST={};          // month -> imported sheet month
let DRAFT=null;       // unsaved plan edits (a copy of the plan in force next month)
STATE.rules=ruleObjs();STATE.rulesV=5;
const planFor=k=>{let v=VERSIONS[0];for(const x of VERSIONS)if(x.from<=k)v=x;return v.plan};
const versionFor=k=>{let v=VERSIONS[0];for(const x of VERSIONS)if(x.from<=k)v=x;return v};
const curPlan=()=>planFor(thisMonthK());
const nextMonthK=()=>addMonthsK(thisMonthK(),1);
const isStartPlan=()=>VERSIONS.length===1&&VERSIONS[0].by==='start';
/* money ticked off or typed in since the last bank balance was taken */
const sinceBalance=(asOf)=>sum(Object.values(TX).flat().filter(t=>(t.s==='tick'||t.s==='man')&&t.p==='bank'&&t.d>(asOf||STATE.asOf||'0')),t=>t.a);
function commitPlan(plan,from,note,by,correct){
  try{audit(correct?'Corrected plan':'Saved plan',`from ${from}${note?': '+note:''}`)}catch(e){}
  if(correct){const v=versionFor(from);v.plan=clone(plan);if(note)v.note=note;return}
  const ex=VERSIONS.find(x=>x.from===from);
  if(ex){ex.plan=clone(plan);ex.note=note||ex.note;ex.at=Date.now();ex.by=by||ex.by}
  else{VERSIONS.push({from,at:Date.now(),by:by||'',note:note||'',plan:clone(plan)});VERSIONS.sort((a,b)=>a.from<b.from?-1:1)}
}
const catName=(p,id)=>{const v=p.vars.find(x=>x.id===id);return v?v.name:id==='_skip'?'Not spending':'Unsorted'};
const allVars=()=>{const seen={},out=[];[...VERSIONS].reverse().forEach(v=>v.plan.vars.forEach(x=>{if(!seen[x.id]){seen[x.id]=1;out.push(x)}}));LEGACY_VARS.forEach(x=>{if(!seen[x.id])out.push(x)});return out};
const activeVars=()=>curPlan().vars.filter(v=>!v.legacy);
/* category picker options: a category, then its sub-categories as "Shopping › Top-up shops" (value v_shop:topup) */
function catOptions(sel,selSub,vars){const cur=sel?sel+(selSub?':'+selSub:''):'';let o='';
  (vars||activeVars()).forEach(v=>{o+=`<option value="${v.id}" ${cur===v.id?'selected':''}>${esc(v.name)}</option>`;(v.subs||[]).forEach(s=>{o+=`<option value="${v.id}:${s.id}" ${cur===v.id+':'+s.id?'selected':''}>${esc(v.name)} › ${esc(s.name)}</option>`})});
  const lg=allVars().find(v=>v.legacy&&v.id===sel);if(lg)o+=`<option value="${lg.id}" selected>${esc(lg.name)}</option>`;return o}
const subName=(cid,sid)=>{const v=allVars().find(x=>x.id===cid);const s=v&&(v.subs||[]).find(x=>x.id===sid);return s?s.name:''};
/* ---- turning old sheet names into your categories ---- */
function canonVar(n){
  const s=(n||'').toLowerCase().trim();
  if(/^annie cash|^annie spend|^annie to pay/.test(s))return'v_acash';
  if(/^sander cash|^sander spend|^sander to pay/.test(s))return'v_scash';
  if(/^shopping/.test(s))return'v_shop';
  if(/general merch/.test(s))return'v_gen';
  if(/takeout.*(restaurant|entertain)|takeout\/entertain|restaurants?.*entertain/.test(s))return'v_eat';
  if(/^restaurants?$/.test(s))return'v_rest';
  if(/^takeout$/.test(s))return'v_take';
  if(/takeout|restaurant|entertain/.test(s))return'v_eat';
  if(/home maint|cleaning/.test(s))return'v_home';
  if(/roundup|round up/.test(s))return'v_round';
  if(/erin|kids|parent ?pay|school|clothing|niamh accom/.test(s))return'v_kids';
  if(/petrol|fuel/.test(s))return'v_petrol';
  if(/groom|pickles|pets?/.test(s))return'v_pets';
  if(/holiday|weekend away/.test(s))return'v_hol';
  if(/christmas|birthday|gift/.test(s))return'v_xmas';
  return'v_other'}
const canonLine=c=>{const s=(c||'').toLowerCase();if(/cash balance/.test(s))return null;if(/van|latitude|expenses/.test(s))return'v_other';return canonVar(c)};
function fixedType(n){const s=(n||'').toLowerCase();
  if(/mortgage/.test(s))return'mortgage';
  if(/credit card|amex|car finance|tax repayment|mat+ress|sofa|hot tub|service plan|latitude/.test(s))return'debt';
  if(/^savings|premium bonds|shares/.test(s))return'save';
  if(/pocket money/.test(s))return'xfer';
  return'bill'}
const fixedKey=n=>(n||'').toLowerCase().replace(/[^a-z]+/g,' ').trim().replace(/^(dora|mini|sander) car tax$/,m=>m).replace(/ +/g,' ');
const isWages=n=>/wage/i.test(n||'');

/* bring plans and rules saved before the category changes up to date (idempotent) */
function migratePlan(p){
  let changed=false;const has=id=>p.vars.some(v=>v.id===id);
  (p.transfers||[]).forEach(x=>{if(x.rule==='afterpay'){x.rule='day';x.day=x.day||2;changed=true}});
  const eat=p.vars.find(v=>v.id==='v_eat');
  if(eat){const b=eat.budget||0;p.vars=p.vars.filter(v=>v.id!=='v_eat');
    if(!has('v_take'))p.vars.push({id:'v_take',name:'Takeaways',budget:Math.round(b/2),kind:'want',cardOK:true});
    if(!has('v_rest'))p.vars.push({id:'v_rest',name:'Restaurants and cafes',budget:Math.round(b/2),kind:'want',cardOK:true});
    changed=true}
  if(!has('v_ent')&&(has('v_take')||has('v_rest'))){p.vars.push({id:'v_ent',name:'Entertainment',budget:0,kind:'want',cardOK:true});changed=true}
  if(has('v_petrol')){p.vars=p.vars.filter(v=>v.id!=='v_petrol');changed=true}
  [['v_well','Wellbeing and personal care','need'],['v_car','Car and travel','need']].forEach(([id,name,kind])=>{if(!has(id)){const i=p.vars.findIndex(v=>v.id==='v_xmas');p.vars.splice(i<0?p.vars.length:i,0,{id,name,budget:0,kind,cardOK:true});changed=true}});
  const k=p.vars.find(v=>v.id==='v_kids');if(k&&k.name!=='Kids'){k.name='Kids';changed=true}
  const sh=p.vars.find(v=>v.id==='v_shop');if(sh&&!sh.subs){sh.subs=[{id:'main',name:'Main shop'},{id:'topup',name:'Top-up shops'},{id:'entertain',name:'Entertaining'}];changed=true}
  if(!p.bankFix){p.bankFix=1;changed=true;const D=defaultPlan(),OLD={b_ctax:'council',b_gas:'gas',b_water:'water',b_bb:'broadband',b_phone:'phone',b_vet:'vet',b_gym:'gym',b_phyl:'phyliss',b_prime:'prime'};
    p.bills.forEach(b=>{const n=D.bills.find(x=>x.id===b.id);if(n&&OLD[b.id]&&b.match===OLD[b.id]){Object.assign(b,{name:n.name,amount:n.amount,day:n.day,match:n.match});delete b.guess}});
    D.bills.forEach(n=>{if(!p.bills.some(b=>b.id===n.id))p.bills.push(n)});
    const DO={d_mort:'Mortgage',d_tax:'Tax bill repayment',d_mbna:'MBNA loan (Annie car)'};
    p.debts.forEach(d=>{const n=D.debts.find(x=>x.id===d.id);if(n&&DO[d.id]===d.name){const keep=d.pay;Object.assign(d,n);if(d.id==='d_mort')d.pay=keep||n.pay}});
    const a=p.income.find(i=>i.id==='i_annie');if(a&&a.name==='Annie wages'){a.name='Annie salary (APEX)';a.day=1}
    const s=p.income.find(i=>i.id==='i_sander');if(s&&s.name==='Sander wages')s.name='Sander (from his own account)';
    if(!p.income.some(i=>i.id==='i_dirloan'))p.income.splice(1,0,D.income[1])}
  return changed}
/* income actually received, by month and stream (STATE.incAct[month][id]); falls back to the planned amount */
const incFromTx=(k,id)=>{if(k>=thisMonthK()||!(TX[k]&&TX[k].length))return null;const r=TX[k].filter(t=>t.c==='_inc'&&t.sc===id&&t.a>0);return r.length?sum(r,t=>t.a):0};
const incFor=(k,i)=>{const a=STATE.incAct&&STATE.incAct[k]&&STATE.incAct[k][i.id];if(a!=null)return a;const b=incFromTx(k,i.id);return b==null?i.amount:b};
const incActualTotal=(k,P)=>sum((P||planFor(k)).income,i=>incFor(k,i));
function migrateAll(){
  if(!STATE.incSeed){STATE.incSeed=1;VERSIONS.forEach(v=>{if(!v.plan.income.some(i=>i.id==='i_niamh'||/niamh/i.test(i.name)))v.plan.income.push({id:'i_niamh',name:'Niamh: phone contribution',amount:15,day:1})})}
  VERSIONS.forEach(v=>migratePlan(v.plan));
  if(STATE.rulesV!==5){const defKeys=new Set(DEFAULT_RULES.map(r=>r[0]));const learned=(STATE.rules||[]).filter(r=>!defKeys.has(r.k)&&r.c!=='v_eat'&&r.c!=='v_petrol');STATE.rules=[...ruleObjs(),...learned];STATE.rulesV=5}
  if(DRAFT)migratePlan(DRAFT)}
