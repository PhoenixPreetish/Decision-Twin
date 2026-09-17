const mongoose = require('mongoose');

const goalConstraintSchema = new mongoose.Schema({
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true,
    unique: true
  },
  // Goal weights in percentages, must sum to 100%
  weights: {
    financialGrowth: { type: Number, default: 25, min: 0, max: 100 },
    jobSecurity: { type: Number, default: 20, min: 0, max: 100 },
    workLifeBalance: { type: Number, default: 20, min: 0, max: 100 },
    personalGrowth: { type: Number, default: 15, min: 0, max: 100 },
    familyStability: { type: Number, default: 10, min: 0, max: 100 },
    locationPreference: { type: Number, default: 5, min: 0, max: 100 },
    healthWellBeing: { type: Number, default: 5, min: 0, max: 100 }
  },
  // Hard Constraints
  constraints: {
    maxBudget: { type: Number, default: null }, // INR ₹
    maxAcceptableDebt: { type: Number, default: null }, // INR ₹
    minAcceptableSalary: { type: Number, default: null }, // INR ₹
    requiredLocation: { type: String, default: null },
    maxDurationMonths: { type: Number, default: null }
  }
}, {
  timestamps: true
});

goalConstraintSchema.pre('validate', function(next) {
  if (this.weights) {
    const total = Object.values(this.weights).reduce((acc, val) => acc + (Number(val) || 0), 0);
    if (Math.round(total) !== 100) {
      return next(new Error(`BR-3 Violation: Goal weights must sum to exactly 100%. Current sum: ${total}%`));
    }
  }
  next();
});

module.exports = mongoose.model('GoalConstraint', goalConstraintSchema);
