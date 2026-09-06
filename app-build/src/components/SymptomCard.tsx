import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../theme';
import SeverityBadge from './SeverityBadge';

interface SymptomCardProps {
  title: string;
  icon: string;
  scoreDisplay: string;
  scaleMax: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  trend?: 'improving' | 'stable' | 'worsening';
  subtitle?: string;
  onPress?: () => void;
}

export const SymptomCard: React.FC<SymptomCardProps> = ({
  title,
  icon,
  scoreDisplay,
  scaleMax,
  severity,
  trend = 'stable',
  subtitle,
  onPress
}) => {
  let trendSymbol = '→';
  let trendColor = Colors.neutral500;

  if (trend === 'improving') {
    trendSymbol = '↘';
    trendColor = Colors.success;
  } else if (trend === 'worsening') {
    trendSymbol = '↗';
    trendColor = Colors.error;
  }

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <View style={styles.headerTitleArea}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <SeverityBadge level={severity} />
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.scoreArea}>
          <Text style={styles.scoreValue}>{scoreDisplay}</Text>
          <Text style={styles.scaleText}>/ {scaleMax}</Text>
        </View>

        <View style={styles.trendPill}>
          <Text style={[styles.trendIcon, { color: trendColor }]}>{trendSymbol}</Text>
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trend.toUpperCase()}
          </Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  iconText: {
    fontSize: 20,
  },
  headerTitleArea: {
    flex: 1,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral100,
  },
  scoreArea: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scaleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginLeft: 4,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendIcon: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});

export default SymptomCard;
