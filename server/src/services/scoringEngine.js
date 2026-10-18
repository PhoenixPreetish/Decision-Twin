// Multi-Dimensional Risk, 4-Tensor Uncertainty & Decision Scoring Engine (REQ-29 to REQ-39)

const CATEGORY_RISK_WEIGHTS = {
  higher_education:    { fin: 0.30, car: 0.20, mkt: 0.15, edu: 0.20, pers: 0.08, fam: 0.07 },
  job_selection:       { fin: 0.22, car: 0.30, mkt: 0.20, edu: 0.00, pers: 0.16, fam: 0.12 },
  career_change:       { fin: 0.25, car: 0.32, mkt: 0.18, edu: 0.05, pers: 0.12, fam: 0.08 },
  entrepreneurship:    { fin: 0.35, car: 0.25, mkt: 0.25, edu: 0.00, pers: 0.10, fam: 0.05 },
  investment_planning: { fin: 0.45, car: 0.10, mkt: 0.35, edu: 0.00, pers: 0.05, fam: 0.05 },
  relocation:          { fin: 0.28, car: 0.17, mkt: 0.15, edu: 0.00, pers: 0.15, fam: 0.25 },
  skill_investment:    { fin: 0.20, car: 0.30, mkt: 0.15, edu: 0.20, pers: 0.10, fam: 0.05 },
  custom_decision:     { fin: 0.30, car: 0.25, mkt: 0.20, edu: 0.05, pers: 0.10, fam: 0.10 }
};

const CATEGORY_KEY_FIELDS = {
  higher_education:    ['tuitionCost', 'programDurationMonths', 'isAccredited', 'institutionName'],
  job_selection:       ['offeredSalary', 'roleLevel', 'companyType', 'workLifeBalanceRating'],
  career_change:       ['offeredSalary', 'roleLevel', 'companyType', 'workLifeBalanceRating'],
  entrepreneurship:    ['initialInvestment', 'expectedRunwayMonths', 'targetMarketSize'],
  investment_planning: ['initialInvestment', 'expectedRunwayMonths'],
  relocation:          ['targetCity', 'targetCountry', 'relocationCost', 'distanceFromFamilyKm'],
  skill_investment:    ['courseCost', 'completionWeeks', 'weeklyStudyHours'],
  custom_decision:     ['expectedUpsideValue', 'reversibilityScore']
};

function computeOptionScores(digitalTwin, option, goalConstraint, simulationResult, prediction, category) {
  const attrs = option?.attributes || {};
  const weights = goalConstraint?.weights || {
    financialGrowth: 25,
    jobSecurity: 20,
    workLifeBalance: 20,
    personalGrowth: 15,
    familyStability: 10,
    locationPreference: 5,
    healthWellBeing: 5
  };
  const constraints = goalConstraint?.constraints || {};

  // 1. FINANCIAL RISK (REQ-29)
  const currentIncome = Math.max(Number(digitalTwin?.currentSalary) || 300000, 100000);
  const scholarshipFactor = attrs.scholarshipPct ? Math.max(0, 1 - Number(attrs.scholarshipPct) / 100) : 1.0;
  const effectiveTuition = (Number(attrs.tuitionCost) || 0) * scholarshipFactor;
  const totalCost = effectiveTuition +
    (Number(attrs.initialInvestment) || 0) +
    (Number(attrs.relocationCost) || 0) +
    (Number(attrs.courseCost) || 0);
  const userDebt = Number(digitalTwin?.debt) || 0;
  const userSavings = Number(digitalTwin?.savings) !== undefined && digitalTwin?.savings !== null
    ? Number(digitalTwin.savings)
    : 100000;
  const monthlyExpenses = Math.max(Number(digitalTwin?.monthlyExpenses) || 25000, 10000);

  let debtRatio = (userDebt + totalCost) / (currentIncome * 3);
  let savingsBufferMonths = userSavings / monthlyExpenses;
  const p10Worst = simulationResult?.percentiles?.p10WorstCase ?? (currentIncome * 0.9);
  const p50Median = simulationResult?.percentiles?.p50MedianCase ?? (currentIncome * 1.2);
  let worstCaseImpact = p10Worst < (currentIncome * 0.8) ? 35 : 10;

  let financialRisk = Math.min(
    100,
    Math.max(5, Math.round(debtRatio * 40 + (12 - Math.min(12, savingsBufferMonths)) * 3 + worstCaseImpact))
  );

  // 2. CAREER RISK (REQ-30)
  let baseCareerRisk = 25;
  if (category === 'entrepreneurship') baseCareerRisk = 60;
  else if (category === 'career_change') baseCareerRisk = 45;
  else if (category === 'job_selection') baseCareerRisk = 20;
  else if (category === 'skill_investment') baseCareerRisk = 22;

  const expYears = Number(digitalTwin?.yearsOfExperience) || 0;
  let skillRiskMod = (expYears < 3) ? 15 : (expYears > 7 ? -10 : 0);
  let careerRisk = Math.min(
    100,
    Math.max(5, Math.round(baseCareerRisk + skillRiskMod + (1 - (prediction?.successProbability || 0.8)) * 30))
  );

  // 3. MARKET RISK (REQ-31)
  let marketRisk = 30;
  if (category === 'entrepreneurship' || category === 'investment_planning') marketRisk = 55;
  else if (category === 'career_change') marketRisk = 38;
  if (attrs.companyType === 'Startup') marketRisk += 15;
  if (attrs.targetCountry && attrs.targetCountry !== 'India') marketRisk += 8;
  marketRisk = Math.min(100, Math.max(5, marketRisk));

  // 4. EDUCATIONAL RISK (REQ-32)
  let educationalRisk = 15;
  if (category === 'higher_education' || category === 'skill_investment') {
    educationalRisk = attrs.isAccredited === false ? 75 : 20;
  }

  // 5. PERSONAL & FAMILY RISK (REQ-32)
  let distance = Number(attrs.distanceFromFamilyKm) || 0;
  if (!distance && attrs.targetCountry && attrs.targetCountry !== 'India') {
    distance = 5000;
  }
  let familyRisk = Math.min(100, Math.max(5, Math.round(15 + (distance > 500 ? 35 : (distance > 100 ? 15 : 0)))));
  let wlb = Number(attrs.workLifeBalanceRating) || 7;
  let studyHoursStrain = (Number(attrs.weeklyStudyHours) || 0) > 20 ? 12 : 0;
  let personalRisk = Math.min(100, Math.max(5, Math.round(100 - (wlb * 9) + studyHoursStrain)));

  // 6. CATEGORY-ADAPTIVE AGGREGATE RISK LEVEL (REQ-33)
  const catWeights = CATEGORY_RISK_WEIGHTS[category] || CATEGORY_RISK_WEIGHTS.custom_decision;
  let overallRiskScore = Math.round(
    (financialRisk * catWeights.fin) +
    (careerRisk * catWeights.car) +
    (marketRisk * catWeights.mkt) +
    (educationalRisk * catWeights.edu) +
    (personalRisk * catWeights.pers) +
    (familyRisk * catWeights.fam)
  );
  overallRiskScore = Math.min(100, Math.max(5, overallRiskScore));

  let overallRiskLevel = 'Low';
  if (overallRiskScore >= 65) overallRiskLevel = 'High';
  else if (overallRiskScore >= 40) overallRiskLevel = 'Medium';

  // 7. GOAL ALIGNMENT SCORE (REQ-35)
  const roiPct = Number(prediction?.predictedRoiPercentage) || 15;
  let finSatisfaction = Math.min(100, Math.max(10, (roiPct + 50) / 1.5));
  let secSatisfaction = Math.min(100, Math.max(10, 100 - careerRisk));
  let wlbSatisfaction = Math.min(100, Math.max(10, wlb * 10));
  let persGrowthSatisfaction = (category === 'higher_education' || category === 'career_change' || category === 'skill_investment') ? 90 : 75;
  let famSatisfaction = Math.min(100, Math.max(10, 100 - familyRisk));
  let locSatisfaction = ((!attrs.targetCountry || attrs.targetCountry === 'India') || attrs.remoteFlexibility === 'Remote') ? 90 : 70;
  let healthSatisfaction = Math.min(100, Math.max(10, 100 - personalRisk));

  let goalAlignmentScore = Math.round(
    (finSatisfaction * ((Number(weights.financialGrowth) || 0) / 100)) +
    (secSatisfaction * ((Number(weights.jobSecurity) || 0) / 100)) +
    (wlbSatisfaction * ((Number(weights.workLifeBalance) || 0) / 100)) +
    (persGrowthSatisfaction * ((Number(weights.personalGrowth) || 0) / 100)) +
    (famSatisfaction * ((Number(weights.familyStability) || 0) / 100)) +
    (locSatisfaction * ((Number(weights.locationPreference) || 0) / 100)) +
    (healthSatisfaction * ((Number(weights.healthWellBeing) || 0) / 100))
  );
  goalAlignmentScore = Math.min(100, Math.max(10, goalAlignmentScore));

  // 8. OVERALL DECISION SCORE WITH USER RISK TOLERANCE INTEGRATION (REQ-36)
  const predSalary = Number(prediction?.predictedExpectedSalary) || currentIncome;
  const successProb = Number(prediction?.successProbability) || 0.8;
  let outcomeQualityScore = Math.min(
    100,
    Math.max(20, Math.round((predSalary / (currentIncome * 1.5)) * 60 + (successProb * 40)))
  );

  // User riskTolerance modulates how steeply overallRiskScore penalizes the Decision Score
  const riskTol = (digitalTwin?.riskTolerance || 'medium').toLowerCase();
  const riskAversionMultiplier = riskTol === 'low' ? 1.25 : (riskTol === 'high' ? 0.78 : 1.0);
  let effectiveInverseRisk = Math.max(0, Math.min(100, 100 - Math.round(overallRiskScore * riskAversionMultiplier)));

  let decisionScore = Math.round(
    (goalAlignmentScore * 0.45) +
    (outcomeQualityScore * 0.35) +
    (effectiveInverseRisk * 0.20)
  );
  decisionScore = Math.min(100, Math.max(10, decisionScore));

  // 9. 4-TENSOR ORTHOGONAL RISK & UNCERTAINTY PROFILE
  // (a) Aleatoric Risk: downside volatility & outcome dispersion
  let medianBase = Math.max(1, Math.abs(p50Median || 1));
  let stdDev = simulationResult?.percentiles?.standardDeviation || 0;
  let varianceRatio = stdDev / medianBase;
  const aleatoricRisk = Math.min(98, Math.max(8, Math.round(varianceRatio * 140 + (1 - successProb) * 45)));

  // (b) Epistemic Uncertainty: missing/unverified key domain attributes
  const expectedKeys = CATEGORY_KEY_FIELDS[category] || CATEGORY_KEY_FIELDS.custom_decision;
  let populatedCount = 0;
  expectedKeys.forEach((k) => {
    if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== '') {
      populatedCount++;
    }
  });
  const completenessRatio = expectedKeys.length > 0 ? populatedCount / expectedKeys.length : 1;
  const epistemicUncertainty = Math.min(85, Math.max(8, Math.round((1 - completenessRatio) * 65 + (100 - (prediction?.confidenceScore || 80)) * 0.5)));

  // (c) Irreversibility Index (Lock-In): sunk capital ratio + duration + reversal friction
  const durationMonths = Number(attrs.programDurationMonths) || Number(attrs.expectedRunwayMonths) || (Number(attrs.completionWeeks) ? Number(attrs.completionWeeks) / 4 : 6);
  const sunkCapitalRatio = Math.min(1.5, totalCost / Math.max(100000, userSavings + currentIncome * 0.5));
  const durationLockRatio = Math.min(1.0, durationMonths / 36);
  const customReversibility = attrs.reversibilityScore ? (11 - Number(attrs.reversibilityScore)) / 10 : (category === 'entrepreneurship' || category === 'higher_education' ? 0.65 : 0.30);
  const irreversibilityIndex = Math.min(98, Math.max(8, Math.round(sunkCapitalRatio * 42 + durationLockRatio * 28 + customReversibility * 30)));

  // (d) Tail Fragility / Ruin Probability
  const ruinProbabilityPct = simulationResult?.tailRisk?.ruinProbabilityPct !== undefined
    ? Number(simulationResult.tailRisk.ruinProbabilityPct)
    : Number(Math.min(65, Math.max(0.5, (totalCost > userSavings ? ((totalCost - userSavings) / currentIncome) * 18 : 1.5))).toFixed(1));

  const fourTensor = {
    aleatoricRisk,
    epistemicUncertainty,
    irreversibilityIndex,
    ruinProbabilityPct
  };

  // 10. CONFIDENCE SCORE (REQ-37) — Penalized by Epistemic Uncertainty & Simulation Variance
  const epistemicPenalty = Math.round((1 - completenessRatio) * 12);
  let confidenceScore = Math.min(
    98,
    Math.max(
      60,
      Math.round(((prediction?.confidenceScore || 80) * 0.7) + ((1 - Math.min(0.5, varianceRatio)) * 30) - epistemicPenalty)
    )
  );

  // 11. ALL 5 HARD CONSTRAINT VIOLATIONS (REQ-16, REQ-17)
  const constraintViolations = [];
  if (constraints.maxBudget && totalCost > Number(constraints.maxBudget)) {
    constraintViolations.push({
      constraintName: 'Maximum Budget Exceeded',
      message: `Total initial cost ₹${totalCost.toLocaleString('en-IN')} exceeds your budget limit of ₹${Number(constraints.maxBudget).toLocaleString('en-IN')}`
    });
    decisionScore = Math.max(5, decisionScore - 15);
  }
  const effectiveSalary = Number(attrs.offeredSalary) || predSalary;
  if (constraints.minAcceptableSalary && effectiveSalary < Number(constraints.minAcceptableSalary)) {
    constraintViolations.push({
      constraintName: 'Minimum Salary Not Met',
      message: `Projected salary ₹${effectiveSalary.toLocaleString('en-IN')} is below minimum target of ₹${Number(constraints.minAcceptableSalary).toLocaleString('en-IN')}`
    });
    decisionScore = Math.max(5, decisionScore - 12);
  }
  const projectedTotalDebt = userDebt + Math.max(0, totalCost - userSavings);
  if (constraints.maxAcceptableDebt !== undefined && constraints.maxAcceptableDebt !== null && constraints.maxAcceptableDebt !== '' && projectedTotalDebt > Number(constraints.maxAcceptableDebt)) {
    constraintViolations.push({
      constraintName: 'Maximum Debt Threshold Exceeded',
      message: `Projected total debt exposure ₹${projectedTotalDebt.toLocaleString('en-IN')} exceeds max acceptable debt of ₹${Number(constraints.maxAcceptableDebt).toLocaleString('en-IN')}`
    });
    decisionScore = Math.max(5, decisionScore - 12);
  }
  if (constraints.requiredLocation && typeof constraints.requiredLocation === 'string' && constraints.requiredLocation.trim() !== '') {
    const reqLoc = constraints.requiredLocation.trim().toLowerCase();
    const optCity = (attrs.targetCity || '').toLowerCase();
    const optCountry = (attrs.targetCountry || 'India').toLowerCase();
    const isRemote = (attrs.remoteFlexibility || '').toLowerCase() === 'remote';
    if (!isRemote && optCity && !optCity.includes(reqLoc) && !optCountry.includes(reqLoc)) {
      constraintViolations.push({
        constraintName: 'Required Location Mismatch',
        message: `Option location (${attrs.targetCity || attrs.targetCountry}) conflicts with required location "${constraints.requiredLocation}"`
      });
      decisionScore = Math.max(5, decisionScore - 10);
    } else if (!isRemote && !optCity && optCountry && !optCountry.includes(reqLoc)) {
      constraintViolations.push({
        constraintName: 'Required Location Mismatch',
        message: `Option country (${attrs.targetCountry}) conflicts with required location "${constraints.requiredLocation}"`
      });
      decisionScore = Math.max(5, decisionScore - 10);
    }
  }
  if (constraints.maxDurationMonths && durationMonths > Number(constraints.maxDurationMonths)) {
    constraintViolations.push({
      constraintName: 'Maximum Duration Exceeded',
      message: `Transition/program duration (${durationMonths} months) exceeds maximum limit of ${constraints.maxDurationMonths} months`
    });
    decisionScore = Math.max(5, decisionScore - 10);
  }

  // 12. COMPOUNDING INTERACTION & CONTRADICTION HAZARDS (Hidden Risk Radar)
  const hiddenHazards = [];
  const postCapexSavings = userSavings - totalCost;
  const postCapexMonths = Math.round(postCapexSavings / monthlyExpenses);

  // Hazard 1: Liquidity Squeeze + High Market Volatility Compounding
  if (postCapexMonths < 3 && totalCost > 0 && marketRisk >= 45) {
    hiddenHazards.push({
      id: 'compound_liquidity_volatility',
      title: 'Liquidity Exhaustion × Market Volatility Synergy',
      severity: 'High',
      factorsInvolved: ['Upfront Capital Drain', 'Thin Liquid Buffer (<3 mos)', 'Elevated Market Risk'],
      compoundMultiplier: 2.8,
      explanation: `Depleting liquid reserves to ${Math.max(0, postCapexMonths)} months while entering a volatile market (${marketRisk}/100) creates a 2.8x higher forced-exit risk if placement or revenue slips by 90 days.`,
      mitigationHint: 'Ring-fence 6 months of living expenses via partial education loan or bridge financing rather than spending 100% of cash savings.'
    });
  }

  // Hazard 2: Priority vs. Workload Contradiction
  if ((Number(weights.workLifeBalance) || 0) >= 25 && wlb <= 5) {
    hiddenHazards.push({
      id: 'contradiction_wlb_burnout',
      title: 'Stated Priority vs. Option Workload Contradiction',
      severity: 'Medium',
      factorsInvolved: [`Work-Life Priority (${weights.workLifeBalance}%)`, `Low Option WLB (${wlb}/10)`],
      compoundMultiplier: 1.9,
      explanation: `You weighted Work-Life Balance at ${weights.workLifeBalance}%, but this option carries a high burnout profile (${wlb}/10 WLB rating), predicting high post-commitment regret.`,
      mitigationHint: 'Negotiate hybrid flexibility or test the workload schedule for 2 weeks before committing.'
    });
  }

  // Hazard 3: Unaccredited / High-Cost Lock-In Trap
  if (attrs.isAccredited === false && totalCost > 200000) {
    hiddenHazards.push({
      id: 'unaccredited_sunk_cost_trap',
      title: 'Unaccredited Credential × Sunk Capital Trap',
      severity: 'Critical',
      factorsInvolved: ['Unaccredited Program', `₹${totalCost.toLocaleString('en-IN')} Upfront Cost`],
      compoundMultiplier: 3.4,
      explanation: 'Committing substantial capital to an unaccredited credential carries severe employer-recognition discount and near-zero credential transferability.',
      mitigationHint: 'Verify AICTE/UGC/international accreditation status or switch to an accredited executive track.'
    });
  }

  // Hazard 4: Low Risk Tolerance vs. High Irreversibility Mismatch
  if (riskTol === 'low' && irreversibilityIndex >= 65) {
    hiddenHazards.push({
      id: 'tolerance_lockin_mismatch',
      title: 'Conservative Risk Profile × High Irreversibility Lock-In',
      severity: 'Medium',
      factorsInvolved: ['Low Risk Tolerance', `Irreversibility Index (${irreversibilityIndex}/100)`],
      compoundMultiplier: 2.1,
      explanation: 'Your Digital Twin specifies Low risk tolerance, but this option has high capital/time lock-in, making a mid-course pivot costly.',
      mitigationHint: 'Execute a 14-day Minimum Viable Commitment (MVC) micro-experiment before signing binding agreements.'
    });
  }

  // 13. 4-GATE DECISION READINESS INDEX (DRI)
  const gateDataCompleteness = Math.round(completenessRatio * 100);
  const gateSolvencyBuffer = Math.min(100, Math.max(15, Math.round(Math.min(6, Math.max(0.5, postCapexMonths + 2)) * 16.6)));
  const gateBoundaryStability = Math.min(100, Math.max(25, Math.round(100 - aleatoricRisk * 0.55)));
  const gateBiasClearance = Math.max(20, 100 - (hiddenHazards.length * 22) - (constraintViolations.length * 25));

  const readinessScore = Math.round(
    (gateDataCompleteness * 0.25) +
    (gateSolvencyBuffer * 0.30) +
    (gateBoundaryStability * 0.20) +
    (gateBiasClearance * 0.25)
  );

  let readinessStatus = 'Ready to Commit';
  if (readinessScore < 55 || constraintViolations.length > 0 || hiddenHazards.some(h => h.severity === 'Critical')) {
    readinessStatus = 'Hold — Resolve Blind Spots';
  } else if (readinessScore < 75 || hiddenHazards.length > 0) {
    readinessStatus = 'Run Micro-Experiment First';
  }

  const decisionReadiness = {
    score: readinessScore,
    status: readinessStatus,
    gates: {
      dataCompleteness: gateDataCompleteness,
      solvencyBuffer: gateSolvencyBuffer,
      boundaryStability: gateBoundaryStability,
      biasClearance: gateBiasClearance
    }
  };

  return {
    financialRisk,
    careerRisk,
    marketRisk,
    educationalRisk,
    personalRisk,
    familyRisk,
    overallRiskScore,
    overallRiskLevel,
    goalAlignmentScore,
    decisionScore,
    confidenceScore,
    constraintViolations,
    fourTensor,
    decisionReadiness,
    hiddenHazards
  };
}

module.exports = { computeOptionScores, CATEGORY_RISK_WEIGHTS, CATEGORY_KEY_FIELDS };

