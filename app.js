(() => {
  "use strict";

  const money = (n, symbol = "£") => {
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

  // Shared LT fee settings — used by every tab so the fee is always part of margin
  const BANK_FEE_PCT = 1.8;
  const feeRateInput = document.getElementById("fee-rate");
  const bankFeeToggle = document.getElementById("bank-fee");
  let recalcAll = () => {};

  function effectiveFeeRate() {
    const baseRate = num(feeRateInput);
    const effectiveRatePct = baseRate + (bankFeeToggle.checked ? BANK_FEE_PCT : 0);
    document.getElementById("effective-rate").textContent =
      `Effective rate: ${effectiveRatePct.toFixed(1)}%${bankFeeToggle.checked ? ` (${baseRate.toFixed(1)}% + ${BANK_FEE_PCT}% bank fee)` : ""}`;
    return effectiveRatePct / 100;
  }
  [feeRateInput, bankFeeToggle].forEach((el) =>
    el.addEventListener(feeRateInput === el ? "input" : "change", () => recalcAll())
  );

  // Tab 1: cost + price -> profit/fee/margin/markup
  const mCost = document.getElementById("m-cost");
  const mPrice = document.getElementById("m-price");
  function calcMargin(feeRate) {
    const cost = num(mCost);
    const price = num(mPrice);
    const profitBeforeFee = price - cost;
    const ltFeeAmount = price * feeRate;
    const netProfit = profitBeforeFee - ltFeeAmount;
    const margin = price !== 0 ? (netProfit / price) * 100 : 0;
    const markup = cost !== 0 ? (profitBeforeFee / cost) * 100 : 0;
    setValue("m-profit", money(profitBeforeFee), profitBeforeFee < 0);
    setValue("m-ltfee", money(ltFeeAmount), ltFeeAmount < 0);
    setValue("m-net", money(netProfit), netProfit < 0);
    setValue("m-margin", pct(margin), margin < 0);
    setValue("m-markup", pct(markup), markup < 0);
  }
  [mCost, mPrice].forEach((el) => el.addEventListener("input", () => recalcAll()));

  // Tab 2: cost + target net margin -> price (net margin = after LT fee)
  const pCost = document.getElementById("p-cost");
  const pMargin = document.getElementById("p-margin");
  function calcPrice(feeRate) {
    const cost = num(pCost);
    const margin = num(pMargin) / 100;
    const denom = 1 - feeRate - margin;
    const price = denom !== 0 ? cost / denom : 0;
    const profitBeforeFee = price - cost;
    const ltFeeAmount = price * feeRate;
    const netProfit = profitBeforeFee - ltFeeAmount;
    const markup = cost !== 0 ? (profitBeforeFee / cost) * 100 : 0;
    setValue("p-price", money(price), price < 0);
    setValue("p-profit", money(profitBeforeFee), profitBeforeFee < 0);
    setValue("p-ltfee", money(ltFeeAmount), ltFeeAmount < 0);
    setValue("p-net", money(netProfit), netProfit < 0);
    setValue("p-markup", pct(markup), markup < 0);
  }
  [pCost, pMargin].forEach((el) => el.addEventListener("input", () => recalcAll()));

  // Tab 3: price + target net margin -> max cost (net margin = after LT fee)
  const cPrice = document.getElementById("c-price");
  const cMargin = document.getElementById("c-margin");
  function calcCost(feeRate) {
    const price = num(cPrice);
    const margin = num(cMargin) / 100;
    const cost = price * (1 - feeRate - margin);
    const profitBeforeFee = price - cost;
    const ltFeeAmount = price * feeRate;
    const netProfit = profitBeforeFee - ltFeeAmount;
    const markup = cost !== 0 ? (profitBeforeFee / cost) * 100 : 0;
    setValue("c-cost", money(cost), cost < 0);
    setValue("c-profit", money(profitBeforeFee), profitBeforeFee < 0);
    setValue("c-ltfee", money(ltFeeAmount), ltFeeAmount < 0);
    setValue("c-net", money(netProfit), netProfit < 0);
    setValue("c-markup", pct(markup), markup < 0);
  }
  [cPrice, cMargin].forEach((el) => el.addEventListener("input", () => recalcAll()));

  // Tab 4: LT Pricing Tool — Option 1
  const ltCustomer = document.getElementById("lt-customer");
  const ltLabour = document.getElementById("lt-labour");
  const ltMaterials = document.getElementById("lt-materials");
  function calcLT(feeRate) {
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

    setValue("lt-profit", money(profitBeforeFee), profitBeforeFee < 0);
    setValue("lt-ltfee", money(ltFeeAmount), ltFeeAmount < 0);
    setValue("lt-net", money(netProfit), netProfit < 0);
    setValue("lt-margin-before", pct(marginBeforeFee), marginBeforeFee < 0);
    setValue("lt-margin-net", pct(marginNet), marginNet < 0);
    setValue("lt-markup", pct(markup), markup < 0);
    setValue("lt-labour-pct", pct(labourPct), labourPct < 0);
  }
  [ltCustomer, ltLabour, ltMaterials].forEach((el) => el.addEventListener("input", () => recalcAll()));

  recalcAll = () => {
    const feeRate = effectiveFeeRate();
    calcMargin(feeRate);
    calcPrice(feeRate);
    calcCost(feeRate);
    calcLT(feeRate);
  };

  recalcAll();
})();
