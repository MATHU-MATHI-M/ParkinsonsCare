import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import PatientCard from '../../components/PatientCard';
import MetricCard from '../../components/MetricCard';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

export const DoctorDashboardScreen: React.FC<Props> = ({ onNavigate }) => {
  const { currentDoctor, patients, alerts, modelMetrics, latestMultiModal } = useData();

  if (!currentDoctor) return null;

  const totalPatients = patients.length;
  const highRiskCount = patients.filter(p => p.riskStatus === 'high').length;
  const activeAlerts = alerts.filter(a => !a.acknowledged).length;

  return (
    <View style={styles.container}>
      <AppHeader
        title={`Dr. ${currentDoctor.name.split(' ').pop()}`}
        subtitle={`${currentDoctor.specialty} • ${currentDoctor.hospital}`}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* ML Performance & Patient Stats */}
        <View style={styles.statsGrid}>
          <MetricCard
            label="COHORT SIZE"
            value={totalPatients}
            badgeText="Active Cohort"
            badgeLevel="normal"
            icon="👥"
          />
          <MetricCard
            label="ML TEST ACCURACY"
            value={modelMetrics.accuracy}
            badgeText={`AUC: ${modelMetrics.rocAuc}`}
            badgeLevel="normal"
            icon="⚡"
          />
        </View>

        <View style={styles.statsGrid}>
          <MetricCard
            label="ACTIVE CLINICAL ALERTS"
            value={activeAlerts}
            badgeText={activeAlerts > 0 ? "Requires Review" : "All Clear"}
            badgeLevel={activeAlerts > 0 ? 'moderate' : 'normal'}
            icon="🔔"
          />
          <MetricCard
            label="SENSITIVITY (RECALL)"
            value={modelMetrics.sensitivity}
            badgeText="PPMI Validated"
            badgeLevel="normal"
            icon="🎯"
          />
        </View>

        {/* Latest Multi-Modal Biomarkers Card */}
        <View style={styles.multiModalCard}>
          <View style={styles.mmHeader}>
            <Text style={styles.mmTitle}>📡 Latest Multi-Modal Patient Stream</Text>
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>LIVE SYNC</Text>
            </View>
          </View>
          <Text style={styles.mmSub}>
            Patient {patients[0]?.name || 'Robert Miller'} completed objective motor & cognitive tests:
          </Text>

          <View style={styles.mmRow}>
            <View style={styles.mmPill}>
              <Text style={styles.mmPillVal}>
                {latestMultiModal?.fingerTap ? `${latestMultiModal.fingerTap.cadenceHz} Hz` : '4.8 Hz'}
              </Text>
              <Text style={styles.mmPillLbl}>Tap Cadence</Text>
            </View>

            <View style={styles.mmPill}>
              <Text style={styles.mmPillVal}>
                {latestMultiModal?.fingerTap ? `${latestMultiModal.fingerTap.variabilityCv}%` : '16%'}
              </Text>
              <Text style={styles.mmPillLbl}>Rhythm Jitter</Text>
            </View>

            <View style={styles.mmPill}>
              <Text style={styles.mmPillVal}>
                {latestMultiModal?.spiralDrawing ? `${latestMultiModal.spiralDrawing.smoothnessScore}%` : '82%'}
              </Text>
              <Text style={styles.mmPillLbl}>Spiral Smooth</Text>
            </View>

            <View style={styles.mmPill}>
              <Text style={styles.mmPillVal}>
                {latestMultiModal?.reactionSpeed ? `${latestMultiModal.reactionSpeed.meanReactionTimeMs}ms` : '440ms'}
              </Text>
              <Text style={styles.mmPillLbl}>Reaction Speed</Text>
            </View>
          </View>
        </View>

        {/* Quick ML Model Launcher */}
        <TouchableOpacity
          style={styles.modelBanner}
          activeOpacity={0.8}
          onPress={() => onNavigate('model')}
        >
          <View style={styles.modelIconBox}>
            <Text style={styles.modelIcon}>🧠</Text>
          </View>
          <View style={styles.modelTextBox}>
            <Text style={styles.modelTitle}>PPMI ML Risk Classifier & Feature Weights</Text>
            <Text style={styles.modelSub}>
              View Confusion Matrix, 35 Non-Motor Feature Importances & Interactive Risk Simulator →
            </Text>
          </View>
        </TouchableOpacity>

        {/* Active Alerts Row */}
        {activeAlerts > 0 && (
          <TouchableOpacity style={styles.alertNotice} onPress={() => onNavigate('alerts')}>
            <Text style={styles.alertNoticeIcon}>⚠️</Text>
            <Text style={styles.alertNoticeText}>
              {activeAlerts} patient alert(s) pending acknowledgement. Tap to inspect.
            </Text>
          </TouchableOpacity>
        )}

        {/* Patient Roster */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patient Clinical Roster</Text>
          <Text style={styles.sectionSub}>Select patient for longitudinal PPMI progression & notes</Text>
        </View>

        {patients.map(patient => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onPress={() => onNavigate('patientProfile', { patientId: patient.id })}
          />
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
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  multiModalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  mmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mmTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  liveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  mmSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  mmRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mmPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mmPillVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  mmPillLbl: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  modelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    ...Shadows.md,
  },
  modelIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  modelIcon: {
    fontSize: 22,
  },
  modelTextBox: {
    flex: 1,
  },
  modelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  modelSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  alertNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: Spacing.sm,
  },
  alertNoticeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  alertNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    flex: 1,
  },
  sectionHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  sectionSub: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});

export default DoctorDashboardScreen;
