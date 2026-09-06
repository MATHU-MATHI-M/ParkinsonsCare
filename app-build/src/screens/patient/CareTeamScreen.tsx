import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';

interface Props {
  onBack: () => void;
}

export const CareTeamScreen: React.FC<Props> = ({ onBack }) => {
  const { currentPatient, caretakers, doctors } = useData();

  if (!currentPatient) return null;

  const assignedCaretaker = caretakers.find(c => c.assignedPatientIds.includes(currentPatient.id));
  const assignedDoctor = doctors.find(d => d.assignedPatientIds.includes(currentPatient.id));

  return (
    <View style={styles.container}>
      <AppHeader
        title="My Care Team"
        subtitle="Connected Healthcare Network"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Patient Self Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.roleTag}>PATIENT (YOU)</Text>
              <Text style={styles.name}>{currentPatient.name}</Text>
              <Text style={styles.subtext}>PPMI ID: {currentPatient.ppmiPatno} • {currentPatient.age} yrs</Text>
            </View>
          </View>
        </View>

        {/* Assigned Doctor Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: '#EBF3FA' }]}>
              <Text style={styles.avatarText}>🩺</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.roleTag, { color: Colors.secondary }]}>ATTENDING CLINICIAN</Text>
              <Text style={styles.name}>{assignedDoctor?.name || 'Dr. Sarah Chen, MD'}</Text>
              <Text style={styles.subtext}>
                {assignedDoctor?.specialty || 'Movement Disorder Neurologist'} • {assignedDoctor?.hospital || 'PPMI Movement Disorders Clinic'}
              </Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.statusText}>🟢 Connected • Real-time PPMI analytics enabled</Text>
          </View>
        </View>

        {/* Assigned Caretaker Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: '#E6F8F6' }]}>
              <Text style={styles.avatarText}>🧑‍⚕️</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.roleTag, { color: Colors.accent }]}>PRIMARY CARETAKER</Text>
              <Text style={styles.name}>{assignedCaretaker?.name || 'Maria Rodriguez'}</Text>
              <Text style={styles.subtext}>
                {assignedCaretaker?.relationship || 'Spouse'} • Daily non-motor observations active
              </Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.statusText}>🟢 Connected • Logged 3 observations this week</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🔒 Shared Care Protocol</Text>
          <Text style={styles.infoBody}>
            Your non-motor symptom survey entries, sleep scores, and mood ratings are shared directly with Dr. Chen and Maria to optimize treatment decisions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  name: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  subtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  cardFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral100,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.successDark,
  },
  infoBox: {
    backgroundColor: Colors.primarySurface,
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
});

export default CareTeamScreen;
