const Scenario = require('../models/Scenario');
const Option = require('../models/Option');
const GoalConstraint = require('../models/GoalConstraint');
const DigitalTwin = require('../models/DigitalTwin');
const Prediction = require('../models/Prediction');
const SimulationResult = require('../models/SimulationResult');
const RiskScore = require('../models/RiskScore');
const Recommendation = require('../models/Recommendation');

const { getPredictionForOption } = require('../services/mlClientService');
const { runMonteCarloSimulation } = require('../services/simulationEngine');
const { computeOptionScores } = require('../services/scoringEngine');
const { generateXaiReport } = require('../services/xaiEngine');

// @desc Run ML prediction, 10,000 Monte Carlo simulations, risk evaluation and scoring (REQ-19 to REQ-39)
// @route POST /api/simulations/run/:scenarioId
exports.runScenarioSimulation = async (req, res, next) => {
  try {
    const scenario = await Scenario.findOne({ _id: req.params.scenarioId, userId: req.user.id });
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }

    const digitalTwin = await DigitalTwin.findOne({ userId: req.user.id });
    if (!digitalTwin || !digitalTwin.isComplete) {
      return res.status(400).json({ success: false, message: 'Digital Twin profile must be completed first.' });
    }

    const options = await Option.find({ scenarioId: scenario._id, isWhatIfClone: false });
    // BR-2: At least 2 options required
    if (!options || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Business Rule BR-2: A decision scenario must contain at least two options before simulations or scoring can be run.'
      });
    }

    let goalConstraint = await GoalConstraint.findOne({ scenarioId: scenario._id });
    if (!goalConstraint) {
      goalConstraint = await GoalConstraint.create({
        scenarioId: scenario._id,
        weights: {
          financialGrowth: 25,
          jobSecurity: 20,
          workLifeBalance: 20,
          personalGrowth: 15,
          familyStability: 10,
          locationPreference: 5,
          healthWellBeing: 5
        }
      });
    }

    // Clean prior runs for fresh generation
    await Prediction.deleteMany({ scenarioId: scenario._id });
    await SimulationResult.deleteMany({ scenarioId: scenario._id });
    await RiskScore.deleteMany({ scenarioId: scenario._id });

    const results = [];

    // Run ML predictions & 10,000 Monte Carlo trials for each option
    for (const option of options) {
      // 1. ML Prediction (REQ-19 to REQ-23)
      const predData = await getPredictionForOption(digitalTwin, option, scenario.category);
      const prediction = await Prediction.create({
        scenarioId: scenario._id,
        optionId: option._id,
        ...predData
      });

      // 2. Monte Carlo 10,000-trial simulation (REQ-24 to REQ-28)
      const simData = runMonteCarloSimulation(digitalTwin, option, scenario.category, 10000);
      const simulation = await SimulationResult.create({
        scenarioId: scenario._id,
        optionId: option._id,
        ...simData
      });

      // 3. Multi-dimensional risk & scoring (REQ-29 to REQ-37)
      const scores = computeOptionScores(digitalTwin, option, goalConstraint, simData, predData, scenario.category);
      
      results.push({
        option,
        prediction,
        simulation,
        scores
      });
    }

    // 4. Rank options by Decision Score descending (REQ-38)
    results.sort((a, b) => b.scores.decisionScore - a.scores.decisionScore);

    const savedRiskScores = [];
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      const rank = i + 1;
      const riskScore = await RiskScore.create({
        scenarioId: scenario._id,
        optionId: item.option._id,
        ...item.scores,
        rank
      });
      savedRiskScores.push(riskScore);
      item.riskScore = riskScore;
    }

    // Mark recommended option on scenario
    const topOption = results[0].option;
    scenario.recommendedOptionId = topOption._id;
    await scenario.save();

    // Generate and persist Recommendation collection document (Point #1)
    const rankedDataForXai = results.map(r => ({
      option: r.option,
      prediction: r.prediction,
      simulation: r.simulation,
      riskScore: r.riskScore
    }));
    const xaiReport = generateXaiReport(scenario, rankedDataForXai, digitalTwin);

    const recommendationDoc = await Recommendation.findOneAndUpdate(
      { scenarioId: scenario._id },
      {
        $set: {
          scenarioId: scenario._id,
          recommendedOptionId: topOption._id,
          recommendedOptionTitle: topOption.title,
          recommendationSummary: xaiReport.recommendationSummary,
          featureContributions: xaiReport.featureContributions,
          optionBreakdown: xaiReport.optionBreakdown,
          actionPlan: xaiReport.actionPlan,
          generatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Simulation and decision scoring completed successfully',
      scenario,
      recommendedOption: topOption,
      recommendation: recommendationDoc,
      results: results.map(r => ({
        option: r.option,
        prediction: r.prediction,
        simulation: r.simulation,
        riskScore: r.riskScore
      }))
    });
  } catch (err) {
    next(err);
  }
};
