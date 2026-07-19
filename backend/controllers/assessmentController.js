const Questionnaire = require('../models/Questionnaire');
const GameResult = require('../models/GameResult');
const VoiceAssessment = require('../models/VoiceAssessment');
const MotorAssessment = require('../models/MotorAssessment');

// @desc    Create new assessment entry
// @route   POST /api/assessments
// @access  Private (Patient)
exports.createAssessment = async (req, res) => {
  try {
    const { type, score, metrics, landmarks, gameType } = req.body;
    const patientId = req.user.id;
    let result = null;

    if (type === 'questionnaire') {
      result = await Questionnaire.create({
        patient: patientId,
        score,
        answers: metrics
      });
    } else if (type === 'voice_analysis') {
      result = await VoiceAssessment.create({
        patient: patientId,
        score,
        metrics
      });
    } else if (['memory_match', 'reaction_tap', 'spiral_drawing', 'color_sequence', 'trail_making', 'pattern_recall', 'word_recall', 'number_recall', 'visual_search'].includes(type) || ['memory_match', 'reaction_tap', 'spiral_drawing'].includes(gameType)) {
      result = await GameResult.create({
        patient: patientId,
        gameType: gameType || type,
        score,
        metrics,
        timeTaken: metrics?.timeTaken || 0,
        mistakes: metrics?.mistakes || 0,
        accuracy: metrics?.accuracy || 0,
        reactionTime: metrics?.reactionTime || 0,
        difficulty: metrics?.difficulty || 'medium'
      });
    } else if (['finger_tapping', 'hand_stability', 'facial_masking', 'posture', 'walking'].includes(type)) {
      result = await MotorAssessment.create({
        patient: patientId,
        score,
        type,
        metrics,
        landmarks,
        videoConsent: req.body.videoConsent || false
      });
    } else {
      return res.status(400).json({ success: false, error: `Invalid assessment type: ${type}` });
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get assessment history unified
// @route   GET /api/assessments
// @access  Private
exports.getAssessments = async (req, res) => {
  try {
    let patientId = req.user.id;
    if (['doctor', 'caregiver'].includes(req.user.role) && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const { type, limit = 50 } = req.query;
    let list = [];

    // Query specific collection or aggregate all
    if (type === 'questionnaire') {
      const q = await Questionnaire.find({ patient: patientId }).sort({ createdAt: -1 }).limit(parseInt(limit));
      list = q.map(item => ({ ...item.toObject(), type: 'questionnaire' }));
    } else if (type === 'voice_analysis') {
      const v = await VoiceAssessment.find({ patient: patientId }).sort({ createdAt: -1 }).limit(parseInt(limit));
      list = v.map(item => ({ ...item.toObject(), type: 'voice_analysis' }));
    } else if (type === 'motor') {
      const m = await MotorAssessment.find({ patient: patientId }).sort({ createdAt: -1 }).limit(parseInt(limit));
      list = m.map(item => ({ ...item.toObject(), type: item.type }));
    } else if (type === 'game') {
      const g = await GameResult.find({ patient: patientId }).sort({ createdAt: -1 }).limit(parseInt(limit));
      list = g.map(item => ({ ...item.toObject(), type: item.gameType }));
    } else {
      // Query all collections in parallel
      const [q, g, m, v] = await Promise.all([
        Questionnaire.find({ patient: patientId }).sort({ createdAt: -1 }).limit(20),
        GameResult.find({ patient: patientId }).sort({ createdAt: -1 }).limit(20),
        MotorAssessment.find({ patient: patientId }).sort({ createdAt: -1 }).limit(20),
        VoiceAssessment.find({ patient: patientId }).sort({ createdAt: -1 }).limit(20)
      ]);

      list = [
        ...q.map(i => ({ ...i.toObject(), type: 'questionnaire' })),
        ...g.map(i => ({ ...i.toObject(), type: i.gameType })),
        ...m.map(i => ({ ...i.toObject(), type: i.type })),
        ...v.map(i => ({ ...i.toObject(), type: 'voice_analysis' }))
      ];
    }

    // Sort by newest first
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply limit
    const paginatedList = list.slice(0, parseInt(limit));

    res.status(200).json({ success: true, data: paginatedList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Daily Wellness Index & dashboard stats from actual MongoDB entries only
// @route   GET /api/assessments/wellness
// @access  Private
exports.getWellnessStats = async (req, res) => {
  try {
    let patientId = req.user.id;
    if (['doctor', 'caregiver'].includes(req.user.role) && req.query.patientId) {
      patientId = req.query.patientId;
    }

    // Fetch latest entries
    const [latestQ, latestVoice, latestGame, latestMotor] = await Promise.all([
      Questionnaire.findOne({ patient: patientId }).sort({ createdAt: -1 }),
      VoiceAssessment.findOne({ patient: patientId }).sort({ createdAt: -1 }),
      GameResult.findOne({ patient: patientId }).sort({ createdAt: -1 }),
      MotorAssessment.findOne({ patient: patientId }).sort({ createdAt: -1 })
    ]);

    // Check if there is absolutely NO data (Zero-Data State)
    if (!latestQ && !latestVoice && !latestGame && !latestMotor) {
      return res.status(200).json({
        success: true,
        data: { zeroState: true }
      });
    }

    // Dynamic Wellness Score Calculation based only on available metrics
    // Calculate weighted average of whatever data is active
    let sumWeightedScores = 0;
    let sumWeights = 0;
    const scores = {};

    if (latestQ) {
      scores.nonMotorScore = latestQ.score;
      sumWeightedScores += latestQ.score * 0.30;
      sumWeights += 0.30;
    }
    if (latestGame) {
      scores.cognitiveScore = latestGame.score;
      sumWeightedScores += latestGame.score * 0.30;
      sumWeights += 0.30;
    }
    if (latestMotor) {
      scores.motorScore = latestMotor.score;
      sumWeightedScores += latestMotor.score * 0.30;
      sumWeights += 0.30;
    }
    if (latestVoice) {
      scores.voiceScore = latestVoice.score;
      sumWeightedScores += latestVoice.score * 0.10;
      sumWeights += 0.10;
    }

    const wellnessScore = Math.round(sumWeightedScores / sumWeights);

    // Dynamic Risk and Recommendation Engine based on actual scores
    let riskCategory = 'Low';
    let recommendation = 'Your recorded clinical parameters indicate stable wellness. Continue your medication schedules and daily assessments.';

    if (wellnessScore < 60) {
      riskCategory = 'High';
      recommendation = 'Critical slowness or motor tremors logged. Rest immediately, inform your caregiver or doctor, and check your medication timings.';
    } else if (wellnessScore < 80) {
      riskCategory = 'Moderate';
      recommendation = 'Mild fluctuations detected. A 15-minute relaxation session is recommended before attempting further physical tasks.';
    }

    res.status(200).json({
      success: true,
      data: {
        zeroState: false,
        wellnessScore,
        riskCategory,
        recommendation,
        scores,
        assessmentsCompletedToday: {
          questionnaire: !!latestQ && new Date(latestQ.createdAt).toDateString() === new Date().toDateString(),
          games: !!latestGame && new Date(latestGame.createdAt).toDateString() === new Date().toDateString(),
          motor: !!latestMotor && new Date(latestMotor.createdAt).toDateString() === new Date().toDateString(),
          voice: !!latestVoice && new Date(latestVoice.createdAt).toDateString() === new Date().toDateString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
