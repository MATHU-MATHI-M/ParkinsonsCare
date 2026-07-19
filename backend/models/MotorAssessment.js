const mongoose = require('mongoose');

const MotorAssessmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['finger_tapping', 'hand_stability', 'facial_masking', 'posture', 'walking'],
    required: true
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  landmarks: {
    type: mongoose.Schema.Types.Mixed, // Stores only extracted keypoints (no video files)
    default: null
  },
  videoConsent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MotorAssessment', MotorAssessmentSchema);
