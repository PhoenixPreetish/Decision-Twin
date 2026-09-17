const Scenario = require('../models/Scenario');
const Option = require('../models/Option');
const DigitalTwin = require('../models/DigitalTwin');
const Prediction = require('../models/Prediction');
const SimulationResult = require('../models/SimulationResult');
const RiskScore = require('../models/RiskScore');
const Recommendation = require('../models/Recommendation');
const DecisionHistory = require('../models/DecisionHistory');
const { generateXaiReport } = require('../services/xaiEngine');

// @desc Generate comprehensive XAI Recommendation & Action Plan Report (REQ-45 to REQ-49)
// @route GET /api/reports/:scenarioId
exports.getScenarioReport = async (req, res, next) => {
  try {
    const scenario = await Scenario.findOne({ _id: req.params.scenarioId, userId: req.user.id });
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }

    // Check if Recommendation is already persisted in DB (Point #1)
    let recommendationDoc = await Recommendation.findOne({ scenarioId: scenario._id });

    const digitalTwin = await DigitalTwin.findOne({ userId: req.user.id });
    const options = await Option.find({ scenarioId: scenario._id, isWhatIfClone: false });
    const predictions = await Prediction.find({ scenarioId: scenario._id });
    const simulations = await SimulationResult.find({ scenarioId: scenario._id });
    const riskScores = await RiskScore.find({ scenarioId: scenario._id }).sort({ rank: 1 });

    if (riskScores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No simulation results available. Please run simulations first.'
      });
    }

    const rankedData = riskScores.map(score => {
      const sOptId = (score.optionId?._id || score.optionId || '').toString();
      const option = options.find(o => (o._id || '').toString() === sOptId);
      const prediction = predictions.find(p => (p.optionId?._id || p.optionId || '').toString() === sOptId);
      const simulation = simulations.find(s => (s.optionId?._id || s.optionId || '').toString() === sOptId);
      return { option, prediction, simulation, riskScore: score };
    }).filter(item => item.option && item.prediction && item.simulation);

    const xaiReport = generateXaiReport(scenario, rankedData, digitalTwin);

    // Ensure Recommendation is persisted/synchronized in DB
    if (!recommendationDoc && rankedData.length > 0) {
      recommendationDoc = await Recommendation.create({
        scenarioId: scenario._id,
        recommendedOptionId: rankedData[0].option._id,
        recommendedOptionTitle: rankedData[0].option.title,
        recommendationSummary: xaiReport.recommendationSummary,
        featureContributions: xaiReport.featureContributions,
        optionBreakdown: xaiReport.optionBreakdown,
        actionPlan: xaiReport.actionPlan,
        generatedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      scenario,
      recommendation: recommendationDoc,
      report: xaiReport,
      rankedOptions: rankedData
    });
  } catch (err) {
    next(err);
  }
};

// @desc Finalize decision and log into Decision History (REQ-50, BR-6)
// @route POST /api/reports/finalize
exports.finalizeDecision = async (req, res, next) => {
  try {
    const { scenarioId, chosenOptionId, userFeedback } = req.body;

    const scenario = await Scenario.findOne({ _id: scenarioId, userId: req.user.id });
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }

    const chosenOption = await Option.findById(chosenOptionId);
    if (!chosenOption) {
      return res.status(404).json({ success: false, message: 'Option not found' });
    }

    const riskScore = await RiskScore.findOne({ scenarioId, optionId: chosenOptionId });
    const recommendationDoc = await Recommendation.findOne({ scenarioId: scenario._id });

    scenario.selectedOptionId = chosenOptionId;
    scenario.status = 'archived'; // Archive upon finalization
    await scenario.save();

    // Snapshot the Recommendation document shape explicitly (Point #8)
    const finalReportSnapshot = recommendationDoc ? {
      recommendedOptionTitle: recommendationDoc.recommendedOptionTitle,
      recommendationSummary: recommendationDoc.recommendationSummary,
      featureContributions: recommendationDoc.featureContributions,
      optionBreakdown: recommendationDoc.optionBreakdown,
      actionPlan: recommendationDoc.actionPlan,
      snapshotAt: new Date()
    } : {};

    const historyRecord = await DecisionHistory.create({
      userId: req.user.id,
      scenarioId: scenario._id,
      scenarioTitle: scenario.title,
      chosenOptionId: chosenOption._id,
      chosenOptionTitle: chosenOption.title,
      decisionScore: riskScore ? riskScore.decisionScore : 75,
      riskLevel: riskScore ? riskScore.overallRiskLevel : 'Medium',
      finalReportSnapshot,
      userFeedback: userFeedback || {}
    });

    res.status(201).json({
      success: true,
      message: 'Decision successfully finalized and archived in your history',
      historyRecord
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get user's decision history (REQ-50, BR-6)
// @route GET /api/reports/history
exports.getDecisionHistory = async (req, res, next) => {
  try {
    const history = await DecisionHistory.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: history.length, history });
  } catch (err) {
    next(err);
  }
};
