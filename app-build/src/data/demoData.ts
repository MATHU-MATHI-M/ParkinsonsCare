import {
  Patient,
  User,
  Caretaker,
  Alert,
  CaretakerObservation,
  DoctorNote,
  Message,
  Notification,
  ModelMetrics,
  PatientVisit
} from '../types';

// ============================================================
// Demo Patients (Fictional starter profiles - NO PPMI patient data)
// Note: PPMI dataset is strictly used for model training only.
// ============================================================
export const DEMO_PATIENTS: Patient[] = [
  {
    id: 'patient-101',
    displayId: 'NC-101',
    name: 'Robert Miller',
    sex: 'Male',
    enrollAge: 64,
    cohort: "Parkinson's Care",
    assignedDoctorId: 'doctor-001',
    assignedCaretakerId: 'caretaker-001',
    age: 64,
    gender: 'Male',
    diagnosisYear: 2022,
    overallBurdenScore: 28,
    lastMoCA: 27,
    riskStatus: 'low',
    visits: [
      {
        event_id: 'V01',
        visitId: 'Baseline',
        date: '01/2024',
        np1_cog: 0, np1_hall: 0, np1_dprs: 1, np1_anxs: 1, np1_apat: 0, np1_dds: 0,
        np1_slpn: 1, np1_slpd: 1, np1_pain: 1, np1_urin: 1, np1_cnst: 1, np1_lthd: 0, np1_fatg: 1,
        ess_score: 7, essTotal: 7, gds_score: 2, gdsScore: 2, rbdsq_score: 2, rbdsqScore: 2, stai_state: 32, stai_trait: 34,
        scopa_gi: 3, scopa_urinary: 2, scopa_cardiovascular: 1, scopa_thermoregulatory: 1, scopa_total: 9, scopaTotal: 9,
        moca_total: 27, mocaTotal: 27, hvlt_total_recall: 52, hvlt_delayed_recall: 48, hvlt_retention: 46,
        sdmt_total: 48, sdmtTotal: 48, tmt_a_sec: 32, tmt_b_sec: 75, tmtbSecs: 75, lexical_fluency_total: 45, semantic_fluency_animals: 20,
        bnt_score: 28, clock_total: 7, upsit_total: 28, upsitTotal: 28, upsit_percentile: 45,
        orthostatic_drop_sys: 6, hr_supine: 68, hr_standing: 74,
        burden: {
          domain_scores: { sleep: 25, mood: 20, cognition: 18, autonomic: 22, sensory: 25, pain_fatigue: 20, psychosis: 0, overall: 22 },
          severity_labels: { sleep: 'low', mood: 'low', cognition: 'low', autonomic: 'low', sensory: 'low', pain_fatigue: 'low', psychosis: 'low', overall: 'low' },
          mci_risk_flags: [], depression_screen_positive: false, excessive_daytime_sleepiness: false, rbd_screen_positive: false
        }
      }
    ],
  },
  {
    id: 'patient-102',
    displayId: 'NC-102',
    name: 'Sarah Jenkins',
    sex: 'Female',
    enrollAge: 59,
    cohort: "Parkinson's Care",
    assignedDoctorId: 'doctor-001',
    assignedCaretakerId: 'caretaker-002',
    age: 59,
    gender: 'Female',
    diagnosisYear: 2023,
    overallBurdenScore: 42,
    lastMoCA: 25,
    riskStatus: 'medium',
    visits: [
      {
        event_id: 'V01',
        visitId: 'Baseline',
        date: '02/2024',
        np1_cog: 1, np1_hall: 0, np1_dprs: 1, np1_anxs: 2, np1_apat: 1, np1_dds: 0,
        np1_slpn: 2, np1_slpd: 2, np1_pain: 2, np1_urin: 2, np1_cnst: 2, np1_lthd: 1, np1_fatg: 2,
        ess_score: 10, essTotal: 10, gds_score: 4, gdsScore: 4, rbdsq_score: 3, rbdsqScore: 3, stai_state: 38, stai_trait: 40,
        scopa_gi: 5, scopa_urinary: 4, scopa_cardiovascular: 2, scopa_thermoregulatory: 2, scopa_total: 15, scopaTotal: 15,
        moca_total: 25, mocaTotal: 25, hvlt_total_recall: 47, hvlt_delayed_recall: 44, hvlt_retention: 40,
        sdmt_total: 42, sdmtTotal: 42, tmt_a_sec: 38, tmt_b_sec: 88, tmtbSecs: 88, lexical_fluency_total: 40, semantic_fluency_animals: 18,
        bnt_score: 26, clock_total: 6, upsit_total: 22, upsitTotal: 22, upsit_percentile: 25,
        orthostatic_drop_sys: 10, hr_supine: 66, hr_standing: 76,
        burden: {
          domain_scores: { sleep: 38, mood: 35, cognition: 28, autonomic: 34, sensory: 38, pain_fatigue: 35, psychosis: 0, overall: 35 },
          severity_labels: { sleep: 'moderate', mood: 'moderate', cognition: 'low', autonomic: 'moderate', sensory: 'moderate', pain_fatigue: 'moderate', psychosis: 'low', overall: 'moderate' },
          mci_risk_flags: [], depression_screen_positive: false, excessive_daytime_sleepiness: false, rbd_screen_positive: false
        }
      }
    ],
  },
];

// ============================================================
// Demo Users
// ============================================================
export const DEMO_USERS: User[] = [
  {
    id: 'patient-101',
    email: 'patient@demo.com',
    role: 'patient',
    name: 'Robert Miller',
    patientId: 'patient-101',
  },
  {
    id: 'caretaker-001',
    email: 'caretaker@demo.com',
    role: 'caretaker',
    name: 'Susan Miller',
    assignedPatients: ['patient-101'],
  },
  {
    id: 'doctor-001',
    email: 'doctor@demo.com',
    role: 'doctor',
    name: 'Dr. Sarah Chen',
    assignedPatients: ['patient-101', 'patient-102'],
  },
];

export const DEMO_CREDENTIALS = {
  patient: { email: 'patient@demo.com', password: 'demo1234' },
  caretaker: { email: 'caretaker@demo.com', password: 'demo1234' },
  doctor: { email: 'doctor@demo.com', password: 'demo1234' },
};

// ============================================================
// Caretakers & Doctors
// ============================================================
export const DEMO_CARETAKERS: Caretaker[] = [
  {
    id: 'caretaker-001',
    name: 'Susan Miller',
    email: 'caretaker@demo.com',
    connectedPatientIds: ['patient-101'],
    assignedPatientIds: ['patient-101'],
    phone: '+1 (555) 012-3456',
  },
  {
    id: 'caretaker-002',
    name: 'Carlos Jenkins',
    email: 'carlos@family.com',
    connectedPatientIds: ['patient-102'],
    assignedPatientIds: ['patient-102'],
    phone: '+1 (555) 987-6543',
  },
];

export const DEMO_DOCTORS = [
  {
    id: 'doctor-001',
    name: 'Dr. Sarah Chen',
    email: 'doctor@demo.com',
    specialty: 'Movement Disorders Neurology',
    hospital: 'NeuroCare Movement Center',
    assignedPatientIds: ['patient-101', 'patient-102'],
  },
];

// ============================================================
// Initial Alerts
// ============================================================
export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alert-001',
    patientId: 'patient-101',
    patientName: 'Robert Miller',
    domain: 'Sleep',
    title: 'Mild Daytime Sleepiness Logged',
    description: 'ESS score recorded at 7. Normal range is under 10. Continue tracking.',
    message: 'ESS score recorded at 7. Normal range is under 10. Continue tracking.',
    suggestedAction: 'Maintain regular sleep schedule and track evening habits.',
    severity: 'medium',
    category: 'Sleep',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2 days ago',
    acknowledged: false,
    isRead: false,
  },
];

// ============================================================
// Initial Caretaker Observations
// ============================================================
export const INITIAL_OBSERVATIONS: CaretakerObservation[] = [
  {
    id: 'obs-001',
    patientId: 'patient-101',
    caretakerId: 'caretaker-001',
    caretakerName: 'Susan Miller',
    domain: 'Sleep',
    note: 'Robert slept well throughout the night. Woke up refreshed this morning.',
    severity: 'mild',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Sleep',
    notes: 'Robert slept well throughout the night.',
    sentToDoctor: true,
  },
];

// ============================================================
// Initial Doctor Notes
// ============================================================
export const INITIAL_DOCTOR_NOTES: DoctorNote[] = [
  {
    id: 'note-001',
    patientId: 'patient-101',
    doctorId: 'doctor-001',
    doctorName: 'Dr. Sarah Chen',
    note: 'Baseline non-motor symptom assessment completed. Cognitive and motor scores are stable within expected target thresholds.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Review',
  },
];

export const INITIAL_MESSAGES: Message[] = [];
export const INITIAL_NOTIFICATIONS: Notification[] = [];
export const MODEL_METRICS: ModelMetrics = {
  model_type: 'Random Forest Non-Motor Classifier (PPMI Trained)',
  description: 'Trained on 14,833 PPMI visits across 35 non-motor features',
  target: 'Parkinsonian Risk & Burden Evaluation',
  n_features: 35,
  validation: '99.5% Accuracy, 1.000 ROC-AUC',
  limitation: 'Clinical decision support tool',
  feature_importance: [],
  domain_thresholds: {},
  disclaimer: 'For health tracking and clinical support',
};

export const getLatestVisit = (p: Patient) => p.visits && p.visits.length > 0 ? p.visits[p.visits.length - 1] : undefined;
export const ASSESSMENT_STEPS = [];
