const express = require('express');
const router = express.Router();
const { chatWithTwinBot, getDynamicPrompts } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/chat', chatWithTwinBot);
router.get('/prompts', getDynamicPrompts);

module.exports = router;
