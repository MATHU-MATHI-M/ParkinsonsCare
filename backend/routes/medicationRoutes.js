const express = require('express');
const router = express.Router();
const MedicationSchedule = require('../models/MedicationSchedule');
const MedicationCall = require('../models/MedicationCall');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all medication schedules for patient
// @route   GET /api/medications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let patientId = req.user.id;
    if (['doctor', 'caregiver'].includes(req.user.role) && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const schedules = await MedicationSchedule.find({ patient: patientId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get all call logs
// @route   GET /api/medications/calls
// @access  Private
router.get('/calls', protect, async (req, res) => {
  try {
    let patientId = req.user.id;
    if (['doctor', 'caregiver'].includes(req.user.role) && req.query.patientId) {
      patientId = req.query.patientId;
    }

    const logs = await MedicationCall.find({ patient: patientId }).sort({ timestamp: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Add new medication schedule
// @route   POST /api/medications
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      name, dosage, time, phoneNumber, countryCode, reminderType,
      morning, afternoon, night, beforeFood, afterFood,
      repeatType, startDate, endDate,
      doctorName, doctorNotes, pharmacyName, customInstructions
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Medicine name is required' });
    }

    const schedule = await MedicationSchedule.create({
      patient: req.user.id,
      medicineName: name,
      dosage: dosage || '',
      time: time || '08:00',
      phoneNumber: phoneNumber || '',
      countryCode: countryCode || '+1',
      reminderType: reminderType || 'Email',
      morning: morning || false,
      afternoon: afternoon || false,
      night: night || false,
      beforeFood: beforeFood || false,
      afterFood: afterFood !== undefined ? afterFood : true,
      repeatType: repeatType || 'daily',
      startDate: startDate || new Date(),
      endDate: endDate || undefined,
      doctorName: doctorName || '',
      doctorNotes: doctorNotes || '',
      pharmacyName: pharmacyName || '',
      customInstructions: customInstructions || ''
    });

    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update medication schedule
// @route   PUT /api/medications/:medId
// @access  Private
router.put('/:medId', protect, async (req, res) => {
  try {
    const schedule = await MedicationSchedule.findById(req.params.medId);
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Prescription schedule not found' });
    }

    // Update all allowed fields
    const fields = [
      'medicineName', 'dosage', 'time', 'phoneNumber', 'countryCode',
      'reminderType', 'morning', 'afternoon', 'night', 'beforeFood',
      'afterFood', 'repeatType', 'startDate', 'endDate', 'doctorName',
      'doctorNotes', 'pharmacyName', 'customInstructions', 'active'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        schedule[field] = req.body[field];
      }
    });

    await schedule.save();
    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Toggle medication taken for today
// @route   POST /api/medications/:medId/take
// @access  Private
router.post('/:medId/take', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const schedule = await MedicationSchedule.findById(req.params.medId);

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Prescription schedule not found' });
    }

    const takenIndex = schedule.takenHistory.findIndex(h => h.date === today);
    if (takenIndex > -1) {
      schedule.takenHistory.splice(takenIndex, 1);
    } else {
      schedule.takenHistory.push({ date: today });
    }

    await schedule.save();
    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Delete medication schedule
// @route   DELETE /api/medications/:medId
// @access  Private
router.delete('/:medId', protect, async (req, res) => {
  try {
    await MedicationSchedule.findByIdAndDelete(req.params.medId);
    res.status(200).json({ success: true, message: 'Prescription schedule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Trigger simulated Twilio Voice Call reminder
// @route   POST /api/medications/:medId/call
// @access  Private
router.post('/:medId/call', protect, async (req, res) => {
  try {
    const schedule = await MedicationSchedule.findById(req.params.medId);
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Prescription schedule not found' });
    }

    // Validate phone number
    const fullNumber = (schedule.countryCode || '+1') + (schedule.phoneNumber || '');
    const phoneRegex = /^\+\d{10,15}$/;
    const numberValid = phoneRegex.test(fullNumber);

    // Mock Twilio call outcomes: 70% Answered, 20% Missed, 10% Failed
    const rand = Math.random();
    let status = 'Answered';
    let retries = 0;
    let duration = Math.floor(Math.random() * 25) + 8; // 8-33 seconds

    if (rand < 0.1) {
      status = 'Failed';
      retries = 2;
      duration = 0;
    } else if (rand < 0.3) {
      status = 'Missed';
      retries = 1;
      duration = 0;
    }

    // Build the TTS script that would play on the call
    const ttsScript = `Hello. This is your ParkinsonCare AI medication reminder. It is now ${schedule.time}. Please take ${schedule.dosage || 'your dose'} of ${schedule.medicineName}${schedule.afterFood ? ' after food' : ''}${schedule.beforeFood ? ' before food' : ''}. If you have already taken the medicine, press 1. If you want to postpone the reminder by 15 minutes, press 2. Take care and have a healthy day.`;

    const callLog = await MedicationCall.create({
      patient: schedule.patient,
      schedule: schedule._id,
      medicineName: schedule.medicineName,
      callStatus: status,
      retryCount: retries,
      duration,
      phoneNumber: fullNumber,
      ttsScript,
      numberValid
    });

    res.status(200).json({
      success: true,
      message: `Simulated Twilio Voice Call placed to ${fullNumber}. Status: ${status}. Duration: ${duration}s.`,
      data: callLog
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
