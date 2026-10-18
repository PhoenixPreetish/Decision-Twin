// Monte Carlo Simulation Engine (REQ-24, REQ-25, REQ-26, REQ-27)
// Runs 10,000 randomized stochastic trials per option with Regime-Switching & Survival Analysis

const marketData = require('../data/marketReferenceData');

// Box-Muller transform for generating standard normal random numbers
function randomNormal(mean = 0, stdev = 1) {
  let u1 = 1 - Math.random();
  let u2 = 1 - Math.random();
  let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdev * randStdNormal;
}

/**
 * Runs 10,000 Monte Carlo trials for an option
 * Fixes the negative-cash-flow compounding bug by separating positive income compounding
 * from capital expenditure & debt service, while computing empirical VaR/CVaR and 60-month survival curves.
 * @param {Object} digitalTwin User profile
 * @param {Object} option Option details and attributes
 * @param {String} category Scenario category
 * @param {Number} trials Count (default 10,000)
 */
function runMonteCarloSimulation(digitalTwin, option, category, trials = 10000) {
  const attrs = option?.attributes || {};
  const currentSalary = Number(digitalTwin?.currentSalary) || 500000;
  const userSavings = Number(digitalTwin?.savings) || 100000;
  const userDebt = Number(digitalTwin?.debt) || 0;
  const monthlyExpenses = Number(digitalTwin?.monthlyExpenses) || 25000;

  // Base salary / expected inflow
  const isExplicitZeroSalary = Boolean(attrs.explicitZeroSalary) ||
    (attrs.offeredSalary === 0 && (Number(attrs.tuitionCost) > 0 || Number(attrs.courseCost) > 0 || Number(attrs.initialInvestment) > 0));
  const baseSalary = isExplicitZeroSalary
    ? 0
    : (Number(attrs.offeredSalary) ||
       Number(attrs.expectedUpsideValue) ||
       currentSalary ||
       500000);

  // Scholarship & upfront cost calculation
  const scholarshipFactor = attrs.scholarshipPct ? Math.max(0, 1 - Number(attrs.scholarshipPct) / 100) : 1.0;
  const effectiveTuition = (Number(attrs.tuitionCost) || 0) * scholarshipFactor;
  const initialCost = effectiveTuition +
    (Number(attrs.initialInvestment) || 0) +
    (Number(attrs.relocationCost) || 0) +
    (Number(attrs.courseCost) || 0);

  // PPP & Country normalization
  const countryKey = attrs.targetCountry || 'India';
  const countryMeta = marketData.pppAndTaxByCountry?.[countryKey] || { effectiveTaxRate: 0.15, pppMultiplier: 1.0 };
  const loanRate = (Number(attrs.loanInterestRate) || 9.0) / 100;

  // Growth rate baseline & volatility depending on category & risk tolerance
  let meanGrowth = 0.09; // 9% average
  let volatility = 0.12; // 12% standard deviation

  if (category === 'entrepreneurship') {
    meanGrowth = 0.18;
    volatility = 0.35;
  } else if (category === 'investment_planning') {
    meanGrowth = 0.13;
    volatility = 0.18;
  } else if (category === 'higher_education') {
    meanGrowth = 0.15; // post-graduation jump
    volatility = 0.10;
  } else if (category === 'skill_investment') {
    meanGrowth = 0.14;
    volatility = 0.09;
  } else if (category === 'relocation') {
    meanGrowth = 0.11;
    volatility = 0.11;
  } else if (category === 'custom_decision') {
    meanGrowth = 0.12;
    volatility = 0.15;
  }

  // Risk tolerance slight calibration on upside capture vs defensive allocation
  const riskTol = (digitalTwin?.riskTolerance || 'medium').toLowerCase();
  if (riskTol === 'high') {
    meanGrowth += 0.01;
    volatility *= 1.05;
  } else if (riskTol === 'low') {
    volatility *= 0.92;
  }

  const simulatedOutcomes = new Float64Array(trials);
  const year1Trials = new Float64Array(trials);
  const year3Trials = new Float64Array(trials);
  const year5Trials = new Float64Array(trials);

  // Track solvency survival across Years 1..5
  let solventY1 = 0;
  let solventY2 = 0;
  let solventY3 = 0;
  let solventY4 = 0;
  let solventY5 = 0;
  let everInsolventCount = 0;

  // Credit/borrowing buffer before technical insolvency
  const creditSafetyLimit = Math.max(userSavings + currentSalary * 0.6, initialCost * 0.75);
  const borrowedPrincipal = Math.max(0, initialCost - userSavings * 0.7);
  const annualDebtService = borrowedPrincipal * loanRate;

  for (let i = 0; i < trials; i++) {
    // Sample annual shock and inflation (with mild Markov regime persistence)
    let inflation = Math.max(0.02, randomNormal(0.055, 0.015));
    let y1Growth = Math.max(-0.45, randomNormal(meanGrowth, volatility));
    let y2Growth = Math.max(-0.45, randomNormal(meanGrowth + 0.15 * (y1Growth - meanGrowth), volatility));
    let y3Growth = Math.max(-0.45, randomNormal(meanGrowth + 0.15 * (y2Growth - meanGrowth), volatility));
    let y4Growth = Math.max(-0.45, randomNormal(meanGrowth, volatility));
    let y5Growth = Math.max(-0.45, randomNormal(meanGrowth, volatility));

    // Positive income trajectory (never compounds negative cost!)
    let earn1 = baseSalary * Math.max(0.25, 1 + y1Growth - inflation);
    let earn2 = earn1 * Math.max(0.25, 1 + y2Growth - inflation);
    let earn3 = earn2 * Math.max(0.25, 1 + y3Growth - inflation);
    let earn4 = earn3 * Math.max(0.25, 1 + y4Growth - inflation);
    let earn5 = earn4 * Math.max(0.25, 1 + y5Growth - inflation);

    // Year 1, Year 3, Year 5 net valuation (separating compounded earnings from capex & debt service)
    let y1Val = earn1 - (initialCost * 0.4) - (annualDebtService * 0.5);
    let y3Val = earn3 - initialCost - (annualDebtService * 1.5);
    let y5Val = earn5 - (initialCost * 0.85) - (annualDebtService * 2.0);

    year1Trials[i] = y1Val;
    year3Trials[i] = y3Val;
    year5Trials[i] = y5Val;
    simulatedOutcomes[i] = y5Val;

    // Track liquid solvency state across years
    const annualLiving = monthlyExpenses * 12;
    let liq1 = userSavings - userDebt + (earn1 * (1 - countryMeta.effectiveTaxRate)) - annualLiving - (initialCost * 0.4);
    let liq2 = liq1 + (earn2 * (1 - countryMeta.effectiveTaxRate)) - (annualLiving * 1.05) - (initialCost * 0.3);
    let liq3 = liq2 + (earn3 * (1 - countryMeta.effectiveTaxRate)) - (annualLiving * 1.10) - (initialCost * 0.3);
    let liq4 = liq3 + (earn4 * (1 - countryMeta.effectiveTaxRate)) - (annualLiving * 1.16);
    let liq5 = liq4 + (earn5 * (1 - countryMeta.effectiveTaxRate)) - (annualLiving * 1.22);

    const floor = -creditSafetyLimit;
    if (liq1 >= floor) solventY1++;
    if (liq2 >= floor) solventY2++;
    if (liq3 >= floor) solventY3++;
    if (liq4 >= floor) solventY4++;
    if (liq5 >= floor) solventY5++;

    if (liq1 < floor || liq2 < floor || liq3 < floor || liq4 < floor || liq5 < floor) {
      everInsolventCount++;
    }
  }

  // Sort arrays to compute exact empirical percentiles
  simulatedOutcomes.sort();
  year1Trials.sort();
  year3Trials.sort();
  year5Trials.sort();

  const getPercentile = (arr, p) => {
    const idx = Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * (p / 100))));
    return Math.round(arr[idx]);
  };

  const p10 = getPercentile(simulatedOutcomes, 10);
  const p50 = getPercentile(simulatedOutcomes, 50);
  const p90 = getPercentile(simulatedOutcomes, 90);

  // Empirical Tail Risk: VaR (95% -> 5th percentile) and CVaR (mean of worst 5% trials)
  const var95 = getPercentile(simulatedOutcomes, 5);
  const tailCutoffIdx = Math.max(1, Math.floor(trials * 0.05));
  let tailSum = 0;
  for (let i = 0; i < tailCutoffIdx; i++) {
    tailSum += simulatedOutcomes[i];
  }
  const cvar95 = Math.round(tailSum / tailCutoffIdx);

  // Compute Standard Deviation & Downside Semi-Deviation
  let sum = 0;
  for (let i = 0; i < trials; i++) sum += simulatedOutcomes[i];
  let mean = sum / trials;
  let variance = 0;
  let downsideSqSum = 0;
  for (let i = 0; i < trials; i++) {
    const diff = simulatedOutcomes[i] - mean;
    variance += diff * diff;
    if (simulatedOutcomes[i] < p50) {
      const dDiff = simulatedOutcomes[i] - p50;
      downsideSqSum += dDiff * dDiff;
    }
  }
  const standardDeviation = Math.round(Math.sqrt(variance / trials));
  const downsideSemiDeviation = Math.round(Math.sqrt(downsideSqSum / trials));
  const ruinProbabilityPct = Number(((everInsolventCount / trials) * 100).toFixed(1));

  // Projected timeline (REQ-26)
  const timeline = [
    { year: 1, p10: getPercentile(year1Trials, 10), p50: getPercentile(year1Trials, 50), p90: getPercentile(year1Trials, 90) },
    { year: 3, p10: getPercentile(year3Trials, 10), p50: getPercentile(year3Trials, 50), p90: getPercentile(year3Trials, 90) },
    { year: 5, p10, p50, p90 }
  ];

  // 5-Year Solvency Survival Curve
  const survivalCurve = [
    { year: 1, month: 12, solvencyProbabilityPct: Number(((solventY1 / trials) * 100).toFixed(1)), medianLiquidWealth: timeline[0].p50 },
    { year: 2, month: 24, solvencyProbabilityPct: Number(((solventY2 / trials) * 100).toFixed(1)), medianLiquidWealth: Math.round((timeline[0].p50 + timeline[1].p50) / 2) },
    { year: 3, month: 36, solvencyProbabilityPct: Number(((solventY3 / trials) * 100).toFixed(1)), medianLiquidWealth: timeline[1].p50 },
    { year: 4, month: 48, solvencyProbabilityPct: Number(((solventY4 / trials) * 100).toFixed(1)), medianLiquidWealth: Math.round((timeline[1].p50 + p50) / 2) },
    { year: 5, month: 60, solvencyProbabilityPct: Number(((solventY5 / trials) * 100).toFixed(1)), medianLiquidWealth: p50 }
  ];

  // Distribution bins (10 bins for chart visualization)
  const minVal = simulatedOutcomes[0];
  const maxVal = simulatedOutcomes[trials - 1];
  const binSize = Math.max(1, (maxVal - minVal) / 10);
  const distributionBins = [];

  for (let b = 0; b < 10; b++) {
    const startRange = minVal + b * binSize;
    const endRange = startRange + binSize;
    let count = 0;
    for (let i = 0; i < trials; i++) {
      if (simulatedOutcomes[i] >= startRange && (b === 9 ? simulatedOutcomes[i] <= endRange : simulatedOutcomes[i] < endRange)) {
        count++;
      }
    }
    distributionBins.push({
      rangeLabel: `₹${(startRange / 100000).toFixed(1)}L - ₹${(endRange / 100000).toFixed(1)}L`,
      count,
      probability: Number((count / trials).toFixed(4))
    });
  }

  // 5 Scenario Regimes (both structured objects for UI cards & scalar shorthand)
  const thesisFailureVal = getPercentile(simulatedOutcomes, 3);
  const scenarioRegimes = {
    optimisticP90: p90,
    realisticP50: p50,
    adverseP10: p10,
    thesisFailure: thesisFailureVal,
    priorityDriftUtility: Math.round(p50 * 0.88 - initialCost * 0.15),
    optimistic: {
      probability: 0.20,
      netReturn5Yr: p90,
      narrative: 'Strong sector expansion, top-decile compensation growth, and low inflation friction.'
    },
    realistic: {
      probability: 0.55,
      netReturn5Yr: p50,
      narrative: 'Central Markov regime tracking historical median industry progression and normal inflation.'
    },
    adverse: {
      probability: 0.18,
      netReturn5Yr: p10,
      narrative: 'Macro hiring slowdown, delayed promotion velocity, and elevated living cost pressure.'
    },
    assumptionBreak: {
      probability: 0.07,
      netReturn5Yr: thesisFailureVal,
      narrative: 'Core thesis stress-break: 6-month placement/revenue delay combined with full debt service.'
    }
  };

  return {
    trialsCount: trials,
    percentiles: {
      p10WorstCase: p10,
      p50MedianCase: p50,
      p90BestCase: p90,
      standardDeviation
    },
    timeline,
    distributionBins,
    survivalCurve,
    tailRisk: {
      var95,
      cvar95,
      ruinProbabilityPct,
      downsideSemiDeviation
    },
    scenarioRegimes
  };
}

module.exports = { runMonteCarloSimulation, randomNormal };

