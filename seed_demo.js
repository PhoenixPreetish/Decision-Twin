/**
 * Demo Data Seeder for DecisionTwin AI
 * Seeds a full demonstration profile, scenario, options, and simulation results
 */
const bcrypt = require('./server/node_modules/bcryptjs');
const User = require('./server/src/models/User');
const DigitalTwin = require('./server/src/models/DigitalTwin');
const Scenario = require('./server/src/models/Scenario');
const Option = require('./server/src/models/Option');
const GoalConstraint = require('./server/src/models/GoalConstraint');
const Prediction = require('./server/src/models/Prediction');
const SimulationResult = require('./server/src/models/SimulationResult');
const RiskScore = require('./server/src/models/RiskScore');
const Recommendation = require('./server/src/models/Recommendation');

const { getPredictionForOption } = require('./server/src/services/mlClientService');
const { runMonteCarloSimulation } = require('./server/src/services/simulationEngine');
const { computeOptionScores } = require('./server/src/services/scoringEngine');
const { generateXaiReport } = require('./server/src/services/xaiEngine');

async function seedDatabase() {
  console.log('===============================================================');
  console.log('   🌱 DECISIONTWIN AI - DEMO DATABASE SEEDER');
  console.log('===============================================================');

  // 1. Create or get Demo User
  console.log('\n[1/5] Creating Demo User account...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password@123', salt);

  // Check if exists
  let user = await User.findOne({ email: 'demo@decisiontwin.ai' });
  if (!user) {
    user = await User.create({
      fullName: 'Demo Evaluator',
      email: 'demo@decisiontwin.ai',
      passwordHash: passwordHash,
      role: 'evaluator',
      tier: 'premium',
      disclaimerAccepted: true,
      disclaimerAcceptedAt: new Date()
    });
    console.log('   ✅ Created user: demo@decisiontwin.ai');
  } else {
    console.log('   ℹ️ User demo@decisiontwin.ai already exists');
  }

  // 2. Create Digital Twin Profile
  console.log('\n[2/5] Creating Digital Twin Profile...');
  let twin = await DigitalTwin.findOne({ userId: user._id });
  if (!twin) {
    twin = await DigitalTwin.create({
      userId: user._id,
      age: 26,
      currentEducationLevel: 'bachelors',
      yearsOfExperience: 4,
      currentDomain: 'technology',
      currentSalary: 1200000,
      savings: 500000,
      monthlyExpenses: 40000,
      existingDebt: 0,
      riskTolerance: 'moderate',
      careerAspiration: 'Tech Leadership & AI Architecture',
      location: 'Bangalore, India',
      dependentsCount: 0,
      healthStatus: 'good',
      isComplete: true
    });
    console.log('   ✅ Digital Twin Profile established (₹12 LPA baseline, Moderate Risk)');
  } else {
    console.log('   ℹ️ Digital Twin profile already active');
  }

  // 3. Create Sample Scenario: Tier-1 MBA vs Senior SWE vs AI Startup
  console.log('\n[3/5] Setting up Career Decision Scenario...');
  let scenario = await Scenario.findOne({ userId: user._id, title: 'Tier-1 MBA (IIM/ISB) vs Senior SWE Promotion' });
  if (!scenario) {
    scenario = await Scenario.create({
      userId: user._id,
      title: 'Tier-1 MBA (IIM/ISB) vs Senior SWE Promotion',
      description: 'Evaluating an intensive 1-year Executive MBA against staying on the technical engineering leadership track or launching an AI startup.',
      category: 'higher_education',
      status: 'active'
    });
    console.log('   ✅ Created Scenario:', scenario.title);
  } else {
    console.log('   ℹ️ Scenario already exists');
  }

  // Clean old options & simulation for fresh seed
  await Option.deleteMany({ scenarioId: scenario._id });
  await GoalConstraint.deleteMany({ scenarioId: scenario._id });
  await Prediction.deleteMany({ scenarioId: scenario._id });
  await SimulationResult.deleteMany({ scenarioId: scenario._id });
  await RiskScore.deleteMany({ scenarioId: scenario._id });
  await Recommendation.deleteMany({ scenarioId: scenario._id });

  // 4. Create Goal Constraints (BR-3: 100% sum)
  const goalConstraint = await GoalConstraint.create({
    scenarioId: scenario._id,
    weights: {
      financialGrowth: 30,
      jobSecurity: 20,
      workLifeBalance: 15,
      personalGrowth: 15,
      familyStability: 10,
      locationPreference: 5,
      healthWellBeing: 5
    },
    maxBudget: 3500000,
    minAcceptableSalary: 2200000,
    maxAcceptableDebt: 2500000
  });

  // 5. Create 3 Alternatives
  console.log('\n[4/5] Adding 3 Strategic Alternatives...');
  const opt1 = await Option.create({
    scenarioId: scenario._id,
    title: 'Tier-1 1-Year Executive MBA (IIM / ISB)',
    description: 'Full-time intensive general management program with leadership placement pipeline.',
    attributes: {
      tuitionCost: 2800000,
      programDurationMonths: 12,
      offeredSalary: 3400000,
      institutionName: 'IIM / ISB',
      isAccredited: true,
      workLifeBalanceRating: 5
    }
  });

  const opt2 = await Option.create({
    scenarioId: scenario._id,
    title: 'Senior SWE Promotion Track at Current MNC',
    description: 'Decline MBA, retain active income, and push for Senior/Lead Engineer promotion.',
    attributes: {
      tuitionCost: 0,
      offeredSalary: 2400000,
      companyType: 'MNC',
      workLifeBalanceRating: 8
    }
  });

  const opt3 = await Option.create({
    scenarioId: scenario._id,
    title: 'Fintech AI Startup Co-founder',
    description: 'Bootstrap a B2B AI fintech venture with 18 months runway reserves.',
    attributes: {
      initialInvestment: 400000,
      expectedRunwayMonths: 18,
      equityOfferedPercentage: 35,
      workLifeBalanceRating: 4
    }
  });

  const options = [opt1, opt2, opt3];
  console.log('   ✅ 3 Options Created');

  // 6. Run Monte Carlo Simulation, Predictions & Scoring
  console.log('\n[5/5] Computing 10,000 Monte Carlo trials & TOPSIS decision scores...');
  const results = [];
  for (const option of options) {
    const predData = await getPredictionForOption(twin, option, scenario.category);
    const prediction = await Prediction.create({
      scenarioId: scenario._id,
      optionId: option._id,
      ...predData
    });

    const simData = runMonteCarloSimulation(twin, option, scenario.category, 10000);
    const simulation = await SimulationResult.create({
      scenarioId: scenario._id,
      optionId: option._id,
      ...simData
    });

    const scores = computeOptionScores(twin, option, goalConstraint, simData, predData, scenario.category);
    results.push({ option, prediction, simulation, scores });
  }

  // Rank options
  results.sort((a, b) => b.scores.decisionScore - a.scores.decisionScore);

  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    const riskScore = await RiskScore.create({
      scenarioId: scenario._id,
      optionId: item.option._id,
      ...item.scores,
      rank: i + 1
    });
    item.riskScore = riskScore;
  }

  scenario.recommendedOptionId = results[0].option._id;
  await scenario.save();

  // Generate XAI Recommendation
  const rankedDataForXai = results.map(r => ({
    option: r.option,
    prediction: r.prediction,
    simulation: r.simulation,
    riskScore: r.riskScore
  }));
  const xaiReport = generateXaiReport(scenario, rankedDataForXai, twin);

  await Recommendation.create({
    scenarioId: scenario._id,
    recommendedOptionId: results[0].option._id,
    recommendedOptionTitle: results[0].option.title,
    recommendationSummary: xaiReport.recommendationSummary,
    featureContributions: xaiReport.featureContributions,
    optionBreakdown: xaiReport.optionBreakdown,
    actionPlan: xaiReport.actionPlan,
    generatedAt: new Date()
  });

  console.log('   ✅ Monte Carlo simulations, risk scores, and XAI report generated');
  console.log('\n===============================================================');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('---------------------------------------------------------------');
  console.log('👤 DEMO USER LOGIN CREDENTIALS:');
  console.log('   Email:    demo@decisiontwin.ai');
  console.log('   Password: Password@123');
  console.log('===============================================================');
}

seedDatabase().catch(err => {
  console.error('[Seeder Error]:', err);
});
