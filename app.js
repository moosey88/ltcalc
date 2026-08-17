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

  // Shared LT fee settings — used by every tab. The fee is always charged
  // on (price - materials), never on the materials portion of the price.
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
  feeRateInput.addEventListener("input", () => recalcAll());
  bankFeeToggle.addEventListener("change", () => recalcAll());

  // Tab 1: labour + materials + price -> profit/fee/margin/markup
  // Fee = feeRate * (price - materials)
  const mLabour = document.getElementById("m-labour");
  const mMaterials = document.getElementById("m-materials");
  const mPrice = document.getElementById("m-price");
  function calcMargin(feeRate) {
    const labour = num(mLabour);
    const materials = num(mMaterials);
    const price = num(mPrice);
    const profitBeforeFee = price - labour - materials;
    const ltFeeAmount = feeRate * (price - materials);
    const netProfit = profitBeforeFee - ltFeeAmount;
    const margin = price !== 0 ? (netProfit / price) * 100 : 0;
    const costs = labour + materials;
    const markup = costs !== 0 ? (profitBeforeFee / costs) * 100 : 0;
    setValue("m-profit", money(profitBeforeFee), profitBeforeFee < 0);
    setValue("m-ltfee", money(ltFeeAmount), ltFeeAmount < 0);
    setValue("m-net", money(netProfit), netProfit < 0);
    setValue("m-margin", pct(margin), margin < 0);
    setValue("m-markup", pct(markup), markup < 0);
  }
  [mLabour, mMaterials, mPrice].forEach((el) => el.addEventListener("input", () => recalcAll()));

  // Tab 2: labour + materials + target net margin -> price
  // netProfit = price - labour - materials - feeRate*(price - materials) = target * price
  // => price = (labour + materials*(1 - feeRate)) / (1 - feeRate - target)
  const pLabour = document.getElementById("p-labour");
  const pMaterials = document.getElementById("p-materials");
  const pMargin = document.getElementById("p-margin");
  function calcPrice(feeRate) {
    const labour = num(pLabour);
    const materials = num(pMaterials);
    const target = num(pMargin) / 100;
    const denom = 1 - feeRate - target;
    const price = denom !== 0 ? (labour + materials * (1 - feeRate)) / denom : 0;
    const profitBeforeFee = price - labour - materials;
    const ltFeeAmount = feeRate * (price - materials);
    const netProfit = profitBeforeFee - ltFeeAmount;
    const costs = labour + materials;
    const markup = costs !== 0 ? (profitBeforeFee / costs) * 100 : 0;
    setValue("p-price", money(price), price < 0);
    setValue("p-profit", money(profitBeforeFee), profitBeforeFee < 0);
    setValue("p-ltfee", money(ltFeeAmount), ltFeeAmount < 0);
    setValue("p-net", money(netProfit), netProfit < 0);
    setValue("p-markup", pct(markup), markup < 0);
  }
  [pLabour, pMaterials, pMargin].forEach((el) => el.addEventListener("input", () => recalcAll()));

  // Tab 3: price + materials + target net margin -> max labour
  // labour = price*(1 - target - feeRate) - materials*(1 - feeRate)
  const cPrice = document.getElementById("c-price");
  const cMaterials = document.getElementById("c-materials");
  const cMargin = document.getElementById("c-margin");
  function calcCost(feeRate) {
    const price = num(cPrice);
    const materials = num(cMaterials);
    const target = num(cMargin) / 100;
    const labour = price * (1 - target - feeRate) - materials * (1 - feeRate);
    const totalCost = labour + materials;
    const profitBeforeFee = price - totalCost;
    const ltFeeAmount = feeRate * (price - materials);
    const netProfit = profitBeforeFee - ltFeeAmount;
    const markup = totalCost !== 0 ? (profitBeforeFee / totalCost) * 100 : 0;
    setValue("c-labour", money(labour), labour < 0);
    setValue("c-totalcost", money(totalCost), totalCost < 0);
    setValue("c-profit", money(profitBeforeFee), profitBeforeFee < 0);
    setValue("c-ltfee", money(ltFeeAmount), ltFeeAmount < 0);
    setValue("c-net", money(netProfit), netProfit < 0);
    setValue("c-markup", pct(markup), markup < 0);
  }
  [cPrice, cMaterials, cMargin].forEach((el) => el.addEventListener("input", () => recalcAll()));

  // Tab 4: LT Pricing Tool — Option 1
  // Fee = feeRate * (revenue - materials)
  const ltCustomer = document.getElementById("lt-customer");
  const ltLabour = document.getElementById("lt-labour");
  const ltMaterials = document.getElementById("lt-materials");
  function calcLT(feeRate) {
    const revenue = num(ltCustomer);
    const labour = num(ltLabour);
    const materials = num(ltMaterials);

    const profitBeforeFee = revenue - labour - materials;
    const ltFeeAmount = feeRate * (revenue - materials);
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
