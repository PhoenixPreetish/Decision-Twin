const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Scenario title is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'higher_education',
      'career_change',
      'job_selection',
      'entrepreneurship',
      'investment_planning',
      'relocation',
      'skill_investment',
      'custom_decision'
    ],
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active',
    index: true
  },
  selectedOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Option',
    default: null
  },
  recommendedOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Option',
    default: null
  },
  tripwires: [{
    parameter: { type: String },
    label: { type: String },
    thresholdValue: { type: Number },
    currentValue: { type: Number },
    operator: { type: String },
    unit: { type: String },
    status: { type: String, enum: ['Safe', 'Near_Breach', 'Breached'], default: 'Safe' },
    consequence: { type: String }
  }],
  stakeholderProfile: {
    name: { type: String, default: null },
    relationship: { type: String, default: null },
    riskTolerance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    weights: {
      financialGrowth: { type: Number, default: 20 },
      jobSecurity: { type: Number, default: 25 },
      workLifeBalance: { type: Number, default: 20 },
      personalGrowth: { type: Number, default: 10 },
      familyStability: { type: Number, default: 15 },
      locationPreference: { type: Number, default: 5 },
      healthWellBeing: { type: Number, default: 5 }
    }
  }
}, {
  timestamps: true
});

const { wrapModel } = require('../config/offlineStore');
module.exports = wrapModel(mongoose.model('Scenario', scenarioSchema), 'scenarios');
