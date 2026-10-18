const mongoose = require('mongoose');

const digitalTwinSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  age: {
    type: Number,
    required: true,
    min: 15,
    max: 100
  },
  highestEducation: {
    type: String,
    required: true,
    enum: ['High School', 'Bachelor', 'Master', 'Doctorate', 'Diploma', 'Other']
  },
  fieldOfStudy: {
    type: String,
    required: true
  },
  currentOccupation: {
    type: String,
    required: true
  },
  yearsOfExperience: {
    type: Number,
    required: true,
    min: 0,
    max: 60
  },
  currentSalary: {
    type: Number, // In INR (₹)
    required: true,
    min: 0
  },
  savings: {
    type: Number, // In INR (₹)
    required: true,
    min: 0
  },
  debt: {
    type: Number, // In INR (₹)
    required: true,
    default: 0,
    min: 0
  },
  monthlyExpenses: {
    type: Number, // In INR (₹)
    required: true,
    min: 0
  },
  keySkills: [{
    type: String,
    trim: true
  }],
  riskTolerance: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
    default: 'medium'
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const { wrapModel } = require('../config/offlineStore');
module.exports = wrapModel(mongoose.model('DigitalTwin', digitalTwinSchema), 'digitaltwins');
