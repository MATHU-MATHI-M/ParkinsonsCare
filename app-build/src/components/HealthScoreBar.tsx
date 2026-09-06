import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HealthScoreBarProps {
  score: number;        // 0–100, higher = worse
  color: string;        // hex color
  label: string;        // "Good" | "Fair" | "Needs Attention"
  showPercent?: boolean;
  height?: number;
}

/**
 * A simple, animated-feel horizontal bar that shows 0–100 health deviation.
 * score=0 means healthy, score=100 means max concern.
 */
const HealthScoreBar: React.FC<HealthScoreBarProps> = ({
  score,
  color,
  label,
  showPercent = false,
  height = 8,
}) => {
  const clamp = Math.max(0, Math.min(100, score));

  return (
    <View style={styles.wrapper}>
      <View style={[styles.track, { height }]}>
        {/* Background segments: green | amber | red zones */}
        <View style={[styles.zoneGreen, { height }]} />
        <View style={[styles.zoneAmber, { height }]} />
        <View style={[styles.zoneRed, { height }]} />
        {/* Fill bar */}
        <View
          style={[
            styles.fill,
            {
              width: `${clamp}%`,
              backgroundColor: color,
              height,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.labelText, { color }]}>{label}</Text>
        {showPercent && (
          <Text style={styles.percentText}>{clamp}%</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  track: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  zoneGreen: {
    flex: 30,
    backgroundColor: '#DCFCE7',
  },
  zoneAmber: {
    flex: 30,
    backgroundColor: '#FEF9C3',
  },
  zoneRed: {
    flex: 40,
    backgroundColor: '#FEE2E2',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0.9,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  percentText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

export default HealthScoreBar;
