const Scenario = require('../models/Scenario');
const Option = require('../models/Option');
const GoalConstraint = require('../models/GoalConstraint');
const DigitalTwin = require('../models/DigitalTwin');
const Prediction = require('../models/Prediction');
const SimulationResult = require('../models/SimulationResult');
const RiskScore = require('../models/RiskScore');
const Recommendation = require('../models/Recommendation');
const scenarioTemplates = require('../data/scenarioTemplates');
const { getPredictionForOption } = require('../services/mlClientService');
const { runMonteCarloSimulation } = require('../services/simulationEngine');
const { computeOptionScores } = require('../services/scoringEngine');

// @desc Get all scenarios for logged in user (REQ-12)
// @route GET /api/scenarios
exports.getScenarios = async (req, res, next) => {
  try {
    const scenarios = await Scenario.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: scenarios.length, scenarios });
  } catch (err) {
    next(err);
  }
};

// @desc Get single scenario with its options and goals
// @route GET /api/scenarios/:id
exports.getScenarioById = async (req, res, next) => {
  try {
    const scenario = await Scenario.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }

    const options = await Option.find({ scenarioId: scenario._id, isWhatIfClone: false });
    const goalConstraint = await GoalConstraint.findOne({ scenarioId: scenario._id });

    // Fetch existing simulations & scores if available
    let predictions = await Prediction.find({ scenarioId: scenario._id });
    let simulations = await SimulationResult.find({ scenarioId: scenario._id });
    let riskScores = await RiskScore.find({ scenarioId: scenario._id }).sort({ rank: 1 });

    // Auto-heal: If options exist but simulations/scores are missing or incomplete, compute immediately
    if (options && options.length >= 2 && (riskScores.length < options.length || simulations.length < options.length)) {
      try {
        const digitalTwin = await DigitalTwin.findOne({ userId: req.user.id });
        if (digitalTwin) {
          const currentGoalConstraint = goalConstraint || await GoalConstraint.create({
            scenarioId: scenario._id,
            weights: { financialGrowth: 25, jobSecurity: 20, workLifeBalance: 20, personalGrowth: 15, familyStability: 10, locationPreference: 5, healthWellBeing: 5 }
          });

          await Prediction.deleteMany({ scenarioId: scenario._id });
          await SimulationResult.deleteMany({ scenarioId: scenario._id });
          await RiskScore.deleteMany({ scenarioId: scenario._id });

          const results = [];
          for (const option of options) {
            const predData = await getPredictionForOption(digitalTwin, option, scenario.category);
            const prediction = await Prediction.create({
              scenarioId: scenario._id,
              optionId: option._id,
              ...predData
            });

            const simData = runMonteCarloSimulation(digitalTwin, option, scenario.category, 10000);
            const simulation = await SimulationResult.create({
              scenarioId: scenario._id,
              optionId: option._id,
              ...simData
            });

            const scores = computeOptionScores(digitalTwin, option, currentGoalConstraint, simData, predData, scenario.category);
            results.push({ option, prediction, simulation, scores });
          }

          results.sort((a, b) => b.scores.decisionScore - a.scores.decisionScore);

          const savedScores = [];
          for (let i = 0; i < results.length; i++) {
            const item = results[i];
            const rank = i + 1;
            const rScore = await RiskScore.create({
              scenarioId: scenario._id,
              optionId: item.option._id,
              ...item.scores,
              rank
            });
            savedScores.push(rScore);
          }

          scenario.recommendedOptionId = results[0].option._id;
          await scenario.save();

          predictions = results.map(r => r.prediction);
          simulations = results.map(r => r.simulation);
          riskScores = savedScores;
        }
      } catch (autoErr) {
        console.warn('Auto simulation computation warning:', autoErr.message);
      }
    }

    res.status(200).json({
      success: true,
      scenario,
      options,
      goalConstraint,
      predictions,
      simulations,
      riskScores
    });
  } catch (err) {
    next(err);
  }
};

// @desc Create new decision scenario (REQ-7, REQ-8, BR-1, BR-5)
// @route POST /api/scenarios
exports.createScenario = async (req, res, next) => {
  try {
    // 1. Check BR-1: Digital Twin must be complete
    const twin = await DigitalTwin.findOne({ userId: req.user.id });
    if (!twin || !twin.isComplete) {
      return res.status(400).json({
        success: false,
        message: 'Business Rule BR-1: You must complete your Digital Twin profile before creating a decision scenario.'
      });
    }

    // 2. Check BR-5: Maximum 5 active scenarios for free-tier
    const activeCount = await Scenario.countDocuments({ userId: req.user.id, status: 'active' });
    if (activeCount >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Business Rule BR-5: Maximum 5 active decision scenarios allowed. Please archive or delete an existing scenario.'
      });
    }

    const { title, category, description, options, goalWeights, constraints } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }

    // Validate options count (REQ-9: 2 to 6 options)
    if (options && (options.length < 2 || options.length > 6)) {
      return res.status(400).json({
        success: false,
        message: 'Business Rule BR-2 / REQ-9: A decision scenario must contain between 2 and 6 options.'
      });
    }

    // Validate goal weights sum (REQ-15, BR-3: sum to 100%)
    if (goalWeights) {
      const sum = Object.values(goalWeights).reduce((a, b) => Number(a) + Number(b), 0);
      if (Math.round(sum) !== 100) {
        return res.status(400).json({
          success: false,
          message: `Business Rule BR-3: Goal weights must sum to exactly 100%. Current sum: ${sum}%`
        });
      }
    }

    const scenario = await Scenario.create({
      userId: req.user.id,
      title,
      category,
      description: description || ''
    });

    // Create Options
    const createdOptions = [];
    if (options && options.length > 0) {
      for (const opt of options) {
        const created = await Option.create({
          scenarioId: scenario._id,
          title: opt.title,
          description: opt.description || '',
          attributes: opt.attributes || {}
        });
        createdOptions.push(created);
      }
    }

    // Create Goal & Constraints
    const createdGoals = await GoalConstraint.create({
      scenarioId: scenario._id,
      weights: goalWeights || {
        financialGrowth: 25,
        jobSecurity: 20,
        workLifeBalance: 20,
        personalGrowth: 15,
        familyStability: 10,
        locationPreference: 5,
        healthWellBeing: 5
      },
      constraints: constraints || {}
    });

    res.status(201).json({
      success: true,
      message: 'Decision Scenario created successfully',
      scenario,
      options: createdOptions,
      goalConstraint: createdGoals
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update an existing scenario (REQ-11)
// @route PUT /api/scenarios/:id
exports.updateScenario = async (req, res, next) => {
  try {
    const scenario = await Scenario.findOne({ _id: req.params.id, userId: req.user.id });
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }

    const { title, description, status, options, goalWeights, constraints } = req.body;

    if (title) scenario.title = title;
    if (description !== undefined) scenario.description = description;
    if (status) scenario.status = status;
    await scenario.save();

    // Update goal weights if passed (BR-3 validation)
    if (goalWeights) {
      const sum = Object.values(goalWeights).reduce((a, b) => Number(a) + Number(b), 0);
      if (Math.round(sum) !== 100) {
        return res.status(400).json({
          success: false,
          message: `Business Rule BR-3: Goal weights must sum to exactly 100%. Current sum: ${sum}%`
        });
      }
      await GoalConstraint.findOneAndUpdate(
        { scenarioId: scenario._id },
        { $set: { weights: goalWeights, constraints: constraints || {} } },
        { upsert: true }
      );
    }

    // Update or replace options if provided
    if (options && Array.isArray(options)) {
      if (options.length < 2 || options.length > 6) {
        return res.status(400).json({
          success: false,
          message: 'Scenario must contain between 2 and 6 options'
        });
      }
      // Remove old non-cloned options
      await Option.deleteMany({ scenarioId: scenario._id, isWhatIfClone: false });
      for (const opt of options) {
        await Option.create({
          scenarioId: scenario._id,
          title: opt.title,
          description: opt.description || '',
          attributes: opt.attributes || {}
        });
      }
    }

    res.status(200).json({ success: true, message: 'Scenario updated successfully', scenario });
  } catch (err) {
    next(err);
  }
};

// @desc Delete scenario (REQ-13)
// @route DELETE /api/scenarios/:id
exports.deleteScenario = async (req, res, next) => {
  try {
    const scenario = await Scenario.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }

    // Cleanup child records
    await Option.deleteMany({ scenarioId: req.params.id });
    await GoalConstraint.deleteMany({ scenarioId: req.params.id });
    await Prediction.deleteMany({ scenarioId: req.params.id });
    await SimulationResult.deleteMany({ scenarioId: req.params.id });
    await RiskScore.deleteMany({ scenarioId: req.params.id });
    await Recommendation.deleteMany({ scenarioId: req.params.id });

    res.status(200).json({ success: true, message: 'Scenario deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc Get pre-built 1-click scenario templates
// @route GET /api/scenarios/templates
exports.getScenarioTemplates = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      count: scenarioTemplates.length,
      templates: scenarioTemplates
    });
  } catch (err) {
    next(err);
  }
};

// @desc Parse natural-language dilemma description into a structured Scenario & Options draft
// @route POST /api/scenarios/parse-nl
exports.parseScenarioFromText = async (req, res, next) => {
  try {
    const { promptText } = req.body;
    const { parseNaturalLanguageScenario } = require('../services/nexusIntelligenceService');
    const twin = (await DigitalTwin.findOne({ userId: req.user.id })) || {};
    const draft = parseNaturalLanguageScenario(promptText || '', twin);
    res.status(200).json({
      success: true,
      draft,
      parsedScenario: draft
    });
  } catch (err) {
    next(err);
  }
};


