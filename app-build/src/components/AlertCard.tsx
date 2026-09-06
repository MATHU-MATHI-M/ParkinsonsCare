import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Alert } from '../types';
import { Colors, Spacing, Typography, Shadows } from '../theme';
import SeverityBadge from './SeverityBadge';
import PrimaryButton from './PrimaryButton';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge }) => {
  let severityLevel: 'normal' | 'mild' | 'moderate' | 'severe' = 'mild';
  if (alert.severity === 'critical') severityLevel = 'severe';
  else if (alert.severity === 'high') severityLevel = 'severe';
  else if (alert.severity === 'medium') severityLevel = 'moderate';
  else if (alert.severity === 'low') severityLevel = 'mild';

  return (
    <View style={[styles.card, alert.acknowledged && styles.cardAck]}>
      <View style={styles.headerRow}>
        <View style={styles.domainBadge}>
          <Text style={styles.domainText}>{alert.domain.toUpperCase()}</Text>
        </View>

        <SeverityBadge level={severityLevel} text={alert.severity.toUpperCase()} />

        <Text style={styles.timeText}>{alert.createdAt}</Text>
      </View>

      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.description}>{alert.description}</Text>

      {alert.suggestedAction && (
        <View style={styles.suggestionBox}>
          <Text style={styles.suggestionLabel}>💡 Clinical Action:</Text>
          <Text style={styles.suggestionText}>{alert.suggestedAction}</Text>
        </View>
      )}

      <View style={styles.footerRow}>
        <Text style={styles.patientLabel}>Patient: PATNO-{alert.patientId.replace('p-', '')}</Text>

        {!alert.acknowledged && onAcknowledge && (
          <PrimaryButton
            title="Acknowledge Alert"
            size="small"
            variant="outline"
            onPress={() => onAcknowledge(alert.id)}
          />
        )}

        {alert.acknowledged && (
          <View style={styles.ackBadge}>
            <Text style={styles.ackText}>✓ Acknowledged</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    ...Shadows.sm,
  },
  cardAck: {
    backgroundColor: Colors.neutral50,
    borderLeftColor: Colors.neutral400,
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  domainBadge: {
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  domainText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  suggestionBox: {
    backgroundColor: Colors.primarySurface,
    padding: Spacing.xs,
    borderRadius: 8,
    marginVertical: Spacing.xs,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral100,
  },
  patientLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  ackBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ackText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.successDark,
  },
});

export default AlertCard;
