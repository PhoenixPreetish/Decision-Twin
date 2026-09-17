// Multi-Dimensional Risk & Decision Scoring Engine (REQ-29 to REQ-39)

function computeOptionScores(digitalTwin, option, goalConstraint, simulationResult, prediction, category) {
  const attrs = option.attributes || {};
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
  const currentIncome = Math.max(digitalTwin.currentSalary || 300000, 100000);
  const totalCost = (attrs.tuitionCost || 0) + (attrs.initialInvestment || 0) + (attrs.relocationCost || 0);
  const userDebt = digitalTwin.debt || 0;
  const userSavings = digitalTwin.savings || 100000;

  let debtRatio = (userDebt + totalCost) / (currentIncome * 3);
  let savingsBufferMonths = userSavings / Math.max(digitalTwin.monthlyExpenses || 25000, 10000);
  let worstCaseImpact = simulationResult.percentiles.p10WorstCase < (currentIncome * 0.8) ? 35 : 10;

  let financialRisk = Math.min(100, Math.max(5, Math.round(debtRatio * 40 + (12 - Math.min(12, savingsBufferMonths)) * 3 + worstCaseImpact)));

  // 2. CAREER RISK (REQ-30)
  let baseCareerRisk = 25;
  if (category === 'entrepreneurship') baseCareerRisk = 60;
  if (category === 'career_change') baseCareerRisk = 45;
  if (category === 'job_selection') baseCareerRisk = 20;

  let skillRiskMod = (digitalTwin.yearsOfExperience < 3) ? 15 : (digitalTwin.yearsOfExperience > 7 ? -10 : 0);
  let careerRisk = Math.min(100, Math.max(5, Math.round(baseCareerRisk + skillRiskMod + (1 - (prediction?.successProbability || 0.8)) * 30)));

  // 3. MARKET RISK (REQ-31)
  let marketRisk = 30;
  if (category === 'entrepreneurship' || category === 'investment_planning') marketRisk = 55;
  if (attrs.companyType === 'Startup') marketRisk += 15;

  // 4. EDUCATIONAL RISK (REQ-32)
  let educationalRisk = 15;
  if (category === 'higher_education') {
    educationalRisk = attrs.isAccredited === false ? 75 : 20;
  }

  // 5. PERSONAL & FAMILY RISK (REQ-32)
  let distance = attrs.distanceFromFamilyKm || 0;
  let familyRisk = Math.min(100, Math.max(5, Math.round(15 + (distance > 500 ? 35 : (distance > 100 ? 15 : 0)))));
  let wlb = attrs.workLifeBalanceRating || 7;
  let personalRisk = Math.min(100, Math.max(5, Math.round(100 - (wlb * 9))));

  // 6. AGGREGATE RISK LEVEL (REQ-33)
  let overallRiskScore = Math.round(
    (financialRisk * 0.30) +
    (careerRisk * 0.25) +
    (marketRisk * 0.15) +
    (educationalRisk * 0.10) +
    (personalRisk * 0.10) +
    (familyRisk * 0.10)
  );

  let overallRiskLevel = 'Low';
  if (overallRiskScore >= 65) overallRiskLevel = 'High';
  else if (overallRiskScore >= 40) overallRiskLevel = 'Medium';

  // 7. GOAL ALIGNMENT SCORE (REQ-35)
  // Evaluate satisfaction (0-100) per goal dimension
  let finSatisfaction = Math.min(100, Math.max(10, ((prediction.predictedRoiPercentage + 50) / 1.5)));
  let secSatisfaction = Math.min(100, Math.max(10, (100 - careerRisk)));
  let wlbSatisfaction = Math.min(100, Math.max(10, wlb * 10));
  let persGrowthSatisfaction = (category === 'higher_education' || category === 'career_change') ? 90 : 75;
  let famSatisfaction = Math.min(100, Math.max(10, 100 - familyRisk));
  let locSatisfaction = (attrs.targetCountry === 'India' || attrs.remoteFlexibility === 'Remote') ? 90 : 70;
  let healthSatisfaction = Math.min(100, Math.max(10, 100 - personalRisk));

  let goalAlignmentScore = Math.round(
    (finSatisfaction * (weights.financialGrowth / 100)) +
    (secSatisfaction * (weights.jobSecurity / 100)) +
    (wlbSatisfaction * (weights.workLifeBalance / 100)) +
    (persGrowthSatisfaction * (weights.personalGrowth / 100)) +
    (famSatisfaction * (weights.familyStability / 100)) +
    (locSatisfaction * (weights.locationPreference / 100)) +
    (healthSatisfaction * (weights.healthWellBeing / 100))
  );

  // 8. OVERALL DECISION SCORE (REQ-36)
  // Combines Goal Alignment, Outcome Quality (predicted salary / ROI), and Inverse Risk
  let outcomeQualityScore = Math.min(100, Math.max(20, Math.round((prediction.predictedExpectedSalary / (currentIncome * 1.5)) * 60 + (prediction.successProbability * 40))));
  let inverseRiskScore = 100 - overallRiskScore;

  let decisionScore = Math.round((goalAlignmentScore * 0.45) + (outcomeQualityScore * 0.35) + (inverseRiskScore * 0.20));
  decisionScore = Math.min(100, Math.max(10, decisionScore));

  // 9. CONFIDENCE SCORE (REQ-37)
  // Derived from ML confidence and Monte Carlo variance
  let medianBase = Math.max(1, Math.abs(simulationResult.percentiles.p50MedianCase || 1));
  let varianceRatio = (simulationResult.percentiles.standardDeviation || 0) / medianBase;
  let confidenceScore = Math.min(98, Math.max(60, Math.round((prediction.confidenceScore * 0.7) + ((1 - Math.min(0.5, varianceRatio)) * 30))));

  // 10. CONSTRAINT VIOLATIONS (REQ-16, REQ-17)
  const constraintViolations = [];
  if (constraints.maxBudget && totalCost > constraints.maxBudget) {
    constraintViolations.push({
      constraintName: 'Maximum Budget Exceeded',
      message: `Total initial cost ₹${totalCost.toLocaleString('en-IN')} exceeds your budget limit of ₹${constraints.maxBudget.toLocaleString('en-IN')}`
    });
    decisionScore = Math.max(5, decisionScore - 15); // Penalty
  }
  if (constraints.minAcceptableSalary && (attrs.offeredSalary || prediction.predictedExpectedSalary) < constraints.minAcceptableSalary) {
    constraintViolations.push({
      constraintName: 'Minimum Salary Not Met',
      message: `Projected salary is below minimum target of ₹${constraints.minAcceptableSalary.toLocaleString('en-IN')}`
    });
    decisionScore = Math.max(5, decisionScore - 12);
  }

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
    constraintViolations
  };
}

module.exports = { computeOptionScores };
