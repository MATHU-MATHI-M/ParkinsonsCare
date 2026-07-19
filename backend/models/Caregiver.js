const mongoose = require('mongoose');

const CaregiverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  relation: {
    type: String,
    default: 'Primary Caregiver'
  },
  assignedPatients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Caregiver', CaregiverSchema);
