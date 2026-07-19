const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Caregiver = require('../models/Caregiver');
const jwt = require('jsonwebtoken');

// Helper to sign JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_123456', {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create base user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
    });

    // Create role-specific profile document
    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.create({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await Doctor.create({ user: user._id });
    } else if (user.role === 'caregiver') {
      profile = await Caregiver.create({ user: user._id });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Find profile
    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id }).populate('doctor caregiver');
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id });
    } else if (user.role === 'caregiver') {
      profile = await Caregiver.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current logged in user & profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id }).populate({
        path: 'doctor caregiver',
        select: 'name email'
      });
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id });
    } else if (user.role === 'caregiver') {
      profile = await Caregiver.findOne({ user: user._id });
    }

    res.status(200).json({ success: true, user, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update patient profile details
// @route   PUT /api/auth/profile
// @access  Private (Patient)
exports.updateProfile = async (req, res) => {
  try {
    const { age, gender, diseaseStage, height, weight, emergencyContact, medicalHistory, doctor, caregiver } = req.body;

    let profile = await Patient.findOne({ user: req.user.id });
    if (!profile) {
      profile = new Patient({ user: req.user.id });
    }

    profile.age = age !== undefined ? age : profile.age;
    profile.gender = gender !== undefined ? gender : profile.gender;
    profile.diseaseStage = diseaseStage !== undefined ? diseaseStage : profile.diseaseStage;
    profile.height = height !== undefined ? height : profile.height;
    profile.weight = weight !== undefined ? weight : profile.weight;
    profile.emergencyContact = emergencyContact !== undefined ? emergencyContact : profile.emergencyContact;
    profile.medicalHistory = medicalHistory !== undefined ? medicalHistory : profile.medicalHistory;
    profile.doctor = doctor !== undefined ? doctor : profile.doctor;
    profile.caregiver = caregiver !== undefined ? caregiver : profile.caregiver;
    profile.updatedAt = Date.now();

    await profile.save();

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all doctors and caregivers list (for patient selector)
// @route   GET /api/auth/clinicians
// @access  Private
exports.getClinicians = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name email');
    const caregivers = await User.find({ role: 'caregiver' }).select('name email');
    res.status(200).json({ success: true, doctors, caregivers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
