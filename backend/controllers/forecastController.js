const Questionnaire = require('../models/Questionnaire');
const GameResult = require('../models/GameResult');
const MotorAssessment = require('../models/MotorAssessment');
const VoiceAssessment = require('../models/VoiceAssessment');
const MedicationSchedule = require('../models/MedicationSchedule');
const MedicationCall = require('../models/MedicationCall');

// Simple linear regression: y = mx + b
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 50, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  });

  const denom = (n * sumX2 - sumX * sumX);
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² coefficient
  const yMean = sumY / n;
  const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

function predict(model, x) {
  return Math.max(0, Math.min(100, Math.round(model.slope * x + model.intercept)));
}

// @desc    Get 7-day and 30-day forecast predictions
// @route   GET /api/assessments/forecast
// @access  Private
exports.getForecast = async (req, res) => {
  try {
    const patientId = req.user.id;

    // Gather historical scores
    const [questionnaires, games, motor, voice] = await Promise.all([
      Questionnaire.find({ patient: patientId }).sort({ createdAt: 1 }).lean(),
      GameResult.find({ patient: patientId }).sort({ createdAt: 1 }).lean(),
      MotorAssessment.find({ patient: patientId }).sort({ createdAt: 1 }).lean(),
      VoiceAssessment.find({ patient: patientId }).sort({ createdAt: 1 }).lean()
    ]);

    const allRecords = [...questionnaires, ...games, ...motor, ...voice];

    if (allRecords.length < 2) {
      return res.status(200).json({
        success: true,
        zeroState: true,
        message: 'Not enough historical data points to generate a statistical forecast. Complete more assessments.'
      });
    }

    // Build time-indexed scores per domain
    const baseDate = new Date(allRecords[0].createdAt).getTime();
    const msPerDay = 86400000;

    const toPoints = (records) => records.map(r => ({
      x: (new Date(r.createdAt).getTime() - baseDate) / msPerDay,
      y: r.score || 50
    }));

    // Domain models
    const domains = {};

    if (questionnaires.length >= 2) {
      domains.nonMotor = linearRegression(toPoints(questionnaires));
    }
    if (games.length >= 2) {
      const memoryGames = games.filter(g => g.gameType === 'memory_match');
      const reactionGames = games.filter(g => g.gameType === 'reaction_tap');
      if (memoryGames.length >= 2) domains.cognitive = linearRegression(toPoints(memoryGames));
      if (reactionGames.length >= 2) domains.reaction = linearRegression(toPoints(reactionGames));
    }
    if (motor.length >= 2) {
      domains.motor = linearRegression(toPoints(motor));
    }
    if (voice.length >= 2) {
      domains.voice = linearRegression(toPoints(voice));
    }

    // Calculate current day offset
    const nowDay = (Date.now() - baseDate) / msPerDay;

    // Generate forecast points
    const forecast7 = {};
    const forecast30 = {};
    const trends = {};
    const confidence = {};

    Object.entries(domains).forEach(([domain, model]) => {
      forecast7[domain] = [];
      forecast30[domain] = [];
      trends[domain] = model.slope > 0.1 ? 'improving' : model.slope < -0.1 ? 'declining' : 'stable';
      confidence[domain] = Math.round(model.r2 * 100);

      for (let d = 1; d <= 7; d++) {
        forecast7[domain].push({
          day: d,
          predicted: predict(model, nowDay + d)
        });
      }
      for (let d = 1; d <= 30; d += 3) {
        forecast30[domain].push({
          day: d,
          predicted: predict(model, nowDay + d)
        });
      }
    });

    // Overall risk score: average of latest predictions
    const latestPredictions = Object.values(domains).map(m => predict(m, nowDay));
    const avgScore = latestPredictions.length > 0
      ? Math.round(latestPredictions.reduce((a, b) => a + b, 0) / latestPredictions.length)
      : 50;

    const riskScore = 100 - avgScore;
    const improvementProbability = Object.values(domains).filter(m => m.slope > 0).length / Math.max(1, Object.keys(domains).length);

    res.status(200).json({
      success: true,
      data: {
        forecast7,
        forecast30,
        trends,
        confidence,
        riskScore,
        improvementProbability: Math.round(improvementProbability * 100),
        totalDataPoints: allRecords.length,
        domainsAnalyzed: Object.keys(domains)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get digital health timeline (all events chronologically)
// @route   GET /api/assessments/timeline
// @access  Private
exports.getTimeline = async (req, res) => {
  try {
    const patientId = req.user.id;

    const [questionnaires, games, motor, voice, meds, calls] = await Promise.all([
      Questionnaire.find({ patient: patientId }).sort({ createdAt: -1 }).limit(50).lean(),
      GameResult.find({ patient: patientId }).sort({ createdAt: -1 }).limit(50).lean(),
      MotorAssessment.find({ patient: patientId }).sort({ createdAt: -1 }).limit(30).lean(),
      VoiceAssessment.find({ patient: patientId }).sort({ createdAt: -1 }).limit(30).lean(),
      MedicationSchedule.find({ patient: patientId }).lean(),
      MedicationCall.find({ patient: patientId }).sort({ timestamp: -1 }).limit(50).lean()
    ]);

    // Unify into timeline events
    const events = [];

    questionnaires.forEach(q => events.push({
      type: 'questionnaire',
      title: 'Daily Symptoms Survey',
      score: q.score,
      date: q.createdAt,
      icon: 'clipboard'
    }));

    games.forEach(g => events.push({
      type: 'game',
      title: g.gameType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Cognitive Game',
      score: g.score,
      date: g.createdAt,
      icon: 'brain',
      meta: { accuracy: g.accuracy, time: g.timeTaken }
    }));

    motor.forEach(m => events.push({
      type: 'motor',
      title: 'Motor Assessment',
      score: m.score,
      date: m.createdAt,
      icon: 'activity'
    }));

    voice.forEach(v => events.push({
      type: 'voice',
      title: 'Voice Analysis',
      score: v.score,
      date: v.createdAt,
      icon: 'mic'
    }));

    calls.forEach(c => events.push({
      type: 'medication_call',
      title: `Twilio Reminder: ${c.medicineName}`,
      date: c.timestamp,
      icon: 'phone',
      meta: { status: c.callStatus, retries: c.retryCount, duration: c.duration }
    }));

    // Medication taken events
    meds.forEach(med => {
      med.takenHistory.forEach(h => {
        events.push({
          type: 'medication_taken',
          title: `Took ${med.medicineName} (${med.dosage})`,
          date: h.takenAt || new Date(h.date),
          icon: 'pill'
        });
      });
    });

    // Sort all events by date descending
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
