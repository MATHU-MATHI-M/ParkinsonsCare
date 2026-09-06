import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FeatureImportanceItem } from '../types';
import { Colors, Spacing, Typography, Shadows } from '../theme';

interface FeatureImportanceChartProps {
  items: FeatureImportanceItem[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ items }) => {
  const maxImportance = Math.max(...items.map(i => i.importance), 0.25);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ML Model Feature Importance</Text>
      <Text style={styles.subtitle}>
        Relative contribution of non-motor clinical metrics to cognitive & progression risk
      </Text>

      <View style={styles.list}>
        {items.map((item, idx) => {
          const safeMax = maxImportance || 1;
          const pct = Math.min(100, Math.max(0, Math.round((item.importance / safeMax) * 100)));
          const isNegative = item.direction === 'negative';
          const barColor = isNegative ? Colors.primary : Colors.warning;

          return (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.labelRow}>
                <Text style={styles.featureName}>{item.feature}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.categoryTag}>{item.category}</Text>
                  <Text style={styles.pctText}>{(item.importance * 100).toFixed(0)}%</Text>
                </View>
              </View>

              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
              </View>

              {item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    ...Shadows.sm,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: 2,
  },
  list: {
    marginTop: Spacing.xs,
  },
  itemRow: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  featureName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primaryDark,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  track: {
    height: 8,
    backgroundColor: Colors.neutral100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  description: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 3,
  },
});

export default FeatureImportanceChart;
