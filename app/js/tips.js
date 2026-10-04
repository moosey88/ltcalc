/* ===== Hover guidance: plain-English help on labels, headings, buttons and figures ===== */
const TIPS=[
 [/^in the bank$/,'Your NatWest balance from the last balance you typed or uploaded, plus anything you have ticked or typed since then.'],
 [/^household cash$/,'Notes and coins kept for shared spending. It is separate from the bank.'],
 [/^left over before payday$/,'The lowest your cash gets before the next wages arrive, after every planned bill, the rest of your budgets, what you owe Amex and your buffer. Positive means safe. Negative means you would dip below the buffer first.'],
 [/^bank check$/,'Compares the balance you typed or uploaded with what your own entries and ticks predicted. A difference means something is missing, duplicated or ticked too early. Fix it in the Weekly check.'],
 [/^amex$/,'Safe means the cash to pay each Amex statement will be in the bank on its due date. Only the joint cardholder counts.'],
 [/^left over,/,'Money in minus everything going out in that month (bills, debts, budgets, transfers, savings). It is one month, so a yearly bill landing in it can make it look worse than a normal month. The grey line shows what it is without yearly bills.'],
 [/^first overdrawn$/,'The first day the bank balance goes below zero in this scenario. Hover the chart to see the balance on any day.'],
 [/^bank in 12 mo$/,'Where the bank balance ends in 12 months. Savings transfers have already left the bank, so a high number means you are not spending it all.'],
 [/^net worth 12 mo$/,'Bank + savings + the part of debt payments that reduces what you owe, over 12 months. Interest is not counted as growth. Home value and pensions are not included.'],
 [/^debt free$/,'The month the balance reaches zero with this change, against the current plan.'],
 [/^interest saved$/,'Interest you no longer pay over the whole life of the loan. It depends on the rate and remaining term, so check both on the Debts tab.'],
 [/^cash you put in$/,'Everything extra you pay in until the debt ends: the lump sum plus the monthly extra for every month it keeps running. It is not lost. It reduces what you owe, which is why interest falls.'],
 [/^interest saved per £1$/,'Interest saved divided by the cash you put in. Above £1 means the money works harder here than it would sitting in cash. Compare it with the rate your savings earn.'],
 [/^early repayment charge$/,'A fee some lenders charge for paying a lump sum above the yearly allowance. Check your mortgage terms before paying a large amount.'],
 [/^money in$/,'Wages and other money arriving in the month.'],[/^money out$/,'Bills, debts, yearly bills, budgets, transfers and one-offs leaving the bank, not counting savings.'],
 [/^to savings$/,'Transfers to Premium Bonds and savings pots. Still your money, but no longer in the bank.'],
 [/^left over$/,'Money in minus money out and savings. Negative means the month spends more than it brings in.'],
 [/^bank at month end$/,'Bank balance on the last day of the month.'],[/^savings$/,'Total in savings at month end.'],[/^debt left$/,'What you still owe on all debts at month end.'],
 [/^net worth change$/,'Growth in what you own minus what you owe that month: bank, savings and debt paid off. Interest does not count.'],
 [/^spent$/,'Money spent this month so far, from bank lines, typed entries and ticks.'],[/^budget$/,'What you planned to spend in this category this month.'],
 [/^left$/,'Budget minus spent. Red means over budget.'],[/^progress$/,'Green is on pace, amber is ahead of pace, red is over budget. Pace means the share of the budget you would have used by this day of the month.'],
 [/^rate$/,'Yearly interest rate on the debt.'],
 [/^act now$/,'Will cause a problem soon unless you change something.'],[/^soon$/,'Needs attention in the next few weeks.'],[/^idea$/,'An opportunity, not a problem.'],
 [/^covered$/,'The bank stays above your buffer for the 30 days after this bill.'],[/^tight$/,'The bank gets above zero but below your buffer in the 30 days after this bill.'],[/^not covered$/,'The bank goes overdrawn in the 30 days after this bill unless something changes.'],
 [/^ticked$/,'You marked this as done. It counts straight away and is swapped for the real bank line when you upload.'],[/^typed$/,'You entered this by hand. It is merged with the bank line when the file arrives so it is never counted twice.'],
 [/^bank ✓$/,'Found on the uploaded bank file.'],
 [/^back to baseline/,'Puts every slider back to what your current plan says.'],[/^make this my plan/,'Saves these changes as your real plan from the month you choose. Nothing changes until you press it.'],
 [/^tick all due/,'Ticks every item whose due date has passed and is not on the bank file yet. Untick any that did not happen.'],
 [/^monthly savings transfer/,'Fixed amount moved to savings every month. Cutting it frees cash but slows your savings.'],
 [/^share of card-friendly spend/,'How much of shopping, general, eating out and home spend goes on the Amex. Amex is paid a month later, which helps cash flow if the bank can cover it.'],
 [/^extra each month/,'Added to the normal payment every month until the debt ends. Check your lender\'s yearly overpayment limit.'],
 [/^one-off lump sum/,'A single payment from savings or the bank on the date you choose. Early repayment charges may apply.'],
 [/^changes start from/,'Changes only apply from this month. Past months never change.'],
 [/^current plan$/,'Your saved plan with nothing changed.'],[/^this scenario$/,'Your plan with the slider changes applied.'],[/ buffer$/,'The minimum you want to keep in the bank. Set in Settings.'],
 [/^weekly check/,'After each upload the app compares ticks, plan and bank file. Fix items here instead of hunting through other tabs.'],
 [/^heads-up/,'Big bills coming and suggestions to keep cash healthy and goals on track.'],
 [/^upload a statement/,'Choose NatWest or Amex. Amex lines for anyone but the joint cardholder are left out.'],
 [/^still to tick/,'Bills, wages and transfers the plan expects that are not yet on the bank file or ticked.'],
 [/^all budgets/,'Every category this month with spend against budget.'],
 [/^earliest we could both stop$/,'The first year that stopping work leaves your savings and pensions lasting to the age you set, after spending, debts and state pensions. It assumes you keep saving what you set until then.'],
 [/^if we stop in$/,'The year you picked (or the earliest year if you left Annie\'s age blank), and whether the money lasts.'],
 [/^savings and pensions then$/,'Savings plus pensions the year work stops, in today\'s money. Businesses and your home are not included here.'],
 [/^safe yearly income from assets$/,'A rule of thumb: a small percentage of your pot each year, adjusted for inflation, that should last a long retirement. Compare it with what you need a year.'],
 [/^what brings it forward$/,'Each line changes one thing and shows the new earliest year, so you can see what matters most.'],
 [/^your businesses/,'Value each business at what it could be sold for. Choose whether it is sold when you stop, keeps paying you, or is left out.'],
 [/^not on the bank yet/,'Counted from your side but missing on the bank file.']
];
function applyTips(){
  document.querySelectorAll('#main .kpi>span,#main .wk small,#main th,#main .lbl,#main h2,#main h3,#main .pill,#main button,#main .legend span,#main label,#main .sl label').forEach(el=>{
    if(el.dataset.tip!==undefined)return;const t=(el.textContent||'').trim().toLowerCase().replace(/\s+/g,' ');if(!t||t.length>70)return;
    const hit=TIPS.find(r=>r[0].test(t));if(hit){el.dataset.tip=hit[1];el.classList.add('hastip')}})}
document.addEventListener('mouseover',e=>{const el=e.target.closest&&e.target.closest('[data-tip]'),tip=document.getElementById('gTip');
  if(!el){if(tip)tip.hidden=true;return}
  if(!tip)return;tip.textContent=el.dataset.tip;tip.hidden=false;const r=el.getBoundingClientRect(),w=280;
  tip.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+'px';tip.style.top=(r.bottom+6+tip.offsetHeight>innerHeight?Math.max(8,r.top-tip.offsetHeight-6):r.bottom+6)+'px'});
document.addEventListener('scroll',()=>{const t=document.getElementById('gTip');if(t)t.hidden=true},true);
