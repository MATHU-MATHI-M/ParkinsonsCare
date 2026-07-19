const mongoose = require('mongoose');

const VoiceAssessmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  metrics: {
    mfcc: { type: [Number], default: [] },
    pitch: { type: Number, default: 0 },
    energy: { type: Number, default: 0 },
    speechRate: { type: Number, default: 0 },
    jitter: { type: Number, default: 0 },
    shimmer: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VoiceAssessment', VoiceAssessmentSchema);
