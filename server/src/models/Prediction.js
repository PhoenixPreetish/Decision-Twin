const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Option',
    required: true,
    immutable: true,
    index: true
  },
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true,
    immutable: true,
    index: true
  },
  modelType: {
    type: String,
    enum: ['GradientBoosting', 'LinearRegression', 'DecisionTree', 'CompositeEnsemble'],
    default: 'GradientBoosting'
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },
  predictedExpectedSalary: {
    type: Number, // INR ₹
    required: true
  },
  predictedRoiPercentage: {
    type: Number, // %
    required: true
  },
  successProbability: {
    type: Number, // 0.0 to 1.0
    required: true
  },
  confidenceScore: {
    type: Number, // 0 to 100
    required: true
  },
  confidenceInterval: {
    lower: { type: Number },
    upper: { type: Number }
  },
  featureVector: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for write consistency and ultra-fast queries
predictionSchema.index({ scenarioId: 1, optionId: 1 }, { unique: true });

const { wrapModel } = require('../config/offlineStore');
module.exports = wrapModel(mongoose.model('Prediction', predictionSchema), 'predictions');
