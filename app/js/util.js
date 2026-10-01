/* ===== shared helpers ===== */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const GBP=v=>{if(v==null||isNaN(v))return'–';const s=Math.abs(v).toLocaleString('en-GB',{maximumFractionDigits:0});return(v<-0.5?'−':'')+'£'+s};
const GBP2=v=>{if(v==null||isNaN(v))return'–';return(v<0?'−':'')+'£'+Math.abs(v).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DAY=864e5, U=(y,m,d)=>Date.UTC(y,m,d);
const parseISO=s=>{const[a,b,c]=s.split('-').map(Number);return U(a,b-1,c)};
const iso=t=>new Date(t).toISOString().slice(0,10);
const ym=t=>iso(t).slice(0,7);
const dim=(y,m)=>new Date(Date.UTC(y,m+1,0)).getUTCDate();
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONL=['January','February','March','April','May','June','July','August','September','October','November','December'];
const fdate=t=>{if(t==null)return'–';const d=new Date(t);return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+String(d.getUTCFullYear()).slice(2)};
const fdateS=t=>{if(t==null)return'–';const d=new Date(t);return d.getUTCDate()+' '+MON[d.getUTCMonth()]};
const fmonthT=t=>{const d=new Date(t);return MON[d.getUTCMonth()]+' '+d.getUTCFullYear()};
const fmonth=k=>{const[y,m]=k.split('-').map(Number);return MON[m-1]+' '+String(y).slice(2)};
const fmonthLong=k=>{const[y,m]=k.split('-').map(Number);return MONL[m-1]+' '+y};
const uid=()=>Math.random().toString(36).slice(2,8);
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const addDays=(s,n)=>iso(parseISO(s)+n*DAY);
const clone=o=>JSON.parse(JSON.stringify(o));
const monthsBetween=(a,b)=>{const x=new Date(a),y=new Date(b);return(y.getUTCFullYear()-x.getUTCFullYear())*12+y.getUTCMonth()-x.getUTCMonth()};
const addMonthsT=(t,n)=>{const d=new Date(t);return U(d.getUTCFullYear(),d.getUTCMonth()+n,1)};
const addMonthsK=(k,n)=>{const[y,m]=k.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+n,1));return d.toISOString().slice(0,7)};
const monthOf=k=>+k.slice(5);
const thisMonthK=()=>todayISO().slice(0,7);
const ys=n=>n==null?'never at this payment':((Math.floor(n/12)?Math.floor(n/12)+' yr ':'')+(n%12?n%12+' mo':'')).trim()||'0 mo';
const sum=(a,f)=>a.reduce((s,x)=>s+(f?f(x):x),0);
const avg=a=>a.length?sum(a)/a.length:0;
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const pct=v=>Math.round(v)+'%';
const KIND={need:['Need','var(--need)'],want:['Want','var(--want)'],debt:['Debt','var(--debt)'],save:['Saving','var(--save)']};
function niceStep(raw){const mag=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/mag;return(f<1.5?1:f<3?2:f<7?5:10)*mag}
function toast(msg){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',3200)}

function ord(n){const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])}
