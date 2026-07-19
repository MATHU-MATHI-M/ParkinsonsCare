const express = require('express');
const {
  createAssessment,
  getAssessments,
  getWellnessStats,
} = require('../controllers/assessmentController');
const { getForecast, getTimeline } = require('../controllers/forecastController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes here require authentication

router.post('/', createAssessment);
router.get('/', getAssessments);
router.get('/wellness', getWellnessStats);
router.get('/forecast', getForecast);
router.get('/timeline', getTimeline);

module.exports = router;
