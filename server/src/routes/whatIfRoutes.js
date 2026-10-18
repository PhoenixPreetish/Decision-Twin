const express = require('express');
const router = express.Router();
const { simulateWhatIf, applyWhatIfChanges } = require('../controllers/whatIfController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/simulate', simulateWhatIf);
router.post('/apply', applyWhatIfChanges);

module.exports = router;
