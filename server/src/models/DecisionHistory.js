const mongoose = require('mongoose');

const decisionHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true
  },
  scenarioTitle: {
    type: String,
    required: true
  },
  chosenOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Option',
    required: true
  },
  chosenOptionTitle: {
    type: String,
    required: true
  },
  decisionScore: {
    type: Number,
    required: true
  },
  riskLevel: {
    type: String,
    required: true
  },
  // Structured snapshot of the final Recommendation document (Point #8)
  finalReportSnapshot: {
    recommendedOptionTitle: { type: String },
    recommendationSummary: { type: String },
    featureContributions: [{
      feature: { type: String },
      importance: { type: Number },
      direction: { type: String }
    }],
    optionBreakdown: [{
      optionId: { type: mongoose.Schema.Types.ObjectId },
      title: { type: String },
      rank: { type: Number },
      decisionScore: { type: Number },
      riskLevel: { type: String },
      pros: [{ type: String }],
      cons: [{ type: String }]
    }],
    actionPlan: [{
      phase: { type: String },
      task: { type: String },
      isCompleted: { type: Boolean }
    }],
    snapshotAt: { type: Date, default: Date.now }
  },
  userFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String, default: '' },
    outcomeActualSatisfaction: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DecisionHistory', decisionHistorySchema);
