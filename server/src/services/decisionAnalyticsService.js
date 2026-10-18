const marketData = require('../data/marketReferenceData');

/**
 * Computes TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)
 * Classical Multi-Criteria Decision Making (MCDM) standard in Decision Sciences
 */
function computeTopsis(optionsData, goalWeights) {
  if (!optionsData || optionsData.length === 0) return [];

  // Criteria definitions mapped across all 7 user goal weights (normalized to sum to 1.0)
  // type: 'benefit' (higher is better) or 'cost' (lower is better)
  const rawCriteria = [
    { key: 'expectedSalary', type: 'benefit', rawWeight: Number(goalWeights?.financialGrowth ?? 25) },
    { key: 'roiPercentage', type: 'benefit', rawWeight: Number(goalWeights?.personalGrowth ?? 15) },
    { key: 'wlb', type: 'benefit', rawWeight: Number(goalWeights?.workLifeBalance ?? 20) + Number(goalWeights?.healthWellBeing ?? 5) },
    { key: 'financialSafety', type: 'benefit', rawWeight: Number(goalWeights?.familyStability ?? 10) + Number(goalWeights?.locationPreference ?? 5) },
    { key: 'careerSafety', type: 'benefit', rawWeight: Number(goalWeights?.jobSecurity ?? 20) },
    { key: 'initialCost', type: 'cost', rawWeight: 18 }
  ];
  const weightSum = rawCriteria.reduce((acc, c) => acc + Math.max(1, c.rawWeight), 0) || 100;
  const criteria = rawCriteria.map(c => ({
    ...c,
    weight: Math.max(1, c.rawWeight) / weightSum
  }));

  // Extract raw matrix
  const matrix = optionsData.map(item => {
    const opt = item.option;
    const pred = item.prediction;
    const score = item.riskScore;
    const attrs = opt.attributes || {};
    const totalCost = (attrs.tuitionCost || 0) + (attrs.initialInvestment || 0) + (attrs.relocationCost || 0) + (attrs.courseCost || 0);

    return {
      optionId: opt._id,
      title: opt.title,
      values: {
        expectedSalary: Math.max(100000, pred.predictedExpectedSalary || 500000),
        roiPercentage: Math.max(1, pred.predictedRoiPercentage || 10),
        wlb: attrs.workLifeBalanceRating || 7,
        financialSafety: Math.max(5, 100 - (score.financialRisk || 50)),
        careerSafety: Math.max(5, 100 - (score.careerRisk || 40)),
        initialCost: Math.max(1000, totalCost)
      }
    };
  });

  // Calculate sum of squares for normalization
  const sumsOfSquares = {};
  criteria.forEach(c => {
    sumsOfSquares[c.key] = Math.sqrt(
      matrix.reduce((sum, row) => sum + Math.pow(row.values[c.key], 2), 0)
    ) || 1;
  });

  // Calculate normalized & weighted matrix
  const weightedMatrix = matrix.map(row => {
    const weighted = {};
    criteria.forEach(c => {
      const normalized = row.values[c.key] / sumsOfSquares[c.key];
      weighted[c.key] = normalized * c.weight;
    });
    return { ...row, weighted };
  });

  // Determine Ideal Best (A+) and Ideal Worst (A-)
  const idealBest = {};
  const idealWorst = {};

  criteria.forEach(c => {
    const columnValues = weightedMatrix.map(r => r.weighted[c.key]);
    if (c.type === 'benefit') {
      idealBest[c.key] = Math.max(...columnValues);
      idealWorst[c.key] = Math.min(...columnValues);
    } else {
      idealBest[c.key] = Math.min(...columnValues);
      idealWorst[c.key] = Math.max(...columnValues);
    }
  });

  // Calculate Euclidean distances and relative closeness (Ci)
  const topsisResults = weightedMatrix.map(row => {
    let distBest = 0;
    let distWorst = 0;

    criteria.forEach(c => {
      distBest += Math.pow(row.weighted[c.key] - idealBest[c.key], 2);
      distWorst += Math.pow(row.weighted[c.key] - idealWorst[c.key], 2);
    });

    distBest = Math.sqrt(distBest);
    distWorst = Math.sqrt(distWorst);

    const relativeCloseness = distBest + distWorst === 0 ? 0.5 : distWorst / (distBest + distWorst);
    const topsisScore = Math.min(100, Math.max(10, Math.round(relativeCloseness * 100)));

    return {
      optionId: row.optionId,
      title: row.title,
      distanceToIdealBest: Number(distBest.toFixed(4)),
      distanceToIdealWorst: Number(distWorst.toFixed(4)),
      topsisScore,
      relativeCloseness: Number(relativeCloseness.toFixed(4))
    };
  });

  // Sort descending by topsisScore
  topsisResults.sort((a, b) => b.topsisScore - a.topsisScore);
  return topsisResults.map((r, i) => ({ ...r, topsisRank: i + 1 }));
}

/**
 * 60-Month Cash Flow & Break-Even Timeline
 * Simulates month-by-month cumulative net savings runway
 */
function computeCashFlowRunway(digitalTwin, optionsData) {
  const currentSalary = digitalTwin.currentSalary || 600000;
  const currentMonthlyNet = (currentSalary * 0.85) / 12;
  const monthlyExpenses = digitalTwin.monthlyExpenses || 30000;
  const initialSavings = digitalTwin.savings || 100000;

  const months = 60; // 5-Year Horizon
  const timelineData = [];

  // Initialize data array
  for (let m = 0; m <= months; m += 6) {
    timelineData.push({ month: m, label: m === 0 ? 'Start' : `M${m}` });
  }

  const optionProfiles = optionsData.map(item => {
    const opt = item.option;
    const pred = item.prediction;
    const attrs = opt.attributes || {};
    const totalCost = (attrs.tuitionCost || 0) + (attrs.initialInvestment || 0) + (attrs.relocationCost || 0);
    const durationMonths = attrs.programDurationMonths || (attrs.expectedRunwayMonths || 0);
    const postSalary = pred.predictedExpectedSalary || (attrs.offeredSalary || currentSalary * 1.3);
    const postMonthlyNet = (postSalary * 0.85) / 12;

    let cumulativeNetWealth = initialSavings - totalCost;
    const cumulativePoints = [];

    for (let m = 0; m <= months; m++) {
      if (m > 0) {
        // While in school / bootstrapping without active full income
        let monthlyIncome = currentMonthlyNet;
        if (durationMonths > 0 && m <= durationMonths) {
          monthlyIncome = attrs.offeredSalary ? (attrs.offeredSalary * 0.85) / 12 : 0; // stipend or 0
        } else if (m > durationMonths) {
          monthlyIncome = postMonthlyNet;
        }

        // Apply modest annual 5% inflation to expenses
        const currentYear = Math.floor(m / 12);
        const adjustedExpenses = monthlyExpenses * Math.pow(1.05, currentYear);
        const netCashFlow = monthlyIncome - adjustedExpenses;
        cumulativeNetWealth += netCashFlow;
      }

      if (m % 6 === 0) {
        cumulativePoints.push(Math.round(cumulativeNetWealth));
      }
    }

    return {
      optionId: opt._id,
      title: opt.title,
      totalUpfrontCost: totalCost,
      postTransitionSalary: postSalary,
      cumulativePoints,
      final5YrNetWealth: Math.round(cumulativeNetWealth)
    };
  });

  // Calculate Break-Even Months relative to lowest upfront cost option
  const lowestCostOpt = [...optionProfiles].sort((a, b) => a.totalUpfrontCost - b.totalUpfrontCost)[0];
  const breakEvenResults = optionProfiles.map(profile => {
    let breakEvenMonth = null;
    let netWealth = initialSavings - profile.totalUpfrontCost;
    let baselineWealth = initialSavings - lowestCostOpt.totalUpfrontCost;

    const optData = optionsData.find(o => o.option._id.toString() === profile.optionId.toString());
    const durationMonths = optData?.option.attributes?.programDurationMonths || 0;
    const postMonthlyNet = (profile.postTransitionSalary * 0.85) / 12;
    const baselineMonthlyNet = (lowestCostOpt.postTransitionSalary * 0.85) / 12;

    if (profile.totalUpfrontCost <= lowestCostOpt.totalUpfrontCost) {
      breakEvenMonth = 0; // Baseline option
    } else {
      for (let m = 1; m <= 60; m++) {
        const income = (m <= durationMonths) ? 0 : postMonthlyNet;
        netWealth += (income - monthlyExpenses);
        baselineWealth += (baselineMonthlyNet - monthlyExpenses);

        if (netWealth >= baselineWealth && breakEvenMonth === null) {
          breakEvenMonth = m;
          break;
        }
      }
    }

    // 5-Year Net Present Value (NPV) calculation at 8% annual discount rate
    const annualDiscountRate = 0.08;
    const monthlyRate = Math.pow(1 + annualDiscountRate, 1 / 12) - 1;
    let npv = -profile.totalUpfrontCost;

    for (let m = 1; m <= 60; m++) {
      const income = (m <= durationMonths) ? 0 : postMonthlyNet;
      const netCash = income - monthlyExpenses;
      npv += netCash / Math.pow(1 + monthlyRate, m);
    }

    return {
      optionId: profile.optionId,
      title: profile.title,
      breakEvenMonth: breakEvenMonth !== null ? breakEvenMonth : '60+ Months',
      breakEvenDescription: breakEvenMonth === 0 
        ? 'Immediate (Zero upfront capital drain)' 
        : (breakEvenMonth ? `Breaks even at Month ${breakEvenMonth} (~${(breakEvenMonth / 12).toFixed(1)} yrs)` : 'Payback exceeds 5-year simulation horizon'),
      npv5Year: Math.round(npv),
      finalNetWealth: profile.final5YrNetWealth
    };
  });

  // Format chart table
  timelineData.forEach((row, idx) => {
    optionProfiles.forEach(p => {
      row[p.title] = p.cumulativePoints[idx];
    });
  });

  return {
    timelineChartData: timelineData,
    breakEvenSummary: breakEvenResults
  };
}

/**
 * Calculates Financial Risk Metrics: VaR (95%) and Conditional VaR (CVaR)
 */
function computeRiskTailMetrics(simulations) {
  return simulations.map(sim => {
    const p10 = sim.percentiles?.p10WorstCase || 0;
    const p50 = sim.percentiles?.p50MedianCase || 0;
    const std = sim.percentiles?.standardDeviation || (p50 * 0.15);

    // Use exact empirical 5th percentile VaR and tail mean CVaR from the 10k trials when available
    const var95 = sim.tailRisk?.var95 !== undefined
      ? sim.tailRisk.var95
      : Math.round(Math.max(0, p50 - 1.645 * std));
    const cvar95 = sim.tailRisk?.cvar95 !== undefined
      ? sim.tailRisk.cvar95
      : Math.round(Math.max(0, p50 - 2.06 * std));

    return {
      optionId: sim.optionId,
      valueAtRisk95: var95,
      conditionalVaR95: cvar95,
      ruinProbabilityPct: sim.tailRisk?.ruinProbabilityPct ?? 1.5,
      downsideVolatilityRatio: Number((std / Math.max(1, Math.abs(p50))).toFixed(3))
    };
  });
}

/**
 * Macroeconomic Stress-Testing Engine
 * Re-runs simulation under selected market shock profiles
 */
function runStressTest(scenario, optionsData, digitalTwin, shockKey) {
  const shock = marketData.stressTestingProfiles[shockKey] || marketData.stressTestingProfiles.recession;
  const growthMultiplier = shock.growthMultiplier || 1.0;
  const volatilityMultiplier = shock.volatilityMultiplier || 1.0;
  const immediateShock = shock.immediateCashShock || 0;

  const stressedResults = optionsData.map(item => {
    const opt = item.option;
    const sim = item.simulation;
    const baseP50 = sim.percentiles.p50MedianCase;
    const baseP10 = sim.percentiles.p10WorstCase;
    const baseP90 = sim.percentiles.p90BestCase;

    // Apply macroeconomic shock
    const stressedP50 = Math.round(Math.max(100000, (baseP50 * growthMultiplier) - immediateShock));
    const stressedP10 = Math.round(Math.max(50000, (baseP10 * (growthMultiplier * 0.85)) - (immediateShock * 1.2)));
    const stressedP90 = Math.round(Math.max(150000, (baseP90 * (growthMultiplier * 1.15)) - immediateShock));

    const baselineScore = item.riskScore.decisionScore;
    const stressedScore = Math.min(100, Math.max(10, baselineScore - (shock.riskPenalty || 10)));
    const resilienceScore = Math.min(100, Math.max(20, Math.round((stressedP50 / Math.max(1, baseP50)) * 100)));

    return {
      optionId: opt._id,
      title: opt.title,
      baselineP50: baseP50,
      stressedP50,
      baselineP10: baseP10,
      stressedP10,
      stressedP90,
      baselineDecisionScore: baselineScore,
      stressedDecisionScore: stressedScore,
      resilienceScore, // % of baseline value retained
      resilienceTier: resilienceScore >= 80 ? 'Highly Resilient' : (resilienceScore >= 60 ? 'Moderately Vulnerable' : 'High Downside Risk')
    };
  });

  return {
    shockProfile: shock,
    stressedResults
  };
}

module.exports = {
  computeTopsis,
  computeCashFlowRunway,
  computeRiskTailMetrics,
  runStressTest
};
