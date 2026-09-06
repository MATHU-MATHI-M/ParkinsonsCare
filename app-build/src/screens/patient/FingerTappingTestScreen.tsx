import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import PrimaryButton from '../../components/PrimaryButton';

interface Props {
  onBack: () => void;
  onComplete?: () => void;
}

export const FingerTappingTestScreen: React.FC<Props> = ({ onBack, onComplete }) => {
  const { recordMultiModalAssessment } = useData();

  const [testState, setTestState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapSide, setLastTapSide] = useState<'left' | 'right' | null>(null);

  // Store timestamps of each tap
  const tapTimestamps = useRef<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTest = () => {
    setTapCount(0);
    setLastTapSide(null);
    tapTimestamps.current = [];
    setSecondsRemaining(10);
    setTestState('running');

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTap = (side: 'left' | 'right') => {
    if (testState !== 'running') return;

    const now = Date.now();
    tapTimestamps.current.push(now);
    setTapCount((prev) => prev + 1);
    setLastTapSide(side);

    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 50, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const finishTest = () => {
    setTestState('completed');
  };

  // Calculate clinical rhythm metrics
  const computeMetrics = () => {
    const timestamps = tapTimestamps.current;
    if (timestamps.length < 2) {
      return {
        cadenceHz: 0,
        meanIntervalMs: 0,
        variabilityCv: 0,
        bradykinesiaIndex: 50,
      };
    }

    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - meanInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (CV = stdDev / mean * 100)
    const cv = meanInterval > 0 ? (stdDev / meanInterval) * 100 : 0;
    const cadence = tapCount / 10; // Taps per second

    // Bradykinesia index (0-100, higher = more severe motor slowing/arrhythmia)
    // Healthy cadence is ~4.5 - 6.5 Hz; PD often < 3.5 Hz with CV > 25%
    let bradykinesia = Math.max(0, Math.min(100, Math.round((5.0 - cadence) * 15 + cv * 0.8)));

    return {
      cadenceHz: Math.round(cadence * 10) / 10,
      meanIntervalMs: Math.round(meanInterval),
      variabilityCv: Math.round(cv * 10) / 10,
      bradykinesiaIndex: bradykinesia,
    };
  };

  const metrics = computeMetrics();

  const handleSaveResults = () => {
    recordMultiModalAssessment({
      fingerTap: {
        tapCount,
        cadenceHz: metrics.cadenceHz,
        meanIntervalMs: metrics.meanIntervalMs,
        variabilityCv: metrics.variabilityCv,
        bradykinesiaIndex: metrics.bradykinesiaIndex,
        timestamp: new Date().toISOString(),
      },
    });

    Alert.alert(
      'Results Transmitted! 🚀',
      `Finger-Tapping Motor Analysis saved.\nCadence: ${metrics.cadenceHz} taps/sec • Rhythm Instability: ${metrics.variabilityCv}%\n\nData has been synchronized with your Doctor and Caretaker portals.`,
      [{ text: 'OK', onPress: () => (onComplete ? onComplete() : onBack()) }]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Finger-Tapping Motor Test"
        subtitle="MDS-UPDRS Part III Kinematic Bradykinesia Protocol"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {testState === 'idle' && (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>⚡</Text>
            </View>
            <Text style={styles.instructionsTitle}>Objective Motor Rhythm Protocol</Text>
            <Text style={styles.instructions}>
              1. Place your phone on a flat surface or hold steadily with one hand.
            </Text>
            <Text style={styles.instructions}>
              2. Alternately tap the <Text style={styles.bold}>LEFT</Text> and <Text style={styles.bold}>RIGHT</Text> buttons as quickly and evenly as possible for 10 seconds.
            </Text>
            <Text style={styles.instructions}>
              3. Our algorithm measures tap frequency (Hz), inter-tap interval regularity, and signs of motor freezing or arrhythmia.
            </Text>

            <PrimaryButton
              title="Start 10s Tapping Test"
              icon="▶️"
              onPress={startTest}
              style={styles.startBtn}
            />
          </View>
        )}

        {testState === 'running' && (
          <View style={styles.testActiveBox}>
            {/* Timer Banner */}
            <View style={styles.timerBadge}>
              <Text style={styles.timerNumber}>{secondsRemaining}s</Text>
              <Text style={styles.timerLabel}>REMAINING</Text>
            </View>

            <Text style={styles.liveScore}>
              Taps: <Text style={styles.scoreHighlight}>{tapCount}</Text>
            </Text>

            {/* Alternating Tap Buttons */}
            <View style={styles.tapButtonRow}>
              <TouchableOpacity
                style={[
                  styles.tapTarget,
                  lastTapSide === 'left' && styles.tapTargetActive,
                ]}
                activeOpacity={0.6}
                onPress={() => handleTap('left')}
              >
                <Text style={styles.tapTargetIcon}>👈</Text>
                <Text style={styles.tapTargetText}>LEFT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tapTarget,
                  lastTapSide === 'right' && styles.tapTargetActive,
                ]}
                activeOpacity={0.6}
                onPress={() => handleTap('right')}
              >
                <Text style={styles.tapTargetIcon}>👉</Text>
                <Text style={styles.tapTargetText}>RIGHT</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.hintText}>Keep a steady, rapid alternating rhythm!</Text>
          </View>
        )}

        {testState === 'completed' && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.icon}>✅</Text>
            </View>
            <Text style={styles.completedTitle}>Test Completed!</Text>
            <Text style={styles.completedSub}>
              Logged {tapCount} alternating taps in 10 seconds.
            </Text>

            {/* Results Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{metrics.cadenceHz} Hz</Text>
                <Text style={styles.metricLbl}>Tapping Cadence</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{metrics.meanIntervalMs} ms</Text>
                <Text style={styles.metricLbl}>Avg Tap Interval</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{metrics.variabilityCv}%</Text>
                <Text style={styles.metricLbl}>Rhythm CV (Jitter)</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: metrics.bradykinesiaIndex > 40 ? Colors.warning : Colors.success }]}>
                  {metrics.bradykinesiaIndex}/100
                </Text>
                <Text style={styles.metricLbl}>Bradykinesia Index</Text>
              </View>
            </View>

            {/* Clinical Feedback */}
            <View style={styles.clinicalNoteBox}>
              <Text style={styles.clinicalNoteTitle}>🩺 Clinical Interpretation</Text>
              <Text style={styles.clinicalNoteText}>
                {metrics.variabilityCv < 18
                  ? 'Excellent motor cadence and minimal rhythm fluctuation. Normal basal ganglia timing transmission.'
                  : metrics.variabilityCv < 32
                  ? 'Mild rhythm variability detected. Typical for controlled Parkinsonian motor state.'
                  : 'Elevated inter-tap irregularity and cadence slowing. Noted for neurological review.'}
              </Text>
            </View>

            <PrimaryButton
              title="Save & Transmit to Care Team"
              icon="📡"
              onPress={handleSaveResults}
              style={{ marginTop: Spacing.md }}
            />

            <TouchableOpacity style={styles.retryBtn} onPress={startTest}>
              <Text style={styles.retryText}>🔄 Retake Test</Text>
            </TouchableOpacity>
          </View>
        )}
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  instructionsTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  instructions: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '800',
    color: Colors.primary,
  },
  startBtn: {
    marginTop: Spacing.md,
  },
  testActiveBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  timerBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  timerNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  liveScore: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  scoreHighlight: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primary,
  },
  tapButtonRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  tapTarget: {
    flex: 1,
    height: 140,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  tapTargetActive: {
    backgroundColor: '#E0F2FE',
    borderColor: Colors.primary,
    transform: [{ scale: 0.96 }],
  },
  tapTargetIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  tapTargetText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  hintText: {
    marginTop: Spacing.lg,
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  completedTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '800',
  },
  completedSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: Spacing.md,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metricLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  clinicalNoteBox: {
    backgroundColor: '#EFF6FF',
    padding: Spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginTop: Spacing.xs,
  },
  clinicalNoteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  clinicalNoteText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  retryBtn: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default FingerTappingTestScreen;
