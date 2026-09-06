import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Patient,
  Caretaker,
  Doctor,
  Alert,
  CaretakerObservation,
  DoctorNote,
  PatientVisit,
  MLPrediction,
  FeatureImportanceItem,
  MultiModalAssessmentReport,
  DomainSeverity,
  DomainScores,
} from '../types';
import {
  DEMO_PATIENTS,
  DEMO_CARETAKERS,
  DEMO_DOCTORS,
  INITIAL_ALERTS,
  INITIAL_OBSERVATIONS,
  INITIAL_DOCTOR_NOTES,
} from '../data/demoData';
import { useAuth } from './AuthContext';
import mlInferenceService, { ModelMetricsInfo } from '../services/mlInferenceService';

// Standard healthy baseline values for all 35 PPMI non-motor features
const DEFAULT_HEALTHY_VISIT: Omit<PatientVisit, 'event_id' | 'date' | 'burden'> = {
  // Cognition (10 features)
  np1_cog: 0,
  moca_total: 28,
  mocaTotal: 28,
  hvlt_total_recall: 52,
  hvlt_delayed_recall: 48,
  hvlt_retention: 46,
  sdmt_total: 48,
  sdmtTotal: 48,
  tmt_a_sec: 32,
  tmt_b_sec: 75,
  tmtbSecs: 75,
  lexical_fluency_total: 45,
  semantic_fluency_animals: 20,
  bnt_score: 28,
  clock_total: 7,

  // Sleep (3 features)
  np1_slpn: 0,
  np1_slpd: 0,
  ess_score: 5,
  essTotal: 5,
  rbdsq_score: 1,
  rbdsqScore: 1,

  // Mood & Behavior (6 features)
  np1_dprs: 0,
  np1_anxs: 0,
  np1_apat: 0,
  np1_hall: 0,
  np1_dds: 0,
  gds_score: 1,
  gdsScore: 1,
  stai_state: 30,
  stai_trait: 32,

  // Autonomic (9 features)
  np1_urin: 0,
  np1_cnst: 0,
  np1_lthd: 0,
  scopa_gi: 2,
  scopa_urinary: 2,
  scopa_cardiovascular: 1,
  scopa_thermoregulatory: 1,
  scopa_total: 6,
  scopaTotal: 6,
  orthostatic_drop_sys: 5,

  // Sensory & Fatigue (5 features)
  np1_pain: 0,
  np1_fatg: 0,
  upsit_total: 34,
  upsitTotal: 34,
  upsit_percentile: 50,
  hr_supine: 70,
  hr_standing: 74,
};

interface DataContextValue {
  // Patients & Current User State
  patients: Patient[];
  currentPatient: Patient | undefined;
  currentCaretaker: Caretaker | undefined;
  currentDoctor: Doctor | undefined;
  getPatient: (id: string) => Patient | undefined;
  createPatient: (userData: { id: string; name: string; email: string }) => void;

  // Caretakers & Doctors
  caretakers: Caretaker[];
  doctors: Doctor[];

  // ML Engine Outputs
  prediction: MLPrediction | null;
  featureImportances: FeatureImportanceItem[];
  modelMetrics: ModelMetricsInfo;

  // Alerts
  alerts: Alert[];
  acknowledgeAlert: (id: string) => void;

  // Observations
  observations: CaretakerObservation[];
  addObservation: (obs: { patientId: string; domain: string; note: string; severity: 'mild' | 'moderate' | 'severe' }) => void;

  // Doctor notes
  doctorNotes: DoctorNote[];
  addDoctorNote: (note: { patientId: string; doctorName: string; note: string }) => void;
  deleteDoctorNote: (id: string) => void;

  // Patient Assessment
  submitFullAssessment: (scores: Record<string, number>) => void;
  submitPatientAssessment: (scores: { essTotal?: number; rbdsqScore?: number; gdsScore?: number; mocaTotal?: number }) => void;
  latestMultiModal: MultiModalAssessmentReport | null;
  recordMultiModalAssessment: (data: Partial<MultiModalAssessmentReport>) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: any }) {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState<Patient[]>(DEMO_PATIENTS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [observations, setObservations] = useState<CaretakerObservation[]>(INITIAL_OBSERVATIONS);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>(INITIAL_DOCTOR_NOTES);

  // Latest multi-modal objective test report (starts null for fresh patient)
  const [latestMultiModal, setLatestMultiModal] = useState<MultiModalAssessmentReport | null>(null);

  // Auto-register new patient if logged in user is a patient and doesn't exist yet
  useEffect(() => {
    if (currentUser?.role === 'patient' && currentUser.patientId) {
      setPatients(prev => {
        if (prev.some(p => p.id === currentUser.patientId)) return prev;
        const newPatient: Patient = {
          id: currentUser.patientId!,
          displayId: `NC-${currentUser.patientId!.slice(-4)}`,
          name: currentUser.name,
          sex: 'Not Specified',
          enrollAge: 60,
          cohort: "Parkinson's Care",
          assignedDoctorId: 'doctor-001',
          assignedCaretakerId: 'caretaker-001',
          age: 60,
          gender: 'Not Specified',
          diagnosisYear: new Date().getFullYear(),
          overallBurdenScore: 0,
          riskStatus: 'low',
          visits: [], // Fresh new patient starts with empty visits!
        };
        return [newPatient, ...prev];
      });
    }
  }, [currentUser]);

  const createPatient = useCallback((userData: { id: string; name: string; email: string }) => {
    setPatients(prev => {
      if (prev.some(p => p.id === userData.id)) return prev;
      const newPatient: Patient = {
        id: userData.id,
        displayId: `NC-${userData.id.slice(-4)}`,
        name: userData.name,
        sex: 'Not Specified',
        enrollAge: 60,
        cohort: "Parkinson's Care",
        assignedDoctorId: 'doctor-001',
        assignedCaretakerId: 'caretaker-001',
        age: 60,
        gender: 'Not Specified',
        diagnosisYear: new Date().getFullYear(),
        overallBurdenScore: 0,
        riskStatus: 'low',
        visits: [],
      };
      return [newPatient, ...prev];
    });
  }, []);

  // Derive current role objects safely
  const currentPatient = useMemo(() => {
    if (!currentUser) return patients[0];
    if (currentUser.role === 'patient') {
      return patients.find(p => p.id === currentUser.patientId) || patients[0];
    }
    if (currentUser.assignedPatients && currentUser.assignedPatients.length > 0) {
      return patients.find(p => p.id === currentUser.assignedPatients![0]) || patients[0];
    }
    return patients[0];
  }, [currentUser, patients]);

  const currentCaretaker = useMemo(() => {
    return DEMO_CARETAKERS[0];
  }, []);

  const currentDoctor = useMemo(() => {
    return DEMO_DOCTORS[0];
  }, []);

  // ML Predictions for active patient using trained PPMI model
  const prediction = useMemo(() => {
    if (!currentPatient || !currentPatient.visits || currentPatient.visits.length === 0) return null;
    const latestVisit = currentPatient.visits[currentPatient.visits.length - 1];
    return mlInferenceService.predictRisk(latestVisit, latestMultiModal);
  }, [currentPatient, latestMultiModal]);

  const featureImportances = useMemo(() => {
    return mlInferenceService.getFeatureImportances();
  }, []);

  const modelMetrics = useMemo(() => {
    return mlInferenceService.getModelMetrics();
  }, []);

  const getPatient = useCallback((id: string) => patients.find(p => p.id === id), [patients]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true, isRead: true } : a));
  }, []);

  const addObservation = useCallback((obs: { patientId: string; domain: string; note: string; severity: 'mild' | 'moderate' | 'severe' }) => {
    const newObs: CaretakerObservation = {
      id: `obs-${Date.now()}`,
      patientId: obs.patientId,
      caretakerName: currentCaretaker?.name || 'Susan Miller',
      domain: obs.domain,
      note: obs.note,
      severity: obs.severity,
      timestamp: new Date().toLocaleDateString(),
      date: new Date().toLocaleDateString(),
      category: obs.domain,
      notes: obs.note,
      sentToDoctor: true,
    };
    setObservations(prev => [newObs, ...prev]);

    if (obs.severity === 'severe' || obs.severity === 'moderate') {
      const alert: Alert = {
        id: `alert-${Date.now()}`,
        patientId: obs.patientId,
        patientName: currentPatient?.name || 'Patient',
        title: `Caretaker Observation: ${obs.domain} Alert`,
        message: obs.note,
        severity: obs.severity === 'severe' ? 'high' : 'medium',
        type: 'symptom_spike',
        domain: obs.domain,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        isRead: false,
        acknowledged: false,
        actionRequired: 'Review observation in patient profile',
      };
      setAlerts(prev => [alert, ...prev]);
    }
  }, [currentCaretaker, currentPatient]);

  const addDoctorNote = useCallback((note: { patientId: string; doctorName: string; note: string }) => {
    const newNote: DoctorNote = {
      id: `note-${Date.now()}`,
      patientId: note.patientId,
      doctorName: note.doctorName,
      note: note.note,
      timestamp: new Date().toLocaleDateString(),
      date: new Date().toLocaleDateString(),
      category: 'Review',
    };
    setDoctorNotes(prev => [newNote, ...prev]);
  }, []);

  const deleteDoctorNote = useCallback((id: string) => {
    setDoctorNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const recordMultiModalAssessment = useCallback((data: Partial<MultiModalAssessmentReport>) => {
    setLatestMultiModal(prev => {
      const updated: MultiModalAssessmentReport = {
        timestamp: new Date().toLocaleDateString(),
        fingerTap: data.fingerTap ?? prev?.fingerTap,
        spiralDrawing: data.spiralDrawing ?? prev?.spiralDrawing,
        reactionSpeed: data.reactionSpeed ?? prev?.reactionSpeed,
        voicePhonation: data.voicePhonation ?? prev?.voicePhonation,
        nonMotorScores: data.nonMotorScores ?? prev?.nonMotorScores,
        overallRiskCategory: 'Low',
        compositeRiskScore: 30,
      };

      // Check for alert conditions
      if (data.fingerTap && data.fingerTap.variabilityCv > 30) {
        const newAlert: Alert = {
          id: `alert-tap-${Date.now()}`,
          patientId: currentPatient?.id || 'patient-101',
          patientName: currentPatient?.name || 'Patient',
          title: 'High Motor Rhythm Instability Detected',
          message: `Finger-tapping test revealed elevated rhythm jitter (CV: ${data.fingerTap.variabilityCv}%). Possible early motor fluctuation.`,
          severity: 'high',
          type: 'symptom_spike',
          domain: 'Motor',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString(),
          isRead: false,
          acknowledged: false,
          actionRequired: 'Review Parkinsonian motor rhythm logs',
        };
        setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
      }

      return updated;
    });
  }, [currentPatient]);

  // Submit complete non-motor assessment questionnaire (scores all 35 features)
  const submitFullAssessment = useCallback((scores: Record<string, number>) => {
    if (!currentPatient) return;

    // Merge with standard healthy defaults
    const draftVisit: any = {
      ...DEFAULT_HEALTHY_VISIT,
      ...scores,
    };

    // Ensure aliases are synchronized
    if (scores.ess_score !== undefined) draftVisit.essTotal = scores.ess_score;
    if (scores.rbdsq_score !== undefined) draftVisit.rbdsqScore = scores.rbdsq_score;
    if (scores.gds_score !== undefined) draftVisit.gdsScore = scores.gds_score;
    if (scores.moca_total !== undefined) draftVisit.mocaTotal = scores.moca_total;
    if (scores.sdmt_total !== undefined) draftVisit.sdmtTotal = scores.sdmt_total;
    if (scores.tmt_b_sec !== undefined) draftVisit.tmtbSecs = scores.tmt_b_sec;
    if (scores.upsit_total !== undefined) draftVisit.upsitTotal = scores.upsit_total;
    if (scores.scopa_total !== undefined) draftVisit.scopaTotal = scores.scopa_total;

    // Compute domain scores using the trained PPMI model feature definitions
    const domainScores = mlInferenceService.computeDomainScores(draftVisit);
    const domainMap: any = {
      sleep: 20,
      mood: 20,
      cognition: 20,
      autonomic: 20,
      sensory: 20,
      pain_fatigue: 20,
      psychosis: 0,
      overall: 20,
    };

    const severityMap: any = {
      sleep: 'low',
      mood: 'low',
      cognition: 'low',
      autonomic: 'low',
      sensory: 'low',
      pain_fatigue: 'low',
      psychosis: 'low',
      overall: 'low',
    };

    let sumScore = 0;
    domainScores.forEach(d => {
      const key = d.domain.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
      domainMap[key] = d.score;
      severityMap[key] = d.score > 55 ? 'high' : d.score > 30 ? 'moderate' : 'low';
      sumScore += d.score;
    });

    const overallScore = Math.round(sumScore / (domainScores.length || 1));
    domainMap.overall = overallScore;
    severityMap.overall = overallScore > 55 ? 'high' : overallScore > 30 ? 'moderate' : 'low';

    const visitNumber = (currentPatient.visits?.length || 0) + 1;
    const newVisit: PatientVisit = {
      ...draftVisit,
      event_id: `V${String(visitNumber).padStart(2, '0')}`,
      visitId: `Visit ${visitNumber}`,
      date: new Date().toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }),
      burden: {
        domain_scores: domainMap as DomainScores,
        severity_labels: severityMap as DomainSeverity,
        mci_risk_flags: (draftVisit.moca_total ?? 28) < 26 ? ['MoCA < 26 (Mild Cognitive Impairment Risk)'] : [],
        depression_screen_positive: (draftVisit.gds_score ?? 1) >= 5,
        excessive_daytime_sleepiness: (draftVisit.ess_score ?? 5) > 10,
        rbd_screen_positive: (draftVisit.rbdsq_score ?? 1) >= 5,
      },
    };

    // Update patient record with new visit and overall scores
    setPatients(prev => prev.map(p => {
      if (p.id !== currentPatient.id) return p;
      const existingVisits = p.visits || [];
      return {
        ...p,
        visits: [...existingVisits, newVisit],
        overallBurdenScore: overallScore,
        lastMoCA: newVisit.moca_total ?? 28,
        riskStatus: overallScore > 55 ? 'high' : overallScore > 30 ? 'medium' : 'low',
      };
    }));

    // Trigger alerts if high severity detected
    if ((draftVisit.ess_score && draftVisit.ess_score > 12) || (draftVisit.gds_score && draftVisit.gds_score >= 6) || overallScore > 55) {
      const alert: Alert = {
        id: `alert-survey-${Date.now()}`,
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        title: 'Elevated Non-Motor Burden Logged',
        message: `Health assessment logged overall non-motor burden of ${overallScore}/100. Clinical review recommended.`,
        severity: overallScore > 55 ? 'critical' : 'high',
        type: 'symptom_spike',
        domain: 'Non-Motor',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        isRead: false,
        acknowledged: false,
        actionRequired: 'Review non-motor assessment questionnaire',
      };
      setAlerts(prev => [alert, ...prev]);
    }
  }, [currentPatient]);

  // Legacy compatibility wrapper
  const submitPatientAssessment = useCallback((scores: { essTotal?: number; rbdsqScore?: number; gdsScore?: number; mocaTotal?: number }) => {
    const fullMap: Record<string, number> = {};
    if (scores.essTotal !== undefined) {
      fullMap.ess_score = scores.essTotal;
      fullMap.np1_slpd = scores.essTotal > 10 ? 2 : 1;
    }
    if (scores.rbdsqScore !== undefined) fullMap.rbdsq_score = scores.rbdsqScore;
    if (scores.gdsScore !== undefined) {
      fullMap.gds_score = scores.gdsScore;
      fullMap.np1_dprs = scores.gdsScore >= 5 ? 2 : 0;
    }
    if (scores.mocaTotal !== undefined) {
      fullMap.moca_total = scores.mocaTotal;
      fullMap.np1_cog = scores.mocaTotal < 26 ? 1 : 0;
    }
    submitFullAssessment(fullMap);
  }, [submitFullAssessment]);

  const value: DataContextValue = {
    patients,
    currentPatient,
    currentCaretaker,
    currentDoctor,
    getPatient,
    createPatient,
    caretakers: DEMO_CARETAKERS,
    doctors: DEMO_DOCTORS,
    prediction,
    featureImportances,
    modelMetrics,
    alerts,
    acknowledgeAlert,
    observations,
    addObservation,
    doctorNotes,
    addDoctorNote,
    deleteDoctorNote,
    submitFullAssessment,
    submitPatientAssessment,
    latestMultiModal,
    recordMultiModalAssessment,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
