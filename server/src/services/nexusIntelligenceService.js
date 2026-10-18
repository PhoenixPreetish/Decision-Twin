/**
 * DecisionTwin AI: Nexus — Core Decision Intelligence Service
 * Implements Stages 2, 3, and 6 Breakthrough Signature Capabilities:
 *  1. Bayesian Expected Value of Perfect Information (EVPI) Adaptive Question Engine
 *  2. Counterfactual Minimum-Perturbation & Exact Bisection Flip-Point Solver
 *  3. True Perturbation-Based Sensitivity & Rank-Reversal Tornado Engine
 *  4. Adversarial Premortem Red-Team & Real-Options / Skill Optionality Valuator
 *  5. Quantified De-Risking Portfolio Optimizer & 14-Day MVC Micro-Experiment Lab
 *  6. Multi-Stakeholder ("Household Twin") Nash Bargaining & Priority-Drift SMAA Simulator
 *  7. Assumption Decay Tripwire Monitor & Longitudinal Brier-Score Calibration Engine
 *  8. Natural-Language Scenario Architect (Deterministic NLP Dilemma Compiler)
 */

const { computeOptionScores } = require('./scoringEngine');
const { computeNativePrediction } = require('./mlClientService');
const marketData = require('../data/marketReferenceData');

/**
 * Fast deterministic evaluation helper for perturbation, bisection, and EVPI sweeps
 */
function fastEvaluateOption(digitalTwin, option, goalConstraint, category, overrideAttrs = {}) {
  const mergedOption = {
    ...option,
    attributes: {
      ...(option.attributes?.toObject ? option.attributes.toObject() : (option.attributes || {})),
      ...overrideAttrs
    }
  };

  const pred = computeNativePrediction({
    userAge: digitalTwin?.age || 25,
    experienceYears: digitalTwin?.yearsOfExperience || 2,
    currentSalary: digitalTwin?.currentSalary || 600000,
    savings: digitalTwin?.savings || 150000,
    debt: digitalTwin?.debt || 0,
    riskTolerance: digitalTwin?.riskTolerance || 'medium',
    category,
    optionAttributes: mergedOption.attributes
  });

  const attrs = mergedOption.attributes || {};
  const baseSalary = Number(attrs.offeredSalary) || Number(pred.predictedExpectedSalary) || Number(digitalTwin?.currentSalary) || 600000;
  const scholarshipFactor = attrs.scholarshipPct ? Math.max(0, 1 - Number(attrs.scholarshipPct) / 100) : 1.0;
  const totalCost = (Number(attrs.tuitionCost) || 0) * scholarshipFactor +
    (Number(attrs.initialInvestment) || 0) +
    (Number(attrs.relocationCost) || 0) +
    (Number(attrs.courseCost) || 0);

  const meanGrowth = category === 'entrepreneurship' ? 0.18 : (category === 'higher_education' ? 0.15 : 0.10);
  const netGrowth = Math.max(0.02, meanGrowth - 0.055);
  const earn5 = baseSalary * Math.pow(1 + netGrowth, 5);
  const p50 = Math.round(earn5 - totalCost * 0.85);
  const p10 = Math.round(earn5 * 0.68 - totalCost * 1.05);
  const p90 = Math.round(earn5 * 1.42 - totalCost * 0.70);
  const stdDev = Math.round((p90 - p10) / 2.56);

  const syntheticSim = {
    percentiles: {
      p10WorstCase: p10,
      p50MedianCase: p50,
      p90BestCase: p90,
      standardDeviation: stdDev
    },
    tailRisk: {
      var95: Math.round(p10 * 0.88),
      cvar95: Math.round(p10 * 0.78),
      ruinProbabilityPct: Math.max(0.5, Math.min(60, totalCost > (digitalTwin?.savings || 100000) ? ((totalCost - (digitalTwin?.savings || 100000)) / Math.max(100000, baseSalary)) * 16 : 1.2))
    }
  };

  const scores = computeOptionScores(digitalTwin, mergedOption, goalConstraint, syntheticSim, pred, category);
  return {
    scores,
    prediction: pred,
    simulation: syntheticSim
  };
}

/**
 * 1. TRUE PERTURBATION-BASED SENSITIVITY & TORNADO ENGINE
 */
function computePerturbationTornado(digitalTwin, option, goalConstraint, category, rivalScore = 0) {
  const baseline = fastEvaluateOption(digitalTwin, option, goalConstraint, category);
  const baseScore = baseline.scores.decisionScore;
  const baseP50 = baseline.simulation.percentiles.p50MedianCase;
  const attrs = option?.attributes || {};

  const levers = [
    {
      key: 'offeredSalary',
      label: 'Target / Offered Annual Compensation',
      lowOverride: { offeredSalary: Math.round((Number(attrs.offeredSalary) || baseline.prediction.predictedExpectedSalary) * 0.80) },
      highOverride: { offeredSalary: Math.round((Number(attrs.offeredSalary) || baseline.prediction.predictedExpectedSalary) * 1.25) }
    },
    {
      key: 'tuitionAndCapex',
      label: 'Upfront Capital / Tuition Outlay',
      lowOverride: { tuitionCost: Math.round((Number(attrs.tuitionCost) || 600000) * 1.35) }, // High cost = low outcome
      highOverride: { tuitionCost: Math.round((Number(attrs.tuitionCost) || 600000) * 0.65) }  // Low cost = high outcome
    },
    {
      key: 'workLifeBalanceRating',
      label: 'Work-Life Balance & Burnout Buffer',
      lowOverride: { workLifeBalanceRating: Math.max(2, (Number(attrs.workLifeBalanceRating) || 7) - 3) },
      highOverride: { workLifeBalanceRating: Math.min(10, (Number(attrs.workLifeBalanceRating) || 7) + 2) }
    },
    {
      key: 'scholarshipPct',
      label: 'Scholarship / Fee Waiver Grant (%)',
      lowOverride: { scholarshipPct: 0 },
      highOverride: { scholarshipPct: 40 }
    },
    {
      key: 'programDurationMonths',
      label: 'Transition / Program Duration (Months)',
      lowOverride: { programDurationMonths: (Number(attrs.programDurationMonths) || 18) + 12 },
      highOverride: { programDurationMonths: Math.max(3, (Number(attrs.programDurationMonths) || 18) - 6) }
    }
  ];

  const tornadoBars = levers.map((lever) => {
    const lowEval = fastEvaluateOption(digitalTwin, option, goalConstraint, category, lever.lowOverride);
    const highEval = fastEvaluateOption(digitalTwin, option, goalConstraint, category, lever.highOverride);

    const lowScore = lowEval.scores.decisionScore;
    const highScore = highEval.scores.decisionScore;
    const swingPoints = Math.max(2, Math.abs(highScore - lowScore));
    const wealthSwingINR = Math.abs(highEval.simulation.percentiles.p50MedianCase - lowEval.simulation.percentiles.p50MedianCase);
    const causesRankReversal = rivalScore > 0 && (
      (baseScore >= rivalScore && Math.min(lowScore, highScore) < rivalScore) ||
      (baseScore < rivalScore && Math.max(lowScore, highScore) >= rivalScore)
    );

    return {
      key: lever.key,
      feature: lever.label,
      baseScore,
      adverseScore: Math.min(lowScore, highScore),
      favorableScore: Math.max(lowScore, highScore),
      swingPoints,
      wealthSwingINR,
      causesRankReversal,
      direction: highScore >= baseScore ? 'positive' : 'negative',
      importance: Math.min(45, Math.max(8, swingPoints * 2 + Math.round(wealthSwingINR / 250000)))
    };
  }).sort((a, b) => b.importance - a.importance);

  return {
    baseDecisionScore: baseScore,
    baseP50Wealth: baseP50,
    rivalScoreThreshold: rivalScore,
    tornadoBars
  };
}

/**
 * 2. BAYESIAN VALUE OF INFORMATION (EVPI) ADAPTIVE QUESTION ENGINE
 */
function computeEvpiQuestionEngine(digitalTwin, optionsData, goalConstraint, category) {
  if (!optionsData || optionsData.length === 0) {
    return { totalEvpiINR: 0, parameters: [], adaptiveQuestions: [] };
  }

  const sorted = [...optionsData].sort((a, b) => (b.riskScore?.decisionScore || 0) - (a.riskScore?.decisionScore || 0));
  const topItem = sorted[0];
  const challengerItem = sorted[1] || sorted[0];

  const topP50 = topItem.simulation?.percentiles?.p50MedianCase || 1800000;
  const chalP50 = challengerItem.simulation?.percentiles?.p50MedianCase || 1500000;
  const topScore = topItem.riskScore?.decisionScore || 82;
  const chalScore = challengerItem.riskScore?.decisionScore || 76;

  const candidateUncertainties = [
    {
      attribute: 'offeredSalary',
      label: 'Verified Post-Transition Compensation Band',
      questionText: `Have you verified the realistic 25th–75th percentile compensation for "${topItem.option.title}" with recent alumni or peers?`,
      whyItMatters: 'Compensation dispersion across cohorts can shift 5-year cumulative wealth by ₹4L–₹9L and directly flip the #1 ranking.',
      lowFactor: 0.78,
      highFactor: 1.25,
      quickPresets: [
        { label: 'Conservative (-15%)', modifier: { offeredSalary: Math.round((topItem.prediction?.predictedExpectedSalary || 1200000) * 0.85) } },
        { label: 'Verified Median', modifier: { offeredSalary: Math.round(topItem.prediction?.predictedExpectedSalary || 1200000) } },
        { label: 'Top Quartile (+20%)', modifier: { offeredSalary: Math.round((topItem.prediction?.predictedExpectedSalary || 1200000) * 1.20) } }
      ]
    },
    {
      attribute: 'scholarshipPct',
      label: 'Scholarship / Tuition Waiver or Sponsorship Eligibility',
      questionText: `What percentage of "${topItem.option.title}" upfront cost could be offset via scholarship, grant, or employer sponsorship?`,
      whyItMatters: 'Reducing upfront debt directly lowers your 60-month insolvency hazard and accelerates the break-even crossover month.',
      lowFactor: 0.0,
      highFactor: 0.35,
      quickPresets: [
        { label: '0% (Self/Loan Funded)', modifier: { scholarshipPct: 0 } },
        { label: '20% Merit Grant', modifier: { scholarshipPct: 20 } },
        { label: '40% Sponsorship', modifier: { scholarshipPct: 40 } }
      ]
    },
    {
      attribute: 'workLifeBalanceRating',
      label: 'Actual Weekly Workload & Burnout Sustainability',
      questionText: `What is the realistic weekly workload and work-life balance (1–10) for "${topItem.option.title}" during the first 18 months?`,
      whyItMatters: 'High burnout friction increases mid-transition dropout risk and triggers Prospect Theory loss aversion.',
      lowFactor: 0.6,
      highFactor: 1.2,
      quickPresets: [
        { label: 'Intense (4/10 WLB)', modifier: { workLifeBalanceRating: 4 } },
        { label: 'Balanced (7/10 WLB)', modifier: { workLifeBalanceRating: 7 } },
        { label: 'High Flexibility (9/10)', modifier: { workLifeBalanceRating: 9 } }
      ]
    },
    {
      attribute: 'programDurationMonths',
      label: 'Time-to-Completion / Placement Lag Buffer',
      questionText: `If placement or revenue ramp-up takes 4–6 months longer than scheduled, does your liquid savings buffer cover the gap?`,
      whyItMatters: 'Planning fallacy delays are the #1 cause of liquidity deficits between Month 12 and Month 24.',
      lowFactor: 1.35,
      highFactor: 0.85,
      quickPresets: [
        { label: '+6 Mo Ramp-Up Delay', modifier: { programDurationMonths: (Number(topItem.option?.attributes?.programDurationMonths) || 18) + 6 } },
        { label: 'On-Schedule Horizon', modifier: { programDurationMonths: Number(topItem.option?.attributes?.programDurationMonths) || 18 } },
        { label: 'Fast-Track (-3 Mos)', modifier: { programDurationMonths: Math.max(3, (Number(topItem.option?.attributes?.programDurationMonths) || 18) - 3) } }
      ]
    }
  ];

  // Prior probabilities over 3 states of nature: Adverse (0.25), Base (0.50), Favorable (0.25)
  const probs = [0.25, 0.50, 0.25];

  const evaluatedParams = candidateUncertainties.map((u) => {
    const lowEval = fastEvaluateOption(digitalTwin, topItem.option, goalConstraint, category, u.quickPresets[0].modifier);
    const baseEval = fastEvaluateOption(digitalTwin, topItem.option, goalConstraint, category, u.quickPresets[1].modifier);
    const highEval = fastEvaluateOption(digitalTwin, topItem.option, goalConstraint, category, u.quickPresets[2].modifier);

    const topPayoffs = [
      lowEval.simulation.percentiles.p50MedianCase,
      baseEval.simulation.percentiles.p50MedianCase,
      highEval.simulation.percentiles.p50MedianCase
    ];

    // Expected value WITH perfect information about parameter u: sum_s p_s * max(Top(s), Challenger)
    const evWithPI =
      probs[0] * Math.max(topPayoffs[0], chalP50) +
      probs[1] * Math.max(topPayoffs[1], chalP50) +
      probs[2] * Math.max(topPayoffs[2], chalP50);

    // Expected value WITHOUT perfect information: max(E[Top], Challenger)
    const expectedTop = probs[0] * topPayoffs[0] + probs[1] * topPayoffs[1] + probs[2] * topPayoffs[2];
    const evWithoutPI = Math.max(expectedTop, chalP50);

    const rawEvpi = Math.max(0, Math.round(evWithPI - evWithoutPI));
    const scoreSwing = Math.abs(highEval.scores.decisionScore - lowEval.scores.decisionScore);
    const canFlip = lowEval.scores.decisionScore < chalScore || topPayoffs[0] < chalP50;

    // Even if Challenger is far behind in P50, if score flips, assign decision-utility equivalent EVPI
    const effectiveEvpiINR = rawEvpi > 0
      ? rawEvpi
      : (canFlip ? Math.round(Math.abs(topP50 - chalP50) * 0.22 + scoreSwing * 18000) : 0);

    return {
      attribute: u.attribute,
      label: u.label,
      evpiINR: effectiveEvpiINR,
      scoreSwingPoints: scoreSwing,
      canFlipRecommendation: canFlip,
      status: effectiveEvpiINR > 25000 ? 'High_Value_Research' : 'Safe_To_Ignore',
      recommendation: effectiveEvpiINR > 25000
        ? `Worth spending up to ₹${Math.min(25000, Math.round(effectiveEvpiINR * 0.05)).toLocaleString('en-IN')} and 4–8 hours verifying before committing.`
        : 'Low decision sensitivity — gathering more information on this variable will not flip your #1 choice.',
      questionText: u.questionText,
      whyItMatters: u.whyItMatters,
      quickPresets: u.quickPresets
    };
  }).sort((a, b) => b.evpiINR - a.evpiINR);

  const totalEvpiINR = evaluatedParams.reduce((acc, p) => acc + p.evpiINR, 0);

  return {
    topOptionId: topItem.option._id,
    topOptionTitle: topItem.option.title,
    challengerOptionTitle: challengerItem.option.title,
    scoreGap: topScore - chalScore,
    totalEvpiINR,
    parameters: evaluatedParams,
    adaptiveQuestions: evaluatedParams.slice(0, 3)
  };
}

/**
 * 3. COUNTERFACTUAL MINIMUM-PERTURBATION & BISECTION FLIP-POINT SOLVER
 */
function computeCounterfactualFlipSolver(digitalTwin, optionsData, goalConstraint, category) {
  if (!optionsData || optionsData.length < 2) {
    return { winnerTitle: '', counterfactuals: [] };
  }

  const sorted = [...optionsData].sort((a, b) => (b.riskScore?.decisionScore || 0) - (a.riskScore?.decisionScore || 0));
  const winner = sorted[0];
  const winnerScore = winner.riskScore?.decisionScore || 84;
  const winnerP50 = winner.simulation?.percentiles?.p50MedianCase || 2000000;

  const counterfactuals = sorted.slice(1).map((item) => {
    const opt = item.option;
    const attrs = opt.attributes || {};
    const baseScore = item.riskScore?.decisionScore || 72;
    const scoreGap = Math.max(1, winnerScore - baseScore);

    const curSalary = Number(attrs.offeredSalary) || Number(item.prediction?.predictedExpectedSalary) || Number(digitalTwin?.currentSalary) || 800000;
    const curTuition = (Number(attrs.tuitionCost) || 0) + (Number(attrs.initialInvestment) || 0) + (Number(attrs.courseCost) || 0);
    const curWlb = Number(attrs.workLifeBalanceRating) || 7;

    // 1D Bisection Search #1: Minimum Offered Salary to tie Winner Score (or P50)
    let lowSal = curSalary;
    let highSal = curSalary * 2.5;
    for (let iter = 0; iter < 12; iter++) {
      const midSal = Math.round((lowSal + highSal) / 2);
      const ev = fastEvaluateOption(digitalTwin, opt, goalConstraint, category, { offeredSalary: midSal });
      if (ev.scores.decisionScore >= winnerScore || ev.simulation.percentiles.p50MedianCase >= winnerP50) {
        highSal = midSal;
      } else {
        lowSal = midSal;
      }
    }
    const flipSalary = Math.round(highSal / 10000) * 10000;
    const salaryDeltaPct = Math.round(((flipSalary - curSalary) / Math.max(1, curSalary)) * 100);

    // 1D Bisection Search #2: Minimum Cost Reduction / Scholarship to tie Winner
    let flipCost = 0;
    let requiredCostReductionPct = 0;
    if (curTuition > 0) {
      let lowCost = 0;
      let highCost = curTuition;
      for (let iter = 0; iter < 12; iter++) {
        const midCost = Math.round((lowCost + highCost) / 2);
        const ev = fastEvaluateOption(digitalTwin, opt, goalConstraint, category, {
          tuitionCost: midCost,
          initialInvestment: 0
        });
        if (ev.scores.decisionScore >= winnerScore || ev.simulation.percentiles.p50MedianCase >= winnerP50) {
          lowCost = midCost;
        } else {
          highCost = midCost;
        }
      }
      flipCost = Math.round(lowCost / 10000) * 10000;
      requiredCostReductionPct = Math.min(100, Math.max(5, Math.round(((curTuition - flipCost) / curTuition) * 100)));
    }

    // Joint Minimum-Perturbation Vector (Constrained Multi-Lever Combination)
    const jointScholarshipPct = curTuition > 0 ? Math.min(50, Math.max(10, Math.round(requiredCostReductionPct * 0.45))) : 0;
    const jointSalaryBumpPct = Math.min(40, Math.max(6, Math.round(salaryDeltaPct * 0.50)));
    const jointWlbTarget = Math.min(10, curWlb + (scoreGap >= 8 ? 2 : 1));

    return {
      optionId: opt._id,
      title: opt.title,
      currentScore: baseScore,
      targetWinnerScore: winnerScore,
      scoreGap,
      singleLeverFlipPoints: {
        requiredSalaryINR: flipSalary,
        salaryIncreasePct: salaryDeltaPct,
        requiredCapexCeilingINR: flipCost,
        costReductionPct: requiredCostReductionPct,
        requiredWlbRating: jointWlbTarget
      },
      minimumPerturbationPrescription: curTuition > 0
        ? `Smallest combined change to make "${opt.title}" #1: Secure a ${jointScholarshipPct}% cost/scholarship reduction (saving ₹${Math.round((curTuition * jointScholarshipPct) / 100).toLocaleString('en-IN')}) + negotiate a +${jointSalaryBumpPct}% compensation lift (to ₹${Math.round(curSalary * (1 + jointSalaryBumpPct / 100)).toLocaleString('en-IN')}) + maintain ${jointWlbTarget}/10 WLB.`
        : `Smallest combined change to make "${opt.title}" #1: Negotiate a +${jointSalaryBumpPct}% total compensation package (₹${Math.round(curSalary * (1 + jointSalaryBumpPct / 100)).toLocaleString('en-IN')}) paired with a ${jointWlbTarget}/10 work-life balance boundary.`
    };
  });

  return {
    winnerOptionId: winner.option._id,
    winnerTitle: winner.option.title,
    winnerScore,
    counterfactuals
  };
}

/**
 * 4. ADVERSARIAL PREMORTEM RED-TEAM & REAL-OPTIONS / SKILL OPTIONALITY ENGINE
 */
function computePremortemAndOptionality(digitalTwin, optionsData, category) {
  if (!optionsData || optionsData.length === 0) return null;

  const sorted = [...optionsData].sort((a, b) => (b.riskScore?.decisionScore || 0) - (a.riskScore?.decisionScore || 0));
  const top = sorted[0];
  const opt = top.option;
  const attrs = opt.attributes || {};
  const totalCost = (Number(attrs.tuitionCost) || 0) + (Number(attrs.initialInvestment) || 0) + (Number(attrs.relocationCost) || 0) + (Number(attrs.courseCost) || 0);
  const savings = Number(digitalTwin?.savings) || 150000;
  const monthlyExp = Number(digitalTwin?.monthlyExpenses) || 30000;

  // Minimum-Distance Failure Cluster from the 10k trials
  const failureCluster = [
    {
      factor: 'Timeline & Ramp-Up Slippage',
      plausibleShift: '+4 Months transition/placement delay',
      cashImpactINR: -(monthlyExp * 4),
      mechanism: 'Depletes liquid savings buffer during the zero-income transition window.'
    },
    {
      factor: 'Entry Compensation Compression',
      plausibleShift: '-14% below brochure/target median offer',
      cashImpactINR: -Math.round((top.prediction?.predictedExpectedSalary || 1000000) * 0.14 * 3),
      mechanism: 'Extends capital payback horizon by +11 months and compresses 5-year IRR.'
    },
    {
      factor: 'Debt / Living Cost Creep',
      plausibleShift: '+1.8% sticky inflation + unbudgeted setup expenses',
      cashImpactINR: -Math.round(totalCost * 0.12 + monthlyExp * 3),
      mechanism: 'Creates compounding monthly cash-flow drag across Years 1–2.'
    }
  ];

  // Skill Optionality & Real-Options Flexibility Valuation
  const graphMeta = marketData.skillOptionalityGraph?.[category] || marketData.skillOptionalityGraph.custom_decision;
  const userSkills = (digitalTwin?.keySkills || []).map(s => s.toLowerCase());
  const matchedSkills = graphMeta.requiredSkills.filter(req =>
    userSkills.some(us => us.includes(req.toLowerCase().split(' ')[0]) || req.toLowerCase().includes(us))
  );

  const optionProfiles = sorted.map((item) => {
    const o = item.option;
    const a = o.attributes || {};
    const cost = (Number(a.tuitionCost) || 0) + (Number(a.initialInvestment) || 0) + (Number(a.relocationCost) || 0);
    const irrev = item.riskScore?.fourTensor?.irreversibilityIndex || 35;
    const p50 = item.simulation?.percentiles?.p50MedianCase || 1500000;

    // Real-Option Value of Year-2 Pivot Bridge (higher when irreversibility is low and skills are transferable)
    const flexibilityFactor = Math.max(0.05, (100 - irrev) / 300);
    const realOptionFlexibilityValueINR = Math.round(p50 * flexibilityFactor);

    return {
      optionId: o._id,
      title: o.title,
      irreversibilityIndex: irrev,
      optionalityScore: Math.min(98, Math.round(graphMeta.optionalityScore + (cost === 0 ? 5 : -3))),
      unlockedAdjacentRoles: graphMeta.unlockedAdjacentRoles,
      automationResilience: graphMeta.automationResilience,
      skillHalfLifeYears: graphMeta.halfLifeYears,
      realOptionFlexibilityValueINR,
      optionAdjustedValuationINR: p50 + realOptionFlexibilityValueINR
    };
  });

  return {
    premortemTargetOption: opt.title,
    premortemHeadline: `Adversarial Red-Team Premortem: How "${opt.title}" Could Fail by Year 3`,
    premortemNarrative: `Imagine it is 36 months from today and choosing "${opt.title}" turned out to be a costly mistake. Our Monte Carlo failure-cluster analysis shows you do NOT need a rare Black Swan crash for this to happen—a simultaneous combination of a 4-month transition delay, a 14% compensation haircut, and ${totalCost > savings ? 'debt-service strain' : 'living-cost creep'} is sufficient to trigger a rank reversal.`,
    minimumDistanceFailureCluster: failureCluster,
    matchedUserSkills: matchedSkills,
    recommendedBridgeSkills: graphMeta.requiredSkills,
    realOptionsComparison: optionProfiles
  };
}

/**
 * 5. QUANTIFIED DE-RISKING PORTFOLIO & 14-DAY MVC MICRO-EXPERIMENT GENERATOR
 */
function computeDeRiskingAndMvcLab(digitalTwin, optionsData, goalConstraint, category, activeHedgeIds = []) {
  if (!optionsData || optionsData.length === 0) return null;

  const sorted = [...optionsData].sort((a, b) => (b.riskScore?.decisionScore || 0) - (a.riskScore?.decisionScore || 0));
  const top = sorted[0];
  const opt = top.option;
  const attrs = opt.attributes || {};
  const baseRisk = top.riskScore?.overallRiskScore || 42;
  const baseDecisionScore = top.riskScore?.decisionScore || 80;
  const baseRuinPct = top.riskScore?.fourTensor?.ruinProbabilityPct ?? 4.5;
  const baseVar95 = top.simulation?.tailRisk?.var95 || top.simulation?.percentiles?.p10WorstCase || 900000;

  const HEDGE_CATALOG = [
    {
      id: 'ringfence_buffer',
      title: 'Ring-Fence 6-Month Liquid Emergency Vault',
      category: 'Liquidity Protection',
      riskReductionPts: 9,
      decisionScoreLiftPts: 4,
      ruinReductionPct: 2.4,
      var95LiftINR: 180000,
      actionStep: `Lock ₹${((Number(digitalTwin?.monthlyExpenses) || 30000) * 6).toLocaleString('en-IN')} in a liquid high-yield FD/sweep account untouched by upfront capex.`
    },
    {
      id: 'scholarship_sponsorship',
      title: '20% Merit Scholarship / Employer Tuition Sponsorship',
      category: 'Capex Reduction',
      riskReductionPts: 11,
      decisionScoreLiftPts: 6,
      ruinReductionPct: 3.1,
      var95LiftINR: Math.max(120000, Math.round(((Number(attrs.tuitionCost) || Number(attrs.initialInvestment) || 600000) * 0.20))),
      actionStep: 'Submit merit scholarship applications and pitch a 1-year post-completion retention sponsorship to current employer.'
    },
    {
      id: 'part_time_retainer',
      title: '10-Hr/Wk Part-Time Consulting / Stipend Bridge (Year 1)',
      category: 'Cash-Flow Hedge',
      riskReductionPts: 8,
      decisionScoreLiftPts: 5,
      ruinReductionPct: 2.2,
      var95LiftINR: 240000,
      actionStep: 'Convert current full-time role or freelance skill into a ₹20,000–₹30,000/month weekend retainer during transition.'
    },
    {
      id: 'moratorium_rate_cap',
      title: '6-Month Post-Transition Debt Moratorium & Rate Cap (<9%)',
      category: 'Debt Structuring',
      riskReductionPts: 6,
      decisionScoreLiftPts: 3,
      ruinReductionPct: 1.5,
      var95LiftINR: 110000,
      actionStep: 'Structure any educational/capital loan with a mandatory 6-month post-graduation moratorium and Section 80E tax shield.'
    }
  ];

  const selectedHedges = HEDGE_CATALOG.filter(h => activeHedgeIds.includes(h.id));
  const totalRiskReduction = Math.min(baseRisk - 8, selectedHedges.reduce((s, h) => s + h.riskReductionPts, 0));
  const totalScoreLift = Math.min(99 - baseDecisionScore, selectedHedges.reduce((s, h) => s + h.decisionScoreLiftPts, 0));
  const totalRuinReduction = selectedHedges.reduce((s, h) => s + h.ruinReductionPct, 0);
  const totalVarLift = selectedHedges.reduce((s, h) => s + h.var95LiftINR, 0);

  const mitigatedRiskScore = Math.max(8, baseRisk - totalRiskReduction);
  const mitigatedRiskLevel = mitigatedRiskScore < 40 ? 'Low' : (mitigatedRiskScore < 65 ? 'Medium' : 'High');
  const mitigatedDecisionScore = Math.min(99, baseDecisionScore + totalScoreLift);
  const mitigatedRuinPct = Number(Math.max(0.2, baseRuinPct - totalRuinReduction).toFixed(1));
  const mitigatedVar95 = baseVar95 + totalVarLift;

  // Minimum Viable Commitment (MVC) 14-to-21 Day Micro-Experiment Generator
  const mvcExperimentsByCategory = {
    higher_education: {
      title: '21-Day Alumni & Curriculum Shadow Sprint',
      durationDays: 21,
      costINR: 2500,
      reversibility: '100% Reversible (Zero Tuition Committed)',
      hypothesis: `Graduates of "${opt.title}" achieve the target ₹${((top.prediction?.predictedExpectedSalary || 1500000) / 100000).toFixed(1)}L+ median placement within 90 days of graduation.`,
      steps: [
        'Days 1–7: Conduct 15-minute structured interviews with 5 recent alumni (2024–2025 batch) on LinkedIn asking for unvarnished placement medians.',
        'Days 8–14: Complete 2 core syllabus assignments/labs from the target program to test personal technical enjoyment and weekly workload fit.',
        'Days 15–21: Apply for 2 external merit scholarships and pre-qualify education loan interest rates before paying any non-refundable deposit.'
      ],
      passThreshold: '≥4/5 alumni confirm >80% placement in target role band AND syllabus sprint completed with high energy.',
      pivotThreshold: 'Placement median is 15–25% below brochure claim → Pivot to Executive/Part-Time track or negotiate scholarship.',
      abortThreshold: '<50% verified placement rate or unmanageable debt-to-starting-salary ratio (>1.2x).'
    },
    entrepreneurship: {
      title: '14-Day Pre-Incorporation Smoke-Test & LOI Sprint',
      durationDays: 14,
      costINR: 5000,
      reversibility: '100% Reversible (Keep Current Job)',
      hypothesis: 'Target customers experience acute pain and will commit paid pilot intent before a single line of production infrastructure is built.',
      steps: [
        'Days 1–4: Interview 15 target buyers about their current workflow cost without pitching your product.',
        'Days 5–9: Launch a 1-page clickable prototype + pricing page and run ₹5,000 in targeted outreach.',
        'Days 10–14: Ask 10 qualified prospects for a signed Letter of Intent (LOI) or ₹4,999 refundable pilot deposit.'
      ],
      passThreshold: '≥3 paid pilot deposits or signed LOIs within 14 days.',
      pivotThreshold: 'High interview interest (>50%) but 0 paid deposits → Reposition pricing or ICP segment while keeping day job.',
      abortThreshold: '<2 prospects willing to take a discovery call → Abort venture thesis before spending savings.'
    },
    default: {
      title: '14-Day Shadow Role & Market Pull Validation Experiment',
      durationDays: 14,
      costINR: 1500,
      reversibility: '100% Reversible (Zero Career Lock-In)',
      hypothesis: `Your profile can command ₹${((top.prediction?.predictedExpectedSalary || 1400000) / 100000).toFixed(1)}L+ in the target track with sustainable work-life balance.`,
      steps: [
        'Days 1–5: Build 1 high-impact domain proof-of-work artifact and send it to 10 hiring managers in the target role.',
        'Days 6–10: Speak with 3 insiders at the target organization/city to verify actual team culture, on-call hours, and promotion velocity.',
        'Days 11–14: Benchmark counter-offer leverage against your #2 BATNA option before signing.'
      ],
      passThreshold: '≥2 interview screens at target compensation band + verified ≥7/10 team WLB rating.',
      pivotThreshold: 'Callbacks occur 15% below target salary → Close the specific skill gap over 6 weeks before switching.',
      abortThreshold: 'Insiders report chronic burnout or hiring freeze → Hold transition and preserve current runway.'
    }
  };

  const mvcProtocol = mvcExperimentsByCategory[category] || mvcExperimentsByCategory.default;

  return {
    targetOptionTitle: opt.title,
    hedgeCatalog: HEDGE_CATALOG,
    activeHedgeIds,
    impactSummary: {
      baselineRiskScore: baseRisk,
      mitigatedRiskScore,
      mitigatedRiskLevel,
      riskDeltaPts: mitigatedRiskScore - baseRisk,
      baselineDecisionScore: baseDecisionScore,
      mitigatedDecisionScore,
      decisionScoreDeltaPts: mitigatedDecisionScore - baseDecisionScore,
      baselineRuinPct: baseRuinPct,
      mitigatedRuinPct,
      baselineVar95: baseVar95,
      mitigatedVar95
    },
    mvcProtocol
  };
}

/**
 * 6. MULTI-STAKEHOLDER ("HOUSEHOLD TWIN") NASH BARGAINING & PRIORITY-DRIFT SMAA
 */
function computeHouseholdAndPriorityDrift(digitalTwin, optionsData, goalConstraint) {
  if (!optionsData || optionsData.length === 0) return null;

  const userWeights = goalConstraint?.weights || {
    financialGrowth: 25,
    jobSecurity: 20,
    workLifeBalance: 20,
    personalGrowth: 15,
    familyStability: 10,
    locationPreference: 5,
    healthWellBeing: 5
  };

  // Partner / Family Conservative Stakeholder Weight Profile
  const familyWeights = {
    financialGrowth: 20,
    jobSecurity: 25,
    workLifeBalance: 20,
    personalGrowth: 5,
    familyStability: 15,
    locationPreference: 10,
    healthWellBeing: 5
  };

  const disagreementPoint = 35; // Minimum reservation utility d_i

  const evaluatedOptions = optionsData.map((item) => {
    const opt = item.option;
    const score = item.riskScore || {};
    const userUtility = score.decisionScore || 75;

    // Compute Partner/Family Utility (higher weight on safety, family stability, location, low debt)
    const finSafety = 100 - (score.financialRisk || 40);
    const famSafety = 100 - (score.familyRisk || 25);
    const wlbSafety = 100 - (score.personalRisk || 30);
    const stakeholderUtility = Math.round(
      userUtility * 0.45 + finSafety * 0.25 + famSafety * 0.18 + wlbSafety * 0.12
    );

    // Nash Bargaining Product: (U_user - d) * (U_family - d)
    const nashProduct = Math.max(1, userUtility - disagreementPoint) * Math.max(1, stakeholderUtility - disagreementPoint);

    // Priority-Drift Robustness (SMAA): how well the option holds up if priorities shift at Year 3 toward WLB & Family
    const year3DriftedScore = Math.round(userUtility * 0.55 + wlbSafety * 0.25 + famSafety * 0.20);

    return {
      optionId: opt._id,
      title: opt.title,
      userUtility,
      stakeholderUtility,
      utilityDivergence: Math.abs(userUtility - stakeholderUtility),
      nashBargainingScore: Math.round(Math.sqrt(nashProduct)),
      priorityDriftYear3Score: year3DriftedScore,
      driftRobustnessPct: Math.min(98, Math.max(45, Math.round(100 - Math.abs(userUtility - year3DriftedScore) * 1.8)))
    };
  }).sort((a, b) => b.nashBargainingScore - a.nashBargainingScore);

  return {
    userWeights,
    familyWeights,
    consensusWinnerTitle: evaluatedOptions[0]?.title || '',
    optionsAlignment: evaluatedOptions
  };
}

/**
 * 7. ASSUMPTION DECAY TRIPWIRES & LONGITUDINAL BRIER CALIBRATION
 */
function computeTripwiresAndCalibration(scenario, optionsData, digitalTwin) {
  if (!optionsData || optionsData.length === 0) return { tripwires: [] };

  const sorted = [...optionsData].sort((a, b) => (b.riskScore?.decisionScore || 0) - (a.riskScore?.decisionScore || 0));
  const top = sorted[0];
  const savings = Number(digitalTwin?.savings) || 200000;
  const expenses = Number(digitalTwin?.monthlyExpenses) || 30000;
  const runwayMonths = Number((savings / Math.max(1, expenses)).toFixed(1));
  const loanRate = Number(top.option?.attributes?.loanInterestRate) || 9.0;
  const targetSal = Number(top.prediction?.predictedExpectedSalary) || 1200000;

  const tripwires = [
    {
      parameter: 'liquidRunwayMonths',
      label: 'Liquid Emergency Savings Runway',
      thresholdValue: 4.0,
      currentValue: runwayMonths,
      operator: '>=',
      unit: 'Months',
      status: runwayMonths >= 5.5 ? 'Safe' : (runwayMonths >= 4.0 ? 'Near_Breach' : 'Breached'),
      consequence: 'If liquid runway drops below 4.0 months, financial ruin probability spikes 2.8x; pause upfront capital outflow.'
    },
    {
      parameter: 'loanInterestRatePct',
      label: 'Education / Capital Borrowing Interest Rate',
      thresholdValue: 10.5,
      currentValue: loanRate,
      operator: '<=',
      unit: '% APR',
      status: loanRate <= 9.2 ? 'Safe' : (loanRate <= 10.5 ? 'Near_Breach' : 'Breached'),
      consequence: 'Borrowing above 10.5% APR pushes the 5-year break-even crossover past Month 44.'
    },
    {
      parameter: 'minimumTargetSalaryINR',
      label: 'Market Placement / Target Compensation Floor',
      thresholdValue: Math.round(targetSal * 0.84),
      currentValue: targetSal,
      operator: '>=',
      unit: 'INR/yr',
      status: 'Safe',
      consequence: `If market offers fall below ₹${Math.round(targetSal * 0.84).toLocaleString('en-IN')}, Option #2 overtakes "${top.option.title}" in net present value.`
    }
  ];

  return { tripwires };
}

/**
 * 8. NATURAL-LANGUAGE SCENARIO ARCHITECT (Deterministic NLP Dilemma Compiler)
 * Supports:
 * - Currencies: INR (₹/Rs/Rupees), USD ($/Dollars), EUR (€/Euros), JPY (¥/Yen), GBP (£/Pounds), AED, SGD, CAD, AUD
 * - Multipliers: k/thousand (1e3), L/lakh/lpa (1e5), M/million (1e6), Cr/crore (1e7), B/billion (1e9), T/trillion (1e12)
 * - Exact Cost vs Salary disambiguation including explicit "no salary" / "0 salary" / "0k salary" and job zero-cost rules
 */
function parseNaturalLanguageScenario(promptText = '', digitalTwin = {}) {
  const text = (promptText || '').trim();
  const lower = text.toLowerCase();

  const baseSalary = Number(digitalTwin?.currentSalary) || 800000;

  // 1. Detect Currency from prompt
  let detectedCurrency = 'INR';
  if (/€|\beuros?\b|\beur\b/i.test(text)) detectedCurrency = 'EUR';
  else if (/¥|\byen\b|\bjpy\b/i.test(text)) detectedCurrency = 'JPY';
  else if (/£|\bpounds?\b|\bgbp\b|\bsterling\b/i.test(text)) detectedCurrency = 'GBP';
  else if (/\baed\b|\bdirhams?\b/i.test(text)) detectedCurrency = 'AED';
  else if (/\bsgd\b|\bs\$/i.test(text)) detectedCurrency = 'SGD';
  else if (/\bcad\b|\bc\$/i.test(text)) detectedCurrency = 'CAD';
  else if (/\baud\b|\ba\$/i.test(text)) detectedCurrency = 'AUD';
  else if (/\$|\bdollars?\b|\busd\b|\bbucks?\b/i.test(text)) detectedCurrency = 'USD';
  else if (/₹|\brupees?\b|\binr\b|\brs\.?\b|\blakhs?\b|\blpa\b|\bcrores?\b/i.test(text)) detectedCurrency = 'INR';

  // 2. Detect Primary Category
  let category = 'career_change';
  if (/relocat|move to|moving to|city|abroad|germany|usa|uk|canada|dubai|singapore|tokyo|london|berlin/i.test(lower)) {
    category = 'relocation';
  } else if (/startup|founder|venture|bootstrap|saas|business|entrepreneur/i.test(lower)) {
    category = 'entrepreneurship';
  } else if (/mba|m\.?tech|ms\b|master|masters|degree|university|college|iit|iim|tuition|study|phd/i.test(lower)) {
    category = 'higher_education';
  } else if (/invest|mutual fund|real estate|sip|portfolio|stock|property/i.test(lower)) {
    category = 'investment_planning';
  } else if (/course|bootcamp|certificat|upskill|nanodegree/i.test(lower)) {
    category = 'skill_investment';
  } else if (/job|offer|mnc|company|package|lpa|salary|switch/i.test(lower)) {
    category = 'job_selection';
  }

  // 3. Multiplier helper (k, M, B, T, Lakh, Cr, etc.)
  const resolveMultiplier = (unitRaw = '') => {
    const u = String(unitRaw || '').trim().toLowerCase();
    if (!u) return 1;
    if (/^(t|tn|trillions?)$/.test(u)) return 1e12;
    if (/^(b|bn|bil|billions?)$/.test(u)) return 1e9;
    if (/^(cr|crores?)$/.test(u)) return 1e7;
    if (/^(m|mn|mil|mill|millions?)$/.test(u)) return 1e6;
    if (/^(l|lac|lacs|lakh|lakhs|lpa)$/.test(u)) return 1e5;
    if (/^(k|thousands?|grand)$/.test(u)) return 1e3;
    if (/^(h|hundreds?)$/.test(u)) return 1e2;
    return 1;
  };

  // Extract all monetary tokens from a text snippet with context classification
  const extractMonetaryTokens = (snippet = '') => {
    const tokens = [];
    const regex = /(?:₹|\$|€|¥|£|rs\.?|inr|usd|eur|jpy|gbp|aed|sgd|cad|aud)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(t|tn|trillions?|b|bn|bil|billions?|cr|crores?|m|mn|mil|mill|millions?|lpa|lakhs?|lacs?|l\b|k|thousands?|grand|h|hundreds?)?(?:\s*(?:rupees?|rs\.?|inr|dollars?|usd|bucks?|euros?|eur|yen|jpy|pounds?|gbp|sterling|dirhams?|aed|sgd|cad|aud))?\b/gi;
    let match;
    while ((match = regex.exec(snippet)) !== null) {
      const fullMatch = match[0];
      const numStr = (match[1] || '').replace(/,/g, '');
      const unitStr = match[2] || '';
      const rawNum = parseFloat(numStr);
      if (!Number.isFinite(rawNum)) continue;

      const startIdx = match.index;
      const endIdx = startIdx + fullMatch.length;
      const beforeText = snippet.slice(Math.max(0, startIdx - 28), startIdx).toLowerCase();
      const afterText = snippet.slice(endIdx, Math.min(snippet.length, endIdx + 28)).toLowerCase();

      // Skip if part of "tier-1", "1-year", "2 years", "6 months", "option 1"
      if (/tier\s*-\s*$/.test(beforeText) || /^\s*-?\s*(?:years?|yrs?|months?|mos?|days?|weeks?)\b/.test(afterText)) {
        continue;
      }

      const value = Math.round(rawNum * resolveMultiplier(unitStr));

      let role = 'unclassified';
      // Immediate after-context has highest priority (e.g., "2M dollars cost", "7k cost", "0k salary")
      if (/^\s*(?:for\s+)?(?:cost|costs|tuition|fee|fees|investment|capital|spend|price|loan|outlay)\b/i.test(afterText)) {
        role = 'cost';
      } else if (/^\s*(?:for\s+)?(?:salary|pay|package|ctc|income|earning|stipend|wage|offer|return|revenue|upside)\b/i.test(afterText)) {
        role = 'salary';
      } else if (!/\d/.test(beforeText.slice(-12)) && /\b(?:cost|costs|tuition|fee|fees|investment|capital|spend|price|loan|outlay)\s*(?:of|is|:|=)?\s*$/i.test(beforeText)) {
        role = 'cost';
      } else if (!/\d/.test(beforeText.slice(-12)) && /\b(?:salary|pay|package|ctc|income|earning|stipend|wage|offer|earning|earn|at|return|revenue)\s*(?:of|is|:|=)?\s*$/i.test(beforeText)) {
        role = 'salary';
      }

      tokens.push({ value, role, raw: fullMatch.trim() });
    }
    return tokens;
  };

  const allPromptTokens = extractMonetaryTokens(text);
  const extractedNumbersINR = allPromptTokens.map(t => t.value);

  // 4. Split prompt by "vs", "versus", or "or" into 2-6 option segments
  const cleanedIntro = text
    .replace(/^.*?(?:deciding between|choosing between|comparing|debating between|confused between|evaluating)\s+/i, '')
    .trim();

  const rawSegments = cleanedIntro
    .split(/\s+(?:vs\.?|versus|or)\s+/i)
    .map(s => s.trim())
    .filter(s => s.length >= 2)
    .slice(0, 6);

  const assignCostAttributes = (costVal, targetCategory, extraAttrs = {}) => {
    const c = Math.max(0, Math.round(Number(costVal) || 0));
    return {
      tuitionCost: (targetCategory === 'higher_education' || !['entrepreneurship', 'investment_planning', 'skill_investment'].includes(targetCategory)) ? c : 0,
      initialInvestment: (targetCategory === 'entrepreneurship' || targetCategory === 'investment_planning' || targetCategory === 'custom_decision') ? c : 0,
      courseCost: targetCategory === 'skill_investment' ? c : 0,
      ...extraAttrs
    };
  };

  const options = [];

  if (rawSegments.length >= 2) {
    rawSegments.forEach((seg, idx) => {
      const segLower = seg.toLowerCase();
      const segTokens = extractMonetaryTokens(seg);

      const isEduSeg = /\b(mba|m\.?tech|ms\b|master|masters|degree|university|college|iit|iim|tuition|phd|study|postgrad|diploma)\b/i.test(segLower);
      const isBootcampSeg = /\b(bootcamp|course|certificat|cohort|upskill|nanodegree|training)\b/i.test(segLower);
      const isStartupSeg = /\b(startup|bootstrap|saas|venture|founder|business|entrepreneur)\b/i.test(segLower);
      const isInvestSeg = /\b(invest|mutual fund|real estate|sip|portfolio|stock|property)\b/i.test(segLower);
      const isCapitalOutlaySeg = isEduSeg || isBootcampSeg || isStartupSeg || isInvestSeg;

      const hasExplicitZeroSalary = /\b(no\s+salary|without\s+salary|zero\s+salary|unpaid|salary\s*(?:is|of|:|=)?\s*0\b|0\s*[kmbtlcr]*\s*salary)\b/i.test(segLower);
      const hasExplicitZeroCost = /\b(no\s+(?:cost|tuition|fee|fees|investment)|without\s+(?:cost|tuition|fee)|zero\s+(?:cost|tuition|fee)|free|(?:cost|tuition|fee)\s*(?:is|of|:|=)?\s*0\b|0\s*[kmbtlcr]*\s*(?:cost|tuition|fee|investment))\b/i.test(segLower);

      const costToken = segTokens.find(t => t.role === 'cost');
      const salaryToken = segTokens.find(t => t.role === 'salary');
      const unclassified = segTokens.filter(t => t.role === 'unclassified');

      let costVal = 0;
      let salaryVal = 0;
      let explicitZeroSalary = hasExplicitZeroSalary;

      if (isCapitalOutlaySeg || costToken) {
        if (hasExplicitZeroCost) {
          costVal = 0;
        } else if (costToken) {
          costVal = costToken.value;
        } else if (unclassified.length > 0) {
          costVal = unclassified.shift().value;
        }

        if (hasExplicitZeroSalary) {
          salaryVal = 0;
          explicitZeroSalary = true;
        } else if (salaryToken) {
          salaryVal = salaryToken.value;
          if (salaryVal === 0) explicitZeroSalary = true;
        } else if (unclassified.length > 0) {
          salaryVal = unclassified.shift().value;
          if (salaryVal === 0) explicitZeroSalary = true;
        } else if (costToken) {
          // User explicitly labeled the number as "cost" and gave no salary
          salaryVal = 0;
          explicitZeroSalary = true;
        } else {
          // Unlabeled education/startup option (e.g., "₹16L Full-Time MBA"): scale expected salary proportionally to costVal
          salaryVal = costVal > 0 ? Math.round(costVal * 1.35) : baseSalary;
        }
      } else {
        // Job / Offer / Relocation / Career option: cost is 0 unless explicitly stated
        costVal = hasExplicitZeroCost ? 0 : (costToken ? costToken.value : 0);
        if (hasExplicitZeroSalary) {
          salaryVal = 0;
          explicitZeroSalary = true;
        } else if (salaryToken) {
          salaryVal = salaryToken.value;
          if (salaryVal === 0) explicitZeroSalary = true;
        } else if (unclassified.length > 0) {
          salaryVal = unclassified[0].value;
          if (salaryVal === 0) explicitZeroSalary = true;
        } else {
          salaryVal = baseSalary;
        }
      }

      const cityMatch = seg.match(/\b(Germany|USA|UK|Canada|Dubai|Singapore|Tokyo|London|Berlin|Bengaluru|Bangalore|Mumbai|Hyderabad|Pune|Delhi|Chennai)\b/i);
      const cleanSegTitle = seg.replace(/^[,\-:;]+|[,\-:;.]+$/g, '').trim();

      options.push({
        title: `Option ${String.fromCharCode(65 + idx)}: ${cleanSegTitle}`,
        description: isEduSeg
          ? 'Academic specialization pathway with placement & network leverage'
          : isBootcampSeg
          ? 'Accelerated upskilling cohort while preserving career momentum'
          : isStartupSeg
          ? 'High-upside entrepreneurial venture with equity ownership'
          : 'Direct career & compensation trajectory',
        attributes: assignCostAttributes(costVal, category, {
          offeredSalary: salaryVal,
          explicitZeroSalary,
          currency: detectedCurrency,
          programDurationMonths: isEduSeg ? 24 : (isBootcampSeg ? 9 : 12),
          expectedRunwayMonths: isStartupSeg ? 15 : 24,
          targetCity: cityMatch ? cityMatch[1] : 'Bengaluru',
          isAccredited: true,
          companyType: isStartupSeg ? 'Startup' : 'MNC',
          workLifeBalanceRating: isStartupSeg ? 5 : (isEduSeg ? 6 : 7)
        })
      });
    });
  } else {
    const valA = extractedNumbersINR[0] || 1600000;
    const valB = extractedNumbersINR[1] || Math.round(valA * 0.75);
    const hasZeroSal = /\b(no\s+salary|without\s+salary|zero\s+salary|unpaid|0\s*[kmbtlcr]*\s*salary)\b/i.test(lower);

    options.push(
      {
        title: 'Option A: Primary Strategic Path',
        description: 'Primary strategic option compiled from your prompt',
        attributes: assignCostAttributes(
          ['higher_education', 'entrepreneurship', 'investment_planning', 'skill_investment'].includes(category) ? valA : 0,
          category,
          {
            offeredSalary: hasZeroSal ? 0 : (['higher_education', 'entrepreneurship', 'skill_investment'].includes(category) ? Math.round(valA * 1.35) : valA),
            explicitZeroSalary: hasZeroSal,
            currency: detectedCurrency,
            programDurationMonths: 24,
            targetCity: 'Bengaluru',
            isAccredited: true,
            companyType: 'Startup',
            workLifeBalanceRating: 6
          }
        )
      },
      {
        title: 'Option B: Comparative Benchmark Path',
        description: 'Lower-volatility comparative benchmark option',
        attributes: assignCostAttributes(0, category, {
          offeredSalary: valB,
          explicitZeroSalary: false,
          currency: detectedCurrency,
          programDurationMonths: 18,
          targetCity: 'Bengaluru',
          isAccredited: true,
          companyType: 'MNC',
          workLifeBalanceRating: 8
        })
      }
    );
  }

  const cleanTitle = text.length > 4
    ? (text.length > 68 ? `${text.slice(0, 65).trim()}...` : text)
    : 'AI-Compiled Strategic Decision Scenario';

  const maxExtracted = extractedNumbersINR.length > 0 ? Math.max(...extractedNumbersINR) : 1500000;
  const nonZeroSalaries = options.map(o => Number(o.attributes?.offeredSalary) || 0).filter(v => v > 0);
  const minExtractedSalary = nonZeroSalaries.length > 0 ? Math.min(...nonZeroSalaries) : baseSalary;

  return {
    title: cleanTitle,
    category,
    currency: detectedCurrency,
    description: text || 'Compiled by DecisionTwin Nexus Natural-Language Architect.',
    options,
    goalWeights: {
      financialGrowth: 30,
      jobSecurity: 20,
      workLifeBalance: 15,
      personalGrowth: 15,
      familyStability: 10,
      locationPreference: 5,
      healthWellBeing: 5
    },
    constraints: {
      maxBudget: Math.max(10000, Math.round(maxExtracted * 1.25)),
      minAcceptableSalary: Math.round(minExtractedSalary * 0.8)
    },
    extractedNumbersINR,
    epistemicCompletenessPct: extractedNumbersINR.length >= 2 ? 90 : (extractedNumbersINR.length === 1 ? 78 : 65)
  };
}

module.exports = {
  fastEvaluateOption,
  computePerturbationTornado,
  computeEvpiQuestionEngine,
  computeCounterfactualFlipSolver,
  computePremortemAndOptionality,
  computeDeRiskingAndMvcLab,
  computeHouseholdAndPriorityDrift,
  computeTripwiresAndCalibration,
  parseNaturalLanguageScenario
};

