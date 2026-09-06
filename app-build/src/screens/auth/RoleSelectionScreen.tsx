import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';

interface Props {
  onSelectRole: (role: 'patient' | 'caretaker' | 'doctor') => void;
}

export const RoleSelectionScreen: React.FC<Props> = ({ onSelectRole }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🧠</Text>
        </View>
        <Text style={styles.appName}>NeuroCare</Text>
        <Text style={styles.tagline}>
          Parkinson's Non-Motor Symptom Care Platform
        </Text>
        <Text style={styles.subTagline}>
          Powered by Advanced AI Health Analytics
        </Text>
      </View>

      <Text style={styles.sectionHeader}>Select Your Care Portal</Text>

      {/* Patient Card */}
      <TouchableOpacity
        style={[styles.roleCard, { borderLeftColor: Colors.primary }]}
        activeOpacity={0.85}
        onPress={() => onSelectRole('patient')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.roleIconCircle, { backgroundColor: Colors.primarySurface }]}>
            <Text style={styles.roleIcon}>👤</Text>
          </View>
          <View style={styles.roleTitleBox}>
            <Text style={styles.roleTitle}>Patient Portal</Text>
            <Text style={styles.roleSubtitle}>Track symptoms, log assessments & view trends</Text>
          </View>
        </View>
        <View style={styles.featurePills}>
          <View style={styles.pill}><Text style={styles.pillText}>• MoCA & ESS Logs</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>• Self Assessments</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>• Care Team Connect</Text></View>
        </View>
      </TouchableOpacity>

      {/* Caretaker Card */}
      <TouchableOpacity
        style={[styles.roleCard, { borderLeftColor: Colors.accent }]}
        activeOpacity={0.85}
        onPress={() => onSelectRole('caretaker')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.roleIconCircle, { backgroundColor: '#E6F8F6' }]}>
            <Text style={styles.roleIcon}>🧑‍⚕️</Text>
          </View>
          <View style={styles.roleTitleBox}>
            <Text style={styles.roleTitle}>Caretaker Portal</Text>
            <Text style={styles.roleSubtitle}>Monitor loved ones & submit daily observations</Text>
          </View>
        </View>
        <View style={styles.featurePills}>
          <View style={styles.pill}><Text style={styles.pillText}>• Symptom Alerts</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>• Behavior Notes</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>• Multi-Patient View</Text></View>
        </View>
      </TouchableOpacity>

      {/* Doctor Card */}
      <TouchableOpacity
        style={[styles.roleCard, { borderLeftColor: Colors.secondary }]}
        activeOpacity={0.85}
        onPress={() => onSelectRole('doctor')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.roleIconCircle, { backgroundColor: '#EBF3FA' }]}>
            <Text style={styles.roleIcon}>🩺</Text>
          </View>
          <View style={styles.roleTitleBox}>
            <Text style={styles.roleTitle}>Doctor / Clinician Portal</Text>
            <Text style={styles.roleSubtitle}>ML risk models, longitudinal analytics & notes</Text>
          </View>
        </View>
        <View style={styles.featurePills}>
          <View style={styles.pill}><Text style={styles.pillText}>• AI Risk Engine</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>• Feature Importance</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>• Clinical Notes</Text></View>
        </View>
      </TouchableOpacity>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          🔐 Secure HIPAA-compliant platform architecture • Encrypted patient wellness records
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    ...Typography.displayMedium,
    color: Colors.primary,
  },
  tagline: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  subTagline: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  roleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    borderLeftWidth: 5,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  roleIcon: {
    fontSize: 24,
  },
  roleTitleBox: {
    flex: 1,
  },
  roleTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  roleSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: Colors.neutral100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footerNote: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

export default RoleSelectionScreen;
