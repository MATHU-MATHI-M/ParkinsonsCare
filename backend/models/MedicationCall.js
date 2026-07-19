const mongoose = require('mongoose');

const MedicationCallSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicationSchedule',
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  callStatus: {
    type: String,
    enum: ['Answered', 'Missed', 'Rejected', 'Failed'],
    required: true
  },
  retryCount: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // seconds
    default: 0
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  ttsScript: {
    type: String,
    default: ''
  },
  numberValid: {
    type: Boolean,
    default: true
  },
  dtmfResponse: {
    type: String, // '1' = taken, '2' = postpone, '3' = repeat
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MedicationCall', MedicationCallSchema);
