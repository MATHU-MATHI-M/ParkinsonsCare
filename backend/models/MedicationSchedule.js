const mongoose = require('mongoose');

const MedicationScheduleSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicineName: {
    type: String,
    required: [true, 'Please add a medicine name']
  },
  dosage: {
    type: String,
    default: ''
  },
  // Dose timing flags
  morning: { type: Boolean, default: false },
  afternoon: { type: Boolean, default: false },
  night: { type: Boolean, default: false },
  beforeFood: { type: Boolean, default: false },
  afterFood: { type: Boolean, default: true },
  // Legacy single time string kept for backwards compat
  time: {
    type: String, // '08:00', '14:00', '20:00'
    default: '08:00'
  },
  // Scheduling
  repeatType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'daily'
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  // Clinician & pharmacy
  doctorName: { type: String, default: '' },
  doctorNotes: { type: String, default: '' },
  pharmacyName: { type: String, default: '' },
  customInstructions: { type: String, default: '' },
  // Contact & reminder
  phoneNumber: { type: String, default: '' },
  countryCode: { type: String, default: '+1' },
  reminderType: {
    type: String,
    enum: ['Notification', 'SMS', 'Email', 'Voice Call'],
    default: 'Email'
  },
  active: {
    type: Boolean,
    default: true
  },
  takenHistory: [
    {
      date: { type: String }, // 'YYYY-MM-DD'
      takenAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MedicationSchedule', MedicationScheduleSchema);
