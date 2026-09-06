import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Patient } from '../types';
import { Colors, Spacing, Typography, Shadows } from '../theme';
import SeverityBadge from './SeverityBadge';

interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onPress }) => {
  let riskLevel: 'normal' | 'mild' | 'moderate' | 'severe' = 'normal';
  if (patient.riskStatus === 'high') riskLevel = 'severe';
  else if (patient.riskStatus === 'medium') riskLevel = 'moderate';
  else if (patient.riskStatus === 'low') riskLevel = 'mild';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
        </View>

        <View style={styles.infoArea}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{patient.name}</Text>
            <Text style={styles.patnoTag}>{patient.ppmiPatno}</Text>
          </View>
          <Text style={styles.subtext}>
            Age {patient.age} • {patient.gender} • {patient.diagnosisYear} Diagnosis
          </Text>
        </View>

        <SeverityBadge level={riskLevel} text={`${patient.riskStatus.toUpperCase()} RISK`} />
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>BURDEN SCORE</Text>
          <Text style={styles.statValue}>{patient.overallBurdenScore}/100</Text>
        </View>

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>MOCA SCORE</Text>
          <Text style={styles.statValue}>{patient.lastMoCA ?? 'N/A'}/30</Text>
        </View>

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>TOTAL VISITS</Text>
          <Text style={styles.statValue}>{patient.visits.length}</Text>
        </View>

        <View style={styles.actionArrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  infoArea: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginRight: 6,
  },
  patnoTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  subtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral100,
    marginVertical: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  actionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
});

export default PatientCard;
