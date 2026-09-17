const express = require('express');
const router = express.Router();
const { getScenarioReport, finalizeDecision, getDecisionHistory } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/history', getDecisionHistory);
router.get('/:scenarioId', getScenarioReport);
router.post('/finalize', finalizeDecision);

module.exports = router;
