/* ===== persistence: this device always, shared database when published ===== */
let dbh=null,ME={id:'',name:''},WRITER=true,lastAt={},timers={},AUDIT=[];
const LSK='hc3_';
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(LSK+k))}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(LSK+k,JSON.stringify(v))}catch(e){}};
function setSync(t,c){const a=$('#syncTxt'),b=$('#syncDot');if(a)a.textContent=t;if(b)b.className='dot '+(c||'')}
/* behind-the-scenes trail of who changed what */
function auditWho(){
  if(ME.name)return ME.name;let n='';try{n=localStorage.getItem(LSK+'who')||''}catch(e){}
  if(!n){try{n=(prompt('Your name, so changes can be tracked (for example Annie or Sander)')||'').trim()}catch(e){n=''}if(n){try{localStorage.setItem(LSK+'who',n)}catch(e){}}}
  return n||'Unknown'}
function audit(act,detail){
  try{const e={id:Date.now().toString(36)+uid(),t:new Date().toISOString(),by:auditWho(),act,detail:detail||''};AUDIT.push(e);lsSet('audit',AUDIT.slice(-1500));
    if(dbh)dbSet('audit/'+e.id,{json:JSON.stringify(e)})}catch(e){}}
function loadLocal(){
  let v=lsGet('versions'),s=lsGet('state');let any=false;
  /* a copy of the app that carries your data starts from it the first time it is opened in a browser */
  if(!v&&!s&&window.SEED){try{lsSet('versions',window.SEED.versions);lsSet('state',window.SEED.state);Object.keys(window.SEED.tx).forEach(k=>lsSet('tx_'+k,window.SEED.tx[k]));v=window.SEED.versions;s=window.SEED.state}catch(e){}}
  if(v&&v.length){VERSIONS=v;any=true}
  if(s){STATE=Object.assign(defaultState(),s);any=true}
  if(!STATE.rules)STATE.rules=ruleObjs();migrateAll();AUDIT=lsGet('audit')||[];
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(LSK+'tx_')){TX[k.slice(LSK.length+3)]=JSON.parse(localStorage.getItem(k))}}}catch(e){}
  if(window.HISTORY&&window.HISTORY.months)ingestHist(window.HISTORY.months);
  return any}
function ingestHist(months){for(const k in months)HIST[k]=months[k]}
async function dbSet(path,obj){
  if(!dbh)return;
  try{lastAt[path]=Date.now();await dbh.doc(path).set(Object.assign({at:lastAt[path],by:ME.id||''},obj));setSync('Saved · shared','ok')}
  catch(e){setSync(e&&e.code==='invalid_argument'?'Read-only: ask for Contributor access':'Not synced ('+(e&&e.code||'error')+')','bad')}
}
function persistAll(){
  lsSet('versions',VERSIONS);lsSet('state',STATE);
  setSync('Saving…','');clearTimeout(timers.all);
  timers.all=setTimeout(async()=>{
    if(!dbh){setSync('Saved on this device only','bad');return}
    await dbSet('hh/plan',{json:JSON.stringify(VERSIONS)});
    await dbSet('hh/state',{json:JSON.stringify(STATE)});
  },500)}
function saveTx(k){
  lsSet('tx_'+k,TX[k]||[]);
  if(!dbh)return;
  clearTimeout(timers['tx'+k]);
  timers['tx'+k]=setTimeout(()=>dbSet('tx/'+k,{json:JSON.stringify(TX[k]||[])}),400)}
async function connectDb(){
  let db=null,user=null;
  try{db=await claude.use('db');user=await claude.use('user')}catch(e){}
  if(!db){setSync('Saved on this device only','bad');return false}
  dbh=db;
  try{if(user){ME.id=await user.id();try{const m=await user.me();ME.name=(m&&m.name)||''}catch(e){}}}catch(e){}
  const busy=()=>{const a=document.activeElement;return a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)&&a.type!=='range'};
  const apply=(path,fn)=>db.doc(path).onSnapshot(snap=>{
    if(!snap.exists)return;const d=snap.data();
    if(d.at&&d.at===lastAt[path]){setSync('Saved · shared','ok');return}
    try{fn(JSON.parse(d.json));setSync('Synced','ok');if(!busy())render()}catch(e){}},e=>setSync('Not synced ('+(e&&e.code||'error')+')','bad'));
  apply('hh/plan',v=>{if(Array.isArray(v)&&v.length){VERSIONS=v;migrateAll();lsSet('versions',v)}});
  apply('hh/state',s=>{STATE=Object.assign(defaultState(),s);if(!STATE.rules)STATE.rules=ruleObjs();migrateAll();lsSet('state',STATE)});
  db.collection('tx').onSnapshot(snap=>{snap.docs.forEach(d=>{try{TX[d.id]=JSON.parse(d.data().json)}catch(e){}});try{reconcileTicks()}catch(e){}if(!busy())render()},()=>{});
  db.collection('audit').onSnapshot(snap=>{const a=[];snap.docs.forEach(d=>{try{a.push(JSON.parse(d.data().json))}catch(e){}});if(a.length){const have=new Set(a.map(x=>x.id));AUDIT.forEach(x=>{if(!have.has(x.id))a.push(x)});AUDIT=a.sort((x,y)=>x.t<y.t?-1:1);lsSet('audit',AUDIT.slice(-1500))}},()=>{});
  db.collection('hist').onSnapshot(snap=>{let n=0;snap.docs.forEach(d=>{try{const o=JSON.parse(d.data().json);const ms=o.months||(o.k?{[o.k]:o}:null);if(ms){ingestHist(ms);n++}}catch(e){}});if(n){resetHist();if(!busy())render()}},()=>{});
  setSync('Connected','ok');return true}
