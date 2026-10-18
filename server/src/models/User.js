const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'evaluator'],
    default: 'user'
  },
  tier: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  disclaimerAccepted: {
    type: Boolean,
    required: [true, 'Consent to advisory disclaimer is required (BR-4)'],
    default: false
  },
  disclaimerAcceptedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const { wrapModel } = require('../config/offlineStore');
module.exports = wrapModel(mongoose.model('User', userSchema), 'users');
