const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true,
    immutable: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Option title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // Category specific attributes (defaulted to null so N/A is distinguishable from zero values)
  attributes: {
    // Higher Education
    tuitionCost: { type: Number, default: null }, // INR ₹
    programDurationMonths: { type: Number, default: null },
    institutionName: { type: String, default: null },
    isAccredited: { type: Boolean, default: null },
    
    // Career & Job specific
    offeredSalary: { type: Number, default: null }, // INR ₹ annual
    roleLevel: { type: String, default: null }, // Junior, Mid, Senior, Lead
    companyType: { type: String, default: null }, // Startup, MNC, SME
    workLifeBalanceRating: { type: Number, default: 7, min: 1, max: 10 },
    remoteFlexibility: { type: String, default: null }, // Remote, Onsite, Hybrid
    
    // Entrepreneurship / Investment specific
    initialInvestment: { type: Number, default: null }, // INR ₹
    expectedRunwayMonths: { type: Number, default: null },
    targetMarketSize: { type: String, default: null }, // Niche, Medium, Large
    monthlyOperatingExpense: { type: Number, default: null },
    
    // Relocation specific
    targetCity: { type: String, default: null },
    targetCountry: { type: String, default: 'India' },
    costOfLivingIndex: { type: Number, default: null },
    relocationCost: { type: Number, default: null }, // INR ₹
    distanceFromFamilyKm: { type: Number, default: null },

    // Skill Investment & Custom Decision specific
    courseCost: { type: Number, default: null },
    weeklyStudyHours: { type: Number, default: null },
    completionWeeks: { type: Number, default: null },
    expectedUpsideValue: { type: Number, default: null },
    reversibilityScore: { type: Number, default: null, min: 1, max: 10 },
    scholarshipPct: { type: Number, default: null, min: 0, max: 100 },
    loanInterestRate: { type: Number, default: null }
  },
  isWhatIfClone: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const { wrapModel } = require('../config/offlineStore');
module.exports = wrapModel(mongoose.model('Option', optionSchema), 'options');
