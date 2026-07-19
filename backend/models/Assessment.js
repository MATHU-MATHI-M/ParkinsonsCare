const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['questionnaire', 'memory_game', 'reaction_game', 'spiral_drawing', 'voice_analysis'],
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed, // Flexible key-value storage for specific test metrics
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexing for faster history aggregation queries
AssessmentSchema.index({ patient: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Assessment', AssessmentSchema);
