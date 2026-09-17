const express = require('express');
const router = express.Router();
const { getDigitalTwin, saveDigitalTwin } = require('../controllers/digitalTwinController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/')
  .get(getDigitalTwin)
  .post(saveDigitalTwin);

module.exports = router;
