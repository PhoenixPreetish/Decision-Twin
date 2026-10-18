const marketData = require('../data/marketReferenceData');

/**
 * TwinBot Offline Decision Intelligence Engine
 * 100% Local, zero external API keys required, instant response time.
 */

/**
 * Generate intelligent contextual reply based on user, digital twin, and active scenario.
 */
function processChatQuery({ message, pageContext = {}, digitalTwin = null, scenarioData = null, scenariosList = [] }) {
  const q = (message || '').trim();
  const qLower = q.toLowerCase();

  // Digital twin metrics
  const salary = digitalTwin?.currentSalary || 600000;
  const savings = digitalTwin?.savings || 100000;
  const expenses = digitalTwin?.monthlyExpenses || 30000;
  const runwayMonths = Math.max(0, Math.round(savings / Math.max(1, expenses)));
  const riskTolerance = digitalTwin?.riskTolerance || 'moderate';
  const role = digitalTwin?.currentRole || 'Professional';

  // -------------------------------------------------------------
  // 1. SCENARIO-AWARE REASONING
  // -------------------------------------------------------------
  if (scenarioData && scenarioData.scenario) {
    const { scenario, options = [], riskScores = [], simulations = [], predictions = [] } = scenarioData;
    
    // Enrich options with their original 1-based index and simulation/risk metrics
    const enrichedOptions = [...options].map((opt, idx) => {
      const optId = opt._id.toString();
      const score = riskScores.find(r => (r.optionId?._id || r.optionId || '').toString() === optId);
      const sim = simulations.find(s => (s.optionId?._id || s.optionId || '').toString() === optId);
      const pred = predictions.find(p => (p.optionId?._id || p.optionId || '').toString() === optId);
      return {
        opt,
        score,
        sim,
        pred,
        originalIndex: idx + 1,
        letterLabel: `Option ${String.fromCharCode(65 + idx)}`,
        numberLabel: `Option ${idx + 1}`
      };
    });

    // Sort options by composite decisionScore descending
    const sortedOptions = [...enrichedOptions].sort((a, b) => (b.score?.decisionScore || 0) - (a.score?.decisionScore || 0));

    const top = sortedOptions[0] || { opt: { title: 'Option 1', attributes: {} }, originalIndex: 1, numberLabel: 'Option 1' };
    const second = sortedOptions[1] || top;

    // Detect if user specifically targeted an option (by number, letter, or title keyword)
    let targetOption = null;
    let optionLabel = null;
    let hasExplicitTarget = false;

    const numMatch = qLower.match(/option\s*([1-6])\b|(first|second|third|fourth|fifth|sixth)\s*option/i);
    const letterMatch = qLower.match(/option\s*([a-f])\b/i);

    if (numMatch) {
      const wordToIdx = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
      const idx = (numMatch[1] ? parseInt(numMatch[1], 10) : wordToIdx[numMatch[2].toLowerCase()]) - 1;
      if (enrichedOptions[idx]) {
        targetOption = enrichedOptions[idx];
        optionLabel = `Option ${idx + 1}`;
        hasExplicitTarget = true;
      }
    } else if (letterMatch) {
      const idx = letterMatch[1].toLowerCase().charCodeAt(0) - 97;
      if (enrichedOptions[idx]) {
        targetOption = enrichedOptions[idx];
        optionLabel = `Option ${String.fromCharCode(65 + idx)}`;
        hasExplicitTarget = true;
      }
    } else {
      // Check title keywords (match any distinctive word >= 3 chars from option title)
      for (const item of enrichedOptions) {
        const titleLower = (item.opt.title || '').toLowerCase();
        const words = titleLower.split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !['option', 'path', 'the', 'and', 'for', 'with'].includes(w));
        if (words.some(w => qLower.includes(w))) {
          targetOption = item;
          optionLabel = `Option ${item.originalIndex}`;
          hasExplicitTarget = true;
          break;
        }
      }
    }

    // Default target option to highest ranked if unspecified
    if (!targetOption) {
      targetOption = top;
      optionLabel = `Option ${top.originalIndex || 1}`;
    }

    const getCost = (item) => Number((item?.opt?.attributes?.tuitionCost || 0) + (item?.opt?.attributes?.initialInvestment || 0));
    const getSal = (item) => Number(item?.pred?.predictedExpectedSalary ?? item?.opt?.attributes?.offeredSalary ?? salary);
    const getP50 = (item) => Number(item?.sim?.percentiles?.p50MedianCase || 0);
    const getRank = (item) => {
      if (item?.score?.rank) return item.score.rank;
      const idx = sortedOptions.findIndex(o => o.opt._id.toString() === item.opt._id.toString());
      return idx >= 0 ? idx + 1 : 1;
    };

    // ---------------------------------------------------------
    // A0. "WHY IS OPTION X CHOSEN / SELECTED / PICKED / BEST?"
    // Handles: "Why option 1 is choosed?", "Why was Option 1 chosen?",
    // "Why did Option 1 win?", "Why not Option 2?", "Which option is chosen and why?"
    // ---------------------------------------------------------
    const isChoiceKeyword = /\b(choos|chose|chosen|choosed|select|selected|pick|picked|prefer|preferred|win|won|winner|recommend|recommended|best|optimal|rank|ranked|beat|beats|better)\b/i.test(qLower);
    const isWhyQuestion = /\b(why|how\s+come|reason|reasons)\b/i.test(qLower);
    const isSpecificDomainWhy = /\b(vulnerab|danger|worst|weakness|negotiat|break[\s-]*even|payback|recession|downturn|layoff|monte\s*carlo|topsis)\b/i.test(qLower);

    if ((isChoiceKeyword || (isWhyQuestion && !isSpecificDomainWhy))) {
      const chosenItem = hasExplicitTarget ? targetOption : top;
      const chosenRank = getRank(chosenItem);
      const isWinner = chosenItem.opt._id.toString() === top.opt._id.toString();
      const otherItem = isWinner ? second : top;

      const cCost = getCost(chosenItem);
      const cSal = getSal(chosenItem);
      const cP50 = getP50(chosenItem);
      const cRisk = chosenItem.score?.overallRiskLevel || 'Low';
      const cScore = chosenItem.score?.decisionScore || 85;
      const cAlign = chosenItem.score?.goalAlignmentScore || 88;

      const oCost = getCost(otherItem);
      const oSal = getSal(otherItem);
      const oP50 = getP50(otherItem);
      const oRisk = otherItem.score?.overallRiskLevel || 'Medium';
      const oScore = otherItem.score?.decisionScore || 70;

      // Build specific comparative reasons based on the actual numbers
      const reasons = [];
      if ((chosenItem.score?.compositeRiskScore || 25) <= (otherItem.score?.compositeRiskScore || 45) || cRisk.toLowerCase() === 'low') {
        reasons.push(`it has a **${cRisk.toLowerCase()} risk rate** (Decision Score: **${cScore}/100** vs **${oScore}/100** for ${otherItem.opt.title})`);
      } else {
        reasons.push(`it achieves the highest composite Decision Score (**${cScore}/100** vs **${oScore}/100**)`);
      }

      if (cCost === 0 && oCost > 0) {
        reasons.push(`requires **zero upfront capital cost (₹0)** compared to **₹${oCost.toLocaleString('en-IN')}** for ${otherItem.opt.title}`);
      } else if (cCost < oCost) {
        reasons.push(`requires a lower upfront capital outlay (**₹${cCost.toLocaleString('en-IN')}** vs **₹${oCost.toLocaleString('en-IN')}**)`);
      }

      if (cSal > oSal) {
        reasons.push(`offers a higher annual salary (**₹${cSal.toLocaleString('en-IN')}/yr** vs **₹${oSal.toLocaleString('en-IN')}/yr**)`);
      }

      if (cP50 >= oP50 && cP50 > 0) {
        reasons.push(`delivers a stronger 5-year median return of **₹${cP50.toLocaleString('en-IN')}**`);
      }

      const directOpening = isWinner
        ? `Why **${optionLabel} (${chosenItem.opt.title})** is chosen is because ${reasons.join(', ')}.`
        : `Why **${optionLabel} (${chosenItem.opt.title})** is ranked **#${chosenRank}** (while **Option ${top.originalIndex} — ${top.opt.title}** is chosen as #1) is because **${top.opt.title}** has a **${(top.score?.overallRiskLevel || 'Low').toLowerCase()} risk rate** (Decision Score: **${top.score?.decisionScore || 85}/100** vs **${cScore}/100**), ${getCost(top) < cCost ? `a lower upfront cost (**₹${getCost(top).toLocaleString('en-IN')}** vs **₹${cCost.toLocaleString('en-IN')}**), ` : ''}and a stronger risk-adjusted 5-year return (**₹${getP50(top).toLocaleString('en-IN')}** vs **₹${cP50.toLocaleString('en-IN')}**).`;

      return {
        reply: `${directOpening}\n\n` +
          `### 🏆 Optimal Decision Recommendation: **${scenario.title}**\n\n` +
          `- **#1 Chosen Option:** **Option ${top.originalIndex} (${top.opt.title})** — Decision Score **${top.score?.decisionScore || 85}/100** | **${top.score?.overallRiskLevel || 'Low'} Risk**\n` +
          `- **Upfront Cost vs. Annual Salary:** Cost **₹${getCost(top).toLocaleString('en-IN')}** | Salary **₹${getSal(top).toLocaleString('en-IN')}/yr**\n` +
          `- **Expected 5-Year Median Valuation (P50):** **₹${getP50(top).toLocaleString('en-IN')}**\n` +
          `- **Personal Goal Alignment:** **${top.score?.goalAlignmentScore || 88}%** match with your weighted priorities\n\n` +
          `**Why ${second.opt.title} Ranked #2 (Score: ${second.score?.decisionScore || 70}/100):**\n` +
          `- Carries **${second.score?.overallRiskLevel || 'Medium'} Risk** with upfront cost of **₹${getCost(second).toLocaleString('en-IN')}** and expected salary of **₹${getSal(second).toLocaleString('en-IN')}/yr** (5-Yr P50: **₹${getP50(second).toLocaleString('en-IN')}**).\n\n` +
          `**TwinBot Strategic Verdict:** **${top.opt.title}** gives you the safest risk-to-reward profile without overextending your liquid runway.`,
        suggestedPrompts: [
          `What are my biggest vulnerabilities in Option 1?`,
          `Compare Option 1 vs Option 2`,
          `What is my break-even payback timeline?`
        ]
      };
    }

    // A. Vulnerability & Risk for the target option or scenario
    if (qLower.includes('risk') || qLower.includes('vulnerab') || qLower.includes('danger') || qLower.includes('worst') || qLower.includes('weakness')) {
      const opt = targetOption.opt;
      const score = targetOption.score;
      const sim = targetOption.sim;
      const cost = getCost(targetOption);
      const isDeficit = cost > savings;
      const deficitAmount = isDeficit ? cost - savings : 0;
      const postBuffer = Math.max(0, Math.round((savings - cost) / Math.max(1, expenses)));
      const p10Val = sim?.percentiles?.p10WorstCase ?? sim?.percentiles?.p10PessimisticCase ?? 0;

      const directRiskSummary = cost > 0 && isDeficit
        ? `The primary risk in **${optionLabel} (${opt.title})** is its **₹${cost.toLocaleString('en-IN')} upfront capital cost**, which exceeds your current liquid savings by **₹${deficitAmount.toLocaleString('en-IN')}**, combined with a **${(score?.overallRiskLevel || 'Moderate').toLowerCase()} risk rate** (Market Risk: **${score?.marketRisk || 35}/100**).`
        : `**${optionLabel} (${opt.title})** carries a **${(score?.overallRiskLevel || 'Low').toLowerCase()} risk rate** (Decision Score: **${score?.decisionScore || 75}/100**, Market Risk: **${score?.marketRisk || 35}/100**), with ${cost === 0 ? '**zero upfront capital cost**' : `an upfront cost of **₹${cost.toLocaleString('en-IN')}**`} and a worst-case 10th-percentile 5-year outcome of **₹${p10Val.toLocaleString('en-IN')}**.`;

      let specificRiskNarrative = '';
      if (cost > 0) {
        specificRiskNarrative += `- **Capital Requirement:** Requires upfront expenditure of **₹${cost.toLocaleString('en-IN')}**. ` +
          (isDeficit 
            ? `⚠️ This creates an immediate **liquidity deficit of ₹${deficitAmount.toLocaleString('en-IN')}** beyond your current savings (₹${savings.toLocaleString('en-IN')}). You will need an educational loan or bridge funding.`
            : `✅ Your savings (₹${savings.toLocaleString('en-IN')}) cover this, leaving a cash buffer of ~${postBuffer} months.`) + '\n';
      } else {
        specificRiskNarrative += `- **Capital Requirement:** Zero upfront capital barrier (preserves 100% of your ₹${savings.toLocaleString('en-IN')} liquid reserves).\n`;
      }

      specificRiskNarrative += `- **P10 Downside Scenario:** In the bottom 10th percentile outcome, the 5-year return dips to **₹${p10Val.toLocaleString('en-IN')}**.\n`;
      specificRiskNarrative += `- **Market Risk Exposure:** Evaluated at **${score?.marketRisk || 35}/100** (${score?.marketRisk > 50 ? 'High market volatility' : 'Defensive and stable'}).\n`;
      specificRiskNarrative += `- **Composite Risk Rating:** **${score?.overallRiskLevel || 'Moderate'} Risk** (Decision Score: ${score?.decisionScore || 75}/100).\n`;

      return {
        reply: `${directRiskSummary}\n\n` +
          `### 🛡️ Risk & Vulnerability Analysis: **${opt.title}** (${optionLabel})\n\n` +
          `Here are the primary vulnerabilities identified for this specific path in **${scenario.title}**:\n\n` +
          specificRiskNarrative + `\n` +
          `**TwinBot De-risking Checklist:**\n` +
          `1. Maintain at least **6-8 months of living expenses (₹${(expenses * 6).toLocaleString('en-IN')})** completely unencumbered.\n` +
          `2. If financing capital, cap loan interest rates below **9.5%** and ensure a moratorium buffer.\n` +
          `3. Track break-even progress at Month 6 and Month 12 milestones.`,
        suggestedPrompts: [
          `Why option 1 is choosed?`,
          `How should I negotiate compensation for ${optionLabel}?`,
          `What is the break-even payback for ${optionLabel}?`
        ]
      };
    }

    // B. Negotiation & Salary tactics for the target option
    if (qLower.includes('negotiat') || qLower.includes('offer') || qLower.includes('salary') || qLower.includes('bonus') || qLower.includes('compensation') || qLower.includes('package')) {
      const opt = targetOption.opt;
      const pred = targetOption.pred;
      const targetComp = pred?.predictedExpectedSalary || (opt.attributes?.offeredSalary || salary * 1.3);

      return {
        reply: `To maximize compensation for **${opt.title}**, you should anchor your counter-offer at **₹${Math.round(targetComp * 1.10).toLocaleString('en-IN')} – ₹${Math.round(targetComp * 1.18).toLocaleString('en-IN')}** and request a **₹${Math.round(targetComp * 0.12).toLocaleString('en-IN')} sign-on bonus**.\n\n` +
          `### 💼 Negotiation Playbook for **${opt.title}**\n\n` +
          `Based on calibrated benchmarks in **${scenario.category.replace('_', ' ')}**, here is your counter-offer strategy:\n\n` +
          `1. **Target Anchor:** Quote an expected compensation tier of **₹${Math.round(targetComp * 1.10).toLocaleString('en-IN')} - ₹${Math.round(targetComp * 1.18).toLocaleString('en-IN')}** (75th percentile market anchor).\n` +
          `2. **Sign-on Bridge:** Ask for a **₹${Math.round(targetComp * 0.12).toLocaleString('en-IN')} one-time sign-on bonus** to offset unvested equity or transition costs.\n` +
          `3. **Accelerated Review:** Negotiate a contract clause for an accelerated **Month 6 compensation review** tied to pre-agreed KPIs.\n` +
          `4. **Learning & Remote Budget:** Secure an annual learning allowance of **₹1,00,000 - ₹2,00,000** for executive certifications or conferences.`,
        suggestedPrompts: [
          `Why option 1 is choosed?`,
          `What are my biggest vulnerabilities in ${optionLabel}?`,
          `What is my break-even payback timeline?`
        ]
      };
    }

    // C. Break-Even & Payback for the target option
    if (qLower.includes('break') || qLower.includes('payback') || qLower.includes('how long') || qLower.includes('timeline') || qLower.includes('roi')) {
      const opt = targetOption.opt;
      const pred = targetOption.pred;
      const cost = getCost(targetOption);
      const postSalary = pred?.predictedExpectedSalary || (opt.attributes?.offeredSalary || salary * 1.3);
      const annualGain = Math.max(50000, (postSalary - salary) * 0.75);
      const breakEvenMonths = cost === 0 ? 0 : Math.round((cost / (annualGain / 12)));

      return {
        reply: `Your break-even payback timeline for **${opt.title}** is **${breakEvenMonths === 0 ? 'immediate (0 months) because it requires zero upfront capital cost' : `approximately ${breakEvenMonths} months (~${(breakEvenMonths / 12).toFixed(1)} years) to recover the ₹${cost.toLocaleString('en-IN')} upfront outlay`}**.\n\n` +
          `### ⏱️ Break-Even & Capital Payback: **${opt.title}**\n\n` +
          `- **Upfront Capital Outlay:** ₹${cost.toLocaleString('en-IN')}\n` +
          `- **Net Incremental Income:** +₹${Math.round(annualGain).toLocaleString('en-IN')}/year above baseline\n` +
          `- **Calculated Break-Even:** **${breakEvenMonths === 0 ? 'Immediate (0 months, zero capital cost)' : `~${breakEvenMonths} months (~${(breakEvenMonths / 12).toFixed(1)} years)`}**\n` +
          `- **5-Year NPV Trajectory:** Compounds positively after month ${breakEvenMonths || 6}.\n\n` +
          `**TwinBot Insight:** ${breakEvenMonths === 0 ? 'Because there is no upfront tuition or seed capital required, this path generates positive cashflow from Day 1.' : 'Once the break-even milestone is reached, this path significantly outpaces linear wage growth.'}`,
        suggestedPrompts: [
          `Why option 1 is choosed?`,
          `What are my biggest vulnerabilities in ${optionLabel}?`,
          `Which option survives a recession best?`
        ]
      };
    }

    // D. Downturn / Recession / Safety
    if (qLower.includes('recession') || qLower.includes('downturn') || qLower.includes('layoff') || qLower.includes('safe') || qLower.includes('defensive')) {
      const defensiveOpt = [...sortedOptions].sort((a, b) => 
        (a.score?.marketRisk || 50) - (b.score?.marketRisk || 50)
      )[0];

      return {
        reply: `**${defensiveOpt?.opt.title}** survives a recession best because it has the lowest market volatility exposure (**${defensiveOpt?.score?.marketRisk || 30}/100**) and a **${(defensiveOpt?.score?.overallRiskLevel || 'Low').toLowerCase()} overall risk rate**.\n\n` +
          `### 📉 Macro Stress-Test: Downturn Resilience\n\n` +
          `- **Most Defensive Alternative:** **${defensiveOpt?.opt.title}** (Lowest market exposure score: **${defensiveOpt?.score?.marketRisk || 30}/100**).\n` +
          `- **Stress-Test Impact:** In an economic contraction (-15% wage growth, extended hiring freezes), higher-risk options drop 12-18 decision score points.\n` +
          `- **Actionable Advice:** If macro stability is your chief concern, adjust your **Job Security** goal weight higher in the Scenario Wizard to re-rank the alternatives accordingly!`,
        suggestedPrompts: [
          `Why option 1 is choosed?`,
          `What are my biggest vulnerabilities in ${optionLabel}?`,
          `What is my break-even payback timeline?`
        ]
      };
    }

    // E. Head-to-Head Comparison
    if (qLower.includes('compare') || qLower.includes('difference') || qLower.includes('versus') || qLower.includes('vs') || qLower.includes('tradeoff')) {
      const optA = sortedOptions[0];
      const optB = sortedOptions[1] || optA;

      return {
        reply: `Comparing your options head-to-head, **${optA.opt.title}** leads **${optB.opt.title}** with a Decision Score of **${optA.score?.decisionScore || 80}/100** vs **${optB.score?.decisionScore || 70}/100** because it carries **${(optA.score?.overallRiskLevel || 'Low').toLowerCase()} risk** and delivers a 5-year median valuation of **₹${getP50(optA).toLocaleString('en-IN')}** vs **₹${getP50(optB).toLocaleString('en-IN')}**.\n\n` +
          `### ⚖️ Head-to-Head Comparison: **${scenario.title}**\n\n` +
          `1. **🥇 #1 Ranked: ${optA.opt.title}**\n` +
          `   - Decision Score: **${optA.score?.decisionScore || 80}/100**\n` +
          `   - Risk Assessment: **${optA.score?.overallRiskLevel || 'Low'} Risk**\n` +
          `   - Upfront Cost / Annual Salary: **₹${getCost(optA).toLocaleString('en-IN')}** cost | **₹${getSal(optA).toLocaleString('en-IN')}/yr** salary\n` +
          `   - P50 Median 5-Yr Valuation: **₹${getP50(optA).toLocaleString('en-IN')}**\n\n` +
          `2. **🥈 #2 Ranked: ${optB.opt.title}**\n` +
          `   - Decision Score: **${optB.score?.decisionScore || 70}/100**\n` +
          `   - Risk Assessment: **${optB.score?.overallRiskLevel || 'Medium'} Risk**\n` +
          `   - Upfront Cost / Annual Salary: **₹${getCost(optB).toLocaleString('en-IN')}** cost | **₹${getSal(optB).toLocaleString('en-IN')}/yr** salary\n` +
          `   - P50 Median 5-Yr Valuation: **₹${getP50(optB).toLocaleString('en-IN')}**\n\n` +
          `**Key Tradeoff:** **${optA.opt.title}** leads on overall goal alignment and risk-adjusted return, whereas **${optB.opt.title}** presents a different capital-to-upside profile.`,
        suggestedPrompts: [
          `Why option 1 is choosed?`,
          `What are my biggest vulnerabilities in Option 1?`,
          `What are my biggest vulnerabilities in Option 2?`
        ]
      };
    }

    // G. Tell me about Option X / Inquiries about specific options
    if (/tell me about|what about|describe|explain|details on/i.test(qLower) || /option\s*[1-6a-f]/i.test(qLower) || hasExplicitTarget) {
      const opt = targetOption.opt;
      const score = targetOption.score;
      const sim = targetOption.sim;
      const cost = getCost(targetOption);
      const expectedSal = getSal(targetOption);
      const rank = getRank(targetOption);

      return {
        reply: `**${optionLabel} (${opt.title})** is **Ranked #${rank}** in your scenario because it has a **${(score?.overallRiskLevel || 'Moderate').toLowerCase()} risk rate** (Decision Score: **${score?.decisionScore || 75}/100**), an upfront cost of **₹${cost.toLocaleString('en-IN')}**, an expected annual salary of **₹${expectedSal.toLocaleString('en-IN')}/year**, and a 5-year median return of **₹${(sim?.percentiles?.p50MedianCase || 0).toLocaleString('en-IN')}**.\n\n` +
          `### 📋 Profile: **${opt.title}** (${optionLabel})\n\n` +
          `- **Decision Score:** **${score?.decisionScore || 75}/100** (Ranked #${rank})\n` +
          `- **Overall Risk Rating:** **${score?.overallRiskLevel || 'Moderate'} Risk**\n` +
          `- **Upfront Capital Cost:** **₹${cost.toLocaleString('en-IN')}**\n` +
          `- **Expected Target Salary:** **₹${expectedSal.toLocaleString('en-IN')}/year**\n` +
          `- **P10 Downside (Worst-Case):** ₹${(sim?.percentiles?.p10PessimisticCase || 0).toLocaleString('en-IN')}\n` +
          `- **P50 Median (Expected):** ₹${(sim?.percentiles?.p50MedianCase || 0).toLocaleString('en-IN')}\n` +
          `- **P90 Upside (Best-Case):** ₹${(sim?.percentiles?.p90OptimisticCase || 0).toLocaleString('en-IN')}\n\n` +
          `**Summary:** ${opt.description || 'Configured decision path modeled through 10,000 Monte Carlo stochastic trials.'}`,
        suggestedPrompts: [
          `Why option 1 is choosed?`,
          `What are my biggest vulnerabilities in ${optionLabel}?`,
          `Compare Option 1 vs Option 2`
        ]
      };
    }
  }

  // -------------------------------------------------------------
  // 2. GENERAL "WHY OPTION X IS CHOSEN" (even if no scenario is loaded)
  // -------------------------------------------------------------
  if (/\b(choos|chose|chosen|choosed|select|selected|pick|picked|prefer|preferred|win|won|winner|why\s+option)\b/i.test(qLower)) {
    const optNum = (qLower.match(/option\s*([1-6a-f])/i) || [])[1] || '1';
    return {
      reply: `Why **Option ${optNum.toUpperCase()}** is chosen is because it has a **low risk rate**, preserves your **${runwayMonths}-month liquid emergency runway**, and achieves the highest composite TOPSIS decision score across your weighted priorities.\n\n` +
        `### 🏆 How Option Selection Works\n` +
        `- **Low Risk Rate & Solvency:** Options with lower upfront capital burn and higher 5-year survival probability score higher on Financial & Market stability.\n` +
        `- **Risk-Adjusted 5-Year Return (P50):** Simulated across 10,000 Monte Carlo trials to balance expected salary against tuition or seed cost.\n` +
        `- **Personal Priority Alignment:** Weighted directly against your 7 life and career goal sliders.`,
      suggestedPrompts: [
        'What are my biggest vulnerabilities?',
        'Calculate my financial runway',
        'How should I negotiate compensation?'
      ]
    };
  }

  // -------------------------------------------------------------
  // 2B. GENERAL RISK / VULNERABILITY (when no scenario is active)
  // -------------------------------------------------------------
  if (qLower.includes('risk') || qLower.includes('vulnerab') || qLower.includes('danger') || qLower.includes('worst')) {
    return {
      reply: `Your primary financial risk is tied to your **${runwayMonths}-month emergency runway** (₹${savings.toLocaleString('en-IN')} liquid savings against ₹${expenses.toLocaleString('en-IN')}/month expenses) and **${riskTolerance.toLowerCase()} risk tolerance**.\n\n` +
        `### 🛡️ Baseline Financial Risk Diagnostic\n\n` +
        `Based on your **Digital Twin Profile**:\n\n` +
        `- **Current Annual Salary:** ₹${salary.toLocaleString('en-IN')}\n` +
        `- **Liquid Emergency Buffer:** ₹${savings.toLocaleString('en-IN')} (~${runwayMonths} months burn rate)\n` +
        `- **Risk Tolerance:** ${riskTolerance.toUpperCase()}\n\n` +
        `**Your Chief Vulnerability:** ` +
        (runwayMonths < 6 
          ? `⚠️ **Runway Squeeze:** Having only ${runwayMonths} months of liquid savings leaves you exposed to cashflow stress during career pivots or education gaps. Target building at least 6 months reserve.`
          : `✅ **Controlled Runway:** You have a healthy ${runwayMonths}-month liquidity cushion, allowing you to take calculated risks without personal debt.`) + `\n\n` +
        `To evaluate vulnerabilities for specific options (like Option 1 vs Option 2), open any decision from your **[Dashboard](/)**!`,
      suggestedPrompts: [
        'Calculate my financial runway',
        'Brainstorm a new career scenario',
        'What are current market benchmarks?'
      ]
    };
  }

  // -------------------------------------------------------------
  // 3. BRAINSTORMING & SCENARIO STRUCTURING
  // -------------------------------------------------------------
  if (qLower.includes('brainstorm') || qLower.includes('idea') || qLower.includes('should i') || qLower.includes('mba') || qLower.includes('switch') || qLower.includes('startup') || qLower.includes('job offer') || qLower.includes('relocat')) {
    let category = 'career_change';
    let suggestedTitle = 'Career Pivot vs Status Quo';
    let optionsList = [
      'Option A: Transition to AI/ML or High-Growth Tech (Upskilling + Job Switch)',
      'Option B: Retain Current Position & Seek Internal Senior Promotion'
    ];

    if (qLower.includes('mba') || qLower.includes('master') || qLower.includes('study') || qLower.includes('degree') || qLower.includes('education')) {
      category = 'higher_education';
      suggestedTitle = 'Full-Time Master/MBA vs Continuous Employment';
      optionsList = [
        'Option A: Tier-1 Full-Time Program (24 Months, High Campus Placement)',
        'Option B: Executive/Part-Time Degree while maintaining current salary'
      ];
    } else if (qLower.includes('startup') || qLower.includes('founder') || qLower.includes('business')) {
      category = 'entrepreneurship';
      suggestedTitle = 'Bootstrap AI Startup vs Lead Engineer Role';
      optionsList = [
        'Option A: Found Bootstrapped Startup (18-Month Founder Runway)',
        'Option B: Lead Engineer at Established Mid-Market Firm'
      ];
    } else if (qLower.includes('relocat') || qLower.includes('city') || qLower.includes('germany') || qLower.includes('abroad') || qLower.includes('bangalore')) {
      category = 'relocation';
      suggestedTitle = 'Relocation: Tier-1 Tech Hub vs Overseas Opportunity';
      optionsList = [
        'Option A: Relocate to International Hub (Euro/Dollar Compensation, Visa Squeeze)',
        'Option B: Domestic Tier-1 Tech City with Low Relative Cost of Living'
      ];
    }

    return {
      reply: `To structure this decision effectively, we recommend modeling **${suggestedTitle}** under the \`${category}\` domain comparing two high-contrast paths.\n\n` +
        `### 💡 Brainstormed Scenario Architecture\n\n` +
        `Here is a recommended modeling template ready for the Scenario Wizard:\n\n` +
        `- **Category:** \`${category}\`\n` +
        `- **Proposed Title:** **${suggestedTitle}**\n` +
        `- **Recommended Alternatives:**\n` +
        optionsList.map(o => `  - ${o}`).join('\n') + `\n\n` +
        `- **Suggested Goal Priorities (Sum = 100%):**\n` +
        `  - Financial Growth: **30%**\n` +
        `  - Job Security: **20%**\n` +
        `  - Work-Life Balance: **15%**\n` +
        `  - Personal Growth: **15%**\n` +
        `  - Family & Proximity: **10%**\n` +
        `  - Health & Location: **10%**\n\n` +
        `👉 Head to **[New Scenario](/scenarios/new)** and use the **1-Click Templates** to simulate 10,000 trials!`,
      suggestedPrompts: [
        'How does Monte Carlo simulation work?',
        'Calculate my financial runway',
        'What are current market salary trends?'
      ]
    };
  }

  // -------------------------------------------------------------
  // 4. RUNWAY & FINANCIAL HEALTH CHECK
  // -------------------------------------------------------------
  if (qLower.includes('runway') || qLower.includes('savings') || qLower.includes('emergency') || qLower.includes('budget') || qLower.includes('burn')) {
    let healthRating = 'Solid';
    let advice = 'Your runway provides a comfortable cushion for exploratory career leaps or certifications.';
    if (runwayMonths < 4) {
      healthRating = 'Vulnerable';
      advice = 'We strongly recommend accumulating at least 6 months of expenses before initiating any career pivot or unpaid study break.';
    } else if (runwayMonths >= 12) {
      healthRating = 'Fortified';
      advice = 'You have exceptional runway flexibility, enabling you to take asymmetric risks like early-stage startups or higher education.';
    }

    return {
      reply: `Your financial runway is **${runwayMonths} Months** (${healthRating}) based on **₹${savings.toLocaleString('en-IN')}** in liquid savings and **₹${expenses.toLocaleString('en-IN')}/month** in expenses.\n\n` +
        `### 💰 Financial Runway Diagnostic\n\n` +
        `- **Current Monthly Compensation:** ₹${salary.toLocaleString('en-IN')}/year (~₹${Math.round(salary / 12).toLocaleString('en-IN')}/mo)\n` +
        `- **Liquid Savings:** ₹${savings.toLocaleString('en-IN')}\n` +
        `- **Estimated Monthly Burn:** ₹${expenses.toLocaleString('en-IN')}/month\n` +
        `- **Zero-Income Runway:** **${runwayMonths} Months** (${healthRating})\n` +
        `- **Risk Appetite Profile:** **${riskTolerance.toUpperCase()}**\n\n` +
        `**TwinBot Assessment:** ${advice}\n\n` +
        `You can calibrate these figures anytime in your **[Digital Twin Profile](/profile)**.`,
      suggestedPrompts: [
        'Brainstorm a new career scenario',
        'What are current tech salary benchmarks?',
        'How does TOPSIS decision scoring work?'
      ]
    };
  }

  // -------------------------------------------------------------
  // 5. METHODOLOGY & SCIENCE (How DecisionTwin works)
  // -------------------------------------------------------------
  if (qLower.includes('how does it work') || qLower.includes('monte carlo') || qLower.includes('topsis') || qLower.includes('methodology') || qLower.includes('math') || qLower.includes('science')) {
    return {
      reply: `DecisionTwin works by running **10,000 Monte Carlo stochastic simulations** and **TOPSIS multi-criteria optimization** to rank your options by risk-adjusted return and personal goal fit.\n\n` +
        `### 🔬 How DecisionTwin AI Computes Outcomes\n\n` +
        `DecisionTwin combines stochastic mathematical engines with multi-criteria optimization:\n\n` +
        `1. **10,000-Trial Monte Carlo Engine:** Simulates 10,000 possible futures using Box-Muller normal transforms, testing salary growth, unexpected setbacks, and cost variance across 1, 3, and 5-year horizons.\n` +
        `2. **TOPSIS Decision Science:** Calculates Euclidean distances to the Ideal Best ($A^+$) and Ideal Worst ($A^-$) solutions across your weighted priorities, ensuring unbiased rankings.\n` +
        `3. **6-Axis Risk Radar:** Measures Financial, Career, Market, Educational, Personal, and Family risks separately.\n` +
        `4. **Explainable AI (XAI):** Uses permutation feature importance to clearly explain *why* an option won.`,
      suggestedPrompts: [
        'Brainstorm a new scenario',
        'Check my financial runway',
        'What are current market salary benchmarks?'
      ]
    };
  }

  // -------------------------------------------------------------
  // 6. MARKET TRENDS & SALARY BENCHMARKS
  // -------------------------------------------------------------
  if (qLower.includes('market') || qLower.includes('trend') || qLower.includes('hiring') || qLower.includes('inflation') || qLower.includes('benchmark')) {
    return {
      reply: `Current market benchmarks show a **+24% compensation premium** for AI/ML and Distributed Systems roles, with Tier-1 tech medians at **₹18.5 LPA (Mid)** and **₹32.0 LPA (Senior)**.\n\n` +
        `### 🌐 Curated Market Intelligence\n\n` +
        `- **Baseline Reference Version:** 2026.1 (Curated Industry Benchmarks)\n` +
        `- **Tech & AI Hiring Velocity:** High demand for Full-Stack AI, LLM fine-tuning, and Distributed Systems roles (+24% salary premium over traditional SWE).\n` +
        `- **Benchmark Inflation Rate:** Projected at 5.2% annually.\n` +
        `- **Tier-1 Tech Comp Median:** ₹18.5 LPA (Mid-level), ₹32.0 LPA (Senior), ₹52.0+ LPA (Staff/Lead).\n\n` +
        `Explore complete interactive benchmark tables on the **[Market Intelligence](/market)** page!`,
      suggestedPrompts: [
        'Brainstorm a new scenario',
        'Check my financial runway',
        'How does DecisionTwin work?'
      ]
    };
  }

  // -------------------------------------------------------------
  // 7. SPECIFIC GREETING ONLY (hi / hello / hey)
  // -------------------------------------------------------------
  if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))\b/i.test(qLower) && q.length < 20) {
    return {
      reply: `Hello! I am **TwinBot**, your strategic AI Decision Co-Pilot.\n\n` +
        `I am connected to your Digital Twin and active scenarios to help you evaluate trade-offs, explain option rankings, and de-risk major decisions.\n\n` +
        `What decision question can I answer for you?`,
      suggestedPrompts: [
        'Why is Option 1 chosen?',
        'What are my biggest vulnerabilities in Option 1?',
        'Calculate my financial runway',
        'How should I negotiate compensation?'
      ]
    };
  }

  // -------------------------------------------------------------
  // 8. DYNAMIC ADAPTIVE FALLBACK (Directly answers with active scenario / twin context)
  // -------------------------------------------------------------
  if (scenarioData?.scenario) {
    const topOpt = scenarioData.options?.[0];
    const topScore = scenarioData.riskScores?.find(r => (r.optionId?._id || r.optionId || '').toString() === (topOpt?._id || '').toString()) || scenarioData.riskScores?.[0];
    const topSim = scenarioData.simulations?.find(s => (s.optionId?._id || s.optionId || '').toString() === (topOpt?._id || '').toString()) || scenarioData.simulations?.[0];
    return {
      reply: `Regarding **"${q}"**: in your active scenario (**${scenarioData.scenario.title}**), **${topOpt?.title || 'Option 1'}** leads with a **${(topScore?.overallRiskLevel || 'Low').toLowerCase()} risk rate** (Decision Score: **${topScore?.decisionScore || 85}/100**) and a 5-year median valuation of **₹${(topSim?.percentiles?.p50MedianCase || 0).toLocaleString('en-IN')}**.\n\n` +
        `### 📊 Active Decision Snapshot\n` +
        `- **Top Recommended Path:** **${topOpt?.title || 'Option 1'}** (${topScore?.overallRiskLevel || 'Low'} Risk, Score ${topScore?.decisionScore || 85}/100)\n` +
        `- **Your Digital Twin Runway:** **${runwayMonths} months** liquid buffer (₹${savings.toLocaleString('en-IN')} savings)\n\n` +
        `You can ask me specific questions like *"Why is Option 1 chosen?"*, *"Compare Option 1 vs Option 2"*, or *"What are my biggest vulnerabilities?"*.`,
      suggestedPrompts: [
        'Why is Option 1 chosen?',
        'Compare Option 1 vs Option 2',
        'What are my biggest vulnerabilities in Option 1?',
        'What is my break-even payback timeline?'
      ]
    };
  }

  return {
    reply: `Regarding **"${q}"**: based on your Digital Twin profile (**${role}**, **₹${(salary/100000).toFixed(1)}L/yr** income, **${runwayMonths} months** liquid runway), you are positioned for **${riskTolerance.toLowerCase()}-risk** career and financial decisions.\n\n` +
      `### 📊 Strategic Profile Summary\n` +
      `- **Current Digital Twin:** ${role} | ₹${(salary/100000).toFixed(1)}L/yr | ${runwayMonths} months emergency runway.\n` +
      `- **Next Step:** Open any scenario from your **[Dashboard](/)** or ask me why a specific option was chosen, its risk rate, or its break-even timeline.`,
    suggestedPrompts: [
      'Why is Option 1 chosen?',
      'What are my biggest vulnerabilities in Option 1?',
      'What is my break-even payback timeline?',
      'Calculate my financial runway'
    ]
  };
}

module.exports = {
  processChatQuery
};
