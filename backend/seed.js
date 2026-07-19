require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Caregiver = require('./models/Caregiver');
const Questionnaire = require('./models/Questionnaire');
const GameResult = require('./models/GameResult');
const VoiceAssessment = require('./models/VoiceAssessment');
const MotorAssessment = require('./models/MotorAssessment');
const MedicationSchedule = require('./models/MedicationSchedule');
const MedicationCall = require('./models/MedicationCall');
const Report = require('./models/Report');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parkinsoncare');
    console.log('Connected to MongoDB for clean user seeding...');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      Caregiver.deleteMany({}),
      Questionnaire.deleteMany({}),
      GameResult.deleteMany({}),
      VoiceAssessment.deleteMany({}),
      MotorAssessment.deleteMany({}),
      MedicationSchedule.deleteMany({}),
      MedicationCall.deleteMany({}),
      Report.deleteMany({})
    ]);
    console.log('Database cleared of all diagnostic logs and profiles.');

    // 1. Create Doctor User
    const docUser = await User.create({
      name: 'Dr. Evelyn Martinez',
      email: 'doctor@parkinsoncare.com',
      password: 'password123',
      role: 'doctor'
    });
    const doctorProfile = await Doctor.create({
      user: docUser._id,
      specialization: 'Neurologist (Movement Disorders Specialist)',
      licenseNumber: 'MD-928492'
    });
    console.log('Doctor created: doctor@parkinsoncare.com');

    // 2. Create Caregiver User
    const cgUser = await User.create({
      name: 'Sarah Chen',
      email: 'caregiver@parkinsoncare.com',
      password: 'password123',
      role: 'caregiver'
    });
    const caregiverProfile = await Caregiver.create({
      user: cgUser._id,
      relation: 'Spouse / Primary Caregiver',
      assignedPatients: [docUser._id] // placeholder, will link to patient
    });
    console.log('Caregiver created: caregiver@parkinsoncare.com');

    // 3. Create Patient User
    const patUser = await User.create({
      name: 'Robert Miller',
      email: 'patient@parkinsoncare.com',
      password: 'password123',
      role: 'patient'
    });
    const patientProfile = await Patient.create({
      user: patUser._id,
      age: null, // Empty for onboarding
      gender: 'Prefer not to say',
      diseaseStage: 'Stage 1 (Mild)',
      height: null,
      weight: null,
      doctor: docUser._id,
      caregiver: cgUser._id,
      emergencyContact: {
        name: 'Sarah Chen',
        relation: 'Spouse',
        phone: '+15550199'
      },
      medicalHistory: ['Diagnosed with Parkinson in 2025', 'Mild resting tremor in right hand']
    });

    // Update Caregiver with patient assignment
    caregiverProfile.assignedPatients = [patUser._id];
    await caregiverProfile.save();
    
    console.log('Patient created: patient@parkinsoncare.com');
    console.log('Database Seeding Completed (Clean Profiles seeded, no diagnostic curves!).');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding clean database:', error);
    process.exit(1);
  }
};

seedDB();
