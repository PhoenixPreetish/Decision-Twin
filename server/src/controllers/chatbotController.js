const DigitalTwin = require('../models/DigitalTwin');
const Scenario = require('../models/Scenario');
const Option = require('../models/Option');
const Prediction = require('../models/Prediction');
const SimulationResult = require('../models/SimulationResult');
const RiskScore = require('../models/RiskScore');
const { processChatQuery } = require('../services/chatbotEngine');

/**
 * @desc Process conversational query through TwinBot Local AI Engine
 * @route POST /api/chatbot/chat
 */
exports.chatWithTwinBot = async (req, res, next) => {
  try {
    const { message, pageContext = {} } = req.body;
    const userId = req.user?.id;

    // 1. Fetch user's Digital Twin
    const digitalTwin = userId ? await DigitalTwin.findOne({ userId }) : null;

    // 2. Resolve scenario: from explicit ID or fall back to user's most recent active scenario
    let scenarioData = null;
    let targetScenario = null;
    const scenarioId = pageContext.scenarioId;

    if (scenarioId) {
      targetScenario = await Scenario.findOne({ _id: scenarioId, userId });
      if (!targetScenario) {
        targetScenario = await Scenario.findById(scenarioId);
      }
    }
    if (!targetScenario && userId) {
      // Auto-fallback: use user's most recently updated scenario so inquiries about options always work!
      targetScenario = await Scenario.findOne({ userId }).sort({ updatedAt: -1 });
    }
    if (!targetScenario) {
      targetScenario = await Scenario.findOne({}).sort({ updatedAt: -1 });
    }

    if (targetScenario) {
      const options = await Option.find({ scenarioId: targetScenario._id, isWhatIfClone: false });
      const predictions = await Prediction.find({ scenarioId: targetScenario._id });
      const simulations = await SimulationResult.find({ scenarioId: targetScenario._id });
      const riskScores = await RiskScore.find({ scenarioId: targetScenario._id });

      scenarioData = {
        scenario: targetScenario,
        options,
        predictions,
        simulations,
        riskScores
      };
    }

    // 3. Process with offline intelligence engine
    const result = processChatQuery({
      message,
      pageContext,
      digitalTwin,
      scenarioData
    });

    res.status(200).json({
      success: true,
      reply: result.reply,
      suggestedPrompts: result.suggestedPrompts || []
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc Get dynamic suggestion prompt chips based on active route
 * @route GET /api/chatbot/prompts
 */
exports.getDynamicPrompts = async (req, res, next) => {
  try {
    const { route = '/', scenarioId } = req.query;

    if (scenarioId) {
      return res.status(200).json({
        success: true,
        prompts: [
          'Why is Option 1 chosen?',
          'What are my biggest vulnerabilities?',
          'How should I negotiate compensation?',
          'What is my break-even payback timeline?'
        ]
      });
    }

    if (route.includes('/profile')) {
      return res.status(200).json({
        success: true,
        prompts: [
          'Calculate my financial runway',
          'How much emergency buffer do I need?',
          'Explain conservative vs aggressive risk',
          'How does my digital twin affect simulations?'
        ]
      });
    }

    if (route.includes('/scenarios/new')) {
      return res.status(200).json({
        success: true,
        prompts: [
          'Brainstorm options for Tier-1 MBA',
          'Brainstorm AI Startup vs Lead SWE',
          'How should I distribute my 100% goal weights?',
          'What are hard constraints?'
        ]
      });
    }

    if (route.includes('/market')) {
      return res.status(200).json({
        success: true,
        prompts: [
          'What are current tech salary benchmarks?',
          'Explain hiring velocity trends',
          'How does inflation impact career ROI?'
        ]
      });
    }

    // Default dashboard prompts
    res.status(200).json({
      success: true,
      prompts: [
        'Brainstorm a new decision scenario',
        'Check my financial runway',
        'How does DecisionTwin AI work?',
        'What are current market trends?'
      ]
    });
  } catch (err) {
    next(err);
  }
};
