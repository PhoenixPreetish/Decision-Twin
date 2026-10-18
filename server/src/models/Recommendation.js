const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true,
    unique: true,
    index: true
  },
  recommendedOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Option',
    required: true
  },
  recommendedOptionTitle: {
    type: String,
    required: true
  },
  recommendationSummary: {
    type: String,
    required: true
  },
  featureContributions: [{
    feature: { type: String, required: true },
    importance: { type: Number, required: true },
    direction: { type: String, enum: ['positive', 'negative'], default: 'positive' }
  }],
  optionBreakdown: [{
    optionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Option' },
    title: { type: String, required: true },
    rank: { type: Number, required: true },
    decisionScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    pros: [{ type: String }],
    cons: [{ type: String }]
  }],
  actionPlan: [{
    phase: { type: String, required: true },
    task: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const { wrapModel } = require('../config/offlineStore');
module.exports = wrapModel(mongoose.model('Recommendation', recommendationSchema), 'recommendations');
