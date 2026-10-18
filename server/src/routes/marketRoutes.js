const express = require('express');
const router = express.Router();
const marketData = require('../data/marketReferenceData');

// @desc Get market intelligence data (salaries, degree ROI, startup survival, macroeconomic indicators)
// @route GET /api/market/benchmarks
router.get('/benchmarks', (req, res) => {
  res.status(200).json({
    success: true,
    version: marketData.version,
    currency: marketData.currency,
    benchmarks: {
      salaryBenchmarksByRole: marketData.salaryBenchmarksByRole,
      degreeRoiBenchmarks: marketData.degreeRoiBenchmarks,
      startupBenchmarks: marketData.startupBenchmarks,
      macroEconomics: marketData.macroEconomics
    }
  });
});

// @desc Get macroeconomic shock profiles for stress testing
// @route GET /api/market/stress-profiles
router.get('/stress-profiles', (req, res) => {
  res.status(200).json({
    success: true,
    profiles: marketData.stressTestingProfiles
  });
});

module.exports = router;
