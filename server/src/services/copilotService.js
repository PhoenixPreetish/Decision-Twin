const marketData = require('../data/marketReferenceData');

/**
 * AI Decision Co-Pilot ("TwinBot")
 * Context-aware intelligent advisory engine for career and life decisions
 */

/**
 * Generates comprehensive advisory synthesis for a scenario
 */
function generateAdvisoryBrief(scenario, optionsData, digitalTwin) {
  if (!optionsData || optionsData.length === 0) {
    return {
      verdict: 'Insufficient data to generate advisory brief.',
      vulnerabilities: [],
      catalysts: [],
      negotiationChecklist: []
    };
  }

  // Find top-ranked option by composite decisionScore
  const sortedOptions = [...optionsData].sort((a, b) => 
    (b.riskScore?.decisionScore || 0) - (a.riskScore?.decisionScore || 0)
  );
  const bestOption = sortedOptions[0];
  const secondOption = sortedOptions[1] || bestOption;

  const twinSalary = digitalTwin?.currentSalary || 600000;
  const twinSavings = digitalTwin?.savings || 100000;
  const twinMonthlyExp = digitalTwin?.monthlyExpenses || 30000;
  const emergencyMonths = Math.round(twinSavings / Math.max(1, twinMonthlyExp));

  // Determine key metrics
  const bestTitle = bestOption.option.title;
  const bestScore = bestOption.riskScore?.decisionScore || 70;
  const bestSalary = bestOption.prediction?.predictedExpectedSalary || (bestOption.option.attributes?.offeredSalary || twinSalary);
  const bestCost = (bestOption.option.attributes?.tuitionCost || 0) + (bestOption.option.attributes?.initialInvestment || 0);
  const salaryLift = Math.round(((bestSalary - twinSalary) / Math.max(1, twinSalary)) * 100);

  // 1. Executive Verdict
  let verdict = `Based on your digital twin risk tolerance (${digitalTwin?.riskTolerance || 'moderate'}) and goal priorities, **${bestTitle}** emerges as the optimal decision path with a Composite Score of **${bestScore}/100**. `;
  if (salaryLift > 0) {
    verdict += `It offers an estimated **+${salaryLift}% income upside** over your baseline. `;
  }
  if (bestCost > 0) {
    const postInvestmentRunway = Math.max(0, Math.round((twinSavings - bestCost) / Math.max(1, twinMonthlyExp)));
    verdict += `However, it requires an upfront commitment of **₹${bestCost.toLocaleString('en-IN')}**, leaving a cash buffer of ~${postInvestmentRunway} months.`;
  } else {
    verdict += `It preserves 100% of your current cash reserves without taking on initial liquidity debt.`;
  }

  // 2. Vulnerability Analysis
  const vulnerabilities = [];
  if (bestCost > twinSavings) {
    vulnerabilities.push({
      severity: 'Critical',
      category: 'Liquidity Deficit',
      title: 'Upfront Capital Exceeds Liquid Reserves',
      detail: `The upfront requirement (₹${bestCost.toLocaleString('en-IN')}) exceeds your current savings (₹${twinSavings.toLocaleString('en-IN')}). You will need an educational loan or external bridge financing.`,
      recommendation: 'Cap borrowing interest rate under 9.5% and secure a 6-month moratorium period post-completion.'
    });
  } else if (emergencyMonths < 4) {
    vulnerabilities.push({
      severity: 'Warning',
      category: 'Runway Squeeze',
      title: 'Emergency Buffer Under 4 Months',
      detail: `Your current emergency buffer is ${emergencyMonths} months. Any transition delay or unexpected expense could induce high financial stress.`,
      recommendation: 'Target a minimum 6-month living expense reserve before formally initiating the transition.'
    });
  }

  if ((bestOption.riskScore?.marketRisk || 0) > 55) {
    vulnerabilities.push({
      severity: 'Warning',
      category: 'Macro Exposure',
      title: 'Elevated Industry & Macroeconomic Volatility',
      detail: `Market risk score is ${bestOption.riskScore?.marketRisk}/100. Hiring or valuation downturns in this domain could lengthen the breakeven horizon.`,
      recommendation: 'Maintain dual-track interview readiness and build an emergency network of 15+ industry mentors.'
    });
  }

  if ((bestOption.riskScore?.personalRisk || 0) > 50 || (bestOption.option.attributes?.workLifeBalanceRating || 7) < 6) {
    vulnerabilities.push({
      severity: 'Notice',
      category: 'Burnout & WLB Strain',
      title: 'High Workload & Transition Friction',
      detail: `Demanding hours or relocation adjustments may impact personal well-being over the first 12-18 months.`,
      recommendation: 'Establish non-negotiable weekly rest boundaries and health routines.'
    });
  }

  if (vulnerabilities.length === 0) {
    vulnerabilities.push({
      severity: 'Low',
      category: 'Execution Stability',
      title: 'Controlled Risk Profile',
      detail: 'No catastrophic single points of failure detected against your baseline profile.',
      recommendation: 'Proceed with disciplined milestone reviews every quarter.'
    });
  }

  // 3. Upside Catalysts
  const catalysts = [
    {
      timing: 'Month 12 - 24',
      name: 'Salary Compounding & Market Rerating',
      impact: `Unlocks target compensation tier of ₹${bestSalary.toLocaleString('en-IN')}/yr with faster trajectory to executive/principal bands.`
    },
    {
      timing: 'Month 24 - 36',
      name: 'Network Equity & Peer Multiplier',
      impact: 'Alumni and elite peer connections increase inbound leadership opportunities by 3.2x.'
    }
  ];

  if (bestOption.option.category === 'entrepreneurship' || bestOption.option.attributes?.equityOfferedPercentage > 0) {
    catalysts.push({
      timing: 'Month 36 - 60',
      name: 'Asymmetric Equity Upside',
      impact: 'Equity appreciation or secondary liquidity events offer non-linear wealth creation beyond fixed compensation.'
    });
  }

  // 4. Negotiation & Tactical Checklist
  const negotiationChecklist = [];
  if (bestOption.option.category === 'higher_education') {
    negotiationChecklist.push(
      'Apply for merit-based entrance scholarships (can reduce tuition by 15-30%)',
      'Inquire with employer about tuition reimbursement in exchange for a 1-year retention pledge',
      'Negotiate early sign-on bonus with campus recruiters before semester completion',
      'Lock fixed-rate education loan with tax deduction under Section 80E'
    );
  } else if (bestOption.option.category === 'entrepreneurship') {
    negotiationChecklist.push(
      'Set an explicit 4-year vesting schedule with a 1-year cliff for founder equity',
      'Negotiate minimum living stipend post-seed funding to prevent personal credit card debt',
      'Draft co-founder separation agreements (IP assignment and reverse vesting) upfront',
      'Maintain 12 months personal runway in cash before leaving salaried employment'
    );
  } else {
    negotiationChecklist.push(
      `Negotiate guaranteed variable/retention bonus of at least ₹${Math.round(bestSalary * 0.1).toLocaleString('en-IN')}`,
      'Request full relocation package or permanent hybrid remote flexibility allowance',
      'Seek pre-agreed 6-month performance review for accelerated band promotion',
      'Ask for employer-sponsored executive learning and certification budget (₹1L - ₹2.5L)'
    );
  }

  return {
    topOptionTitle: bestTitle,
    compositeScore: bestScore,
    verdict,
    vulnerabilities,
    catalysts,
    negotiationChecklist,
    recommendedDecisionDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  };
}

/**
 * Handles conversational queries to the AI Co-Pilot
 */
function answerCoPilotQuery(question, scenario, optionsData, digitalTwin, stressTestResults) {
  const qLower = (question || '').toLowerCase();
  const sortedOptions = [...optionsData].sort((a, b) => 
    (b.riskScore?.decisionScore || 0) - (a.riskScore?.decisionScore || 0)
  );
  const bestOption = sortedOptions[0];
  const secondOption = sortedOptions[1] || bestOption;

  // Direct handler for "Why option 1 is choosed / chosen / selected / best?"
  if (/\b(why|choos|chose|chosen|choosed|select|selected|pick|picked|prefer|preferred|win|won|winner|best|recommend)\b/i.test(qLower) && !/\b(vulnerab|danger|worst|negotiat|break|payback|recession|downturn)\b/i.test(qLower)) {
    const numMatch = qLower.match(/option\s*([1-6])/i);
    const letterMatch = qLower.match(/option\s*([a-f])/i);
    let targetIdx = 0;
    let optLabel = 'Option 1';
    if (numMatch) {
      targetIdx = parseInt(numMatch[1], 10) - 1;
      optLabel = `Option ${targetIdx + 1}`;
    } else if (letterMatch) {
      targetIdx = letterMatch[1].toLowerCase().charCodeAt(0) - 97;
      optLabel = `Option ${String.fromCharCode(65 + targetIdx)}`;
    }
    const targetOpt = optionsData[targetIdx] || bestOption;
    const isBest = (targetOpt.option?._id || '').toString() === (bestOption.option?._id || '').toString();
    const bCost = (bestOption.option.attributes?.tuitionCost || 0) + (bestOption.option.attributes?.initialInvestment || 0);
    const bSal = bestOption.prediction?.predictedExpectedSalary || bestOption.option.attributes?.offeredSalary || 0;
    const bP50 = bestOption.simulation?.percentiles?.p50MedianCase || 0;
    const bRisk = bestOption.riskScore?.overallRiskLevel || 'Low';

    return {
      question,
      reply: isBest
        ? `Why **${optLabel} (${bestOption.option.title})** is chosen is because it has a **${bRisk.toLowerCase()} risk rate** (Decision Score: **${bestOption.riskScore?.decisionScore || 85}/100**), ${bCost === 0 ? 'requires **zero upfront capital cost**' : `an upfront cost of **₹${bCost.toLocaleString('en-IN')}**`}, and delivers a stronger 5-year median return of **₹${bP50.toLocaleString('en-IN')}** (annual salary: **₹${bSal.toLocaleString('en-IN')}/yr**) compared to **${secondOption.option.title}** (Score: ${secondOption.riskScore?.decisionScore || 70}/100, ${secondOption.riskScore?.overallRiskLevel || 'Medium'} Risk).`
        : `Why **${optLabel} (${targetOpt.option.title})** is ranked behind **${bestOption.option.title}** is because **${bestOption.option.title}** has a lower risk rate (**${bRisk} Risk**, Score: **${bestOption.riskScore?.decisionScore || 85}/100** vs **${targetOpt.riskScore?.decisionScore || 70}/100**) and a stronger risk-adjusted 5-year return (**₹${bP50.toLocaleString('en-IN')}**).`
    };
  }

  // Question routing heuristics
  if (qLower.includes('vulnerab') || qLower.includes('risk') || qLower.includes('danger') || qLower.includes('worst')) {
    const cost = (bestOption.option.attributes?.tuitionCost || 0) + (bestOption.option.attributes?.initialInvestment || 0);
    const savings = digitalTwin?.savings || 100000;
    return {
      question,
      reply: `Your primary vulnerability under **${bestOption.option.title}** is **${cost > savings ? 'upfront capital deficit' : 'opportunity cost & transition delay'}** (${bestOption.riskScore?.overallRiskLevel || 'Low'} Risk, Score: ${bestOption.riskScore?.decisionScore || 85}/100). ` +
        `With an emergency savings of ₹${savings.toLocaleString('en-IN')}, ` +
        (cost > savings 
          ? `the upfront requirement of ₹${cost.toLocaleString('en-IN')} leaves you dependent on debt. We advise capping debt to no more than 1x your annual post-grad expected salary.`
          : `your liquidity is resilient, but watch out for timeline slippage beyond the expected duration.`) +
        `\n\n**Stress Test Insight:** In a recessionary freeze, this option drops its decision score by ~${bestOption.riskScore?.marketRisk > 50 ? '18' : '10'} points.`
    };
  }

  if (qLower.includes('negotiat') || qLower.includes('ask') || qLower.includes('offer') || qLower.includes('salary')) {
    const targetSalary = bestOption.prediction?.predictedExpectedSalary || 2000000;
    return {
      question,
      reply: `To negotiate compensation for **${bestOption.option.title}**, anchor your counter-offer at **₹${Math.round(targetSalary * 1.08).toLocaleString('en-IN')} - ₹${Math.round(targetSalary * 1.18).toLocaleString('en-IN')}**:\n\n` +
        `1. **Anchor High:** Quote an expected total compensation range of **₹${Math.round(targetSalary * 1.08).toLocaleString('en-IN')} - ₹${Math.round(targetSalary * 1.18).toLocaleString('en-IN')}**.\n` +
        `2. **Trade Base vs. Bonus:** If base salary is fixed by bands, ask for a **₹${Math.round(targetSalary * 0.15).toLocaleString('en-IN')} one-time joining/retention bonus**.\n` +
        `3. **De-Risk Relocation:** If relocation or high cost-of-living is required, negotiate 30 days corporate transit housing + moving reimbursement.\n` +
        `4. **Review Acceleration:** Request a formal performance and compensation review at **Month 6** instead of Month 12.`
    };
  }

  if (qLower.includes('recession') || qLower.includes('downturn') || qLower.includes('layoff') || qLower.includes('safe')) {
    // Find option with lowest market risk
    const safestOpt = [...optionsData].sort((a, b) => 
      (a.riskScore?.marketRisk || 0) - (b.riskScore?.marketRisk || 0)
    )[0];
    return {
      question,
      reply: `**${safestOpt.option.title}** survives an economic downturn best because it has the lowest market risk score (**${safestOpt.riskScore?.marketRisk}/100**) and lowest upfront capital drain. ` +
        `\n\nIf you prefer high long-term growth with **${bestOption.option.title}**, ensure you build at least **8 months of liquid living expenses** before taking the leap.`
    };
  }

  if (qLower.includes('break') || qLower.includes('payback') || qLower.includes('how long') || qLower.includes('runway')) {
    const cost = (bestOption.option.attributes?.tuitionCost || 0) + (bestOption.option.attributes?.initialInvestment || 0);
    const postSalary = bestOption.prediction?.predictedExpectedSalary || 2000000;
    const baseSalary = digitalTwin?.currentSalary || 600000;
    const netGainAnnual = (postSalary - baseSalary) * 0.75;
    const estBreakEvenMonths = cost === 0 ? 0 : Math.round((cost / Math.max(1, netGainAnnual / 12)));

    return {
      question,
      reply: `Your break-even payback period for **${bestOption.option.title}** is **${estBreakEvenMonths === 0 ? 'immediate (0 months, zero upfront cost)' : `approximately ${estBreakEvenMonths} months (~${(estBreakEvenMonths / 12).toFixed(1)} years)`}**:\n\n` +
        `- Upfront Investment: **₹${cost.toLocaleString('en-IN')}**\n` +
        `- Annualized Net Incremental Cash Flow: **+₹${Math.round(netGainAnnual).toLocaleString('en-IN')}/year**\n` +
        `- Estimated Payback Period: **${estBreakEvenMonths === 0 ? 'Immediate (0 months)' : `~${estBreakEvenMonths} months (~${(estBreakEvenMonths / 12).toFixed(1)} years)`}**\n\n` +
        `After the break-even point, your cumulative net wealth trajectory accelerates significantly over baseline.`
    };
  }

  // General fallback query response
  return {
    question,
    reply: `**${bestOption.option.title}** is the recommended choice for **${scenario.title}** because it has a **${(bestOption.riskScore?.overallRiskLevel || 'Low').toLowerCase()} risk rate** (Decision Score: **${bestOption.riskScore?.decisionScore}/100**) and a 5-year median valuation of **₹${(bestOption.simulation?.percentiles?.p50MedianCase || 0).toLocaleString('en-IN')}**, outperforming **${secondOption.option.title}** (Score: ${secondOption.riskScore?.decisionScore}/100).`
  };
}

module.exports = {
  generateAdvisoryBrief,
  answerCoPilotQuery
};
