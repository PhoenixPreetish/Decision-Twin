const express = require('express');
const router = express.Router();
const {
  runScenarioSimulation,
  getScenarioAnalytics,
  runMacroStressTest,
  getCoPilotAdvisory,
  getAdvancedDecisionSuite
} = require('../controllers/simulationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/run/:scenarioId', runScenarioSimulation);
router.get('/analytics/:scenarioId', getScenarioAnalytics);
router.post('/stress-test/:scenarioId', runMacroStressTest);
router.post('/copilot/:scenarioId', getCoPilotAdvisory);
router.get('/advanced-suite/:scenarioId', getAdvancedDecisionSuite);
router.post('/advanced-suite/:scenarioId', getAdvancedDecisionSuite);

module.exports = router;
