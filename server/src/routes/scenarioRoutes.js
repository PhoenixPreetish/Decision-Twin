const express = require('express');
const router = express.Router();
const {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario,
  getScenarioTemplates,
  parseScenarioFromText
} = require('../controllers/scenarioController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/templates', getScenarioTemplates);
router.post('/parse-nl', parseScenarioFromText);

router.route('/')
  .get(getScenarios)
  .post(createScenario);

router.route('/:id')
  .get(getScenarioById)
  .put(updateScenario)
  .delete(deleteScenario);

module.exports = router;
