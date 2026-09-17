const express = require('express');
const router = express.Router();
const { runScenarioSimulation } = require('../controllers/simulationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/run/:scenarioId', runScenarioSimulation);

module.exports = router;
