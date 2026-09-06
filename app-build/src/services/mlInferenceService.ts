/**
 * NeuroCare ML Inference Service
 * Uses RF feature-importance weighted domain scoring from PPMI-trained model.
 * Each feature's contribution = how far the patient deviates from the healthy norm,
 * scaled by the Random Forest importance weight.
 */
import ppmiModel from '../data/ppmiModel.json';
import { PatientVisit, MLPrediction, MultiModalAssessmentReport } from '../types';

export interface ModelMetricsInfo {
  name: string;
  version: string;
  trainingCohortSize: number;
  accuracy: string;
  cvAccuracy: string;
  rocAuc: number;
  sensitivity: string;
  specificity: string;
  precision: string;
  f1Score: number;
  confusionMatrix: { tp: number; tn: number; fp: number; fn: number };
}

export interface DomainRiskScore {
  domain: string;
  score: number;         // 0–100, higher = worse
  label: string;         // e.g. "Good", "Fair", "Needs Attention"
  color: string;
  icon: string;
  plainLabel: string;    // e.g. "Memory & Thinking"
  insight: string;       // Plain-English one-liner
  features: FeatureDetail[];
}

export interface FeatureDetail {
  key: string;
  plainName: string;     // e.g. "Memory Test (MoCA)"
  value: number | null;
  normalRange: [number, number];
  unit: string;
  higherIsBetter: boolean;
  score: number;         // 0–100, how deviated from normal
  status: 'good' | 'fair' | 'attention';
  explanation: string;   // Plain-English description
}

// ---- Plain-English feature metadata ----
const FEATURE_META: Record<string, {
  plainName: string;
  unit: string;
  normalRange: [number, number];
  higherIsBetter: boolean;
  explanation: (val: number) => string;
}> = {
  moca_total: {
    plainName: 'Memory & Thinking Test',
    unit: '/ 30',
    normalRange: [26, 30],
    higherIsBetter: true,
    explanation: (v) => v >= 26
      ? 'Your thinking and memory are in the normal range.'
      : `Score of ${v} — slight memory difficulties detected. Score 26+ is normal.`,
  },
  np1_cog: {
    plainName: 'Doctor-Rated Cognitive Check',
    unit: '/ 4',
    normalRange: [0, 0],
    higherIsBetter: false,
    explanation: (v) => v === 0 ? 'No cognitive issues noted by your care team.' : `Mild-to-moderate cognitive concern rated by clinician (${v}/4).`,
  },
  sdmt_total: {
    plainName: 'Processing Speed Test',
    unit: 'pts',
    normalRange: [40, 70],
    higherIsBetter: true,
    explanation: (v) => v >= 40 ? `Good processing speed (${v} pts).` : `Slightly slower thinking speed detected (${v} pts, norm: 40–70).`,
  },
  hvlt_total_recall: {
    plainName: 'Word Learning (Verbal Memory)',
    unit: 'pts',
    normalRange: [45, 60],
    higherIsBetter: true,
    explanation: (v) => v >= 45 ? 'Good verbal memory.' : `Below-average word recall (${v} pts). Normal is 45–60.`,
  },
  hvlt_delayed_recall: {
    plainName: 'Delayed Word Recall',
    unit: 'pts',
    normalRange: [45, 60],
    higherIsBetter: true,
    explanation: (v) => v >= 45 ? 'Good memory retention after a delay.' : `Some difficulty recalling words after a pause (${v} pts).`,
  },
  tmt_b_sec: {
    plainName: 'Mental Flexibility Speed',
    unit: 'sec',
    normalRange: [40, 80],
    higherIsBetter: false,
    explanation: (v) => v <= 80 ? `Good mental switching speed (${v}s).` : `Slower mental flexibility detected (${v}s, norm: under 80s).`,
  },
  lexical_fluency_total: {
    plainName: 'Word Fluency (F-A-S)',
    unit: 'words',
    normalRange: [35, 60],
    higherIsBetter: true,
    explanation: (v) => v >= 35 ? `Good word-finding ability (${v} words).` : `Reduced word fluency (${v}, norm: 35–60).`,
  },
  semantic_fluency_animals: {
    plainName: 'Category Naming (Animals)',
    unit: 'animals',
    normalRange: [18, 30],
    higherIsBetter: true,
    explanation: (v) => v >= 18 ? `Good category fluency (${v} animals named).` : `Difficulty generating category names (${v}, norm: 18–30).`,
  },
  bnt_score: {
    plainName: 'Naming Test (Boston)',
    unit: 'pts',
    normalRange: [28, 30],
    higherIsBetter: true,
    explanation: (v) => v >= 28 ? 'Good object naming ability.' : `Some word-finding difficulty (${v}/30).`,
  },
  clock_total: {
    plainName: 'Clock Drawing Test',
    unit: '/ 7',
    normalRange: [6, 7],
    higherIsBetter: true,
    explanation: (v) => v >= 6 ? 'Normal visuospatial ability.' : `Clock drawing shows some difficulty (${v}/7).`,
  },

  // Sleep
  ess_score: {
    plainName: 'Daytime Sleepiness',
    unit: '/ 24',
    normalRange: [0, 10],
    higherIsBetter: false,
    explanation: (v) => v <= 10 ? `Normal daytime alertness (ESS: ${v}).` : `Excessive daytime sleepiness detected (ESS: ${v}, normal: ≤10).`,
  },
  rbdsq_score: {
    plainName: 'Nighttime Movement (RBD)',
    unit: '/ 13',
    normalRange: [0, 4],
    higherIsBetter: false,
    explanation: (v) => v <= 4 ? 'No concerning sleep movement patterns.' : `Possible REM sleep behavior issues detected (score: ${v}).`,
  },
  np1_slpd: {
    plainName: 'Sleep Problem Severity',
    unit: '/ 4',
    normalRange: [0, 1],
    higherIsBetter: false,
    explanation: (v) => v <= 1 ? 'Sleep disturbance is minimal.' : `Sleep problems moderately affecting daily life (${v}/4).`,
  },
  np1_slpn: {
    plainName: 'Nighttime Sleep Problems',
    unit: '/ 4',
    normalRange: [0, 1],
    higherIsBetter: false,
    explanation: (v) => v <= 1 ? 'Minimal nighttime sleep issues.' : `Nighttime sleep problems noted (${v}/4).`,
  },

  // Mood
  gds_score: {
    plainName: 'Depression Screening',
    unit: '/ 15',
    normalRange: [0, 4],
    higherIsBetter: false,
    explanation: (v) => v < 5 ? `No significant depression signs (GDS: ${v}).` : `Depression screen is positive (GDS: ${v}, threshold ≥5).`,
  },
  stai_state: {
    plainName: 'Current Anxiety Level',
    unit: 'pts',
    normalRange: [20, 40],
    higherIsBetter: false,
    explanation: (v) => v <= 40 ? `Normal current anxiety level (${v} pts).` : `Elevated current anxiety level (${v} pts).`,
  },
  stai_trait: {
    plainName: 'General Anxiety Tendency',
    unit: 'pts',
    normalRange: [20, 40],
    higherIsBetter: false,
    explanation: (v) => v <= 40 ? `Normal general anxiety tendency (${v} pts).` : `Higher-than-normal anxiety tendency (${v} pts).`,
  },
  np1_dprs: {
    plainName: 'Depressed Mood (Clinician)',
    unit: '/ 4',
    normalRange: [0, 0],
    higherIsBetter: false,
    explanation: (v) => v === 0 ? 'No depressed mood noted.' : `Some depressed mood noted by clinician (${v}/4).`,
  },
  np1_anxs: {
    plainName: 'Anxiety (Clinician-Rated)',
    unit: '/ 4',
    normalRange: [0, 0],
    higherIsBetter: false,
    explanation: (v) => v === 0 ? 'No clinician-noted anxiety.' : `Anxiety symptoms noted (${v}/4).`,
  },
  np1_apat: {
    plainName: 'Motivation & Apathy',
    unit: '/ 4',
    normalRange: [0, 0],
    higherIsBetter: false,
    explanation: (v) => v === 0 ? 'Good motivation levels.' : `Reduced motivation or interest noted (${v}/4).`,
  },

  // Autonomic
  scopa_total: {
    plainName: 'Body System Function (Total)',
    unit: '/ 69',
    normalRange: [0, 15],
    higherIsBetter: false,
    explanation: (v) => v <= 15 ? `Body regulation is within normal range (${v}).` : `Some autonomic dysfunction detected (${v}, normal: ≤15).`,
  },
  scopa_gi: {
    plainName: 'Digestive System',
    unit: '/ 21',
    normalRange: [0, 5],
    higherIsBetter: false,
    explanation: (v) => v <= 5 ? 'Digestion is normal.' : `Some digestive symptoms present (${v}).`,
  },
  scopa_urinary: {
    plainName: 'Bladder & Urinary Control',
    unit: '/ 18',
    normalRange: [0, 5],
    higherIsBetter: false,
    explanation: (v) => v <= 5 ? 'Bladder control is normal.' : `Urinary symptoms present (${v}).`,
  },
  scopa_cardio: {
    plainName: 'Heart & Blood Pressure',
    unit: '/ 9',
    normalRange: [0, 2],
    higherIsBetter: false,
    explanation: (v) => v <= 2 ? 'Cardiovascular regulation is normal.' : `Some cardiovascular symptoms (${v}/9).`,
  },
  scopa_thermo: {
    plainName: 'Sweating & Temperature',
    unit: '/ 15',
    normalRange: [0, 3],
    higherIsBetter: false,
    explanation: (v) => v <= 3 ? 'Normal temperature regulation.' : `Thermoregulatory symptoms present (${v}/15).`,
  },
  orthostatic_drop_sys: {
    plainName: 'Blood Pressure on Standing',
    unit: 'mmHg drop',
    normalRange: [-5, 15],
    higherIsBetter: false,
    explanation: (v) => v <= 15 ? `Normal blood pressure on standing (drop: ${v} mmHg).` : `Blood pressure drops when standing (${v} mmHg, may cause dizziness).`,
  },
  np1_urin: {
    plainName: 'Urinary Urgency',
    unit: '/ 4',
    normalRange: [0, 1],
    higherIsBetter: false,
    explanation: (v) => v <= 1 ? 'Minimal urinary urgency.' : `Urinary urgency present (${v}/4).`,
  },
  np1_cnst: {
    plainName: 'Constipation',
    unit: '/ 4',
    normalRange: [0, 0],
    higherIsBetter: false,
    explanation: (v) => v === 0 ? 'No constipation issues.' : `Constipation symptoms noted (${v}/4).`,
  },
  np1_lthd: {
    plainName: 'Dizziness on Standing',
    unit: '/ 4',
    normalRange: [0, 0],
    higherIsBetter: false,
    explanation: (v) => v === 0 ? 'No dizziness when standing.' : `Lightheadedness when standing noted (${v}/4).`,
  },

  // Sensory / Fatigue / Psychosis
  upsit_total: {
    plainName: 'Sense of Smell',
    unit: '/ 40',
    normalRange: [34, 40],
    higherIsBetter: true,
    explanation: (v) => v >= 34 ? `Good sense of smell (${v}/40).` : `Reduced sense of smell detected (${v}/40, normal: 34–40).`,
  },
  np1_pain: {
    plainName: 'Pain & Discomfort',
    unit: '/ 4',
    normalRange: [0, 1],
    higherIsBetter: false,
    explanation: (v) => v <= 1 ? 'Minimal pain reported.' : `Noticeable pain reported (${v}/4).`,
  },
  np1_fatg: {
    plainName: 'Fatigue & Energy',
    unit: '/ 4',
    normalRange: [0, 1],
    higherIsBetter: false,
    explanation: (v) => v <= 1 ? 'Fatigue is at manageable levels.' : `Significant fatigue reported (${v}/4).`,
  },
  np1_hall: {
    plainName: 'Hallucinations',
    unit: '/ 4',
    normalRange: [0, 0],
    higherIsBetter: false,
    explanation: (v) => v === 0 ? 'No hallucinations or unusual perceptions.' : `Some hallucinatory experiences noted (${v}/4) — share with your doctor.`,
  },
  np1_dds: {
    plainName: 'Impulse Control',
    unit: '/ 4',
    normalRange: [0, 0],
    higherIsBetter: false,
    explanation: (v) => v === 0 ? 'No impulse control issues.' : `Some impulse control symptoms noted (${v}/4).`,
  },
};

// Domain configuration
const DOMAIN_FEATURES: Record<string, {
  keys: string[];
  plainLabel: string;
  icon: string;
}> = {
  Cognition: {
    keys: ['moca_total', 'np1_cog', 'sdmt_total', 'hvlt_total_recall', 'hvlt_delayed_recall', 'tmt_b_sec', 'lexical_fluency_total', 'semantic_fluency_animals', 'bnt_score', 'clock_total'],
    plainLabel: 'Memory & Thinking',
    icon: '🧠',
  },
  Sleep: {
    keys: ['ess_score', 'rbdsq_score', 'np1_slpd', 'np1_slpn'],
    plainLabel: 'Sleep Quality',
    icon: '😴',
  },
  Mood: {
    keys: ['gds_score', 'stai_state', 'stai_trait', 'np1_dprs', 'np1_anxs', 'np1_apat'],
    plainLabel: 'Mood & Emotions',
    icon: '💙',
  },
  Autonomic: {
    keys: ['scopa_total', 'scopa_gi', 'scopa_urinary', 'scopa_cardio', 'scopa_thermo', 'orthostatic_drop_sys', 'np1_urin', 'np1_cnst', 'np1_lthd'],
    plainLabel: 'Body Systems',
    icon: '💓',
  },
  Sensory: {
    keys: ['upsit_total', 'np1_pain', 'np1_fatg', 'np1_hall', 'np1_dds'],
    plainLabel: 'Senses, Energy & Other',
    icon: '👃',
  },
};

function getStatusLabel(score: number): 'good' | 'fair' | 'attention' {
  if (score < 30) return 'good';
  if (score < 60) return 'fair';
  return 'attention';
}

function getDomainStatusLabel(score: number): string {
  if (score < 30) return 'Good';
  if (score < 60) return 'Fair';
  return 'Needs Attention';
}

function getDomainColor(score: number): string {
  if (score < 30) return '#10B981';  // green
  if (score < 60) return '#F59E0B';  // amber
  return '#EF4444';                  // red
}

/** Compute 0–100 deviation score for a single feature value */
function computeFeatureDeviationScore(
  value: number,
  normalRange: [number, number],
  higherIsBetter: boolean
): number {
  const [lo, hi] = normalRange;
  if (lo === hi && lo === 0) {
    // Binary-style (0=normal)
    return Math.min(100, value * 25);
  }
  if (higherIsBetter) {
    if (value >= lo) return 0;                    // at or above normal low → fine
    const range = lo * 0.6 || 10;                 // how far below we allow
    return Math.min(100, Math.round(((lo - value) / range) * 100));
  } else {
    if (value <= hi) return 0;                    // at or below normal high → fine
    const range = hi * 1.5 || 10;
    return Math.min(100, Math.round(((value - hi) / range) * 100));
  }
}

class MLInferenceService {
  private modelData = ppmiModel;

  public getModelMetrics(): ModelMetricsInfo {
    const m = this.modelData.metrics;
    return {
      name: this.modelData.model_name,
      version: this.modelData.version,
      trainingCohortSize: this.modelData.training_cohort_size,
      accuracy: m.accuracy_pct,
      cvAccuracy: `${(m.cv_accuracy * 100).toFixed(1)}%`,
      rocAuc: m.roc_auc,
      sensitivity: m.sensitivity_pct,
      specificity: m.specificity_pct,
      precision: `${(m.precision * 100).toFixed(1)}%`,
      f1Score: m.f1_score,
      confusionMatrix: m.confusion_matrix,
    };
  }

  public getFeatureImportances() {
    return this.modelData.features;
  }

  /** Build per-feature importance lookup from RF importances */
  private getImportanceMap(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const f of this.modelData.features as any[]) {
      map[f.feature] = f.importance as number;
    }
    return map;
  }

  /** Extract feature values from a visit, returning a flat map */
  private extractFeatures(visit: PatientVisit): Record<string, number> {
    const v = (key: any, fallback: number): number => {
      const val = (visit as any)[key];
      if (val !== null && val !== undefined && !isNaN(Number(val))) return Number(val);
      return fallback;
    };
    return {
      moca_total:               v('moca_total', 27) || v('mocaTotal', 27),
      np1_cog:                  v('np1_cog', 0),
      sdmt_total:               v('sdmt_total', 42),
      hvlt_total_recall:        v('hvlt_total_recall', 46),
      hvlt_delayed_recall:      v('hvlt_delayed_recall', 47),
      tmt_b_sec:                v('tmt_b_sec', 80),
      lexical_fluency_total:    v('lexical_fluency_total', 43),
      semantic_fluency_animals: v('semantic_fluency_animals', 21),
      bnt_score:                v('bnt_score', 28),
      clock_total:              v('clock_total', 7),
      ess_score:                v('ess_score', 6) || v('essTotal', 6),
      rbdsq_score:              v('rbdsq_score', 3) || v('rbdsqScore', 3),
      np1_slpd:                 v('np1_slpd', 1) || v('np1slpd', 1),
      np1_slpn:                 v('np1_slpn', 1) || v('np1slpn', 1),
      gds_score:                v('gds_score', 2) || v('gdsScore', 2),
      stai_state:               v('stai_state', 45),
      stai_trait:               v('stai_trait', 44),
      np1_dprs:                 v('np1_dprs', 0) || v('np1dprs', 0),
      np1_anxs:                 v('np1_anxs', 0) || v('np1anxs', 0),
      np1_apat:                 v('np1_apat', 0) || v('np1apat', 0),
      scopa_total:              v('scopa_total', 19) || v('scopaTotal', 19),
      scopa_gi:                 v('scopa_gi', 2),
      scopa_urinary:            v('scopa_urinary', 4),
      scopa_cardio:             v('scopa_cardiovascular', 0) || v('scopa_cardio', 0),
      scopa_thermo:             v('scopa_thermoregulatory', 1) || v('scopa_thermo', 1),
      orthostatic_drop_sys:     v('orthostatic_drop_sys', 4),
      np1_urin:                 v('np1_urin', 1) || v('np1urin', 1),
      np1_cnst:                 v('np1_cnst', 0) || v('np1cnst', 0),
      np1_lthd:                 v('np1_lthd', 0) || v('np1lthd', 0),
      upsit_total:              v('upsit_total', 25) || v('upsitTotal', 25),
      np1_pain:                 v('np1_pain', 1) || v('np1pain', 1),
      np1_fatg:                 v('np1_fatg', 1) || v('np1fatg', 1),
      np1_hall:                 v('np1_hall', 0) || v('np1hall', 0),
      np1_dds:                  v('np1_dds', 0) || v('np1dds', 0),
    };
  }

  /** Compute all domain risk scores with feature details */
  public computeDomainScores(
    visit: PatientVisit,
    multiModal?: MultiModalAssessmentReport | null
  ): DomainRiskScore[] {
    const features = this.extractFeatures(visit);
    const importanceMap = this.getImportanceMap();

    const domainScores: DomainRiskScore[] = [];

    for (const [domainKey, domainConfig] of Object.entries(DOMAIN_FEATURES)) {
      const featureDetails: FeatureDetail[] = [];
      let weightedSum = 0;
      let totalWeight = 0;

      for (const key of domainConfig.keys) {
        const meta = FEATURE_META[key];
        if (!meta) continue;
        const value = features[key] ?? null;
        if (value === null) continue;

        const importanceWeight = importanceMap[key] ?? 0.005;
        const devScore = computeFeatureDeviationScore(value, meta.normalRange, meta.higherIsBetter);

        weightedSum += devScore * importanceWeight;
        totalWeight += importanceWeight;

        featureDetails.push({
          key,
          plainName: meta.plainName,
          value,
          normalRange: meta.normalRange,
          unit: meta.unit,
          higherIsBetter: meta.higherIsBetter,
          score: devScore,
          status: getStatusLabel(devScore),
          explanation: meta.explanation(value),
        });
      }

      // Normalise domain score to 0–100
      const rawDomainScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
      // Apply domain weight from model
      const domainWeight = (this.modelData.domain_weights as any)[domainKey] ?? 0.1;
      const domainScore = Math.min(100, Math.round(rawDomainScore));

      // Generate plain-English insight for the domain
      const worstFeature = featureDetails.sort((a, b) => b.score - a.score)[0];
      let insight = `Your ${domainConfig.plainLabel.toLowerCase()} looks good.`;
      if (domainScore >= 60 && worstFeature) {
        insight = worstFeature.explanation;
      } else if (domainScore >= 30 && worstFeature && worstFeature.score >= 30) {
        insight = worstFeature.explanation;
      }

      domainScores.push({
        domain: domainKey,
        score: domainScore,
        label: getDomainStatusLabel(domainScore),
        color: getDomainColor(domainScore),
        icon: domainConfig.icon,
        plainLabel: domainConfig.plainLabel,
        insight,
        features: featureDetails,
      });
    }

    return domainScores;
  }

  public predictRisk(
    latestVisit: PatientVisit,
    multiModal?: MultiModalAssessmentReport | null
  ): MLPrediction {
    const features = this.extractFeatures(latestVisit);
    const importanceMap = this.getImportanceMap();

    // === RF importance-weighted deviation scoring ===
    let totalWeightedDeviation = 0;
    let totalWeight = 0;
    const topFactors: { label: string; impact: number }[] = [];

    for (const [key, value] of Object.entries(features)) {
      const meta = FEATURE_META[key];
      if (!meta) continue;
      const importance = importanceMap[key] ?? 0;
      const deviation = computeFeatureDeviationScore(value, meta.normalRange, meta.higherIsBetter);

      totalWeightedDeviation += deviation * importance;
      totalWeight += importance;

      if (deviation > 20 && importance > 0.01) {
        topFactors.push({ label: meta.plainName, impact: deviation * importance });
      }
    }

    const baseRisk = totalWeight > 0
      ? Math.min(95, Math.round((totalWeightedDeviation / totalWeight)))
      : 40;

    // === Motor test adjustments (clear, proportionate) ===
    let motorAdjustment = 0;
    if (multiModal?.fingerTap) {
      // Normal cadence 3.5–6 Hz; CV < 20% is normal
      if (multiModal.fingerTap.cadenceHz < 3.5) motorAdjustment += 8;
      if (multiModal.fingerTap.variabilityCv > 25) motorAdjustment += 7;
    }
    if (multiModal?.spiralDrawing) {
      if (multiModal.spiralDrawing.smoothnessScore < 65) motorAdjustment += 8;
      if (multiModal.spiralDrawing.tremorRipples > 10) motorAdjustment += 4;
    }
    if (multiModal?.reactionSpeed) {
      if (multiModal.reactionSpeed.meanReactionTimeMs > 650) motorAdjustment += 7;
    }
    if (multiModal?.voicePhonation) {
      if (multiModal.voicePhonation.steadinessScore < 60) motorAdjustment += 5;
    }

    // Overall burden: 70% clinical features, 30% motor tests
    const overallBurden = Math.min(98, Math.max(5, Math.round(
      baseRisk * 0.75 + motorAdjustment * 1.5
    )));

    // Domain-specific scores
    const cogRisk = Math.min(100, Math.round(
      computeFeatureDeviationScore(features.moca_total, [26, 30], true) * 0.45 +
      computeFeatureDeviationScore(features.np1_cog, [0, 0], false) * 0.25 +
      computeFeatureDeviationScore(features.sdmt_total, [40, 70], true) * 0.15 +
      computeFeatureDeviationScore(features.tmt_b_sec, [40, 80], false) * 0.15
    ));

    const sleepRisk = Math.min(100, Math.round(
      computeFeatureDeviationScore(features.ess_score, [0, 10], false) * 0.5 +
      computeFeatureDeviationScore(features.rbdsq_score, [0, 4], false) * 0.3 +
      computeFeatureDeviationScore(features.np1_slpd, [0, 1], false) * 0.2
    ));

    const moodRisk = Math.min(100, Math.round(
      computeFeatureDeviationScore(features.gds_score, [0, 4], false) * 0.5 +
      computeFeatureDeviationScore(features.np1_dprs, [0, 0], false) * 0.25 +
      computeFeatureDeviationScore(features.np1_anxs, [0, 0], false) * 0.25
    ));

    const autoRisk = Math.min(100, Math.round(
      computeFeatureDeviationScore(features.scopa_total, [0, 15], false) * 0.6 +
      computeFeatureDeviationScore(features.orthostatic_drop_sys, [-5, 15], false) * 0.2 +
      computeFeatureDeviationScore(features.np1_cnst, [0, 0], false) * 0.2
    ));

    // Progression speed
    let progression: 'Slow' | 'Moderate' | 'Rapid' | 'Stable' = 'Stable';
    if (overallBurden > 65) progression = 'Rapid';
    else if (overallBurden > 42) progression = 'Moderate';
    else if (overallBurden > 22) progression = 'Slow';

    // Top risk factors (sorted by impact)
    topFactors.sort((a, b) => b.impact - a.impact);
    const riskFactorStrings = topFactors.slice(0, 4).map((f) => f.label);
    if (riskFactorStrings.length === 0) {
      riskFactorStrings.push('Memory & Thinking', 'Sleep Quality');
    }

    // Recommendations in plain English
    const recommendations: string[] = [];
    if (features.ess_score > 10) {
      recommendations.push('Your daytime sleepiness score is high — talk to your doctor about sleep quality.');
    }
    if (features.moca_total < 26) {
      recommendations.push('Your memory test score is below the normal range — cognitive exercises may help.');
    }
    if (features.gds_score >= 5) {
      recommendations.push('Your mood check suggests possible depression — consider speaking with your care team.');
    }
    if (features.orthostatic_drop_sys > 15) {
      recommendations.push('Your blood pressure drops when standing — stay hydrated and rise slowly.');
    }
    if (features.upsit_total < 25) {
      recommendations.push('Your sense of smell is reduced — this is common in Parkinson\'s. Inform your doctor.');
    }
    if ((multiModal?.fingerTap?.cadenceHz ?? 5) < 3.5) {
      recommendations.push('Your finger tap test shows slower-than-normal speed. Practice daily hand exercises.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Keep up your daily check-ins. Your scores look stable overall.');
    }

    return {
      cognitiveImpairmentRisk: cogRisk,
      mciProbability: Math.round(cogRisk) / 100,
      depressionRiskScore: moodRisk,
      sleepDisorderRiskScore: sleepRisk,
      autonomicDysfunctionRiskScore: autoRisk,
      overallNonMotorBurdenScore: overallBurden,
      progressionSpeed: progression,
      topRiskFactors: riskFactorStrings,
      confidenceScore: Math.round(this.modelData.metrics.accuracy * 100),
      recommendedInterventions: recommendations,
      modelTimestamp: new Date().toISOString(),
    };
  }
}

export const mlInferenceService = new MLInferenceService();
export default mlInferenceService;
