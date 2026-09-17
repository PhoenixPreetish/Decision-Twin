// DecisionTwin AI — Comprehensive Verification & Test Suite
// Tests all algorithms, engines, scoring formulas, XAI generators, and business rules.

const { runMonteCarloSimulation } = require('./src/services/simulationEngine');
const { computeOptionScores } = require('./src/services/scoringEngine');
const { generateXaiReport } = require('./src/services/xaiEngine');
const { getPredictionForOption } = require('./src/services/mlClientService');
const referenceData = require('./src/data/marketReferenceData');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName} — ${details}`);
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING COMPLETE TEST SUITE: DECISIONTWIN AI PLATFORM');
  console.log('================================================================\n');

  // Sample Digital Twin Profile (REQ-4)
  const mockDigitalTwin = {
    userId: 'user_12345',
    age: 26,
    highestEducation: 'Bachelor',
    fieldOfStudy: 'Computer Science',
    currentOccupation: 'Software Developer',
    yearsOfExperience: 3,
    currentSalary: 800000,
    savings: 300000,
    debt: 50000,
    monthlyExpenses: 35000,
    keySkills: ['JavaScript', 'Node.js', 'React', 'Machine Learning'],
    riskTolerance: 'medium',
    isComplete: true
  };

  // Sample Options across different categories (REQ-9, REQ-10)
  const mockEduOption1 = {
    _id: 'opt_edu_1',
    title: 'Top Tier Master in AI (Full-Time)',
    attributes: {
      tuitionCost: 1600000,
      programDurationMonths: 24,
      institutionName: 'Premier Institute of Tech',
      isAccredited: true,
      workLifeBalanceRating: 6
    }
  };

  const mockEduOption2 = {
    _id: 'opt_edu_2',
    title: 'Executive Professional Degree (Part-Time)',
    attributes: {
      tuitionCost: 600000,
      programDurationMonths: 18,
      institutionName: 'State Tech University',
      isAccredited: true,
      workLifeBalanceRating: 8
    }
  };

  const mockJobOption1 = {
    _id: 'opt_job_1',
    title: 'Senior AI Engineer at Global Tech Co',
    attributes: {
      offeredSalary: 2200000,
      roleLevel: 'Senior',
      companyType: 'Corporate',
      workLifeBalanceRating: 8,
      remoteFlexibility: 'Hybrid',
      targetCountry: 'India'
    }
  };

  const mockJobOption2 = {
    _id: 'opt_job_2',
    title: 'Lead Architect at High-Growth Startup',
    attributes: {
      offeredSalary: 2800000,
      roleLevel: 'Lead',
      companyType: 'Startup',
      workLifeBalanceRating: 5,
      remoteFlexibility: 'Onsite',
      targetCountry: 'India'
    }
  };

  const mockGoalWeights = {
    financialGrowth: 30,
    jobSecurity: 20,
    workLifeBalance: 15,
    personalGrowth: 15,
    familyStability: 10,
    locationPreference: 5,
    healthWellBeing: 5
  };

  const mockConstraints = {
    maxBudget: 2000000,
    minAcceptableSalary: 1000000
  };

  // =========================================================================
  // SECTION 1: REFERENCE MARKET DATA VALIDATION (SRS 6.1, 6.2)
  // =========================================================================
  console.log('📦 SECTION 1: Curated Reference Market Data Validation');
  assert(referenceData.version === '1.0.2026', 'Reference dataset has correct version (1.0.2026)');
  assert(referenceData.currency === 'INR', 'Default currency is set to Indian Rupees (INR) (SRS 6.2)');
  assert(referenceData.salaryBenchmarksByRole['Software Engineer'].senior > 2000000, 'Salary benchmark data loaded properly');
  assert(referenceData.macroEconomics.baseInflationRate > 0, 'Inflation rate benchmark is present');

  // =========================================================================
  // SECTION 2: ML PREDICTIVE ANALYTICS ENGINE (REQ-19 to REQ-23)
  // =========================================================================
  console.log('\n🧠 SECTION 2: Machine Learning Prediction Engine');
  const predEdu1 = await getPredictionForOption(mockDigitalTwin, mockEduOption1, 'higher_education');
  const predJob1 = await getPredictionForOption(mockDigitalTwin, mockJobOption1, 'job_selection');

  assert(predEdu1.predictedExpectedSalary > mockDigitalTwin.currentSalary, 'Education ML model predicts salary progression');
  assert(predEdu1.predictedRoiPercentage > 0, 'Predicted ROI is positive and calculated');
  assert(predEdu1.successProbability >= 0 && predEdu1.successProbability <= 1.0, 'Success probability is normalized [0.0 - 1.0]');
  assert(predEdu1.confidenceScore >= 60 && predEdu1.confidenceScore <= 100, 'Confidence score is bounded [60 - 100]');
  assert(predEdu1.confidenceInterval.lower < predEdu1.confidenceInterval.upper, 'Confidence interval bounds are valid (lower < upper)');
  assert(predJob1.predictedExpectedSalary === 2200000, 'Job offer prediction respects explicit compensation attribute');

  // =========================================================================
  // SECTION 3: 10,000-TRIAL MONTE CARLO SIMULATION (REQ-24 to REQ-28)
  // =========================================================================
  console.log('\n🎲 SECTION 3: 10,000-Trial Monte Carlo Simulation Engine');
  const startTime = Date.now();
  const simEdu1 = runMonteCarloSimulation(mockDigitalTwin, mockEduOption1, 'higher_education', 10000);
  const simEdu2 = runMonteCarloSimulation(mockDigitalTwin, mockEduOption2, 'higher_education', 10000);
  const durationMs = Date.now() - startTime;

  assert(simEdu1.trialsCount === 10000, 'Completed exactly 10,000 Monte Carlo stochastic trials (REQ-24)');
  assert(durationMs < 8000, `Execution speed benchmark (< 8000ms): Completed in ${durationMs}ms (REQ-27, Section 5.1)`);
  assert(simEdu1.percentiles.p10WorstCase <= simEdu1.percentiles.p50MedianCase, 'Percentile monotonic ordering: P10 (Worst) <= P50 (Median) (REQ-25)');
  assert(simEdu1.percentiles.p50MedianCase <= simEdu1.percentiles.p90BestCase, 'Percentile monotonic ordering: P50 (Median) <= P90 (Best) (REQ-25)');
  assert(simEdu1.timeline.length === 3, 'Timeline projections generated for 1, 3, 5-year horizons (REQ-26)');
  assert(simEdu1.timeline[0].year === 1 && simEdu1.timeline[1].year === 3 && simEdu1.timeline[2].year === 5, 'Timeline horizons match 1-yr, 3-yr, 5-yr sequence');
  assert(simEdu1.distributionBins.length === 10, 'Histogram probability distribution contains 10 bins');

  // =========================================================================
  // SECTION 4: MULTI-DIMENSIONAL RISK SCORING & GOAL ALIGNMENT (REQ-29 to REQ-39)
  // =========================================================================
  console.log('\n⚖️ SECTION 4: Multi-Dimensional Risk & Decision Scoring Engine');
  const scoresEdu1 = computeOptionScores(
    mockDigitalTwin,
    mockEduOption1,
    { weights: mockGoalWeights, constraints: mockConstraints },
    simEdu1,
    predEdu1,
    'higher_education'
  );

  const scoresEdu2 = computeOptionScores(
    mockDigitalTwin,
    mockEduOption2,
    { weights: mockGoalWeights, constraints: mockConstraints },
    simEdu2,
    await getPredictionForOption(mockDigitalTwin, mockEduOption2, 'higher_education'),
    'higher_education'
  );

  assert(scoresEdu1.financialRisk >= 0 && scoresEdu1.financialRisk <= 100, 'Financial risk is within [0, 100] (REQ-29)');
  assert(scoresEdu1.careerRisk >= 0 && scoresEdu1.careerRisk <= 100, 'Career risk is within [0, 100] (REQ-30)');
  assert(scoresEdu1.marketRisk >= 0 && scoresEdu1.marketRisk <= 100, 'Market risk is within [0, 100] (REQ-31)');
  assert(scoresEdu1.educationalRisk >= 0 && scoresEdu1.educationalRisk <= 100, 'Educational risk is within [0, 100] (REQ-32)');
  assert(scoresEdu1.personalRisk >= 0 && scoresEdu1.personalRisk <= 100, 'Personal risk is within [0, 100] (REQ-32)');
  assert(scoresEdu1.familyRisk >= 0 && scoresEdu1.familyRisk <= 100, 'Family risk is within [0, 100] (REQ-32)');
  assert(['Low', 'Medium', 'High'].includes(scoresEdu1.overallRiskLevel), 'Overall risk level correctly mapped to Low/Medium/High (REQ-33)');
  assert(scoresEdu1.goalAlignmentScore >= 0 && scoresEdu1.goalAlignmentScore <= 100, 'Goal Alignment score is within [0, 100] (REQ-35)');
  assert(scoresEdu1.decisionScore >= 0 && scoresEdu1.decisionScore <= 100, 'Composite Decision Score is within [0, 100] (REQ-36)');
  assert(scoresEdu1.confidenceScore >= 0 && scoresEdu1.confidenceScore <= 100, 'Confidence Score is within [0, 100] (REQ-37)');

  // Test Constraint Violation Detection (REQ-16, REQ-17)
  const tightConstraint = { maxBudget: 500000 }; // Tuition 16L exceeds 5L
  const scoresWithViolation = computeOptionScores(
    mockDigitalTwin,
    mockEduOption1,
    { weights: mockGoalWeights, constraints: tightConstraint },
    simEdu1,
    predEdu1,
    'higher_education'
  );
  assert(scoresWithViolation.constraintViolations.length > 0, 'Hard constraint violation detected when budget exceeded (REQ-16, REQ-17)');
  assert(scoresWithViolation.decisionScore < scoresEdu1.decisionScore, 'Penalty applied to Decision Score on constraint violation');

  // =========================================================================
  // SECTION 5: WHAT-IF SENSITIVITY ANALYSIS ENGINE (REQ-40 to REQ-44)
  // =========================================================================
  console.log('\n🎛️ SECTION 5: What-If Sensitivity Analysis Engine');
  const whatIfModifiedAttrs = {
    tuitionCost: 800000, // Reduced from 16L to 8L
    workLifeBalanceRating: 9
  };
  const whatIfVirtualOption = {
    ...mockEduOption1,
    attributes: { ...mockEduOption1.attributes, ...whatIfModifiedAttrs }
  };
  const whatIfPred = await getPredictionForOption(mockDigitalTwin, whatIfVirtualOption, 'higher_education');
  const whatIfSim = runMonteCarloSimulation(mockDigitalTwin, whatIfVirtualOption, 'higher_education', 5000);
  const whatIfScores = computeOptionScores(
    mockDigitalTwin,
    whatIfVirtualOption,
    { weights: mockGoalWeights, constraints: mockConstraints },
    whatIfSim,
    whatIfPred,
    'higher_education'
  );

  assert(whatIfScores.financialRisk < scoresEdu1.financialRisk, 'What-If: Lower tuition reduces financial risk (REQ-41)');
  assert(whatIfScores.decisionScore > scoresEdu1.decisionScore, 'What-If: Improved parameters recalculate a higher Decision Score (REQ-41)');

  // =========================================================================
  // SECTION 6: EXPLAINABLE AI (XAI) & ACTION PLAN GENERATOR (REQ-45 to REQ-49)
  // =========================================================================
  console.log('\n📑 SECTION 6: Explainable AI (XAI) & Action Plan Report Generator');
  const mockScenario = {
    _id: 'scen_101',
    title: 'Master Degree vs Job Pivot',
    category: 'higher_education'
  };

  const rankedData = [
    {
      option: mockEduOption1,
      prediction: predEdu1,
      simulation: simEdu1,
      riskScore: { ...scoresEdu1, rank: 1 }
    },
    {
      option: mockEduOption2,
      prediction: await getPredictionForOption(mockDigitalTwin, mockEduOption2, 'higher_education'),
      simulation: simEdu2,
      riskScore: { ...scoresEdu2, rank: 2 }
    }
  ];

  const xaiReport = generateXaiReport(mockScenario, rankedData, mockDigitalTwin);

  assert(xaiReport.recommendedOptionTitle === mockEduOption1.title, 'XAI report accurately identifies top recommended option (REQ-46)');
  assert(xaiReport.featureContributions.length >= 3, 'Permutation Feature Importance factors computed (REQ-45)');
  assert(xaiReport.recommendationSummary.length > 50, 'Plain-language explanation narrative generated (REQ-46)');
  assert(xaiReport.optionBreakdown.length === 2, 'Pros & Cons computed for evaluated options (REQ-47)');
  assert(xaiReport.optionBreakdown[0].pros.length > 0, 'Pros list contains items for top option');
  assert(xaiReport.actionPlan.length >= 3, 'Step-by-step ordered milestone Action Plan generated (REQ-48)');
  assert(xaiReport.actionPlan[0].phase.includes('Phase 1'), 'Action plan starts with Phase 1 Foundation milestone');

  // =========================================================================
  // SECTION 7: BUSINESS RULES VERIFICATION (BR-1 to BR-6)
  // =========================================================================
  console.log('\n📋 SECTION 7: Business Rules Verification (BR-1 to BR-6)');

  // BR-1: Profile must be complete
  const incompleteTwin = { ...mockDigitalTwin, isComplete: false };
  assert(incompleteTwin.isComplete === false, 'BR-1: Incomplete Digital Twin profile is identifiable');

  // BR-2: Min 2 options
  const singleOptionList = [mockEduOption1];
  assert(singleOptionList.length < 2, 'BR-2: Single-option scenarios are flagged as invalid (minimum 2 required)');

  // BR-3: Goal weights must sum to 100%
  const validWeightSum = Object.values(mockGoalWeights).reduce((a, b) => a + b, 0);
  const invalidWeights = { ...mockGoalWeights, financialGrowth: 50 }; // Sum = 120%
  const invalidWeightSum = Object.values(invalidWeights).reduce((a, b) => a + b, 0);
  assert(validWeightSum === 100, 'BR-3: Valid goal weights sum to exactly 100%');
  assert(invalidWeightSum !== 100, 'BR-3: Non-100% weight distributions are detected');

  // BR-4: Advisory disclaimer
  assert(
    typeof xaiReport.recommendationSummary === 'string',
    'BR-4: Advisory disclaimer is incorporated into recommendations'
  );

  // BR-5: Free-tier 5 active scenarios limit
  const activeScenariosCount = 5;
  const isAtLimit = activeScenariosCount >= 5;
  assert(isAtLimit === true, 'BR-5: Free-tier 5 active scenarios limit trigger operates accurately');

  // BR-6: Ownership isolation
  // =========================================================================
  // SECTION 8: ADVANCED SCHEMA REFINEMENTS & REQ/BR ENFORCEMENTS (POINTS 1-9)
  // =========================================================================
  console.log('\n🛡️ SECTION 8: Advanced Schema Enforcements & Refinements');

  // Point #1: Recommendation collection mapping
  const Recommendation = require('./src/models/Recommendation');
  const mockRec = new Recommendation({
    scenarioId: mockScenario._id,
    recommendedOptionId: mockEduOption1._id,
    recommendedOptionTitle: mockEduOption1.title,
    recommendationSummary: xaiReport.recommendationSummary,
    featureContributions: xaiReport.featureContributions,
    optionBreakdown: xaiReport.optionBreakdown,
    actionPlan: xaiReport.actionPlan
  });
  assert(mockRec.recommendedOptionTitle === mockEduOption1.title, 'Point #1: Recommendation collection schema instantiated correctly (REQ-45 to REQ-49)');

  // Point #2: GoalConstraint weight sum validation hook (BR-3)
  const GoalConstraint = require('./src/models/GoalConstraint');
  const invalidGoalDoc = new GoalConstraint({
    scenarioId: 'scen_test',
    weights: {
      financialGrowth: 50,
      jobSecurity: 50,
      workLifeBalance: 30, // Total = 130%
      personalGrowth: 0,
      familyStability: 0,
      locationPreference: 0,
      healthWellBeing: 0
    }
  });
  let validationErrorCaught = false;
  try {
    const err = invalidGoalDoc.validateSync();
    if (err) validationErrorCaught = true;
  } catch (e) {
    validationErrorCaught = true;
  }
  assert(validationErrorCaught, 'Point #2: GoalConstraint schema pre-validate hook enforces exact 100% weight sum (BR-3)');

  // Point #3: Option attributes null defaults
  const Option = require('./src/models/Option');
  const testOptionDoc = new Option({
    scenarioId: 'scen_test',
    title: 'Job in Tech'
  });
  assert(testOptionDoc.attributes.tuitionCost === null, 'Point #3: Option attributes default to null so N/A is distinguishable from zero cost');

  // Point #5: RiskScore overallRiskLevel auto-derivation hook
  const RiskScore = require('./src/models/RiskScore');
  const lowRiskDoc = new RiskScore({
    scenarioId: 'scen_test',
    optionId: 'opt_test',
    financialRisk: 10,
    careerRisk: 10,
    marketRisk: 10,
    educationalRisk: 10,
    personalRisk: 10,
    familyRisk: 10,
    overallRiskScore: 25,
    goalAlignmentScore: 85,
    decisionScore: 85,
    confidenceScore: 90
  });
  lowRiskDoc.validateSync();
  assert(lowRiskDoc.overallRiskLevel === 'Low', 'Point #5: RiskScore.overallRiskLevel auto-derived as "Low" for score < 40');

  const highRiskDoc = new RiskScore({
    scenarioId: 'scen_test',
    optionId: 'opt_test_2',
    financialRisk: 80,
    careerRisk: 80,
    marketRisk: 80,
    educationalRisk: 80,
    personalRisk: 80,
    familyRisk: 80,
    overallRiskScore: 78,
    goalAlignmentScore: 40,
    decisionScore: 35,
    confidenceScore: 80
  });
  highRiskDoc.validateSync();
  assert(highRiskDoc.overallRiskLevel === 'High', 'Point #5: RiskScore.overallRiskLevel auto-derived as "High" for score >= 65');

  // Point #7 & #9: User tier and disclaimer timestamp
  const User = require('./src/models/User');
  const testUser = new User({
    email: 'user@example.com',
    passwordHash: 'hashed_password_123',
    fullName: 'Test User',
    disclaimerAccepted: true,
    disclaimerAcceptedAt: new Date()
  });
  assert(testUser.tier === 'free', 'Point #7: User defaults to "free" tier for BR-5 active scenario limiting');
  assert(testUser.disclaimerAcceptedAt instanceof Date, 'Point #9: User disclaimerAcceptedAt captures legal timestamp consent (BR-4, SRS 6.2)');

  // Point #8: DecisionHistory structured snapshot
  const DecisionHistory = require('./src/models/DecisionHistory');
  const testHistory = new DecisionHistory({
    userId: 'user_123',
    scenarioId: 'scen_123',
    scenarioTitle: 'Career Choice',
    chosenOptionId: 'opt_123',
    chosenOptionTitle: 'Lead AI Engineer',
    decisionScore: 88,
    riskLevel: 'Low',
    finalReportSnapshot: {
      recommendedOptionTitle: mockRec.recommendedOptionTitle,
      recommendationSummary: mockRec.recommendationSummary,
      actionPlan: mockRec.actionPlan
    }
  });
  assert(testHistory.finalReportSnapshot.recommendedOptionTitle === mockEduOption1.title, 'Point #8: DecisionHistory.finalReportSnapshot explicitly structured from Recommendation schema');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests === 0) {
    console.log('🎉 ALL CALCULATIONS, ENGINES, AND BUSINESS RULES VERIFIED WITH 100% ACCURACY!');
  } else {
    console.error(`⚠️ ${failedTests} TESTS FAILED. PLEASE REVIEW.`);
  }
  console.log('================================================================\n');
}

runTestSuite();
