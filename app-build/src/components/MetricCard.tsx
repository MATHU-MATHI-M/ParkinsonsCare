import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../theme';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  badgeText?: string;
  badgeLevel?: 'normal' | 'mild' | 'moderate' | 'severe';
  icon?: string;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  badgeText,
  badgeLevel = 'normal',
  icon,
  subtitle
}) => {
  let badgeBg = Colors.successLight;
  let badgeFg = Colors.successDark;

  if (badgeLevel === 'mild') {
    badgeBg = Colors.infoLight;
    badgeFg = Colors.infoDark;
  } else if (badgeLevel === 'moderate') {
    badgeBg = Colors.warningLight;
    badgeFg = Colors.warningDark;
  } else if (badgeLevel === 'severe') {
    badgeBg = Colors.errorLight;
    badgeFg = Colors.errorDark;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {badgeText && (
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeFg }]}>{badgeText}</Text>
        </View>
      )}

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    flex: 1,
    minWidth: 140,
    ...Shadows.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 14,
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginLeft: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});

export default MetricCard;
