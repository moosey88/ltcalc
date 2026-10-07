/* ===== forecast engine: runs day by day from today's real bank balance ===== */
const monthTx=k=>TX[k]||[];
const spentIn=(k,catId)=>-sum(monthTx(k).filter(t=>t.c===catId),t=>t.a);   // spend is stored negative
const amexOwedNow=()=>(STATE.amexOwed||0)+sum(Object.values(TX).flat().filter(t=>t.p==='amex'&&t.who!=='S'&&(t.a<0||(t.c&&isSpendCat(t.c)))&&t.d>(STATE.amexOwedDate||STATE.startedAt||'0')),t=>-t.a);
function buildGoals(P,st){
  return[...(P.tax||[]).map(t=>({id:t.id,name:t.name,kind:'tax',target:(t.last||0)*((t.adj??100)/100),saved:(st.taxSaved||{})[t.id]||0,date:t.date,monthly:0,spend:true,amex:false,pri:0})),
         ...(P.goals||[]).map(g=>({...g,kind:g.kind||'other',spend:true,saved:(st.goalSaved||{})[g.id]||0,pri:1}))]}
function payDateOf(P,y,m){const md=Math.max(...P.income.map(i=>i.day),28);return U(y,m,Math.min(md,dim(y,m)))}
function simulate(o={}){
  const st=o.state||STATE,asOf=o.asOf||st.asOf,planOf=o.planOf||planFor,horizon=o.horizon||24;
  const s0=parseISO(asOf)+DAY,sd=new Date(s0),end=U(sd.getUTCFullYear(),sd.getUTCMonth()+horizon,sd.getUTCDate()),start=s0;
  const P0=planOf(ym(start)),A0=P0.amex;
  let bank=(st.bank||0)+sinceBalance(asOf),cycle=o.amexOwed!=null?o.amexOwed:amexOwedNow(),cardSpend=0,feeTotal=0;const stmts=[];
  const P1=planOf(ym(start));const G0=buildGoals(P1,st);
  const pots={general:st.general||0,yearly:0};G0.forEach(g=>pots[g.id]=g.saved||0);
  const done={},hit={},gsp={},dbal={};(P1.debts||[]).forEach(d=>dbal[d.id]=st.debtBal[d.id]);
  // dates of savings transfers and of personal transfers
  const sdays=[];for(let d=start;d<=end;d+=DAY){const dt=new Date(d);if(dt.getUTCDate()===Math.min(P1.savings.day,dim(dt.getUTCFullYear(),dt.getUTCMonth())))sdays.push(d)}
  const sset=new Set(sdays),xfer={};
  {let t=U(sd.getUTCFullYear(),sd.getUTCMonth(),1);while(t<=end){const dt=new Date(t),y=dt.getUTCFullYear(),m=dt.getUTCMonth(),P=planOf(ym(t));
    (P.transfers||[]).forEach(x=>{const dd=x.rule==='day'?U(y,m,Math.min(x.day||2,dim(y,m))):Math.min(payDateOf(P,y,m)+2*DAY,U(y,m,dim(y,m)));if(dd>=start&&dd<=end)(xfer[dd]=xfer[dd]||[]).push(x)});t=U(y,m+1,1)}}
  const days=[],months={},events=[];let lowBank={v:1e12,t:0},lowTrue={v:1e12,t:0};
  const lumps=[...(st.lumps||[]),...(o.lumps||[])];
  for(let t=start;t<=end;t+=DAY){
    const dt=new Date(t),y=dt.getUTCFullYear(),m=dt.getUTCMonth(),d=dt.getUTCDate(),n=dim(y,m),k=ym(t),ds=iso(t),P=planOf(k),A=P.amex;
    const M=months[k]||(months[k]={k,inc:0,bills:0,yearly:0,debt:0,lump:0,vars:0,xfer:0,one:0,sav:0,fee:0,goalOut:0,ySet:0});
    const on=day=>d===Math.min(day,n);
    /* bills and debts that were due on or before the balance date but are not on the bank file yet are assumed to leave today */
    if(t===start&&o.overdue!==false&&typeof expectedItems==='function'&&!o.state){const kA=ym(parseISO(asOf)),dA=+asOf.slice(8);
      expectedItems(kA).filter(it=>it.sign<0&&it.kind!=='xfer'&&it.day<=dA&&!tickRow(kA,it.id)&&!bankRowFor(it,kA)).forEach(it=>{const amt=it.amt;bank-=amt;
        if(it.kind==='debt')M.debt+=amt;else if(it.kind==='sav'){M.sav+=amt;pots.general+=amt}else if(it.yearly)M.yearly+=amt;else M.bills+=amt;
        events.push({t,k:it.kind==='debt'?'debt':it.kind==='sav'?'save':it.yearly?'yearly':'bill',n:it.name,a:-amt,overdue:true})})}
    P.income.forEach(i=>{if(on(i.day)){const tk=tickRow(k,i.id),a=tk?tk.a:incFor(k,i);if(!tk)bank+=a;M.inc+=a;if(!tk)events.push({t,k:'in',n:i.name,a})}});
    P.bills.forEach(b=>{
      const fr=b.freq||'monthly';let due=false;
      if(fr==='monthly')due=on(b.day);
      else if(fr==='yearly')due=(m+1)===(b.month||12)&&on(b.day);
      else if(fr==='quarterly')due=((m+1-(b.month||1))%3+3)%3===0&&on(b.day);
      if(!due)return;
      const amt=b.amount;
      if(fr!=='monthly'&&b.spread){const take=Math.min(pots.yearly,amt);pots.yearly-=take;bank-=amt-take;M.yearly+=amt;M.yPot=(M.yPot||0)+take;events.push({t,k:'yearly',n:b.name,a:-amt,variable:!!b.variable})}
      else{if(b.card){cycle+=amt;cardSpend+=amt;const f=amt*(b.fee||0)/100;bank-=f;feeTotal+=f;M.fee+=f}else if(!tickRow(k,b.id))bank-=amt;
        if(fr==='monthly'){M.bills+=amt;if(!tickRow(k,b.id))events.push({t,k:'bill',n:b.name,a:-amt,variable:!!b.variable})}else{M.yearly+=amt;events.push({t,k:'yearly',n:b.name,a:-amt})}}});
    // spread-over-the-year set aside, on the savings day
    if(sset.has(t)){const sp=sum(P.bills.filter(b=>(b.freq||'monthly')!=='monthly'&&b.spread),b=>b.amount/(b.freq==='quarterly'?3:12));if(sp>0){bank-=sp;pots.yearly+=sp;M.ySet+=sp}}
    P.debts.forEach(x=>{if(!(x.id in dbal))dbal[x.id]=st.debtBal[x.id];const tot=(x.pay||0)+(x.extra||0)+(o.extraDebt&&o.extraDebt.id===x.id?o.extraDebt.amt:0);if(!on(x.day)||tot<=0)return;let pay=tot;const b=dbal[x.id];
      if(b!=null){if(b<=0.005)return;const it=b*(x.apr||0)/1200,owe=b+it;pay=Math.min(tot,owe);dbal[x.id]=owe-pay;if(dbal[x.id]<=0.005)dbal[x.id]=0}
      if(!tickRow(k,x.id)){bank-=pay;events.push({t,k:'debt',n:x.name,a:-pay})}M.debt+=pay});
    lumps.forEach(l=>{if(l.date!==ds)return;const nm=(P.debts.find(x=>x.id===l.debt)||{}).name||'debt';let amt=l.amount;const b=dbal[l.debt];if(b!=null)amt=Math.min(amt,b);if(amt<=0)return;
      if(b!=null)dbal[l.debt]=Math.max(0,b-amt);
      if(l.from==='savings'){const tk=Math.min(pots.general,amt);pots.general-=tk;bank-=amt-tk}else bank-=amt;
      const dd=P.debts.find(x=>x.id===l.debt)||{},fee=amt*((dd.erc||0)/100);if(fee>0){bank-=fee;M.lump+=fee}
      M.lump+=amt;events.push({t,k:'lump',n:'Lump sum: '+nm,a:-amt-fee})});
    // variable spending: this month's remaining budget after what you have already spent, spread over the days left
    const share=Math.min(1,Math.max(0,(P.amexShare||0)/100)),curM=(k===ym(start));
    const daysLeft=curM?Math.max(1,n-new Date(start).getUTCDate()+1):n;
    const xcat=new Set((P.transfers||[]).map(x=>x.catId));
    P.vars.forEach(v=>{if(xcat.has(v.id))return;const rem=curM?Math.max(0,v.budget-spentIn(k,v.id)):v.budget;const a=rem/daysLeft;if(a<=0)return;const cp=v.cardOK?a*share:0;cycle+=cp;cardSpend+=cp;bank-=a-cp;M.vars+=a});
    (xfer[t]||[]).forEach(x=>{if(!tickRow(k,x.id)){bank-=x.amount;events.push({t,k:'xfer',n:x.name,a:-x.amount})}M.xfer+=x.amount});
    (P.oneoffs||[]).forEach(oo=>{if(oo.date!==ds)return;M.one+=oo.amount;events.push({t,k:'one',n:oo.name,a:-oo.amount,pay:oo.pay});
      if(oo.pay==='amex'){cycle+=oo.amount;cardSpend+=oo.amount}else if(oo.pay==='savings'){const tk=Math.min(pots.general,oo.amount);pots.general-=tk;bank-=oo.amount-tk}else bank-=oo.amount});
    const G=buildGoals(P,{...st,goalSaved:{},taxSaved:{}});
    if(sset.has(t)){let avail=P.savings.monthly;const stk=tickRow(k,'sav');if(!stk){bank-=avail;events.push({t,k:'save',n:'Transfer to savings',a:-avail})}M.sav+=avail;const idx=sdays.indexOf(t);
      G.forEach(g=>{if(pots[g.id]==null)pots[g.id]=0});
      G.filter(g=>!done[g.id]).sort((a,b)=>a.pri-b.pri||(a.date<b.date?-1:1)).forEach(g=>{const gt=parseISO(g.date);let last=-1;sdays.forEach((s,i)=>{if(s<=gt)last=i});const left=Math.max(1,last-idx+1);
        const need=Math.max(0,g.target-pots[g.id]);let give=g.monthly>0?Math.min(g.monthly,need):need/left;give=Math.min(give,need,avail);pots[g.id]+=give;avail-=give});
      pots.general+=avail}
    G.forEach(g=>{if(pots[g.id]==null)pots[g.id]=0;if(!hit[g.id]&&!done[g.id]&&g.target>0&&pots[g.id]>=g.target-0.005)hit[g.id]=t;
      if(!done[g.id]&&ds===g.date){const sp=Math.min(pots[g.id],g.target);pots[g.id]-=sp;M.goalOut+=sp;if(g.amex){bank+=sp;cycle+=g.target;cardSpend+=g.target}
        gsp[g.id]={t,spent:sp,short:Math.max(0,g.target-sp)};done[g.id]=true;events.push({t,k:'goal',n:g.name,a:-sp,short:Math.max(0,g.target-sp),kind:g.kind})}});
    if(d===Math.min(A.closeDay,n)){if(cycle>0.005)stmts.push({close:t,due:t+A.dueDays*DAY,amt:cycle});cycle=0}
    let pend=0;stmts.forEach(s=>{if(!s.paid){if(s.due===t){bank-=s.amt;s.paid=true;events.push({t,k:'amex',n:'Amex statement due',a:-s.amt})}else pend+=s.amt}});
    let owed=cycle+pend;
    if(P.savings&&P.savings.sweep&&d===n){const sw=Math.max(0,bank-owed-(st.buffer||0));if(sw>0.005){bank-=sw;pots.general+=sw;M.sav+=sw;M.sweep=(M.sweep||0)+sw;events.push({t,k:'save',n:'Surplus moved to savings',a:-sw})}}
    const tru=bank-owed,savT=Object.values(pots).reduce((a,b)=>a+b,0);
    if(bank<lowBank.v)lowBank={v:bank,t};if(tru<lowTrue.v)lowTrue={v:tru,t};
    days.push({t,bank,owed,tru,sav:savT});M.debtLeft=Object.values(dbal).reduce((p,v)=>p+(v||0),0);M.endBank=bank;M.endTrue=tru;M.endSav=savT;
  }
  const Gend=buildGoals(planOf(ym(end)),st);
  const goals=Gend.map(g=>{const ht=hit[g.id],gs=gsp[g.id],dl=parseISO(g.date);let status='ok';
    if(gs&&gs.short>1)status='late';else if(ht&&ht>dl)status='late';else if(!ht&&!gs&&g.target>0)status='beyond';
    const evN=sdays.filter(s=>s<=dl).length;return{...g,hit:ht,gs,status,pot:pots[g.id]||0,reqM:Math.max(0,g.target-g.saved)/Math.max(1,evN)}});
  const buf=st.buffer||0;let verdict='none',why='No spend is on the card in this plan.';
  if(cardSpend>0||cycle>0||stmts.length){verdict='good';why='Every Amex statement is covered by cash you will hold on the due date.';
    if(lowBank.v<0){verdict='bad';why='The bank balance drops below zero on '+fdate(lowBank.t)+'. A card payment could not be made in full.'}
    else if(lowTrue.v<buf){verdict='warn';why='After setting aside what you owe Amex, cash falls to '+GBP(lowTrue.v)+' on '+fdate(lowTrue.t)+', below your '+GBP(buf)+' buffer.'}}
  return{days,months:Object.values(months),events,goals,lowBank,lowTrue,stmts,verdict,why,cardSpend,feeTotal,start,end,nMonths:Math.max(1,horizon),float:cardSpend>0?Math.round(30.4/2+A0.dueDays):0,pots}}
/* ---- plan-only totals for a month (no actuals) ---- */
function planMonth(k,P){
  P=P||planFor(k);const y=+k.slice(0,4),m=monthOf(k)-1;
  const inc=sum(P.income,i=>i.amount);
  let bills=0,yearly=0;
  P.bills.forEach(b=>{const fr=b.freq||'monthly';if(fr==='monthly')bills+=b.amount;else if(fr==='yearly'&&m+1===(b.month||12))yearly+=b.amount;else if(fr==='quarterly'&&((m+1-(b.month||1))%3+3)%3===0)yearly+=b.amount});
  const debt=sum(P.debts,d=>(d.pay||0)+(d.extra||0));
  const xcat=new Set((P.transfers||[]).map(x=>x.catId));
  const vars=sum(P.vars.filter(v=>!xcat.has(v.id)),v=>v.budget),xfer=sum(P.transfers||[],x=>x.amount);
  const one=sum((P.oneoffs||[]).filter(o=>o.date.slice(0,7)===k),o=>o.amount);
  const sav=P.savings.monthly;
  const out=bills+yearly+debt+vars+xfer+one+sav;
  return{k,inc,bills,yearly,debt,vars,xfer,one,sav,out,left:inc-out}}
/* ---- one debt, whole life (runs past the forecast) ---- */
function amort(bal,apr,pay,extra,lump,lumpM){
  if(!(bal>0))return null;pay=(pay||0)+(extra||0);const r=(apr||0)/1200;let b=bal,int=0,i=0;const ser=[b];
  if(pay<=0)return{n:null,int:null,ser};
  while(b>0.005&&i<720){if(i===lumpM&&lump>0){b=Math.max(0,b-lump);if(b<=0.005){ser.push(0);break}}
    const it=b*r;if(pay<=it&&i>12)return{n:null,int:null,ser};int+=it;b=b+it-pay;if(b<0)b=0;i++;ser.push(b)}
  return{n:i,int,ser}}
/* ---- what-if: the same plan with changes, from a month onwards ---- */
function scenarioPlanOf(sc,fromK){
  const cache={};
  return k=>{const base=planFor(k);if(k<fromK)return base;if(cache[k])return cache[k];
    const p=clone(base);
    p.income.forEach(i=>{if(sc.inc[i.id]!=null)i.amount=sc.inc[i.id]});
    p.vars.forEach(v=>{if(sc.vars[v.id]!=null)v.budget=sc.vars[v.id]});
    (p.transfers||[]).forEach(x=>{if(sc.xfer[x.id]!=null)x.amount=sc.xfer[x.id]});
    p.tax.forEach(t=>{if(sc.tax[t.id]!=null)t.adj=sc.tax[t.id]});
    p.savings.monthly=sc.sav;p.savings.sweep=!!sc.sweep;p.amexShare=sc.share;
    const d=p.debts.find(x=>x.id===sc.debtSel);if(d)d.extra=(d.extra||0)+sc.extra;
    return cache[k]=p}}
