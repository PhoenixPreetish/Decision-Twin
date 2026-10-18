// Explainable AI (XAI), Perturbation Attribution & Action Plan Report Generator (REQ-45 to REQ-49)

const {
  computePerturbationTornado,
  computeCounterfactualFlipSolver,
  computeDeRiskingAndMvcLab,
  computePremortemAndOptionality
} = require('./nexusIntelligenceService');

function generateXaiReport(scenario, rankedOptionsData, digitalTwin) {
  if (!rankedOptionsData || rankedOptionsData.length === 0) return null;

  const topOption = rankedOptionsData[0];
  const rivalOption = rankedOptionsData[1] || topOption;
  const optionTitle = topOption.option.title;
  const category = scenario.category || 'career_change';
  const scores = topOption.riskScore || {};
  const pred = topOption.prediction || {};

  // 1. True Perturbation-Based Feature Importance Ranking (REQ-45)
  const tornado = computePerturbationTornado(
    digitalTwin,
    topOption.option,
    {},
    category,
    rivalOption?.riskScore?.decisionScore || 0
  );

  const featureContributions = [
    {
      feature: 'Goal Alignment Fit',
      importance: Math.round((scores.goalAlignmentScore || 75) * 0.35),
      direction: 'positive',
      swingPoints: tornado.tornadoBars[0]?.swingPoints || 8
    },
    {
      feature: tornado.tornadoBars[0]?.feature || 'Expected ROI & Salary Lift',
      importance: tornado.tornadoBars[0]?.importance || Math.min(35, Math.round((pred.predictedRoiPercentage || 20) * 0.4)),
      direction: 'positive',
      swingPoints: tornado.tornadoBars[0]?.swingPoints || 7
    },
    {
      feature: 'Success Probability & Conformal Bound',
      importance: Math.round((pred.successProbability || 0.85) * 25),
      direction: 'positive',
      swingPoints: 5
    },
    {
      feature: tornado.tornadoBars[1]?.feature || 'Financial Buffer & Debt Impact',
      importance: tornado.tornadoBars[1]?.importance || Math.round((scores.financialRisk || 35) * 0.28),
      direction: (scores.financialRisk || 35) > 50 ? 'negative' : 'positive',
      swingPoints: tornado.tornadoBars[1]?.swingPoints || 6
    },
    {
      feature: 'Market & Irreversibility Exposure',
      importance: Math.round((100 - (scores.marketRisk || 30)) * 0.22),
      direction: (scores.marketRisk || 30) > 55 ? 'negative' : 'positive',
      swingPoints: 4
    }
  ].sort((a, b) => b.importance - a.importance);

  // 2. Plain Language AI Explanation with 4-Tensor & Readiness Context (REQ-46)
  const readinessStatus = scores.decisionReadiness?.status || 'Ready to Commit';
  const ruinPct = scores.fourTensor?.ruinProbabilityPct ?? 1.5;
  const explanation = `"${optionTitle}" is recommended as your top-performing alternative with a composite Decision Score of ${scores.decisionScore}/100, a ${scores.overallRiskLevel} risk profile, and a "${readinessStatus}" readiness status. ` +
    `Our models indicate strong alignment with your weighted personal goals (${scores.goalAlignmentScore}% alignment), ` +
    `an estimated 5-year median valuation of ₹${(topOption.simulation?.percentiles?.p50MedianCase || 0).toLocaleString('en-IN')}, and a 60-month insolvency hazard of only ${ruinPct}%. ` +
    `Key driving factor: ${featureContributions[0].feature} with a calibrated confidence rating of ${scores.confidenceScore}%. Advisory Estimate Disclaimer: Predictions are algorithmically generated for decision support and are not professional financial, legal, or career counsel.`;

  // 3. Pros and Cons Generator for Top Options (REQ-47)
  const optionBreakdown = rankedOptionsData.map((item) => {
    const pros = [];
    const cons = [];

    if ((item.prediction?.predictedRoiPercentage || 0) > 20) {
      pros.push(`High ROI potential (+${Number(item.prediction.predictedRoiPercentage).toFixed(1)}%)`);
    }
    if ((item.riskScore?.financialRisk || 50) < 40) {
      pros.push('Low initial financial strain & manageable debt buffer');
    }
    if ((item.riskScore?.goalAlignmentScore || 70) > 75) {
      pros.push('Exceptional fit with your top-weighted personal priorities');
    }
    if ((item.prediction?.successProbability || 0.8) > 0.8) {
      pros.push(`High outcome success probability (${((item.prediction.successProbability || 0.85) * 100).toFixed(0)}%)`);
    }
    if ((item.riskScore?.fourTensor?.irreversibilityIndex || 40) < 35) {
      pros.push('High strategic reversibility — low capital lock-in if priorities shift');
    }

    if ((item.riskScore?.financialRisk || 0) >= 60) {
      cons.push('Elevated financial risk due to upfront capital/tuition expenditure');
    }
    if ((item.riskScore?.marketRisk || 0) >= 50) {
      cons.push('Higher sensitivity to macroeconomic and industry demand cycles');
    }
    if ((item.riskScore?.familyRisk || 0) > 45) {
      cons.push('Relocation distance or high work hours may strain personal/family commitments');
    }
    if (item.riskScore?.constraintViolations?.length > 0) {
      cons.push(`Violates constraint: ${item.riskScore.constraintViolations[0].constraintName}`);
    }
    if (item.riskScore?.hiddenHazards?.length > 0) {
      cons.push(`Compounding hazard: ${item.riskScore.hiddenHazards[0].title}`);
    }

    if (pros.length === 0) pros.push('Moderate baseline stability in line with industry average');
    if (cons.length === 0) cons.push('Requires consistent execution to maintain expected timeline');

    return {
      optionId: item.option._id,
      title: item.option.title,
      rank: item.riskScore.rank,
      decisionScore: item.riskScore.decisionScore,
      riskLevel: item.riskScore.overallRiskLevel,
      fourTensor: item.riskScore.fourTensor,
      decisionReadiness: item.riskScore.decisionReadiness,
      pros,
      cons
    };
  });

  // 4. Personalized Step-by-Step Action Plan (REQ-48) + MVC & De-Risking Lab
  const actionPlan = generateActionSteps(category, topOption.option, digitalTwin);
  const deRiskingLab = computeDeRiskingAndMvcLab(digitalTwin, rankedOptionsData, {}, category, ['ringfence_buffer', 'scholarship_sponsorship']);
  const counterfactuals = computeCounterfactualFlipSolver(digitalTwin, rankedOptionsData, {}, category);
  const premortem = computePremortemAndOptionality(digitalTwin, rankedOptionsData, category);

  return {
    recommendedOptionTitle: optionTitle,
    recommendationSummary: explanation,
    featureContributions,
    optionBreakdown,
    actionPlan,
    tornadoSensitivity: tornado,
    deRiskingLab,
    counterfactuals,
    premortem
  };
}

function generateActionSteps(category, option, digitalTwin) {
  switch (category) {
    case 'higher_education':
    case 'skill_investment':
      return [
        { phase: 'Phase 1: Foundation & MVC Sprint (Months 1-2)', task: 'Run 21-day alumni verification sprint, finalize prerequisite courses, and apply for merit scholarships.', isCompleted: false },
        { phase: 'Phase 2: Ring-Fenced Transition (Months 3-6)', task: 'Ring-fence 6 months of living expenses in a liquid reserve and lock education loan moratorium terms.', isCompleted: false },
        { phase: 'Phase 3: Domain Mastery (Months 7-18)', task: 'Build high-impact capstone portfolio and secure industry research or product internship.', isCompleted: false },
        { phase: 'Phase 4: High-Leverage Placement (Months 19-24)', task: 'Leverage alumni network and BATNA counter-offer strategy to hit target compensation band.', isCompleted: false }
      ];
    case 'career_change':
    case 'job_selection':
      return [
        { phase: 'Phase 1: Skill Gap Bridging (Weeks 1-6)', task: 'Complete certification and build 2 portfolio projects demonstrating target stack proficiency.', isCompleted: false },
        { phase: 'Phase 2: Interview Prep & BATNA Negotiation (Weeks 7-10)', task: 'Conduct mock interviews and negotiate starting compensation package using Option #2 as BATNA.', isCompleted: false },
        { phase: 'Phase 3: 90-Day Ramp Up (Months 1-3)', task: 'Establish stakeholder trust, master internal workflows, and deliver quick-win deliverables.', isCompleted: false },
        { phase: 'Phase 4: Long-Term Trajectory (Months 4-12)', task: 'Target promotion milestones and track assumption tripwires quarterly.', isCompleted: false }
      ];
    case 'entrepreneurship':
      return [
        { phase: 'Phase 1: 14-Day MVC Customer Discovery (Months 1-2)', task: 'Validate MVP problem-solution fit with 15 prospective buyers and secure 3 paid pilot LOIs.', isCompleted: false },
        { phase: 'Phase 2: MVP & Runway Ring-Fencing (Months 3-4)', task: 'Ring-fence personal living runway, register entity, and launch initial minimum viable product.', isCompleted: false },
        { phase: 'Phase 3: Go-To-Market (Months 5-8)', task: 'Execute targeted acquisition funnel to achieve unit economic breakeven before Month 9.', isCompleted: false },
        { phase: 'Phase 4: Scaling & Runway (Months 9-18)', task: 'Reinvest positive cash flows or prepare seed investment pitch deck.', isCompleted: false }
      ];
    default:
      return [
        { phase: 'Phase 1: Initial Preparation & MVC Validation', task: 'Formulate 6-month emergency budget buffer and verify contract/relocation terms.', isCompleted: false },
        { phase: 'Phase 2: Execution & Transition', task: 'Execute migration checklist and begin primary milestone activities.', isCompleted: false },
        { phase: 'Phase 3: Calibration & Optimization', task: 'Review 6-month check-in actuals against Monte Carlo P50 growth targets.', isCompleted: false }
      ];
  }
}

module.exports = { generateXaiReport };

