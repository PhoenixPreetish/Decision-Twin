const express = require('express');
const router = express.Router();
const { getScenarioReport, finalizeDecision, getDecisionHistory, recordMilestoneCheckIn } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/history', getDecisionHistory);
router.post('/history/:historyId/checkin', recordMilestoneCheckIn);
router.get('/:scenarioId', getScenarioReport);
router.post('/finalize', finalizeDecision);

module.exports = router;

