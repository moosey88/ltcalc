(() => {
  "use strict";

  const money = (n, symbol = "$") => {
    if (!isFinite(n)) return `${symbol}0.00`;
    const sign = n < 0 ? "-" : "";
    return `${sign}${symbol}${Math.abs(n).toFixed(2)}`;
  };
  const pct = (n) => {
    if (!isFinite(n)) return "0%";
    const sign = n < 0 ? "-" : "";
    return `${sign}${Math.abs(n).toFixed(1)}%`;
  };
  const num = (el) => {
    const v = parseFloat(el.value.replace(/[^0-9.\-]/g, ""));
    return isFinite(v) ? v : 0;
  };
  const setValue = (id, text, negative) => {
    const el = document.getElementById(id);
    el.textContent = text;
    el.classList.toggle("negative", !!negative);
  };

  // Tabs
  const tabs = document.querySelectorAll(".tab");
  const panels = {
    margin: document.getElementById("panel-margin"),
    price: document.getElementById("panel-price"),
    cost: document.getElementById("panel-cost"),
    lt: document.getElementById("panel-lt"),
  };
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      Object.entries(panels).forEach(([key, panel]) => {
        panel.style.display = key === tab.dataset.tab ? "" : "none";
      });
    });
  });

  // Tab 1: cost + price -> margin/markup/profit
  const mCost = document.getElementById("m-cost");
  const mPrice = document.getElementById("m-price");
  function calcMargin() {
    const cost = num(mCost);
    const price = num(mPrice);
    const profit = price - cost;
    const margin = price !== 0 ? (profit / price) * 100 : 0;
    const markup = cost !== 0 ? (profit / cost) * 100 : 0;
    setValue("m-profit", money(profit), profit < 0);
    setValue("m-margin", pct(margin), margin < 0);
    setValue("m-markup", pct(markup), markup < 0);
  }
  [mCost, mPrice].forEach((el) => el.addEventListener("input", calcMargin));

  // Tab 2: cost + target margin -> price
  const pCost = document.getElementById("p-cost");
  const pMargin = document.getElementById("p-margin");
  function calcPrice() {
    const cost = num(pCost);
    const margin = num(pMargin);
    const denom = 1 - margin / 100;
    const price = denom !== 0 ? cost / denom : 0;
    const profit = price - cost;
    const markup = cost !== 0 ? (profit / cost) * 100 : 0;
    setValue("p-price", money(price), price < 0);
    setValue("p-profit", money(profit), profit < 0);
    setValue("p-markup", pct(markup), markup < 0);
  }
  [pCost, pMargin].forEach((el) => el.addEventListener("input", calcPrice));

  // Tab 3: price + target margin -> max cost
  const cPrice = document.getElementById("c-price");
  const cMargin = document.getElementById("c-margin");
  function calcCost() {
    const price = num(cPrice);
    const margin = num(cMargin);
    const cost = price * (1 - margin / 100);
    const profit = price - cost;
    const markup = cost !== 0 ? (profit / cost) * 100 : 0;
    setValue("c-cost", money(cost), cost < 0);
    setValue("c-profit", money(profit), profit < 0);
    setValue("c-markup", pct(markup), markup < 0);
  }
  [cPrice, cMargin].forEach((el) => el.addEventListener("input", calcCost));

  // Tab 4: LT Pricing Tool — Option 1
  const ltFee = document.getElementById("lt-fee");
  const ltCustomer = document.getElementById("lt-customer");
  const ltLabour = document.getElementById("lt-labour");
  const ltMaterials = document.getElementById("lt-materials");
  function calcLT() {
    const feeRate = num(ltFee) / 100;
    const revenue = num(ltCustomer);
    const labour = num(ltLabour);
    const materials = num(ltMaterials);

    const profitBeforeFee = revenue - labour - materials;
    const ltFeeAmount = revenue * feeRate;
    const netProfit = profitBeforeFee - ltFeeAmount;
    const marginBeforeFee = revenue !== 0 ? (profitBeforeFee / revenue) * 100 : 0;
    const marginNet = revenue !== 0 ? (netProfit / revenue) * 100 : 0;
    const costs = labour + materials;
    const markup = costs !== 0 ? (profitBeforeFee / costs) * 100 : 0;
    const labourPct = revenue !== 0 ? (labour / revenue) * 100 : 0;

    setValue("lt-profit", money(profitBeforeFee, "£"), profitBeforeFee < 0);
    setValue("lt-ltfee", money(ltFeeAmount, "£"), ltFeeAmount < 0);
    setValue("lt-net", money(netProfit, "£"), netProfit < 0);
    setValue("lt-margin-before", pct(marginBeforeFee), marginBeforeFee < 0);
    setValue("lt-margin-net", pct(marginNet), marginNet < 0);
    setValue("lt-markup", pct(markup), markup < 0);
    setValue("lt-labour-pct", pct(labourPct), labourPct < 0);
  }
  [ltFee, ltCustomer, ltLabour, ltMaterials].forEach((el) => el.addEventListener("input", calcLT));

  calcMargin();
  calcPrice();
  calcCost();
  calcLT();
})();
