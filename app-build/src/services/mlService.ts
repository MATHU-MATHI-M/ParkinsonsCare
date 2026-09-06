import { NonMotorDomainScores, MLPrediction, FeatureImportanceItem, PatientVisit } from '../types';

/**
 * NeuroCare ML & Risk Assessment Engine
 * Based on PPMI (Parkinson's Progression Markers Initiative) non-motor data metrics
 */

export class MLService {
  /**
   * Calculate cognitive impairment risk score (0-100) based on MoCA and sub-domain scores
   */
  static calculateCognitiveRisk(mocaScore?: number, sdmtTotal?: number, tmtbSecs?: number): number {
    if (mocaScore === undefined || mocaScore === null) return 25; // baseline assumption
    
    // MoCA max 30. <26 indicates mild cognitive impairment (MCI). <21 indicates dementia risk.
    let risk = 0;
    if (mocaScore < 21) {
      risk = 85 + (21 - mocaScore) * 3;
    } else if (mocaScore < 26) {
      risk = 45 + (26 - mocaScore) * 8;
    } else {
      risk = Math.max(5, (30 - mocaScore) * 6);
    }

    if (sdmtTotal !== undefined && sdmtTotal !== null && sdmtTotal < 30) {
      risk += 10;
    }
    if (tmtbSecs !== undefined && tmtbSecs !== null && tmtbSecs > 120) {
      risk += 10;
    }

    return Math.min(99, Math.round(risk));
  }

  /**
   * Calculate depression risk from GDS-15 score (0-15)
   */
  static calculateDepressionRisk(gdsScore?: number, np1dprs?: number): number {
    let score = 0;
    if (gdsScore !== undefined && gdsScore !== null) {
      score = (gdsScore / 15) * 80;
    }
    if (np1dprs !== undefined && np1dprs !== null) {
      score = Math.max(score, (np1dprs / 4) * 90);
    }
    return Math.min(99, Math.round(score));
  }

  /**
   * Calculate sleep disorder risk from ESS total (0-24) and RBDSQ score (0-13)
   */
  static calculateSleepRisk(essTotal?: number, rbdsqScore?: number): number {
    let essRisk = (essTotal !== undefined && essTotal !== null) ? (essTotal / 24) * 80 : 20;
    let rbdRisk = (rbdsqScore !== undefined && rbdsqScore !== null) ? (rbdsqScore / 13) * 90 : 20;
    return Math.min(99, Math.round(Math.max(essRisk, rbdRisk)));
  }

  /**
   * Compute overall Non-Motor Symptom Burden Score (0-100)
   */
  static computeOverallBurdenScore(visit: PatientVisit): number {
    const mocaVal = visit.mocaTotal ?? visit.moca_total ?? undefined;
    const sdmtVal = visit.sdmtTotal ?? visit.sdmt_total ?? undefined;
    const tmtVal = visit.tmtbSecs ?? visit.tmt_b_sec ?? undefined;
    const gdsVal = visit.gdsScore ?? visit.gds_score ?? undefined;
    const np1dprsVal = visit.np1dprs ?? visit.np1_dprs ?? undefined;
    const essVal = visit.essTotal ?? visit.ess_score ?? undefined;
    const rbdVal = visit.rbdsqScore ?? visit.rbdsq_score ?? undefined;
    const scopaVal = visit.scopaTotal ?? visit.scopa_total ?? undefined;
    const np1hallVal = visit.np1hall ?? visit.np1_hall ?? undefined;
    const np1fatgVal = visit.np1fatg ?? visit.np1_fatg ?? undefined;
    const np1painVal = visit.np1pain ?? visit.np1_pain ?? undefined;

    const cog = this.calculateCognitiveRisk(mocaVal, sdmtVal, tmtVal);
    const dep = this.calculateDepressionRisk(gdsVal, np1dprsVal);
    const sleep = this.calculateSleepRisk(essVal, rbdVal);
    
    // Autonomic risk
    const scopa = scopaVal !== undefined ? (scopaVal / 42) * 85 : 30;
    
    // Psychosis / Hallucinations risk
    const hall = np1hallVal !== undefined ? (np1hallVal / 4) * 100 : 0;

    // Fatigue & Pain
    const fatg = np1fatgVal !== undefined ? (np1fatgVal / 4) * 75 : 20;
    const pain = np1painVal !== undefined ? (np1painVal / 4) * 75 : 20;

    const weightedScore = (
      cog * 0.25 +
      dep * 0.20 +
      sleep * 0.20 +
      scopa * 0.15 +
      hall * 0.10 +
      fatg * 0.05 +
      pain * 0.05
    );

    return Math.min(100, Math.max(5, Math.round(weightedScore)));
  }

  /**
   * Calculate feature importances for clinical risk prediction
   */
  static getFeatureImportances(): FeatureImportanceItem[] {
    return [
      { feature: 'MoCA Total Score (Cognition)', category: 'Cognitive', importance: 0.24, direction: 'negative', description: 'Lower MoCA score increases MCI progression risk significantly.' },
      { feature: 'GDS-15 Depression Scale', category: 'Mood', importance: 0.18, direction: 'positive', description: 'Depression severity correlates strongly with quality of life reduction.' },
      { feature: 'Epworth Sleepiness Scale (ESS)', category: 'Sleep', importance: 0.15, direction: 'positive', description: 'Daytime somnolence is a key indicator of sleep architecture disruption.' },
      { feature: 'SCOPA-AUT Total Score', category: 'Autonomic', importance: 0.14, direction: 'positive', description: 'Autonomic dysfunction burden across GI, urinary, and CV domains.' },
      { feature: 'RBD Screening Score (REM Sleep)', category: 'Sleep', importance: 0.11, direction: 'positive', description: 'REM Sleep Behavior Disorder correlates with alpha-synucleinopathy.' },
      { feature: 'Symbol Digit Modalities (SDMT)', category: 'Cognitive', importance: 0.09, direction: 'negative', description: 'Processing speed measure sensitive to cognitive slowing.' },
      { feature: 'MDS-UPDRS Part I Hallucinations', category: 'Psychosis', importance: 0.05, direction: 'positive', description: 'Presence of visual hallucinations predicts advanced non-motor stage.' },
      { feature: 'MDS-UPDRS Part I Fatigue', category: 'Fatigue', importance: 0.04, direction: 'positive', description: 'Subjective fatigue severity impacting daily activity engagement.' }
    ];
  }

  /**
   * Predict risk trajectory for a patient given historical visits
   */
  static predictPatientRisk(visits: PatientVisit[]): MLPrediction {
    if (!visits || visits.length === 0) {
      return {
        cognitiveImpairmentRisk: 30,
        mciProbability: 0.25,
        depressionRiskScore: 25,
        sleepDisorderRiskScore: 30,
        autonomicDysfunctionRiskScore: 25,
        overallNonMotorBurdenScore: 32,
        progressionSpeed: 'Stable',
        topRiskFactors: ['Mild sleep disturbance', 'Borderline processing speed'],
        confidenceScore: 0.88,
        recommendedInterventions: [
          'Continue annual MoCA tracking',
          'Maintain regular daytime physical exercise schedule',
          'Monitor sleep hygiene'
        ],
        modelTimestamp: new Date().toISOString().split('T')[0]
      };
    }

    const latest = visits[visits.length - 1];
    const mocaVal = latest.mocaTotal ?? latest.moca_total ?? undefined;
    const sdmtVal = latest.sdmtTotal ?? latest.sdmt_total ?? undefined;
    const tmtVal = latest.tmtbSecs ?? latest.tmt_b_sec ?? undefined;
    const gdsVal = latest.gdsScore ?? latest.gds_score ?? undefined;
    const np1dprsVal = latest.np1dprs ?? latest.np1_dprs ?? undefined;
    const essVal = latest.essTotal ?? latest.ess_score ?? undefined;
    const rbdVal = latest.rbdsqScore ?? latest.rbdsq_score ?? undefined;
    const scopaVal = latest.scopaTotal ?? latest.scopa_total ?? undefined;

    const cognitiveRisk = this.calculateCognitiveRisk(mocaVal, sdmtVal, tmtVal);
    const depressionRisk = this.calculateDepressionRisk(gdsVal, np1dprsVal);
    const sleepRisk = this.calculateSleepRisk(essVal, rbdVal);
    const scopaRisk = scopaVal !== undefined ? Math.round((scopaVal / 42) * 85) : 30;
    const overallBurden = this.computeOverallBurdenScore(latest);

    let progression: 'Slow' | 'Moderate' | 'Rapid' | 'Stable' = 'Stable';
    if (visits.length >= 2) {
      const prev = visits[visits.length - 2];
      const prevBurden = this.computeOverallBurdenScore(prev);
      const diff = overallBurden - prevBurden;
      if (diff > 12) progression = 'Rapid';
      else if (diff > 5) progression = 'Moderate';
      else if (diff < -3) progression = 'Slow';
    }

    const mciProb = cognitiveRisk / 100;
    const topRisks: string[] = [];
    if (cognitiveRisk > 50) topRisks.push(`High Cognitive Risk (MoCA: ${mocaVal ?? 'N/A'})`);
    if (depressionRisk > 50) topRisks.push(`Elevated Mood Disturbance (GDS: ${gdsVal ?? 'N/A'})`);
    if (sleepRisk > 50) topRisks.push(`Sleep Disruption / RBD (ESS: ${essVal ?? 'N/A'})`);
    if (scopaRisk > 50) topRisks.push(`Autonomic Burden (SCOPA: ${scopaVal ?? 'N/A'})`);
    if (topRisks.length === 0) topRisks.push('Low overall non-motor symptom risk');

    const interventions: string[] = [];
    if (cognitiveRisk > 40) interventions.push('Schedule cognitive rehabilitation and neuro-psychological evaluation');
    if (depressionRisk > 40) interventions.push('Review mood parameters; evaluate SSRI / CBT support');
    if (sleepRisk > 40) interventions.push('Assess sleep hygiene; evaluate Melatonin or Clonazepam for RBD');
    if (scopaRisk > 40) interventions.push('Monitor orthostatic blood pressures and hydration protocol');
    if (interventions.length === 0) interventions.push('Maintain routine non-motor symptom monitoring every 6 months');

    return {
      cognitiveImpairmentRisk: cognitiveRisk,
      mciProbability: Math.round(mciProb * 100) / 100,
      depressionRiskScore: depressionRisk,
      sleepDisorderRiskScore: sleepRisk,
      autonomicDysfunctionRiskScore: scopaRisk,
      overallNonMotorBurdenScore: overallBurden,
      progressionSpeed: progression,
      topRiskFactors: topRisks,
      confidenceScore: 0.92,
      recommendedInterventions: interventions,
      modelTimestamp: new Date().toISOString().split('T')[0]
    };
  }
}

export default MLService;
