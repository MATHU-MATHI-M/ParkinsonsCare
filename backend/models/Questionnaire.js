const mongoose = require('mongoose');

const QuestionnaireSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  answers: {
    sleep: { type: Number, required: true },
    mood: { type: Number, required: true },
    fatigue: { type: Number, required: true },
    constipation: { type: Number, required: true },
    stress: { type: Number, required: true },
    depression: { type: Number, required: true },
    anxiety: { type: Number, required: true },
    motivation: { type: Number, required: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Questionnaire', QuestionnaireSchema);
