import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert as RNAlert } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import PatientCard from '../../components/PatientCard';
import ObservationCard from '../../components/ObservationCard';
import PrimaryButton from '../../components/PrimaryButton';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

export const CaretakerHomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const {
    currentCaretaker,
    patients,
    alerts,
    observations,
    latestMultiModal,
    prediction,
    addObservation,
  } = useData();

  // Daily medication & safety monitoring checklist state
  const [medsChecklist, setMedsChecklist] = useState({
    morningLevodopa: true,
    afternoonDose: false,
    eveningHydration: false,
  });

  if (!currentCaretaker) return null;

  const assignedPatients = patients.filter(p => currentCaretaker.assignedPatientIds.includes(p.id));
  const activeAlerts = alerts.filter(a => !a.acknowledged);

  const toggleMed = (key: keyof typeof medsChecklist) => {
    setMedsChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleQuickLog = (domain: string, note: string, severity: 'mild' | 'moderate' | 'severe') => {
    addObservation({
      patientId: assignedPatients[0]?.id || 'patient-101',
      domain,
      note,
      severity,
    });
    RNAlert.alert('Observation Logged', `Daily note recorded for ${domain}. Synchronized with Doctor.`);
  };

  // Daily multi-modal risk calculation
  let dailyRiskLevel = 'Low Risk';
  let dailyRiskColor = Colors.success;
  if (latestMultiModal?.fingerTap && latestMultiModal.fingerTap.variabilityCv > 28) {
    dailyRiskLevel = 'Elevated Motor Jitter';
    dailyRiskColor = Colors.warning;
  }
  if (prediction && prediction.progressionSpeed === 'Rapid') {
    dailyRiskLevel = 'High Non-Motor Burden';
    dailyRiskColor = Colors.error;
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={`Hello, ${currentCaretaker.name.split(' ')[0]}`}
        subtitle={`Primary Caretaker • Daily Monitoring & Risk Dashboard`}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Daily Patient Risk Status Card */}
        <View style={styles.dailyRiskCard}>
          <View style={styles.dailyRiskHeader}>
            <View>
              <Text style={styles.dailyRiskLabel}>TODAY'S PATIENT MONITORING RISK</Text>
              <Text style={[styles.dailyRiskValue, { color: dailyRiskColor }]}>{dailyRiskLevel}</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: dailyRiskColor }]}>
              <Text style={styles.riskBadgeText}>ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.dailyRiskSub}>
            Real-time synthesis of today's motor rhythm tests, non-motor questionnaires, and safety logs.
          </Text>

          {/* Daily Multi-Modal Snapshot */}
          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotVal}>
                {latestMultiModal?.fingerTap ? `${latestMultiModal.fingerTap.cadenceHz} Hz` : '4.8 Hz'}
              </Text>
              <Text style={styles.snapshotLbl}>⚡ Tap Cadence</Text>
            </View>

            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotVal}>
                {latestMultiModal?.fingerTap ? `${latestMultiModal.fingerTap.variabilityCv}%` : '16%'}
              </Text>
              <Text style={styles.snapshotLbl}>〰️ Rhythm Jitter</Text>
            </View>

            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotVal}>
                {latestMultiModal?.spiralDrawing ? `${latestMultiModal.spiralDrawing.smoothnessScore}%` : '82%'}
              </Text>
              <Text style={styles.snapshotLbl}>🌀 Spiral Smooth</Text>
            </View>

            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotVal}>
                {latestMultiModal?.reactionSpeed ? `${latestMultiModal.reactionSpeed.meanReactionTimeMs}ms` : '440ms'}
              </Text>
              <Text style={styles.snapshotLbl}>⏱️ Reaction Speed</Text>
            </View>
          </View>
        </View>

        {/* Daily Medication & Care Coordination Checklist */}
        <View style={styles.checklistCard}>
          <View style={styles.checklistHeader}>
            <Text style={styles.checklistIcon}>💊</Text>
            <View>
              <Text style={styles.checklistTitle}>Daily Medication & Safety Routine</Text>
              <Text style={styles.checklistSub}>Tap to mark tasks as completed today</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.checkItem} onPress={() => toggleMed('morningLevodopa')}>
            <View style={[styles.checkbox, medsChecklist.morningLevodopa && styles.checkboxChecked]}>
              {medsChecklist.morningLevodopa && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkTextBox}>
              <Text style={[styles.checkTitle, medsChecklist.morningLevodopa && styles.checkDoneText]}>
                Morning Carbidopa / Levodopa Dose (8:00 AM)
              </Text>
              <Text style={styles.checkTime}>Take with water, 30m before breakfast</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.checkItem} onPress={() => toggleMed('afternoonDose')}>
            <View style={[styles.checkbox, medsChecklist.afternoonDose && styles.checkboxChecked]}>
              {medsChecklist.afternoonDose && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkTextBox}>
              <Text style={[styles.checkTitle, medsChecklist.afternoonDose && styles.checkDoneText]}>
                Afternoon Mobility & Hydration Check (1:30 PM)
              </Text>
              <Text style={styles.checkTime}>Monitor for orthostatic lightheadedness</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.checkItem} onPress={() => toggleMed('eveningHydration')}>
            <View style={[styles.checkbox, medsChecklist.eveningHydration && styles.checkboxChecked]}>
              {medsChecklist.eveningHydration && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkTextBox}>
              <Text style={[styles.checkTitle, medsChecklist.eveningHydration && styles.checkDoneText]}>
                Evening Rest & Bedtime Safety Prep (8:30 PM)
              </Text>
              <Text style={styles.checkTime}>Ensure clear path for night bathroom visits</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Active Safety Alerts */}
        {activeAlerts.length > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertBannerHeader}>
              <Text style={styles.alertBannerIcon}>⚠️</Text>
              <Text style={styles.alertBannerTitle}>{activeAlerts.length} Clinical Safety Alert(s)</Text>
            </View>
            <Text style={styles.alertBannerSub}>
              {activeAlerts[0]?.title}: {activeAlerts[0]?.message}
            </Text>
            <TouchableOpacity style={styles.viewAlertsBtn} onPress={() => onNavigate('alerts')}>
              <Text style={styles.viewAlertsText}>Acknowledge & View Details →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Monitored Patients */}
        <Text style={styles.sectionTitle}>Monitored Patient</Text>
        {assignedPatients.map(patient => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onPress={() => onNavigate('patientDetail', { patientId: patient.id })}
          />
        ))}

        {/* Quick Observation Logger */}
        <View style={styles.logCard}>
          <View style={styles.logHeader}>
            <Text style={styles.logIcon}>📝</Text>
            <View>
              <Text style={styles.logTitle}>Log Daily Observation</Text>
              <Text style={styles.logSub}>Transmit behavior & symptom updates to Doctor</Text>
            </View>
          </View>
          <PrimaryButton
            title="+ Record Detailed Observation"
            onPress={() => onNavigate('observations')}
            style={styles.logBtn}
          />

          {/* 1-Tap Quick Tags */}
          <Text style={styles.quickTagHeader}>1-Tap Quick Tags:</Text>
          <View style={styles.quickTagRow}>
            <TouchableOpacity
              style={styles.quickTagPill}
              onPress={() => handleQuickLog('Sleep', 'Restless night, acted out dreams (possible RBD episode)', 'moderate')}
            >
              <Text style={styles.quickTagText}>🌙 Restless Sleep</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickTagPill}
              onPress={() => handleQuickLog('Motor', 'Observed slight freezing when turning in hallway', 'mild')}
            >
              <Text style={styles.quickTagText}>🚶 Hallway Hesitation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickTagPill}
              onPress={() => handleQuickLog('Mood', 'Good spirits and engaged during family call', 'mild')}
            >
              <Text style={styles.quickTagText}>😊 Good Mood Today</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Observation Logs */}
        <Text style={styles.sectionTitle}>Recent Observations Logged</Text>
        {observations.slice(0, 3).map(obs => (
          <ObservationCard key={obs.id} observation={obs} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  dailyRiskCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  dailyRiskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dailyRiskLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  dailyRiskValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
  },
  dailyRiskSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginVertical: Spacing.xs,
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xs,
  },
  snapshotItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  snapshotVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  snapshotLbl: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  checklistCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checklistIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  checklistSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  checkTextBox: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  checkDoneText: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  checkTime: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  alertBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  alertBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertBannerIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  alertBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  alertBannerSub: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 8,
  },
  viewAlertsBtn: {
    alignSelf: 'flex-start',
  },
  viewAlertsText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.error,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  logCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  logSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  logBtn: {
    marginTop: Spacing.xs,
  },
  quickTagHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  quickTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default CaretakerHomeScreen;
