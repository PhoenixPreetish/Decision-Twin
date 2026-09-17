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
      'relocation'
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Scenario', scenarioSchema);
