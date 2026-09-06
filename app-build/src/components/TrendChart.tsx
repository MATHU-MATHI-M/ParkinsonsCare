import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../theme';

interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface TrendChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  maxValue?: number;
  minValue?: number;
  height?: number;
  color?: string;
  secondaryColor?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  subtitle,
  data,
  maxValue = 30,
  minValue = 0,
  height = 180,
  color = Colors.primary,
  secondaryColor = Colors.accent,
  primaryLabel = 'Primary Metric',
  secondaryLabel
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No longitudinal data available to display</Text>
      </View>
    );
  }

  const effectiveMax = Math.max(...data.map(d => Math.max(d.value, d.secondaryValue || 0)), maxValue);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{primaryLabel}</Text>
          </View>
          {secondaryLabel && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: secondaryColor }]} />
              <Text style={styles.legendText}>{secondaryLabel}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.chartArea, { height }]}>
          {data.map((point, index) => {
            const range = (effectiveMax - minValue) || 1;
            const barHeight = Math.max(8, ((point.value - minValue) / range) * (height - 40));
            const secBarHeight = point.secondaryValue !== undefined
              ? Math.max(8, ((point.secondaryValue - minValue) / range) * (height - 40))
              : 0;

            return (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  {point.secondaryValue !== undefined && (
                    <View
                      style={[
                        styles.bar,
                        { height: secBarHeight, backgroundColor: secondaryColor, marginRight: 2 }
                      ]}
                    >
                      <Text style={styles.barValueText}>{point.secondaryValue}</Text>
                    </View>
                  )}
                  <View style={[styles.bar, { height: barHeight, backgroundColor: color }]}>
                    <Text style={styles.barValueText}>{point.value}</Text>
                  </View>
                </View>
                <Text style={styles.label}>{point.label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
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
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 44,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    width: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  barValueText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.white,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 6,
    position: 'absolute',
    bottom: -20,
  },
});

export default TrendChart;
