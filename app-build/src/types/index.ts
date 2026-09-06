// NeuroCare TypeScript Types
// Based on verified PPMI dataset variables

export type UserRole = 'patient' | 'caretaker' | 'doctor';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  patientId?: string;       // for patients & caretakers
  assignedPatients?: string[]; // for doctors & caretakers
}

export interface DemoCredentials {
  email: string;
  password: string;
  role: UserRole;
  userId: string;
}

// ---- PPMI-derived Assessment Types ----

/** MDS-UPDRS Part I (Clinician-rated, non-motor) — 0-4 each */
export interface MDSUPDRSI {
  np1_cog: number | null;   // NP1COG - Cognitive impairment
  np1_hall: number | null;  // NP1HALL - Hallucinations & psychosis
  np1_dprs: number | null;  // NP1DPRS - Depressed mood
  np1_anxs: number | null;  // NP1ANXS - Anxious mood
  np1_apat: number | null;  // NP1APAT - Apathy
  np1_dds: number | null;   // NP1DDS - Dopamine dysregulation syndrome
}

/** MDS-UPDRS Part I Patient Questionnaire — 0-4 each */
export interface MDSUPDRSIPQ {
  np1_slpn: number | null;  // NP1SLPN - Nighttime sleep problems
  np1_slpd: number | null;  // NP1SLPD - Daytime sleepiness
  np1_pain: number | null;  // NP1PAIN - Pain and other sensations
  np1_urin: number | null;  // NP1URIN - Urinary problems
  np1_cnst: number | null;  // NP1CNST - Constipation
  np1_lthd: number | null;  // NP1LTHD - Light-headedness on standing
  np1_fatg: number | null;  // NP1FATG - Fatigue
}

/** Epworth Sleepiness Scale — items ESS1-ESS8, sum 0-24 */
export interface EpworthSleepinessScale {
  ess_score: number | null;  // Total 0-24; >10 = excessive daytime sleepiness
}

/** Geriatric Depression Scale — 15 items, sum 0-15 */
export interface GeriatricDepressionScale {
  gds_score: number | null;  // >=5 = depression screen positive
}

/** REM Sleep Behavior Disorder Screening Questionnaire — 13 items, sum 0-13 */
export interface REMSleepBehaviorScreening {
  rbdsq_score: number | null; // >=5 = RBD screen positive
}

/** State-Trait Anxiety Inventory — items 1-40 */
export interface StateTraitAnxiety {
  stai_state: number | null;  // Items 1-20, sum 20-80
  stai_trait: number | null;  // Items 21-40, sum 20-80
}

/** SCOPA-AUT Autonomic Symptoms */
export interface SCOPAAutonomic {
  scopa_gi: number | null;              // GI subscore SCAU1-7 (0-21)
  scopa_urinary: number | null;         // Urinary SCAU8-13 (0-18)
  scopa_cardiovascular: number | null;  // Cardiovascular SCAU14-16 (0-9)
  scopa_thermoregulatory: number | null;// Thermo SCAU17-21 (0-15)
  scopa_total: number | null;           // Total (0-69)
}

/** Montreal Cognitive Assessment */
export interface MontréalCognitiveAssessment {
  moca_total: number | null;  // MCATOT, 0-30; <26 = below normal
}

/** Hopkins Verbal Learning Test – Revised */
export interface HopkinsVerbalLearning {
  hvlt_total_recall: number | null;   // DVT_TOTAL_RECALL (T-score)
  hvlt_delayed_recall: number | null; // DVT_DELAYED_RECALL (T-score)
  hvlt_retention: number | null;      // DVT_RETENTION
}

/** Symbol Digit Modalities Test */
export interface SymbolDigitModalitiesTest {
  sdmt_total: number | null;  // SDMTOTAL, higher=better, processing speed
}

/** Trail Making Test A and B */
export interface TrailMakingTest {
  tmt_a_sec: number | null;  // TMTASEC, seconds, lower=better
  tmt_b_sec: number | null;  // TMTBSEC, seconds, lower=better (executive)
}

/** Lexical Fluency (FAS) */
export interface LexicalFluency {
  lexical_fluency_total: number | null;  // LXFLUEF + LXFLUEA + LXFLUES
}

/** UPSIT Smell Identification */
export interface USPITSmell {
  upsit_total: number | null;       // TOTAL_CORRECT, 0-40, lower=worse
  upsit_percentile: number | null;  // UPSIT_PRCNTGE
}

/** Vital Signs (orthostatic) */
export interface VitalSigns {
  orthostatic_drop_sys: number | null;  // SYSSUP - SYSSTND; >20=OH
  hr_supine: number | null;
  hr_standing: number | null;
}

export type SeverityLevel = 'unknown' | 'low' | 'moderate' | 'high' | 'severe';

export interface DomainScores {
  sleep: number | null;
  mood: number | null;
  cognition: number | null;
  autonomic: number | null;
  sensory: number | null;
  pain_fatigue: number | null;
  psychosis: number | null;
  overall: number | null;
}

export interface DomainSeverity {
  sleep: SeverityLevel;
  mood: SeverityLevel;
  cognition: SeverityLevel;
  autonomic: SeverityLevel;
  sensory: SeverityLevel;
  pain_fatigue: SeverityLevel;
  psychosis: SeverityLevel;
  overall: SeverityLevel;
}

export interface BurdenAssessment {
  domain_scores: DomainScores;
  severity_labels: DomainSeverity;
  mci_risk_flags: string[];
  depression_screen_positive: boolean;
  excessive_daytime_sleepiness: boolean;
  rbd_screen_positive: boolean;
}

/** A single longitudinal visit with all non-motor assessments */
export interface PatientVisit {
  event_id: string;
  visitId?: string;
  date: string;

  // MDS-UPDRS Part I
  np1_cog: number | null;
  np1_hall: number | null;
  np1_dprs: number | null;
  np1_anxs: number | null;
  np1_apat: number | null;
  np1_dds: number | null;

  np1cog?: number;
  np1hall?: number;
  np1dprs?: number;
  np1anxs?: number;
  np1apat?: number;
  np1dds?: number;

  // MDS-UPDRS Part I PQ
  np1_slpn: number | null;
  np1_slpd: number | null;
  np1_pain: number | null;
  np1_urin: number | null;
  np1_cnst: number | null;
  np1_lthd: number | null;
  np1_fatg: number | null;

  np1slpn?: number;
  np1slpd?: number;
  np1pain?: number;
  np1urin?: number;
  np1cnst?: number;
  np1lthd?: number;
  np1fatg?: number;

  // ESS
  ess_score: number | null;
  essTotal?: number;

  // GDS
  gds_score: number | null;
  gdsScore?: number;

  // RBDSQ
  rbdsq_score: number | null;
  rbdsqScore?: number;

  // STAI
  stai_state: number | null;
  stai_trait: number | null;

  // SCOPA-AUT
  scopa_gi: number | null;
  scopa_urinary: number | null;
  scopa_cardiovascular: number | null;
  scopa_thermoregulatory: number | null;
  scopa_total: number | null;
  scopaTotal?: number;

  // Cognitive tests
  moca_total: number | null;
  mocaTotal?: number;
  hvlt_total_recall: number | null;
  hvlt_delayed_recall: number | null;
  hvlt_retention: number | null;
  sdmt_total: number | null;
  sdmtTotal?: number;
  tmt_a_sec: number | null;
  tmt_b_sec: number | null;
  tmtbSecs?: number;
  lexical_fluency_total: number | null;
  semantic_fluency_animals: number | null;
  bnt_score: number | null;
  clock_total: number | null;

  // Sensory
  upsit_total: number | null;
  upsitTotal?: number;
  upsit_percentile: number | null;

  // Vitals
  orthostatic_drop_sys: number | null;
  hr_supine: number | null;
  hr_standing: number | null;

  // Computed burden
  burden: BurdenAssessment;
}

export interface PPMIPatient {
  patno: string;
  display_id: string;
  sex: string;
  enroll_age: number | null;
  cohort: string;
  visits: PatientVisit[];
}

// ---- App-level Types ----

export interface Patient {
  id: string;
  displayId: string;
  name: string;
  sex: string;
  enrollAge: number | null;
  cohort: string;
  assignedDoctorId: string;
  assignedCaretakerId: string;
  ppmiData?: PPMIPatient;
  ppmiPatno?: string;
  age?: number;
  gender?: string;
  diagnosisYear?: number;
  overallBurdenScore?: number;
  lastMoCA?: number;
  riskStatus?: 'low' | 'medium' | 'high';
  visits?: PatientVisit[];
}

export interface Caretaker {
  id: string;
  name: string;
  email: string;
  connectedPatientIds: string[];
  assignedPatientIds?: string[];
  phone?: string;
  relationship?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  hospital: string;
  assignedPatientIds: string[];
}

export interface TrendPoint {
  date: string;
  value: number | null;
  eventId: string;
}

export interface TrendData {
  domain: keyof DomainScores;
  label: string;
  points: TrendPoint[];
  unit?: string;
  higherIsBetter?: boolean;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical' | 'info' | 'warning' | 'urgent';

export interface Alert {
  id: string;
  patientId: string;
  patientName?: string;
  domain?: string;
  title: string;
  description?: string;
  suggestedAction?: string;
  actionRequired?: string;
  type?: string;
  date?: string;
  message?: string;
  severity: AlertSeverity;
  category?: string;
  timestamp?: string;
  createdAt?: string;
  acknowledged?: boolean;
  isRead?: boolean;
}

export interface CaretakerObservation {
  id: string;
  patientId: string;
  caretakerId?: string;
  caretakerName: string;
  domain?: string;
  note?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  timestamp?: string;
  date?: string;
  category?: string;
  notes?: string;
  sentToDoctor?: boolean;
}

export interface DoctorNote {
  id: string;
  patientId: string;
  doctorId?: string;
  doctorName: string;
  note?: string;
  timestamp?: string;
  date?: string;
  category?: string;
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  fromRole: UserRole;
  toId: string;
  toRole: UserRole;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
}

export interface FeatureImportanceItem {
  feature: string;
  label?: string;
  category?: string;
  domain?: string;
  importance: number;
  importance_pct?: number;
  direction?: 'positive' | 'negative';
  description?: string;
}

export interface FeatureContribution {
  feature: string;
  label: string;
  importance: number;
  direction?: 'positive' | 'negative';
}

export interface ModelMetrics {
  model_type: string;
  description: string;
  target: string;
  n_features: number;
  validation: string;
  limitation: string;
  feature_importance: FeatureContribution[];
  domain_thresholds: Record<string, string>;
  disclaimer: string;
}

export interface NonMotorDomainScores {
  sleep: number;
  mood: number;
  cognition: number;
  autonomic: number;
  sensory: number;
  fatiguePain: number;
}

export interface MLPrediction {
  cognitiveImpairmentRisk: number;
  mciProbability: number;
  depressionRiskScore: number;
  sleepDisorderRiskScore: number;
  autonomicDysfunctionRiskScore: number;
  overallNonMotorBurdenScore: number;
  progressionSpeed: 'Slow' | 'Moderate' | 'Rapid' | 'Stable';
  topRiskFactors: string[];
  confidenceScore: number;
  recommendedInterventions: string[];
  modelTimestamp: string;
}

export interface AssessmentStep {
  id: string;
  title: string;
  description: string;
  domain: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  field: keyof PatientVisit;
  text: string;
  type: 'scale' | 'binary' | 'number';
  scale?: {
    min: number;
    max: number;
    labels: string[];
  };
  required: boolean;
}

export interface AssessmentResponse {
  [field: string]: number | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: string;
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
}

// Multi-Modal Assessment Types (beyond standard MCQ)
export interface FingerTapResult {
  tapCount: number;
  cadenceHz: number;
  meanIntervalMs: number;
  variabilityCv: number; // Coefficient of variation of inter-tap intervals
  bradykinesiaIndex: number; // 0-100
  timestamp: string;
}

export interface SpiralDrawingResult {
  smoothnessScore: number; // 0-100
  tremorRipples: number;
  meanDeviationPx: number;
  drawingDurationSec: number;
  timestamp: string;
}

export interface ReactionSpeedResult {
  meanReactionTimeMs: number;
  accuracyPct: number;
  correctCount: number;
  totalTrials: number;
  speedCategory: 'Normal' | 'Mild Delay' | 'Significant Delay';
  timestamp: string;
}

export interface VoicePhonationResult {
  durationSeconds: number;
  steadinessScore: number; // 0-100
  stabilityCategory: 'Stable' | 'Mild Fluctuation' | 'Tremor Detected';
  timestamp: string;
}

export interface MultiModalAssessmentReport {
  timestamp: string;
  fingerTap?: FingerTapResult;
  spiralDrawing?: SpiralDrawingResult;
  reactionSpeed?: ReactionSpeedResult;
  voicePhonation?: VoicePhonationResult;
  nonMotorScores?: {
    essTotal?: number;
    rbdsqScore?: number;
    gdsScore?: number;
    mocaTotal?: number;
    scopaTotal?: number;
  };
  overallRiskCategory: 'Low' | 'Moderate' | 'High' | 'Critical';
  compositeRiskScore: number; // 0-100
}

