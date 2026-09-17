const mongoose = require('mongoose');

const riskScoreSchema = new mongoose.Schema({
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
  // Sub-scores (0-100, where higher means higher risk)
  financialRisk: { type: Number, required: true, min: 0, max: 100 },
  careerRisk: { type: Number, required: true, min: 0, max: 100 },
  marketRisk: { type: Number, required: true, min: 0, max: 100 },
  educationalRisk: { type: Number, required: true, min: 0, max: 100 },
  personalRisk: { type: Number, required: true, min: 0, max: 100 },
  familyRisk: { type: Number, required: true, min: 0, max: 100 },
  
  // Aggregate Risk Score (0-100) & Level
  overallRiskScore: { type: Number, required: true, min: 0, max: 100 },
  overallRiskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: function() {
      if (this.overallRiskScore === undefined || this.overallRiskScore === null) return 'Medium';
      if (this.overallRiskScore < 40) return 'Low';
      if (this.overallRiskScore < 65) return 'Medium';
      return 'High';
    }
  },
  
  // Goal Alignment & Decision Scoring (REQ-35 to REQ-39)
  goalAlignmentScore: { type: Number, required: true, min: 0, max: 100 },
  decisionScore: { type: Number, required: true, min: 0, max: 100 },
  confidenceScore: { type: Number, required: true, min: 0, max: 100 },
  rank: { type: Number, default: 1 },
  
  constraintViolations: [{
    constraintName: { type: String },
    message: { type: String }
  }]
}, {
  timestamps: true
});

// Compound index for write consistency and ultra-fast queries
riskScoreSchema.index({ scenarioId: 1, optionId: 1 }, { unique: true });

// Auto-derive overallRiskLevel so it never drifts from overallRiskScore (Point #5)
riskScoreSchema.pre('validate', function() {
  if (this.overallRiskScore !== undefined && this.overallRiskScore !== null) {
    if (this.overallRiskScore < 40) {
      this.overallRiskLevel = 'Low';
    } else if (this.overallRiskScore < 65) {
      this.overallRiskLevel = 'Medium';
    } else {
      this.overallRiskLevel = 'High';
    }
  }
});

module.exports = mongoose.model('RiskScore', riskScoreSchema);
