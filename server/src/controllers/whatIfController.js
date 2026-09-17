const Scenario = require('../models/Scenario');
const Option = require('../models/Option');
const GoalConstraint = require('../models/GoalConstraint');
const DigitalTwin = require('../models/DigitalTwin');
const { getPredictionForOption } = require('../services/mlClientService');
const { runMonteCarloSimulation } = require('../services/simulationEngine');
const { computeOptionScores } = require('../services/scoringEngine');

// @desc Recalculate What-If scenario in real-time (REQ-40, REQ-41, REQ-42)
// @route POST /api/what-if/simulate
exports.simulateWhatIf = async (req, res, next) => {
  try {
    const { optionId, scenarioId, modifiedAttributes, modifiedWeights } = req.body;

    const scenario = await Scenario.findOne({ _id: scenarioId, userId: req.user.id });
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }

    const digitalTwin = await DigitalTwin.findOne({ userId: req.user.id });
    const originalOption = await Option.findById(optionId);
    if (!originalOption) {
      return res.status(404).json({ success: false, message: 'Original option not found' });
    }

    let goalConstraint = await GoalConstraint.findOne({ scenarioId });
    let activeWeights = modifiedWeights || goalConstraint?.weights;

    // Create ephemeral What-If virtual option
    const virtualOption = {
      _id: originalOption._id,
      title: `${originalOption.title} (What-If Simulation)`,
      attributes: {
        ...(originalOption.attributes?.toObject ? originalOption.attributes.toObject() : (originalOption.attributes || {})),
        ...modifiedAttributes
      }
    };

    // Run rapid simulation & scoring (bounded < 3s, REQ-41)
    const prediction = await getPredictionForOption(digitalTwin, virtualOption, scenario.category);
    const simulation = runMonteCarloSimulation(digitalTwin, virtualOption, scenario.category, 5000);
    const riskScore = computeOptionScores(
      digitalTwin,
      virtualOption,
      { weights: activeWeights, constraints: goalConstraint?.constraints },
      simulation,
      prediction,
      scenario.category
    );

    res.status(200).json({
      success: true,
      originalOptionId: originalOption._id,
      whatIfOption: virtualOption,
      prediction,
      simulation,
      riskScore
    });
  } catch (err) {
    next(err);
  }
};

// @desc Save What-If adjustments into the saved option (REQ-43)
// @route POST /api/what-if/apply
exports.applyWhatIfChanges = async (req, res, next) => {
  try {
    const { optionId, modifiedAttributes } = req.body;

    const option = await Option.findById(optionId);
    if (!option) {
      return res.status(404).json({ success: false, message: 'Option not found' });
    }

    option.attributes = {
      ...(option.attributes?.toObject ? option.attributes.toObject() : (option.attributes || {})),
      ...modifiedAttributes
    };
    await option.save();

    res.status(200).json({
      success: true,
      message: 'What-If changes successfully saved to the active option',
      option
    });
  } catch (err) {
    next(err);
  }
};
