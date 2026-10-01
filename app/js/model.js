/* ===== data model: plan versions (change from a month onwards), state, categories ===== */
function defaultPlan(){return{
  income:[{id:'i_annie',name:'Annie wages',amount:8333,day:28},{id:'i_sander',name:'Sander wages',amount:1500,day:29,varies:true}],
  bills:[
    {id:'b_ctax',name:'Council tax',amount:260,day:2,kind:'need',freq:'monthly',match:'council'},
    {id:'b_gas',name:'Gas & electric',amount:282,day:21,kind:'need',freq:'monthly',variable:true,match:'gas'},
    {id:'b_water',name:'Water',amount:53,day:2,kind:'need',freq:'monthly',guess:1,match:'water'},
    {id:'b_bb',name:'Broadband and TV',amount:9.1,day:2,kind:'need',freq:'monthly',guess:1,match:'broadband'},
    {id:'b_phone',name:'Annie / girls phone',amount:77.94,day:2,kind:'need',freq:'monthly',match:'phone'},
    {id:'b_vet',name:'Vet cover',amount:20,day:2,kind:'need',freq:'monthly',guess:1,match:'vet'},
    {id:'b_gym',name:'Sander and Erin gym',amount:67,day:2,kind:'want',freq:'monthly',guess:1,match:'gym'},
    {id:'b_netflix',name:'Netflix',amount:18.99,day:10,kind:'want',freq:'monthly',match:'netflix'},
    {id:'b_phyl',name:'Phyliss',amount:8.68,day:10,kind:'want',freq:'monthly',guess:1,match:'phyliss'},
    {id:'b_prime',name:'Amazon Prime',amount:8.99,day:10,kind:'want',freq:'monthly',guess:1,match:'prime'},
    {id:'b_spot',name:'Spotify',amount:21.99,day:24,kind:'want',freq:'monthly',match:'spotify'}],
  debts:[
    {id:'d_mort',name:'Mortgage',type:'mortgage',pay:1818.69,day:2,apr:null,extra:0},
    {id:'d_tax',name:'Tax bill repayment',type:'tax',pay:1000,day:9,apr:0,extra:0},
    {id:'d_mbna',name:'MBNA loan (Annie car)',type:'loan',pay:0,day:1,apr:null,extra:0},
    {id:'d_ikea',name:'Ikea repayment',type:'loan',pay:0,day:1,apr:0,extra:0}],
  vars:[
    {id:'v_shop',name:'Shopping',budget:650,kind:'need',cardOK:true},
    {id:'v_home',name:'Home maintenance',budget:100,kind:'need',cardOK:true},
    {id:'v_round',name:'Roundups',budget:15,kind:'need',cardOK:false},
    {id:'v_gen',name:'General Merchandise',budget:200,kind:'want',cardOK:true},
    {id:'v_eat',name:'Takeout / Restaurants / Entertainment',budget:200,kind:'want',cardOK:true},
    {id:'v_kids',name:'Kids and school',budget:0,kind:'need',cardOK:true},
    {id:'v_petrol',name:'Petrol',budget:0,kind:'need',cardOK:true},
    {id:'v_pets',name:'Pets and grooming',budget:0,kind:'need',cardOK:true},
    {id:'v_hol',name:'Holiday and trips',budget:0,kind:'want',cardOK:true},
    {id:'v_xmas',name:'Christmas and gifts',budget:0,kind:'want',cardOK:true},
    {id:'v_other',name:'Other',budget:0,kind:'want',cardOK:true}],
  transfers:[
    {id:'t_annie',name:'Annie spending money',amount:750,rule:'afterpay',day:2,catId:'v_acash'},
    {id:'t_sander',name:'Sander spending money',amount:500,rule:'afterpay',day:2,catId:'v_scash'}],
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
  assets:[],nwSnaps:[],notes:{},rules:null,amexOwed:0,catMap:{},lumps:[],
  startedAt:todayISO()}}
const DEFAULT_RULES=[
 ['TESCO','v_shop'],['SAINSBURY','v_shop'],['ASDA','v_shop'],['LIDL','v_shop'],['ALDI','v_shop'],['WAITROSE','v_shop'],['MORRISONS','v_shop'],['OCADO','v_shop'],['CO-OP','v_shop'],['COSTCO','v_shop'],['M&S','v_shop'],
 ['ROUND UP','v_round'],['ROUNDUP','v_round'],
 ['AMAZON','v_gen'],['ARGOS','v_gen'],['EBAY','v_gen'],['NEXT','v_gen'],['PRIMARK','v_gen'],['CURRYS','v_gen'],['ETSY','v_gen'],
 ['DELIVEROO','v_eat'],['JUST EAT','v_eat'],['UBER EATS','v_eat'],['COSTA','v_eat'],['STARBUCKS','v_eat'],['PRET','v_eat'],['NANDO','v_eat'],['MCDONALD','v_eat'],['CINEMA','v_eat'],['ODEON','v_eat'],
 ['B&Q','v_home'],['SCREWFIX','v_home'],['WICKES','v_home'],['HOMEBASE','v_home'],
 ['SHELL','v_petrol'],['ESSO','v_petrol'],['BP ','v_petrol'],['PETS AT HOME','v_pets'],['VETS','v_pets'],['PARENTPAY','v_kids'],
 ['MOONPIG','v_xmas'],['INTERFLORA','v_xmas']];
/* ---- global stores ---- */
let VERSIONS=[{from:'2000-01',at:Date.now(),by:'start',note:'Starting plan, from your Sept 2026 sheet',plan:defaultPlan()}];
let STATE=defaultState();
let TX={};            // month -> [{id,d,t,a,c,s:'man'|'nw'|'amex',p:'bank'|'amex'|'cash',b,m}]
let HIST={};          // month -> imported sheet month
let DRAFT=null;       // unsaved plan edits (a copy of the plan in force next month)
STATE.rules=DEFAULT_RULES.map(([k,c])=>({k,c}));
const planFor=k=>{let v=VERSIONS[0];for(const x of VERSIONS)if(x.from<=k)v=x;return v.plan};
const versionFor=k=>{let v=VERSIONS[0];for(const x of VERSIONS)if(x.from<=k)v=x;return v};
const curPlan=()=>planFor(thisMonthK());
const nextMonthK=()=>addMonthsK(thisMonthK(),1);
const isStartPlan=()=>VERSIONS.length===1&&VERSIONS[0].by==='start';
function commitPlan(plan,from,note,by,correct){
  if(correct){const v=versionFor(from);v.plan=clone(plan);if(note)v.note=note;return}
  const ex=VERSIONS.find(x=>x.from===from);
  if(ex){ex.plan=clone(plan);ex.note=note||ex.note;ex.at=Date.now();ex.by=by||ex.by}
  else{VERSIONS.push({from,at:Date.now(),by:by||'',note:note||'',plan:clone(plan)});VERSIONS.sort((a,b)=>a.from<b.from?-1:1)}
}
const catName=(p,id)=>{const v=p.vars.find(x=>x.id===id);return v?v.name:id==='_skip'?'Not spending':'Unsorted'};
const allVars=()=>{const seen={},out=[];[...VERSIONS].reverse().forEach(v=>v.plan.vars.forEach(x=>{if(!seen[x.id]){seen[x.id]=1;out.push(x)}}));return out};
/* ---- turning old sheet names into your categories ---- */
function canonVar(n){
  const s=(n||'').toLowerCase().trim();
  if(/^annie cash|^annie spend|^annie to pay/.test(s))return'v_acash';
  if(/^sander cash|^sander spend|^sander to pay/.test(s))return'v_scash';
  if(/^shopping/.test(s))return'v_shop';
  if(/general merch/.test(s))return'v_gen';
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
