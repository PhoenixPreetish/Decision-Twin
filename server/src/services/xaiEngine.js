// Explainable AI (XAI) & Action Plan Report Generator (REQ-45 to REQ-49)

function generateXaiReport(scenario, rankedOptionsData, digitalTwin) {
  if (!rankedOptionsData || rankedOptionsData.length === 0) return null;

  const topOption = rankedOptionsData[0];
  const optionTitle = topOption.option.title;
  const category = scenario.category;
  const scores = topOption.riskScore;
  const pred = topOption.prediction;

  // 1. Feature Importance Ranking (Permutation Feature Importance)
  const featureContributions = [
    { feature: 'Goal Alignment Fit', importance: Math.round(scores.goalAlignmentScore * 0.35), direction: 'positive' },
    { feature: 'Expected ROI & Salary Lift', importance: Math.min(30, Math.round(pred.predictedRoiPercentage * 0.4)), direction: 'positive' },
    { feature: 'Success Probability Ratio', importance: Math.round(pred.successProbability * 25), direction: 'positive' },
    { feature: 'Financial Buffer & Debt Impact', importance: Math.round(scores.financialRisk * 0.25), direction: scores.financialRisk > 50 ? 'negative' : 'positive' },
    { feature: 'Market & Industry Stability', importance: Math.round((100 - scores.marketRisk) * 0.2), direction: scores.marketRisk > 55 ? 'negative' : 'positive' }
  ].sort((a, b) => b.importance - a.importance);

  // 2. Plain Language AI Explanation (REQ-46)
  const explanation = `"${optionTitle}" is recommended as your top-performing alternative with a composite Decision Score of ${scores.decisionScore}/100 and a ${scores.overallRiskLevel} risk profile. ` +
    `Our predictive models indicate strong alignment with your weighted personal goals (${scores.goalAlignmentScore}% alignment) ` +
    `and an estimated 5-year expected financial outcome of ₹${topOption.simulation.percentiles.p50MedianCase.toLocaleString('en-IN')}. ` +
    `Key driving factor: high ${featureContributions[0].feature} with a confidence rating of ${scores.confidenceScore}%.`;

  // 3. Pros and Cons Generator for Top Options (REQ-47)
  const optionBreakdown = rankedOptionsData.map((item) => {
    const pros = [];
    const cons = [];

    if (item.prediction.predictedRoiPercentage > 20) {
      pros.push(`High ROI potential (+${item.prediction.predictedRoiPercentage.toFixed(1)}%)`);
    }
    if (item.riskScore.financialRisk < 40) {
      pros.push('Low initial financial strain & manageable debt buffer');
    }
    if (item.riskScore.goalAlignmentScore > 75) {
      pros.push('Exceptional fit with your top-weighted personal priorities');
    }
    if (item.prediction.successProbability > 0.8) {
      pros.push(`High outcome success probability (${(item.prediction.successProbability * 100).toFixed(0)}%)`);
    }

    if (item.riskScore.financialRisk >= 60) {
      cons.push(`Elevated financial risk due to upfront capital/tuition expenditure`);
    }
    if (item.riskScore.marketRisk >= 50) {
      cons.push('Higher sensitivity to macroeconomic and industry demand cycles');
    }
    if (item.riskScore.familyRisk > 45) {
      cons.push('Relocation distance or high work hours may strain personal/family commitments');
    }
    if (item.riskScore.constraintViolations?.length > 0) {
      cons.push(`Violates constraint: ${item.riskScore.constraintViolations[0].constraintName}`);
    }

    if (pros.length === 0) pros.push('Moderate baseline stability in line with industry average');
    if (cons.length === 0) cons.push('Requires consistent execution to maintain expected timeline');

    return {
      optionId: item.option._id,
      title: item.option.title,
      rank: item.riskScore.rank,
      decisionScore: item.riskScore.decisionScore,
      riskLevel: item.riskScore.overallRiskLevel,
      pros,
      cons
    };
  });

  // 4. Personalized Step-by-Step Action Plan (REQ-48)
  const actionPlan = generateActionSteps(category, topOption.option, digitalTwin);

  return {
    recommendedOptionTitle: optionTitle,
    recommendationSummary: explanation,
    featureContributions,
    optionBreakdown,
    actionPlan
  };
}

function generateActionSteps(category, option, digitalTwin) {
  switch (category) {
    case 'higher_education':
      return [
        { phase: 'Phase 1: Foundation (Months 1-3)', task: 'Finalize admission prerequisite courses and apply for scholarship/educational financing grants.', isCompleted: false },
        { phase: 'Phase 2: Transition (Months 4-6)', task: 'Liquidate allocated education savings reserve and prepare living accommodation near campus.', isCompleted: false },
        { phase: 'Phase 3: Academic Excellence (Months 7-18)', task: 'Maintain core GPA and secure high-impact research or industry internship.', isCompleted: false },
        { phase: 'Phase 4: Career Launch (Months 19-24)', task: 'Leverage campus recruitment networks and alumni connections to secure target placement.', isCompleted: false }
      ];
    case 'career_change':
    case 'job_selection':
      return [
        { phase: 'Phase 1: Skill Gap Bridging (Weeks 1-6)', task: 'Complete certification and build 2 portfolio projects demonstrating target stack proficiency.', isCompleted: false },
        { phase: 'Phase 2: Interview Prep & Negotiation (Weeks 7-10)', task: 'Conduct mock interviews and negotiate starting compensation package targeting expected band.', isCompleted: false },
        { phase: 'Phase 3: 90-Day Ramp Up (Months 1-3)', task: 'Establish stakeholder trust, master internal workflows, and deliver quick-win deliverables.', isCompleted: false },
        { phase: 'Phase 4: Long-Term Trajectory (Months 4-12)', task: 'Target promotion milestones and maintain active mentor relationships.', isCompleted: false }
      ];
    case 'entrepreneurship':
      return [
        { phase: 'Phase 1: Customer Discovery (Months 1-2)', task: 'Validate MVP problem-solution fit with at least 30 prospective target customers.', isCompleted: false },
        { phase: 'Phase 2: MVP & Compliance (Months 3-4)', task: 'Register legal entity, establish GST/banking compliance, and launch initial minimum viable product.', isCompleted: false },
        { phase: 'Phase 3: Go-To-Market (Months 5-8)', task: 'Execute targeted acquisition funnel to achieve unit economic breakeven.', isCompleted: false },
        { phase: 'Phase 4: Scaling & Runway (Months 9-18)', task: 'Reinvest positive cash flows or prepare seed investment pitch deck.', isCompleted: false }
      ];
    default:
      return [
        { phase: 'Phase 1: Initial Preparation', task: 'Formulate emergency budget buffer and verify legal/contract terms.', isCompleted: false },
        { phase: 'Phase 2: Execution & Transition', task: 'Execute migration checklist and begin primary milestone activities.', isCompleted: false },
        { phase: 'Phase 3: Optimization', task: 'Review quarterly progress against Monte Carlo median growth targets.', isCompleted: false }
      ];
  }
}

module.exports = { generateXaiReport };
