/* ===== Reading NatWest and Amex PDF statements in the browser (PDF.js is fetched from cdnjs the first time) ===== */
const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',PDFW_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let pdfJsP=null;
function loadPdfJs(){if(window.pdfjsLib)return Promise.resolve();
  return pdfJsP||(pdfJsP=new Promise((res,rej)=>{const s=document.createElement('script');s.src=PDFJS_URL;s.onload=()=>{pdfjsLib.GlobalWorkerOptions.workerSrc=PDFW_URL;res()};s.onerror=()=>{pdfJsP=null;rej(new Error('Could not load the PDF reader. It needs an internet connection the first time.'))};document.head.appendChild(s)}))}
const PNUM=/^-?£?\s?[\d,]+\.\d{2}$/,pnum=s=>parseFloat(String(s).replace(/[£,\s]/g,''));
const PMON={JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};
async function pdfLines(file){
  await loadPdfJs();const doc=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,pages=[];
  for(let p=1;p<=doc.numPages;p++){const tc=await(await doc.getPage(p)).getTextContent();
    const its=tc.items.map(i=>({s:i.str.trim(),x:i.transform[4],y:i.transform[5]})).filter(i=>i.s).sort((a,b)=>b.y-a.y||a.x-b.x),lines=[];
    its.forEach(i=>{const l=lines[lines.length-1];if(l&&Math.abs(l.y-i.y)<=3)l.items.push(i);else lines.push({y:i.y,items:[i]})});
    lines.forEach(l=>{l.items.sort((a,b)=>a.x-b.x);l.text=l.items.map(i=>i.s).join(' ')});pages.push(lines)}
  return pages}
const pdfKind=pages=>{const t=pages.slice(0,2).map(p=>p.map(l=>l.text).join(' ')).join(' ');return /American Express/i.test(t)&&/Membership Number|Statement of Account/i.test(t)?'amex':/NatWest|Paid In\(|Withdrawn\(|Sort Code/i.test(t)?'nw':null};
function parseNatWestPdf(pages){
  const all=pages.flat().map(l=>l.text).join(' | '),per=all.match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\s+to\s+(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/),
    pv=all.match(/Previous Balance\s*\|?\s*(-?£?[\d,]+\.\d{2})(\s*OD)?/i),nb=all.match(/New Balance\s*\|?\s*(-?£?[\d,]+\.\d{2})(\s*OD)?/i);
  if(!per)throw new Error('Could not find the statement period');
  const endY=+per[6],endM=PMON[per[5]],startY=+per[3],rows=[];let prev=pv?pnum(pv[1])*(pv[2]?-1:1):null,date=null,buf=[];
  const yr=m=>m>endM?startY:endY,iso=(d,m)=>`${yr(m)}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  pages.forEach(lines=>{let on=false;lines.forEach(l=>{
    if(/Description/.test(l.text)&&/Balance\(/.test(l.text)){on=true;buf=[];return}
    if(!on)return;
    const left=l.items.filter(i=>i.x<100).map(i=>i.s).join(' '),dm=left.match(/^(\d{1,2})\s+([A-Z]{3})(?:\s+(\d{4}))?$/);if(dm&&PMON[dm[2]])date=dm[3]?`${dm[3]}-${String(PMON[dm[2]]).padStart(2,'0')}-${String(+dm[1]).padStart(2,'0')}`:iso(+dm[1],PMON[dm[2]]);
    /* numbers (and an OD marker after the balance) in the money columns */
    const nums=[];l.items.forEach((i,k)=>{if(i.x>=340&&PNUM.test(i.s))nums.push({v:pnum(i.s),x:i.x});else if(i.x>=340&&/^OD$/.test(i.s)&&nums.length)nums[nums.length-1].v*=-1;else if(i.x>=340&&/^[\d,]+\.\d{2}\s*OD$/.test(i.s))nums.push({v:-pnum(i.s),x:i.x})});
    const desc=l.items.filter(i=>i.x>=100&&!(i.x>=340&&(PNUM.test(i.s)||/OD$/.test(i.s)))).map(i=>i.s).join(' ');
    if(/BROUGHT FORWARD|CARRIED FORWARD/i.test(desc)){if(nums.length)prev=nums[nums.length-1].v;buf=[];return}
    if(!nums.length){if(desc&&!/^(Page|Account|Statement|Sort|IBAN|BIC)/i.test(desc))buf.push({d:date,t:desc});return}
    const bal=nums[nums.length-1].v,cands=nums.slice(0,-1);if(!cands.length){prev=bal;return}
    let a=null;for(const c of cands){if(prev!=null&&Math.abs(prev+c.v-bal)<.006){a=c.v;break}if(prev!=null&&Math.abs(prev-c.v-bal)<.006){a=-c.v;break}}
    if(a==null){const c=cands[0];a=c.x<392?c.v:-c.v}
    buf.push({d:date,t:desc});const d0=(buf.find(b=>b.d)||{}).d||date;
    rows.push({d:d0,t:buf.map(b=>b.t).join(' ').replace(/\s+/g,' ').trim(),a:Math.round(a*100)/100,b:Math.round(bal*100)/100,who:undefined});buf=[];prev=bal})});
  const chk=nb?pnum(nb[1])*(nb[2]?-1:1):null,last=rows.length?rows[rows.length-1].b:null;
  return{rows,warn:chk!=null&&last!=null&&Math.abs(chk-last)>.006?`The last balance read (${GBP2(last)}) does not match the statement's New Balance (${GBP2(chk)}), so check this file.`:''}}
function parseAmexPdf(pages){
  const all=pages.flat().map(l=>l.text).join(' | '),per=all.match(/Statement Period\s*\|?\s*From\s+(\d{1,2})\s+([A-Za-z]+)\s+to\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if(!per)throw new Error('Could not find the statement period');
  const endY=+per[5],endM=PMON[per[4].slice(0,3).toUpperCase()],rows=[],totals={};let pend=[],warn='';
  const RE=/^([A-Z][a-z]{2})\s+(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{1,2})\s+(.*?)\s+(-?[\d,]+\.\d{2})$/;
  pages.forEach(lines=>lines.forEach(l=>{
    const tm=l.text.match(/Total new spend transactions for\s+(.+?)\s+(-?[\d,]+\.\d{2})$/i);
    if(tm){const who=tm[1].trim();pend.forEach(r=>r.who=amexIsJoint(who)?'A':'S');totals[who]=pnum(tm[2]);rows.push(...pend);pend=[];return}
    const m=l.text.match(RE);
    if(m){const mon=PMON[m[1].toUpperCase()];if(!mon)return;const y=mon>endM?endY-1:endY;
      let t=m[5].replace(/\s+-?[\d,]+\.\d{2}(?=\s|$)/g,' ').replace(/\s+/g,' ').trim();
      pend.push({d:`${y}-${String(mon).padStart(2,'0')}-${String(+m[2]).padStart(2,'0')}`,t,a:-pnum(m[6]),b:null,who:'A'});return}
    if(/^CR$/.test(l.text.trim())&&pend.length){pend[pend.length-1].a=Math.abs(pend[pend.length-1].a)}}));
  /* payments received come before the first cardholder total; keep them as joint */
  rows.push(...pend);
  const bad=Object.entries(totals).filter(([w,t])=>Math.abs(-sum(rows.filter(r=>(amexIsJoint(w)?'A':'S')===r.who&&r.a<0&&!/PAYMENT RECEIVED/i.test(r.t)),r=>r.a)-t)>.02&&Object.keys(totals).length===1);
  return{rows,warn:bad.length?'The lines read do not add up to the statement total, so check this file.':''}}
async function importPdfFile(file){
  const pages=await pdfLines(file),kind=pdfKind(pages);if(!kind)throw new Error('That PDF does not look like a NatWest or Amex statement');
  const r=kind==='amex'?parseAmexPdf(pages):parseNatWestPdf(pages);if(!r.rows.length)throw new Error('No transactions found in that PDF');
  const msg=importRows(r.rows,kind);return`${file.name}: ${kind==='amex'?'Amex':'NatWest'}. ${msg}${r.warn?' '+r.warn:''}`}
