const mongoose = require('mongoose');

const simulationResultSchema = new mongoose.Schema({
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Option',
    required: true,
    index: true
  },
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true,
    index: true
  },
  trialsCount: {
    type: Number,
    default: 10000
  },
  // Percentile bands for final outcome valuation (INR ₹)
  percentiles: {
    p10WorstCase: { type: Number, required: true },
    p50MedianCase: { type: Number, required: true },
    p90BestCase: { type: Number, required: true },
    standardDeviation: { type: Number, default: 0 }
  },
  // Multi-year timeline projections
  timeline: [{
    year: { type: Number, required: true }, // e.g. 1, 3, 5
    p10: { type: Number, required: true },
    p50: { type: Number, required: true },
    p90: { type: Number, required: true }
  }],
  // Distribution bins for histogram rendering
  distributionBins: [{
    rangeLabel: { type: String },
    count: { type: Number },
    probability: { type: Number }
  }],
  // 60-Month / 5-Year Solvency Survival Curve
  survivalCurve: [{
    year: { type: Number },
    month: { type: Number },
    solvencyProbabilityPct: { type: Number },
    medianLiquidWealth: { type: Number }
  }],
  // Empirical Tail Risk Metrics from 10k Trials
  tailRisk: {
    var95: { type: Number, default: 0 },
    cvar95: { type: Number, default: 0 },
    ruinProbabilityPct: { type: Number, default: 0 },
    downsideSemiDeviation: { type: Number, default: 0 }
  },
  // 5 Explicit Scenario Regimes (Statistical vs Stress)
  scenarioRegimes: {
    optimisticP90: { type: Number },
    realisticP50: { type: Number },
    adverseP10: { type: Number },
    thesisFailure: { type: Number },
    priorityDriftUtility: { type: Number }
  }
}, {
  timestamps: true
});

const { wrapModel } = require('../config/offlineStore');
module.exports = wrapModel(mongoose.model('SimulationResult', simulationResultSchema), 'simulationresults');
