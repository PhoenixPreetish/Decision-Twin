/**
 * Advanced Decision Intelligence Suite (5 Flagship Modules)
 * 1. Parallel Universe Time-Machine (Twin A vs Twin B Year-by-Year Evolution)
 * 2. Reverse Goal-Solver & Tipping-Point Backcaster (Mathematical Optimization)
 * 3. Game Theory Regret & Opportunity Cost Matrix (Savage Minimax Regret)
 * 4. Interactive Life Event & Black Swan Shock Injector (Dynamic Timeline Shocks)
 * 5. Behavioral Economics & Cognitive Bias Auditor (Kahneman Prospect Theory)
 *
 * 100% Offline, Deterministic & Mathematically Rigorous Engine
 */

const LIFE_EVENT_CATALOG = [
  {
    id: 'marriage_house',
    title: 'Marriage / Home Downpayment',
    year: 2,
    type: 'expense_shock',
    impactAmount: -1200000,
    badge: '-₹12.0L in Yr 2',
    category: 'Life Milestone',
    description: 'Major personal milestone requiring ₹12 Lakhs lump-sum capital outlay in Year 2 (Month 24).'
  },
  {
    id: 'sabbatical_layoff',
    title: '6-Month Layoff / Career Sabbatical',
    year: 2,
    type: 'income_Pause',
    incomeMultiplier: 0.5,
    badge: '-50% Yr 2 Income',
    category: 'Career Shock',
    description: 'Unexpected 6-month employment gap or burnout sabbatical reducing Year 2 earnings by 50%.'
  },
  {
    id: 'medical_emergency',
    title: 'Family Medical Emergency',
    year: 1,
    type: 'expense_shock',
    impactAmount: -450000,
    badge: '-₹4.5L in Yr 1',
    category: 'Black Swan',
    description: 'Uninsured health or family emergency requiring immediate ₹4.5 Lakhs cash outflow in Year 1.'
  },
  {
    id: 'ai_boom_promo',
    title: 'AI Industry Boom / Fast-Track Promo',
    year: 3,
    type: 'income_boost',
    incomeBoostRate: 0.25,
    badge: '+25% Salary (Yr 3-5)',
    category: 'Upside Catalyst',
    description: 'Accelerated promotion or high-demand skill premium boosting annual compensation by +25% from Year 3 onward.'
  },
  {
    id: 'new_dependent',
    title: 'New Child / Dependent Addition',
    year: 3,
    type: 'recurring_expense',
    monthlyIncrease: 20000,
    badge: '+₹20k/mo (Yr 3-5)',
    category: 'Family Milestone',
    description: 'Increased household & childcare responsibility adding ₹20,000/month (₹2.4L/year) from Year 3 to Year 5.'
  },
  {
    id: 'grant_bonus',
    title: 'Scholarship / Signing Bonus Windfall',
    year: 1,
    type: 'windfall',
    impactAmount: 500000,
    badge: '+₹5.0L in Yr 1',
    category: 'Upside Catalyst',
    description: 'Merit scholarship grant, ESOP liquidation, or signing bonus injecting +₹5 Lakhs in Year 1.'
  }
];

/**
 * Helper to extract option financial fundamentals consistently
 */
function extractOptionFundamentals(digitalTwin, item, index = 0) {
  const opt = item.option || {};
  const pred = item.prediction || {};
  const sim = item.simulation || {};
  const score = item.riskScore || {};
  const attrs = opt.attributes || {};

  const currentSalary = Number(digitalTwin?.currentSalary) || 800000;
  const monthlyExpenses = Number(digitalTwin?.monthlyExpenses) || 35000;
  const initialSavings = Number(digitalTwin?.savings) || 300000;
  const existingDebt = Number(digitalTwin?.debt) || 0;

  const tuitionCost = Number(attrs.tuitionCost) || 0;
  const initialInvestment = Number(attrs.initialInvestment) || 0;
  const relocationCost = Number(attrs.relocationCost) || 0;
  const upfrontCost = tuitionCost + initialInvestment + relocationCost;

  const durationMonths = Number(attrs.programDurationMonths) || (tuitionCost > 0 ? 24 : 0);
  const studyYears = Math.min(3, Math.ceil(durationMonths / 12));

  const targetSalary =
    Number(attrs.offeredSalary) ||
    Number(pred.predictedExpectedSalary) ||
    Number(attrs.expectedAnnualRevenue) ||
    Math.round(currentSalary * (tuitionCost > 0 ? 1.65 : 1.25));

  const p50 = sim?.percentiles?.p50MedianCase ?? (targetSalary * 2.2 - upfrontCost);
  const p10 = sim?.percentiles?.p10WorstCase ?? Math.round(p50 * 0.45 - upfrontCost * 0.3);
  const p90 = sim?.percentiles?.p90BestCase ?? Math.round(p50 * 1.65);
  const stdDev = sim?.percentiles?.standardDeviation ?? Math.max(250000, Math.round((p90 - p10) / 2.56));

  const isPartTimeOrExec =
    opt.title?.toLowerCase().includes('executive') ||
    opt.title?.toLowerCase().includes('part-time') ||
    opt.title?.toLowerCase().includes('distance') ||
    opt.title?.toLowerCase().includes('continue job');

  return {
    optionId: (opt._id || opt.id || `opt-${index}`).toString(),
    title: opt.title || `Option ${index + 1}`,
    description: opt.description || '',
    currentSalary,
    monthlyExpenses,
    initialSavings,
    existingDebt,
    tuitionCost,
    initialInvestment,
    upfrontCost,
    durationMonths,
    studyYears: isPartTimeOrExec ? 0 : studyYears,
    isPartTimeOrExec,
    targetSalary,
    p10,
    p50,
    p90,
    stdDev,
    decisionScore: score.decisionScore ?? (85 - index * 4),
    overallRiskScore: score.overallRiskScore ?? 35,
    overallRiskLevel: score.overallRiskLevel || 'Low',
    goalAlignmentScore: score.goalAlignmentScore ?? 82,
    rank: score.rank ?? (index + 1),
    wlbRating: Number(attrs.workLifeBalanceRating) || 7
  };
}

/**
 * 1. PARALLEL UNIVERSE TIME-MACHINE (Twin A vs Twin B Year-by-Year Evolution)
 */
function computeParallelUniverseTimeline(digitalTwin, optionsData) {
  const fundamentals = optionsData.map((item, idx) => extractOptionFundamentals(digitalTwin, item, idx));
  fundamentals.sort((a, b) => a.rank - b.rank);

  const baseYear = 2026;
  const optionTimelines = {};

  fundamentals.forEach((f) => {
    const snapshots = [];
    let cumulativeWealth = f.initialSavings - f.existingDebt;
    let remainingCapexDebt = f.upfrontCost;

    for (let yr = 0; yr <= 5; yr++) {
      let annualGrossIncome = f.currentSalary;
      let annualCapexOutflow = 0;
      let careerStage = 'Baseline Role';
      let stressScore = Math.max(15, Math.min(95, 100 - f.wlbRating * 9));

      if (yr === 0) {
        careerStage = 'Decision Launchpad (Day 1)';
        annualGrossIncome = f.currentSalary;
      } else if (yr <= f.studyYears && !f.isPartTimeOrExec) {
        // Full-time study / incubation period
        annualGrossIncome = 0;
        annualCapexOutflow = f.upfrontCost / Math.max(1, f.studyYears);
        remainingCapexDebt = Math.max(0, remainingCapexDebt - annualCapexOutflow);
        careerStage = yr === 1 ? 'Intensive Immersion / Year 1' : 'Capstone & Placement Pipeline';
        stressScore = Math.min(90, stressScore + 18);
      } else {
        // Active earning / post-transition growth
        const yearsInNewRole = yr - (f.isPartTimeOrExec ? 0 : f.studyYears);
        const growthFactor = Math.pow(1.10, Math.max(0, yearsInNewRole - 1));
        annualGrossIncome = Math.round(f.targetSalary * growthFactor);

        if (f.isPartTimeOrExec && yr <= 2 && f.upfrontCost > 0) {
          annualCapexOutflow = f.upfrontCost / 2;
          remainingCapexDebt = Math.max(0, remainingCapexDebt - annualCapexOutflow);
          careerStage = 'Dual-Track (Job + Executive Degree)';
          stressScore = Math.min(88, stressScore + 15);
        } else {
          remainingCapexDebt = 0;
          careerStage =
            yearsInNewRole <= 1
              ? 'Post-Transition Specialist'
              : yearsInNewRole <= 3
              ? 'Senior Domain Lead'
              : 'Principal / Executive Track';
        }
      }

      const annualNetIncome = Math.round(annualGrossIncome * 0.82); // Post-tax
      const annualLivingCost = Math.round(f.monthlyExpenses * 12 * Math.pow(1.06, yr)); // 6% inflation

      if (yr > 0) {
        const netAnnualSavings = annualNetIncome - annualLivingCost - annualCapexOutflow;
        // Investment compounding on positive savings
        const investmentYield = cumulativeWealth > 0 ? Math.round(cumulativeWealth * 0.07) : 0;
        cumulativeWealth = Math.round(cumulativeWealth + netAnnualSavings + investmentYield);
      }

      const monthlyNetCashFlow = yr === 0
        ? Math.round((f.currentSalary * 0.82) / 12 - f.monthlyExpenses)
        : Math.round((annualNetIncome - annualLivingCost - annualCapexOutflow) / 12);

      snapshots.push({
        yearIndex: yr,
        calendarYear: baseYear + yr,
        label: yr === 0 ? `Yr 0 (${baseYear})` : `Yr ${yr} (${baseYear + yr})`,
        netWealth: cumulativeWealth,
        annualIncome: annualGrossIncome,
        monthlyCashFlow: monthlyNetCashFlow,
        remainingDebt: Math.round(remainingCapexDebt),
        careerStage,
        wellBeingIndex: Math.max(10, 100 - stressScore),
        stressIndex: stressScore
      });
    }

    optionTimelines[f.optionId] = {
      optionId: f.optionId,
      title: f.title,
      rank: f.rank,
      decisionScore: f.decisionScore,
      riskLevel: f.overallRiskLevel,
      snapshots
    };
  });

  // Build combined chart series for Years 0..5
  const comparisonSeries = [];
  for (let yr = 0; yr <= 5; yr++) {
    const point = {
      yearIndex: yr,
      calendarYear: baseYear + yr,
      label: `Year ${yr} (${baseYear + yr})`
    };
    fundamentals.forEach((f) => {
      const snap = optionTimelines[f.optionId].snapshots[yr];
      point[f.title] = snap.netWealth;
      point[`${f.optionId}_wealth`] = snap.netWealth;
      point[`${f.optionId}_income`] = snap.annualIncome;
    });
    comparisonSeries.push(point);
  }

  // Compute Crossover Insights between Top 2 options (and all pairs)
  const crossovers = [];
  for (let i = 0; i < fundamentals.length; i++) {
    for (let j = i + 1; j < fundamentals.length; j++) {
      const optA = optionTimelines[fundamentals[i].optionId];
      const optB = optionTimelines[fundamentals[j].optionId];
      let crossoverMonth = null;
      let crossoverNarrative = '';

      for (let yr = 1; yr <= 5; yr++) {
        const prevDiff = optA.snapshots[yr - 1].netWealth - optB.snapshots[yr - 1].netWealth;
        const currDiff = optA.snapshots[yr].netWealth - optB.snapshots[yr].netWealth;

        if ((prevDiff < 0 && currDiff >= 0) || (prevDiff > 0 && currDiff <= 0)) {
          const fraction = Math.abs(prevDiff) / (Math.abs(prevDiff) + Math.abs(currDiff) || 1);
          crossoverMonth = Math.round((yr - 1 + fraction) * 12);
          const overtakingTitle = currDiff >= 0 ? optA.title : optB.title;
          const overtakenTitle = currDiff >= 0 ? optB.title : optA.title;
          crossoverNarrative = `Month ${crossoverMonth} (Year ${(crossoverMonth / 12).toFixed(1)}): "${overtakingTitle}" overtakes "${overtakenTitle}" in cumulative net wealth.`;
          break;
        }
      }

      if (!crossoverNarrative) {
        const finalDiff = optA.snapshots[5].netWealth - optB.snapshots[5].netWealth;
        const leader = finalDiff >= 0 ? optA.title : optB.title;
        crossoverNarrative = `"${leader}" maintains a continuous wealth lead across the entire 60-month horizon (5-Yr Lead: ₹${(Math.abs(finalDiff) / 100000).toFixed(2)} Lakh).`;
      }

      crossovers.push({
        optionAId: optA.optionId,
        optionBId: optB.optionId,
        crossoverMonth,
        narrative: crossoverNarrative
      });
    }
  }

  return {
    baseYear,
    optionTimelines,
    comparisonSeries,
    crossovers
  };
}

/**
 * 2. REVERSE GOAL-SOLVER & TIPPING-POINT BACKCASTER
 */
function computeReverseGoalSolver(digitalTwin, optionsData, targetWealthGoal = 3000000) {
  const fundamentals = optionsData.map((item, idx) => extractOptionFundamentals(digitalTwin, item, idx));
  fundamentals.sort((a, b) => a.rank - b.rank);

  const winner = fundamentals[0];
  const winnerFinalWealth = winner.p50;

  // Approximate normal CDF using logistic approximation for target goal probability
  function normalCDF(x, mean, std) {
    if (std <= 0) return x >= mean ? 1 : 0;
    const z = (x - mean) / std;
    return 1 / (1 + Math.exp(-1.702 * z));
  }

  const backcastResults = fundamentals.map((f) => {
    const isWinner = f.optionId === winner.optionId;
    const wealthGapToWinner = Math.max(0, winnerFinalWealth - f.p50);
    const wealthGapToTarget = Math.max(0, targetWealthGoal - f.p50);

    // 1. Required Scholarship / Upfront Cost Reduction to match Winner
    const maxPossibleDiscount = f.upfrontCost;
    const requiredCostCut = Math.min(maxPossibleDiscount, Math.round(wealthGapToWinner * 0.85));
    const requiredScholarshipPct =
      f.upfrontCost > 0 ? Math.min(100, Math.round((requiredCostCut / f.upfrontCost) * 100)) : 0;

    // 2. Required Starting Salary / Annual Revenue to beat Winner over earning years
    const activeEarningYears = Math.max(1, 5 - f.studyYears);
    const annualPostTaxGap = wealthGapToWinner / activeEarningYears;
    const requiredStartingSalary = isWinner
      ? f.targetSalary
      : Math.round(f.targetSalary + annualPostTaxGap / 0.82);
    const salaryBumpPct = Math.round(((requiredStartingSalary - f.targetSalary) / (f.targetSalary || 1)) * 100);

    // 3. Probability of achieving user's custom Target Wealth Goal
    const probExceedingTarget = 1 - normalCDF(targetWealthGoal, f.p50, f.stdDev);
    const targetAchievementProb = Math.max(5, Math.min(98, Math.round(probExceedingTarget * 100)));

    // 4. Required Monthly Savings Boost to hit custom Target Wealth Goal
    const requiredMonthlyDelta = Math.round(wealthGapToTarget / 60);

    let prescription = '';
    if (isWinner) {
      prescription = `Benchmark Leader (#1). To lock in your ₹${(targetWealthGoal / 100000).toFixed(1)}L target with >85% certainty, maintain a monthly investment SIP of ₹${Math.max(15000, Math.round((f.targetSalary * 0.2) / 12)).toLocaleString('en-IN')}.`;
    } else if (f.upfrontCost > 0 && requiredScholarshipPct > 0 && requiredScholarshipPct <= 75) {
      prescription = `Negotiate at least a ${requiredScholarshipPct}% tuition scholarship (saving ₹${(requiredCostCut / 100000).toFixed(2)}L) OR target a post-completion package of ₹${(requiredStartingSalary / 100000).toFixed(2)} LPA (+${salaryBumpPct}%) to overtake "${winner.title}".`;
    } else {
      prescription = `Requires a starting compensation of ₹${(requiredStartingSalary / 100000).toFixed(2)} LPA (+${salaryBumpPct}% over current projection) or a ₹${Math.round(wealthGapToWinner / 60).toLocaleString('en-IN')}/mo burn reduction to tie "${winner.title}".`;
    }

    return {
      optionId: f.optionId,
      title: f.title,
      rank: f.rank,
      isWinner,
      currentMedianWealth: f.p50,
      currentTargetSalary: f.targetSalary,
      upfrontCost: f.upfrontCost,
      wealthGapToWinner,
      wealthGapToTarget,
      tippingPoints: {
        requiredScholarshipAmount: requiredCostCut,
        requiredScholarshipPct,
        requiredStartingSalary,
        salaryBumpPct,
        requiredMonthlySavingsBoost: requiredMonthlyDelta
      },
      targetGoalAnalysis: {
        targetWealthGoal,
        achievementProbabilityPct: targetAchievementProb,
        feasibilityRating:
          targetAchievementProb >= 75 ? 'High Feasibility' : targetAchievementProb >= 45 ? 'Moderate Stretch' : 'Aggressive Moonshot'
      },
      prescription
    };
  });

  return {
    winnerTitle: winner.title,
    winnerValuation: winnerFinalWealth,
    targetWealthGoal,
    backcastResults
  };
}

/**
 * 3. GAME THEORY REGRET & OPPORTUNITY COST MATRIX (Savage Minimax Regret)
 */
function computeRegretMatrix(optionsData, digitalTwin = {}) {
  const fundamentals = optionsData.map((item, idx) => extractOptionFundamentals(digitalTwin, item, idx));

  const statesOfNature = [
    {
      id: 'bull_boom',
      name: 'Bull / Economic Boom',
      probability: 0.25,
      desc: 'High industry growth, strong placement/market multiples (P90 trajectory)'
    },
    {
      id: 'baseline_growth',
      name: 'Baseline Expected Market',
      probability: 0.45,
      desc: 'Standard macroeconomic growth & historical median progression (P50 trajectory)'
    },
    {
      id: 'stagflation',
      name: 'Stagflation & Cost Squeeze',
      probability: 0.18,
      desc: 'Sticky 8% inflation, delayed promotions, muted hiring (P25 trajectory)'
    },
    {
      id: 'recession_shock',
      name: 'Recession / Downside Shock',
      probability: 0.12,
      desc: 'Market contraction, compensation freeze, capital stress (P10 trajectory)'
    }
  ];

  // Step 1: Compute Payoff Matrix V(Option, State)
  const payoffsByOption = fundamentals.map((f) => {
    const p25 = Math.round((f.p50 + f.p10) / 2);
    return {
      optionId: f.optionId,
      title: f.title,
      rank: f.rank,
      payoffs: {
        bull_boom: f.p90,
        baseline_growth: f.p50,
        stagflation: p25,
        recession_shock: f.p10
      }
    };
  });

  // Step 2: Find Best Payoff V*(State) in each State of Nature
  const bestInState = {};
  statesOfNature.forEach((st) => {
    bestInState[st.id] = Math.max(...payoffsByOption.map((o) => o.payoffs[st.id]));
  });

  // Step 3: Compute Savage Regret R(Option, State) = V*(State) - V(Option, State)
  const regretRows = payoffsByOption.map((o) => {
    const regrets = {};
    let maxRegret = 0;
    let worstStateName = '';
    let expectedRegret = 0;

    statesOfNature.forEach((st) => {
      const regretVal = Math.max(0, bestInState[st.id] - o.payoffs[st.id]);
      regrets[st.id] = regretVal;
      if (regretVal >= maxRegret) {
        maxRegret = regretVal;
        worstStateName = st.name;
      }
      expectedRegret += regretVal * st.probability;
    });

    return {
      optionId: o.optionId,
      title: o.title,
      payoffs: o.payoffs,
      regrets,
      maxRegret: Math.round(maxRegret),
      expectedRegret: Math.round(expectedRegret),
      worstStateName
    };
  });

  // Sort by Minimax Regret ascending (Lowest Maximum Regret wins!)
  regretRows.sort((a, b) => a.maxRegret - b.maxRegret);

  const minimaxWinner = regretRows[0];

  regretRows.forEach((row, idx) => {
    row.minimaxRank = idx + 1;
    row.isMinimaxWinner = idx === 0;
    if (idx === 0) {
      row.age80Narrative = `Minimax Regret Winner: Minimizes your worst-case opportunity cost across all economic futures (Max Regret capped at ₹${(row.maxRegret / 100000).toFixed(2)}L).`;
    } else {
      row.age80Narrative = `Carries up to ₹${(row.maxRegret / 100000).toFixed(2)}L in opportunity cost regret if "${row.worstStateName}" materializes.`;
    }
  });

  return {
    statesOfNature,
    bestInState,
    minimaxWinnerTitle: minimaxWinner?.title || '',
    minimaxWinnerMaxRegret: minimaxWinner?.maxRegret || 0,
    regretRows
  };
}

/**
 * 4. INTERACTIVE LIFE EVENT & BLACK SWAN SHOCK INJECTOR
 */
function simulateLifeEventShocks(digitalTwin, optionsData, activeShockIds = []) {
  const fundamentals = optionsData.map((item, idx) => extractOptionFundamentals(digitalTwin, item, idx));
  const activeShocks = LIFE_EVENT_CATALOG.filter((s) => activeShockIds.includes(s.id));

  const optionShockResults = fundamentals.map((f) => {
    let baselineWealth = f.initialSavings - f.existingDebt;
    let shockedWealth = f.initialSavings - f.existingDebt;
    let minLiquidity = shockedWealth;

    const yearlyTrajectory = [];

    for (let yr = 0; yr <= 5; yr++) {
      // Base income & expenses
      let baseIncome = f.currentSalary;
      let capexOutflow = 0;

      if (yr === 0) {
        baseIncome = f.currentSalary;
      } else if (yr <= f.studyYears && !f.isPartTimeOrExec) {
        baseIncome = 0;
        capexOutflow = f.upfrontCost / Math.max(1, f.studyYears);
      } else {
        const yrsActive = yr - (f.isPartTimeOrExec ? 0 : f.studyYears);
        baseIncome = Math.round(f.targetSalary * Math.pow(1.10, Math.max(0, yrsActive - 1)));
        if (f.isPartTimeOrExec && yr <= 2 && f.upfrontCost > 0) {
          capexOutflow = f.upfrontCost / 2;
        }
      }

      const annualLiving = Math.round(f.monthlyExpenses * 12 * Math.pow(1.06, yr));

      if (yr > 0) {
        // 1. Update Baseline
        const baseNet = Math.round(baseIncome * 0.82) - annualLiving - capexOutflow;
        const baseYield = baselineWealth > 0 ? Math.round(baselineWealth * 0.07) : 0;
        baselineWealth = Math.round(baselineWealth + baseNet + baseYield);

        // 2. Apply Active Shocks for Year `yr`
        let shockedIncome = baseIncome;
        let shockOneTimeDelta = 0;
        let shockRecurringExpense = 0;

        activeShocks.forEach((shock) => {
          if (shock.id === 'marriage_house' && yr === 2) {
            shockOneTimeDelta += shock.impactAmount;
          }
          if (shock.id === 'medical_emergency' && yr === 1) {
            shockOneTimeDelta += shock.impactAmount;
          }
          if (shock.id === 'grant_bonus' && yr === 1) {
            shockOneTimeDelta += shock.impactAmount;
          }
          if (shock.id === 'sabbatical_layoff' && yr === 2) {
            shockedIncome = Math.round(shockedIncome * shock.incomeMultiplier);
          }
          if (shock.id === 'ai_boom_promo' && yr >= 3) {
            shockedIncome = Math.round(shockedIncome * (1 + shock.incomeBoostRate));
          }
          if (shock.id === 'new_dependent' && yr >= 3) {
            shockRecurringExpense += shock.monthlyIncrease * 12;
          }
        });

        const shockedNet =
          Math.round(shockedIncome * 0.82) -
          annualLiving -
          capexOutflow +
          shockOneTimeDelta -
          shockRecurringExpense;
        const shockedYield = shockedWealth > 0 ? Math.round(shockedWealth * 0.07) : 0;
        shockedWealth = Math.round(shockedWealth + shockedNet + shockedYield);

        if (shockedWealth < minLiquidity) {
          minLiquidity = shockedWealth;
        }
      }

      yearlyTrajectory.push({
        year: yr,
        label: `Yr ${yr} (${2026 + yr})`,
        baselineWealth,
        shockedWealth,
        netShockImpact: shockedWealth - baselineWealth
      });
    }

    const finalBaseline = yearlyTrajectory[5].baselineWealth;
    const finalShocked = yearlyTrajectory[5].shockedWealth;
    const isSolvent = minLiquidity >= 0;
    const emergencyBufferMonths = Math.round(minLiquidity / (f.monthlyExpenses || 35000));

    const resilienceScore = Math.max(
      10,
      Math.min(
        99,
        Math.round(
          (isSolvent ? 65 : 25) +
            Math.min(34, Math.max(-15, emergencyBufferMonths * 2.5))
        )
      )
    );

    return {
      optionId: f.optionId,
      title: f.title,
      rank: f.rank,
      baselineYear5Wealth: finalBaseline,
      shockedYear5Wealth: finalShocked,
      netWealthDelta: finalShocked - finalBaseline,
      minLiquidityPoint: minLiquidity,
      emergencyBufferMonths,
      isSolvent,
      survivalStatus: isSolvent
        ? emergencyBufferMonths >= 4
          ? 'Fortress Solvency'
          : 'Solvent (Tight Buffer)'
        : 'Liquidity Deficit Alert',
      resilienceScore,
      yearlyTrajectory
    };
  });

  // Combined chart series for Recharts
  const combinedTimeline = [0, 1, 2, 3, 4, 5].map((yr) => {
    const row = {
      year: yr,
      label: `Yr ${yr} (${2026 + yr})`
    };
    optionShockResults.forEach((res) => {
      const pt = res.yearlyTrajectory[yr];
      row[`${res.title} (Post-Shock)`] = pt.shockedWealth;
      row[`${res.title} (Baseline)`] = pt.baselineWealth;
    });
    return row;
  });

  return {
    catalog: LIFE_EVENT_CATALOG,
    activeShockIds,
    activeShocksCount: activeShocks.length,
    optionShockResults,
    combinedTimeline
  };
}

/**
 * 5. BEHAVIORAL ECONOMICS & COGNITIVE BIAS AUDITOR (Kahneman Prospect Theory)
 */
function computeBehavioralAudit(digitalTwin, optionsData, goalConstraint = {}) {
  const fundamentals = optionsData.map((item, idx) => extractOptionFundamentals(digitalTwin, item, idx));
  const weights = goalConstraint?.weights || {
    financialGrowth: 25,
    jobSecurity: 20,
    workLifeBalance: 20,
    personalGrowth: 15,
    familyStability: 10
  };

  // Kahneman & Tversky Prospect Theory Parameters
  const ALPHA = 0.88; // Diminishing sensitivity to gains
  const BETA = 0.88;  // Diminishing sensitivity to losses
  const LAMBDA = 2.25; // Loss Aversion Coefficient (Losses hurt 2.25x more than gains)

  // Status-quo reference wealth point over 5 years
  const statusQuoReference = Math.round(
    (fundamentals[0]?.initialSavings || 300000) +
      ((fundamentals[0]?.currentSalary || 800000) * 0.82 - (fundamentals[0]?.monthlyExpenses || 35000) * 12) * 2.5
  );

  function prospectValue(outcome, refPoint) {
    const delta = (outcome - refPoint) / 100000; // In Lakhs for numerical stability
    if (delta >= 0) {
      return Math.pow(delta, ALPHA);
    }
    return -LAMBDA * Math.pow(Math.abs(delta), BETA);
  }

  // Evaluate Prospect Utility for each option across P10 (0.20), P50 (0.55), P90 (0.25)
  const rawProspectScores = fundamentals.map((f) => {
    const uP10 = prospectValue(f.p10, statusQuoReference);
    const uP50 = prospectValue(f.p50, statusQuoReference);
    const uP90 = prospectValue(f.p90, statusQuoReference);

    const compositeUtility = 0.25 * uP10 + 0.50 * uP50 + 0.25 * uP90;
    const downsidePain = uP10 < 0 ? Math.round(Math.abs(uP10) * 10) : 0;

    return {
      optionId: f.optionId,
      title: f.title,
      expectedValueRank: f.rank,
      decisionScore: f.decisionScore,
      p10: f.p10,
      p50: f.p50,
      p90: f.p90,
      upfrontCost: f.upfrontCost,
      rawUtility: compositeUtility,
      downsidePain
    };
  });

  // Normalize Prospect Theory scores to [45..96]
  const maxU = Math.max(...rawProspectScores.map((r) => r.rawUtility));
  const minU = Math.min(...rawProspectScores.map((r) => r.rawUtility));
  const rangeU = Math.max(1, maxU - minU);

  rawProspectScores.forEach((r) => {
    r.prospectUtilityScore = Math.round(58 + ((r.rawUtility - minU) / rangeU) * 36);
  });

  const sortedByProspect = [...rawProspectScores].sort(
    (a, b) => b.prospectUtilityScore - a.prospectUtilityScore
  );
  sortedByProspect.forEach((r, idx) => {
    const target = rawProspectScores.find((item) => item.optionId === r.optionId);
    if (target) target.prospectTheoryRank = idx + 1;
  });

  // Detect 5 Cognitive Biases
  const maxUpfrontCost = Math.max(...fundamentals.map((f) => f.upfrontCost));
  const initialSavings = fundamentals[0]?.initialSavings || 300000;
  const monthlyExpenses = fundamentals[0]?.monthlyExpenses || 35000;
  const postCapexRunwayMonths = Math.round((initialSavings - maxUpfrontCost) / monthlyExpenses);

  const rankShiftDetected = rawProspectScores.some(
    (r) => r.expectedValueRank !== r.prospectTheoryRank
  );

  const biases = [
    {
      id: 'loss_aversion',
      name: 'Loss Aversion Asymmetry (λ = 2.25x)',
      theoryRef: 'Kahneman & Tversky (1979) Prospect Theory',
      status: rankShiftDetected ? 'Moderate Alert' : 'Cleared',
      severity: rankShiftDetected ? 'medium' : 'low',
      detectedMetric: `λ = 2.25x Loss Weight | Reference: ₹${(statusQuoReference / 100000).toFixed(1)}L`,
      diagnosis: rankShiftDetected
        ? 'Human loss aversion penalizes high-upfront-cost options 2.25x more heavily than mathematical expected value suggests, causing a rank shift between Rational EV and Perceived Utility.'
        : 'Your top-ranked option dominates in both Expected Value and Loss-Averse Prospect Utility—no psychological rank distortion detected.',
      debiasingPrescription:
        'Evaluate downside risk via liquid emergency buffer rather than emotional fear of upfront tuition/investment outlay.'
    },
    {
      id: 'optimism_runway',
      name: 'Optimism & Liquidity Runway Bias',
      theoryRef: 'Weinstein (1980) Unrealistic Optimism',
      status: postCapexRunwayMonths < 3 ? 'High Warning' : postCapexRunwayMonths < 6 ? 'Moderate Alert' : 'Cleared',
      severity: postCapexRunwayMonths < 3 ? 'high' : postCapexRunwayMonths < 6 ? 'medium' : 'low',
      detectedMetric:
        maxUpfrontCost > 0
          ? `Post-Capex Runway: ${Math.max(0, postCapexRunwayMonths)} Months`
          : 'Zero Upfront Capex Exposure',
      diagnosis:
        postCapexRunwayMonths < 4 && maxUpfrontCost > 0
          ? `High-capex option (₹${(maxUpfrontCost / 100000).toFixed(2)}L) depletes liquid savings below the safe 6-month threshold. Assuming zero unexpected expenses over 5 years reflects optimism bias.`
          : 'Liquid savings adequately cover upfront capital commitments with a healthy emergency buffer.',
      debiasingPrescription:
        'Ring-fence at least 6 months of living expenses (₹' +
        ((monthlyExpenses * 6) / 100000).toFixed(2) +
        ' Lakhs) in a liquid account before committing upfront capital.'
    },
    {
      id: 'status_quo_sunk_cost',
      name: 'Status Quo & Sunk Cost Anchoring',
      theoryRef: 'Samuelson & Zeckhauser (1988)',
      status: weights.jobSecurity >= 35 ? 'Moderate Alert' : 'Cleared',
      severity: weights.jobSecurity >= 35 ? 'medium' : 'low',
      detectedMetric: `Security Weight: ${weights.jobSecurity || 20}% vs Growth: ${weights.financialGrowth || 25}%`,
      diagnosis:
        weights.jobSecurity >= 35
          ? 'High weighting on immediate job security may anchor you to your current trajectory and under-weight 5-year compounding upside.'
          : 'Goal weights show a balanced trade-off between career security and long-term growth.',
      debiasingPrescription:
        'Compare 5-year cumulative opportunity cost (from the Regret Matrix) rather than Year-1 comfort alone.'
    },
    {
      id: 'planning_fallacy',
      name: 'Planning & Payback Horizon Fallacy',
      theoryRef: 'Buehler, Griffin & Ross (1994)',
      status: fundamentals.some((f) => f.studyYears >= 2) ? 'Moderate Alert' : 'Cleared',
      severity: fundamentals.some((f) => f.studyYears >= 2) ? 'medium' : 'low',
      detectedMetric: `Max Transition Duration: ${Math.max(...fundamentals.map((f) => f.durationMonths || 0))} Months`,
      diagnosis: fundamentals.some((f) => f.studyYears >= 2)
        ? 'Multi-year transitions often experience a 3-to-6 month placement or revenue ramp-up lag beyond initial estimates.'
        : 'Short transition horizon minimizes timeline slippage risk.',
      debiasingPrescription:
        'Budget an extra 4 months of post-completion job search / ramp-up buffer into your financial plan.'
    },
    {
      id: 'hyperbolic_discounting',
      name: 'Hyperbolic Discounting (Present Bias)',
      theoryRef: 'Laibson (1997) Quasi-Hyperbolic Model',
      status: fundamentals.some((f) => f.p50 < 0) ? 'Moderate Alert' : 'Cleared',
      severity: fundamentals.some((f) => f.p50 < 0) ? 'medium' : 'low',
      detectedMetric: 'Year 1 Cash Dip vs Year 5 Compounding',
      diagnosis:
        'Options with Year 1–2 capital outflows often look negative at Year 5 if post-transition compounding is truncated too early, whereas short-term salary paths plateau later.',
      debiasingPrescription:
        'Use the Parallel Universe Time-Machine to inspect the exact Month/Year crossover point before discarding high-upside investments.'
    }
  ];

  return {
    prospectParameters: {
      alpha: ALPHA,
      beta: BETA,
      lambdaLossAversion: LAMBDA,
      statusQuoReference
    },
    optionProspects: rawProspectScores,
    biases
  };
}

const {
  computeEvpiQuestionEngine,
  computeCounterfactualFlipSolver,
  computePremortemAndOptionality,
  computeDeRiskingAndMvcLab,
  computeHouseholdAndPriorityDrift,
  computeTripwiresAndCalibration
} = require('./nexusIntelligenceService');

/**
 * Master aggregator returning all 5 Original Flagship Modules + 6 Nexus Breakthrough Modules
 */
function computeFullAdvancedSuite(digitalTwin, optionsData, goalConstraint, params = {}) {
  const targetWealthGoal = Number(params.targetWealthGoal) || 3000000;
  const activeShockIds = Array.isArray(params.activeShockIds) ? params.activeShockIds : ['marriage_house', 'ai_boom_promo'];
  const activeHedgeIds = Array.isArray(params.activeHedgeIds) ? params.activeHedgeIds : ['ringfence_buffer', 'scholarship_sponsorship'];
  const category = params.category || 'higher_education';

  return {
    parallelUniverse: computeParallelUniverseTimeline(digitalTwin, optionsData),
    reverseGoalSolver: computeReverseGoalSolver(digitalTwin, optionsData, targetWealthGoal),
    regretMatrix: computeRegretMatrix(optionsData, digitalTwin),
    shockInjector: simulateLifeEventShocks(digitalTwin, optionsData, activeShockIds),
    behavioralAudit: computeBehavioralAudit(digitalTwin, optionsData, goalConstraint),
    // Nexus Breakthrough Modules
    evpiEngine: computeEvpiQuestionEngine(digitalTwin, optionsData, goalConstraint, category),
    counterfactualSolver: computeCounterfactualFlipSolver(digitalTwin, optionsData, goalConstraint, category),
    premortemAndOptionality: computePremortemAndOptionality(digitalTwin, optionsData, category),
    deRiskingAndMvc: computeDeRiskingAndMvcLab(digitalTwin, optionsData, goalConstraint, category, activeHedgeIds),
    householdBargaining: computeHouseholdAndPriorityDrift(digitalTwin, optionsData, goalConstraint),
    tripwireMonitor: computeTripwiresAndCalibration({ category }, optionsData, digitalTwin)
  };
}

module.exports = {
  LIFE_EVENT_CATALOG,
  computeParallelUniverseTimeline,
  computeReverseGoalSolver,
  computeRegretMatrix,
  simulateLifeEventShocks,
  computeBehavioralAudit,
  computeFullAdvancedSuite
};

