import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import PrimaryButton from '../../components/PrimaryButton';

interface Props {
  onBack: () => void;
  onComplete?: () => void;
}

interface Point {
  x: number;
  y: number;
  t: number;
}

export const SpiralDrawingTestScreen: React.FC<Props> = ({ onBack, onComplete }) => {
  const { recordMultiModalAssessment } = useData();

  const [testState, setTestState] = useState<'idle' | 'drawing' | 'completed'>('idle');
  const [points, setPoints] = useState<Point[]>([]);
  const pointsRef = useRef<Point[]>([]);
  const startTimeRef = useRef<number>(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        const now = Date.now();
        if (startTimeRef.current === 0) startTimeRef.current = now;
        const firstPt = { x: locationX, y: locationY, t: now };
        pointsRef.current = [firstPt];
        setPoints([firstPt]);
        setTestState('drawing');
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        const now = Date.now();
        const pt = { x: locationX, y: locationY, t: now };
        pointsRef.current.push(pt);
        if (pointsRef.current.length % 3 === 0) {
          setPoints([...pointsRef.current]);
        }
      },
      onPanResponderRelease: () => {
        setPoints([...pointsRef.current]);
        if (pointsRef.current.length > 20) {
          setTestState('completed');
        }
      },
    })
  ).current;

  const resetTest = () => {
    pointsRef.current = [];
    setPoints([]);
    startTimeRef.current = 0;
    setTestState('idle');
  };

  // Compute kinematic smoothness and tremor ripples
  const computeSpiralMetrics = () => {
    const pts = pointsRef.current;
    if (pts.length < 10) {
      return {
        smoothnessScore: 75,
        tremorRipples: 4,
        meanDeviationPx: 8.2,
        drawingDurationSec: 5.0,
      };
    }

    const durationSec = Math.max(1, (pts[pts.length - 1].t - pts[0].t) / 1000);

    // Calculate direction reversal ripples (tremor oscillation marker)
    let ripples = 0;
    let totalJitter = 0;

    for (let i = 2; i < pts.length; i++) {
      const dx1 = pts[i - 1].x - pts[i - 2].x;
      const dy1 = pts[i - 1].y - pts[i - 2].y;
      const dx2 = pts[i].x - pts[i - 1].x;
      const dy2 = pts[i].y - pts[i - 1].y;

      // Sharp directional deviation / jitter
      const dot = dx1 * dx2 + dy1 * dy2;
      if (dot < 0) {
        ripples += 1;
      }
      const dist = Math.sqrt(Math.pow(pts[i].x - pts[i - 1].x, 2) + Math.pow(pts[i].y - pts[i - 1].y, 2));
      totalJitter += dist;
    }

    // Kinematic Smoothness Score (0 - 100, 100 = completely smooth)
    const rippleDensity = ripples / Math.max(1, pts.length);
    let smoothness = Math.max(15, Math.min(98, Math.round(100 - rippleDensity * 220 - (ripples > 15 ? 20 : 0))));

    return {
      smoothnessScore: smoothness,
      tremorRipples: ripples,
      meanDeviationPx: Math.round((totalJitter / pts.length) * 10) / 10,
      drawingDurationSec: Math.round(durationSec * 10) / 10,
    };
  };

  const metrics = computeSpiralMetrics();

  const handleSaveResults = () => {
    recordMultiModalAssessment({
      spiralDrawing: {
        smoothnessScore: metrics.smoothnessScore,
        tremorRipples: metrics.tremorRipples,
        meanDeviationPx: metrics.meanDeviationPx,
        drawingDurationSec: metrics.drawingDurationSec,
        timestamp: new Date().toISOString(),
      },
    });

    Alert.alert(
      'Kinematic Analysis Saved! 🌀',
      `Archimedean Spiral Test complete.\nSmoothness Rating: ${metrics.smoothnessScore}/100 • Micro-Tremor Ripples: ${metrics.tremorRipples}\n\nObjective drawing kinematics synchronized with Doctor and Caretaker.`,
      [{ text: 'OK', onPress: () => (onComplete ? onComplete() : onBack()) }]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Spiral Kinematic Test"
        subtitle="Postural & Kinetic Tremor Analysis"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Archimedean Spiral Tracing</Text>
          <Text style={styles.cardDesc}>
            Trace steadily from the center dot outward along the spiral guidance curve.
          </Text>

          {/* Canvas Area */}
          <View style={styles.canvasContainer} {...panResponder.panHandlers}>
            {/* Background Guided Spiral Rings */}
            <View style={[styles.guideRing, { width: 60, height: 60, borderRadius: 30 }]} />
            <View style={[styles.guideRing, { width: 120, height: 120, borderRadius: 60 }]} />
            <View style={[styles.guideRing, { width: 180, height: 180, borderRadius: 90 }]} />
            <View style={[styles.guideRing, { width: 240, height: 240, borderRadius: 120 }]} />
            <View style={styles.centerDot} />

            {/* Render Drawn Points */}
            {points.map((pt, i) => (
              <View
                key={i}
                style={[
                  styles.tracePoint,
                  {
                    left: pt.x - 4,
                    top: pt.y - 4,
                    backgroundColor: testState === 'completed' ? Colors.primary : '#2563EB',
                  },
                ]}
              />
            ))}

            {testState === 'idle' && (
              <View style={styles.touchHintOverlay} pointerEvents="none">
                <Text style={styles.touchHintText}>👉 Touch and trace spiral here</Text>
              </View>
            )}
          </View>

          {/* Test Controls / Results */}
          {testState === 'drawing' && (
            <View style={styles.statusRow}>
              <Text style={styles.drawingText}>✍️ Tracing... keep a steady movement</Text>
            </View>
          )}

          {testState === 'completed' && (
            <View style={styles.resultsBox}>
              <Text style={styles.resultsHeading}>Kinematic Tremor Metrics</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={[styles.metricBig, { color: metrics.smoothnessScore > 70 ? Colors.success : Colors.warning }]}>
                    {metrics.smoothnessScore}%
                  </Text>
                  <Text style={styles.metricLabel}>Smoothness Score</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricBig}>{metrics.tremorRipples}</Text>
                  <Text style={styles.metricLabel}>Tremor Ripples</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricBig}>{metrics.drawingDurationSec}s</Text>
                  <Text style={styles.metricLabel}>Duration</Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricBig}>{metrics.meanDeviationPx} px</Text>
                  <Text style={styles.metricLabel}>Mean Step Jitter</Text>
                </View>
              </View>

              <PrimaryButton
                title="Save & Transmit Analysis"
                icon="📡"
                onPress={handleSaveResults}
                style={{ marginTop: Spacing.md }}
              />

              <TouchableOpacity style={styles.clearBtn} onPress={resetTest}>
                <Text style={styles.clearBtnText}>🔄 Reset Canvas & Retake</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    ...Shadows.md,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  canvasContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  centerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.error,
    position: 'absolute',
  },
  guideRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  tracePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  touchHintOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  touchHintText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusRow: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  drawingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  resultsBox: {
    marginTop: Spacing.md,
  },
  resultsHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricBig: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  clearBtn: {
    alignSelf: 'center',
    marginTop: Spacing.sm,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});

export default SpiralDrawingTestScreen;
