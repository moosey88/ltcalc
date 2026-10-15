/* ===== charts (plain SVG, no libraries) ===== */
function lineChart(id,days,o){
  const W=760,H=o.h||230,L=56,R=12,T=12,B=26,n=days.length;if(!n)return'';
  let lo=0,hi=-1e12;o.series.forEach(s=>days.forEach(d=>{const v=d[s.k];if(v!=null){if(v<lo)lo=v;if(v>hi)hi=v}}));
  if(o.buffer!=null&&o.buffer>hi)hi=o.buffer;hi=Math.max(hi,100);const pad=(hi-lo)*.06;lo=lo<0?lo-pad:0;hi+=pad;
  const x=i=>L+(W-L-R)*i/Math.max(1,n-1),y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
  const st=niceStep((hi-lo)/4);let g='';for(let v=Math.ceil(lo/st)*st;v<=hi;v+=st)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="${Math.abs(v)<1?1.5:1}"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${GBP(v)}</text>`;
  let xl='',last='';days.forEach((d,i)=>{const dt=new Date(d.t),k=ym(d.t);
    if(o.years){if(dt.getUTCMonth()===0&&(n<130||dt.getUTCFullYear()%2===0))xl+=`<text x="${x(i)}" y="${H-7}" text-anchor="middle">${dt.getUTCFullYear()}</text>`;return}
    if(k!==last){last=k;if(dt.getUTCDate()<=3||i===0){if(n>200&&dt.getUTCMonth()%2)return;xl+=`<text x="${x(i)}" y="${H-7}" text-anchor="middle">${MON[dt.getUTCMonth()]}</text>`}}});
  const paths=o.series.map(s=>{let d='',open=false;days.forEach((p,i)=>{if(p[s.k]==null){open=false;return}d+=(open?'L':'M')+x(i).toFixed(1)+' '+y(p[s.k]).toFixed(1);open=true});return`<path d="${d}" fill="none" stroke="${s.c}" stroke-width="2" ${s.dash?'stroke-dasharray="6 4"':''} stroke-linejoin="round"/>`}).join('');
  const buf=o.buffer!=null?`<line x1="${L}" x2="${W-R}" y1="${y(o.buffer)}" y2="${y(o.buffer)}" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="3 4"/><text x="${L+4}" y="${y(o.buffer)-4}" style="fill:var(--warn)">buffer ${GBP(o.buffer)}</text>`:'';
  attachTip(id,days,o.series,x,W,L,R,n,o.years);
  return`<div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(o.label)}">${g}${xl}${buf}${paths}<line class="xh" y1="${T}" y2="${H-B}" stroke="var(--ink2)" style="display:none"/></svg><div class="tip"></div></div>`}
function attachTip(id,days,series,x,W,L,R,n,years){
  setTimeout(()=>{const el=document.getElementById(id);if(!el)return;const svg=el.querySelector('svg'),tip=el.querySelector('.tip'),xh=el.querySelector('.xh');
    svg.addEventListener('pointermove',e=>{const r=svg.getBoundingClientRect();let i=Math.round(((e.clientX-r.left)/r.width*W-L)/(W-L-R)*(n-1));i=Math.max(0,Math.min(n-1,i));const d=days[i];
      xh.style.display='';xh.setAttribute('x1',x(i));xh.setAttribute('x2',x(i));tip.style.display='block';
      tip.innerHTML='<b>'+(years?fmonthT(d.t):fdate(d.t))+'</b><br>'+series.filter(s=>d[s.k]!=null).map(s=>s.name+': '+GBP(d[s.k])).join('<br>');
      tip.style.left=Math.min(Math.max(0,x(i)/W*r.width+10),r.width-170)+'px';tip.style.top='6px'});
    svg.addEventListener('pointerleave',()=>{tip.style.display='none';xh.style.display='none'})},0)}
/* bank balance with shaded months, trend of monthly lows, and rows of dots for what goes out */
function bankChart(id,days,events,buffer,showTrend=true){
  const n=days.length;if(!n)return'';
  const W=760,H=300,L=58,R=12,T=12,CH=200;
  let mx=Math.max(...days.map(d=>d.bank),buffer||0)*1.05;mx=Math.max(mx,100);const mn=Math.min(0,...days.map(d=>d.bank))*1.05;
  const x=i=>L+(W-L-R)*i/Math.max(1,n-1),y=v=>T+(CH-T)*(1-(v-mn)/(mx-mn));
  let svg='',cur=null,xs=0;const bands=[];
  days.forEach((d,i)=>{const k=ym(d.t);if(k!==cur){if(cur!=null)bands.push([cur,xs,i]);cur=k;xs=i}});bands.push([cur,xs,n-1]);
  bands.forEach(([k,a,b],i)=>{if(i%2===0)svg+=`<rect x="${x(a)}" y="${T}" width="${Math.max(0,x(b)-x(a))}" height="${CH-T}" fill="var(--surface2)" opacity=".7"/>`;
    if(b-a>12||n<100)svg+=`<text x="${(x(a)+x(b))/2}" y="${CH+16}" text-anchor="middle">${MON[monthOf(k)-1]}</text>`});
  const st=niceStep((mx-mn)/4);for(let v=Math.ceil(mn/st)*st;v<=mx;v+=st)svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="${Math.abs(v)<1?1.5:1}"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${GBP(v)}</text>`;
  if(buffer!=null)svg+=`<line x1="${L}" x2="${W-R}" y1="${y(buffer)}" y2="${y(buffer)}" stroke="var(--warn)" stroke-dasharray="3 4" stroke-width="1.5"/>`;
  svg+=`<path d="${days.map((d,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(d.bank).toFixed(1)).join('')}" fill="none" stroke="var(--bank)" stroke-width="2.2" stroke-linejoin="round"/>`;
  const lows=[];bands.forEach(([k,a,b])=>{if(b-a>14){let j=a;for(let i=a;i<=b;i++)if(days[i].bank<days[j].bank)j=i;lows.push([j,days[j].bank])}});
  let trend='';
  if(showTrend&&lows.length>=2){lows.forEach(([i,v])=>svg+=`<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="var(--surface)" stroke="var(--bank)" stroke-width="2"/>`);
    const mi=avg(lows.map(l=>l[0])),mv=avg(lows.map(l=>l[1]));const den=sum(lows,l=>(l[0]-mi)**2)||1;const sl=sum(lows,l=>(l[0]-mi)*(l[1]-mv))/den;
    const a0=Math.max(0,lows[0][0]-5),a1=Math.min(n-1,lows[lows.length-1][0]+8);
    svg+=`<path d="M${x(a0)} ${y(mv+sl*(a0-mi))} L${x(a1)} ${y(mv+sl*(a1-mi))}" stroke="var(--good)" stroke-width="2" stroke-dasharray="7 4" fill="none"/>`;
    trend=sl*30.4}
  const rows={bill:CH+40,debt:CH+60,sav:CH+80},nm={bill:'Bills',debt:'Debts',sav:'Savings'},col={bill:'var(--want)',debt:'var(--debt)',sav:'var(--save)'};
  Object.keys(rows).forEach(k=>svg+=`<text x="${L-14}" y="${rows[k]+4}" text-anchor="end">${nm[k]}</text><line x1="${L}" x2="${W-R}" y1="${rows[k]}" y2="${rows[k]}" stroke="var(--line)"/>`);
  const t0=days[0].t;
  events.forEach(e=>{const kind=e.k==='bill'||e.k==='yearly'||e.k==='xfer'||e.k==='one'?'bill':e.k==='debt'||e.k==='lump'?'debt':e.k==='save'?'sav':null;if(!kind)return;
    const i=Math.round((e.t-t0)/DAY);if(i<0||i>=n)return;const a=Math.abs(e.a),r=3+Math.min(6,Math.sqrt(a)/9);
    svg+=`<circle cx="${x(i)}" cy="${rows[kind]}" r="${r.toFixed(1)}" fill="${col[kind]}" opacity=".85"><title>${fdateS(e.t)}: ${esc(e.n)} ${GBP(a)}</title></circle>`});
  attachTip(id,days,[{k:'bank',name:'Bank balance'}],x,W,L,R,n,false);
  return{html:`<div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Bank balance with bills, debts and savings">${svg}<line class="xh" y1="${T}" y2="${CH}" stroke="var(--ink2)" style="display:none"/></svg><div class="tip"></div></div>`,trend}}
function barChart(ms,k1='inc',k2='out',l1='Money in',l2='Money out'){
  const W=760,H=220,L=56,R=8,T=10,B=26;const mx=Math.max(...ms.map(m=>Math.max(m[k1],m[k2])),1)*1.08,st=niceStep(mx/4);
  const y=v=>T+(H-T-B)*(1-v/mx),bw=(W-L-R)/ms.length;let g='';
  for(let v=0;v<=mx;v+=st)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${GBP(v)}</text>`;
  let b='';ms.forEach((m,i)=>{const x0=L+i*bw+bw*.14,w=bw*.34;b+=`<g><title>${fmonth(m.k)}: ${l1} ${GBP(m[k1])}, ${l2} ${GBP(m[k2])}</title><rect x="${x0}" y="${y(m[k1])}" width="${w}" height="${Math.max(0,y(0)-y(m[k1]))}" rx="3" fill="var(--bank)"/><rect x="${x0+w+2}" y="${y(m[k2])}" width="${w}" height="${Math.max(0,y(0)-y(m[k2]))}" rx="3" fill="var(--amex)"/><text x="${L+i*bw+bw/2}" y="${H-7}" text-anchor="middle">${MON[monthOf(m.k)-1]}</text></g>`});
  return`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${l1} and ${l2} each month">${g}${b}</svg><div class="legend"><span><i style="border-color:var(--bank)"></i>${l1}</span><span><i style="border-color:var(--amex)"></i>${l2}</span></div>`}
function spark(vals,c){if(vals.length<2)return'';const W=200,H=40,mx=Math.max(...vals,1);const p=vals.map((v,i)=>(i/(vals.length-1)*W).toFixed(1)+','+(H-2-(v/mx)*(H-6)).toFixed(1)).join(' ');return`<svg viewBox="0 0 ${W} ${H}" width="100%" height="40" preserveAspectRatio="none" aria-hidden="true"><polyline points="${p}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`}
function miniBars(vals,hi,col){const mx=Math.max(...vals.map(Math.abs),1),w=100/vals.length;
  return`<svg viewBox="0 0 100 38" width="100%" height="46" preserveAspectRatio="none" aria-hidden="true">${vals.map((v,i)=>`<rect x="${(i*w+1).toFixed(1)}" y="${(36-Math.max(v,0)/mx*34).toFixed(1)}" width="${(w-2).toFixed(1)}" height="${(Math.max(v,0)/mx*34+.01).toFixed(1)}" fill="${i===hi?'var(--want)':(col||'var(--bank)')}" opacity="${i===hi?1:.55}"/>`).join('')}</svg>`}
/* cumulative spend through a month against budget pace */
function paceChart(cum,budget,n,dom){
  const W=760,H=200,L=54,R=16,T=14,B=26;const top=Math.max(budget,cum[cum.length-1]||0,1)*1.1;
  const x=d=>L+(W-L-R)*(d-1)/Math.max(1,n-1),y=v=>T+(H-T-B)*(1-v/top);
  const st=niceStep(top/3);let g='';for(let v=0;v<=top;v+=st)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${GBP(v)}</text>`;
  [1,8,15,22,n].forEach(d=>g+=`<text x="${x(d)}" y="${H-7}" text-anchor="middle">${d}</text>`);
  const act='M'+cum.map((v,i)=>x(i+1).toFixed(1)+' '+y(v).toFixed(1)).join(' L'),last=cum[cum.length-1]||0;
  const proj=dom>=1?`<path d="M${x(dom)} ${y(last)} L${x(n)} ${y(last/dom*n)}" stroke="var(--bank)" stroke-width="2" stroke-dasharray="2 4" fill="none"/>`:'';
  return`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Spending this month against budget">${g}<path d="M${x(1)} ${y(0)} L${x(n)} ${y(budget)}" stroke="var(--muted)" stroke-width="2" stroke-dasharray="6 4" fill="none"/>${proj}<path d="${act}" stroke="var(--bank)" stroke-width="2.5" fill="none" stroke-linejoin="round"/><circle cx="${x(dom)}" cy="${y(last)}" r="5" fill="var(--bank)" stroke="var(--surface)" stroke-width="2"/><text x="${W-R}" y="${y(budget)-6}" text-anchor="end">Budget ${GBP(budget)}</text></svg>`}
