const mongoose = require('mongoose');

const GameResultSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    enum: [
      'memory_match',
      'reaction_tap',
      'color_sequence',
      'trail_making',
      'pattern_recall',
      'spiral_drawing',
      'word_recall',
      'number_recall',
      'visual_search'
    ],
    required: true
  },
  timeTaken: { type: Number, default: 0 }, // seconds
  mistakes: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 }, // %
  reactionTime: { type: Number, default: 0 }, // ms
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  score: {
    type: Number,
    required: true
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed, // Stores specific game coordinates or variables
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GameResult', GameResultSchema);
