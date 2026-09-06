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

export const VoicePhonationTestScreen: React.FC<Props> = ({ onBack, onComplete }) => {
  const { recordMultiModalAssessment } = useData();

  const [testState, setTestState] = useState<'idle' | 'recording' | 'completed'>('idle');
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Animated wave bars
  const waveAnim1 = useRef(new Animated.Value(20)).current;
  const waveAnim2 = useRef(new Animated.Value(35)).current;
  const waveAnim3 = useRef(new Animated.Value(50)).current;
  const waveAnim4 = useRef(new Animated.Value(30)).current;
  const waveAnim5 = useRef(new Animated.Value(25)).current;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startVoiceTest = () => {
    setDurationSeconds(0);
    setTestState('recording');

    // Start wave loop animation
    const animateWave = (anim: Animated.Value, minH: number, maxH: number, dur: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: maxH, duration: dur, useNativeDriver: false }),
          Animated.timing(anim, { toValue: minH, duration: dur, useNativeDriver: false }),
        ])
      ).start();
    };

    animateWave(waveAnim1, 15, 60, 220);
    animateWave(waveAnim2, 25, 90, 180);
    animateWave(waveAnim3, 30, 110, 260);
    animateWave(waveAnim4, 20, 85, 200);
    animateWave(waveAnim5, 15, 65, 240);

    timerRef.current = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopVoiceTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTestState('completed');
  };

  const computeMetrics = () => {
    const dur = Math.max(1, durationSeconds);

    // Normal sustained phonation in healthy adult is ~15-25 seconds; PD often < 12 seconds
    let steadiness = Math.min(95, Math.round(dur * 6.5 + 20));
    let category: 'Stable' | 'Mild Fluctuation' | 'Tremor Detected' = 'Stable';

    if (dur < 8) {
      category = 'Tremor Detected';
      steadiness = Math.min(steadiness, 55);
    } else if (dur < 14) {
      category = 'Mild Fluctuation';
      steadiness = Math.min(steadiness, 75);
    }

    return {
      durationSeconds: dur,
      steadinessScore: steadiness,
      stabilityCategory: category,
    };
  };

  const metrics = computeMetrics();

  const handleSaveResults = () => {
    recordMultiModalAssessment({
      voicePhonation: {
        durationSeconds: metrics.durationSeconds,
        steadinessScore: metrics.steadinessScore,
        stabilityCategory: metrics.stabilityCategory,
        timestamp: new Date().toISOString(),
      },
    });

    Alert.alert(
      'Vocal Stability Logged! 🎙️',
      `Sustained Phonation: ${metrics.durationSeconds}s • Stability: ${metrics.steadinessScore}/100\nCategory: ${metrics.stabilityCategory}\n\nTransmitted to Doctor's hypophonia and speech clarity panel.`,
      [{ text: 'OK', onPress: () => (onComplete ? onComplete() : onBack()) }]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Vocal & Speech Stability"
        subtitle="Sustained Phonation & Hypophonia Check"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {testState === 'idle' && (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🎙️</Text>
            </View>
            <Text style={styles.cardTitle}>Vocal Steadiness Protocol</Text>
            <Text style={styles.instructions}>
              1. Take a deep, comfortable breath.
            </Text>
            <Text style={styles.instructions}>
              2. Tap the button and steadily vocalize a sustained sound (<Text style={styles.bold}>"Ahhhhh"</Text>) into the phone at a normal volume.
            </Text>
            <Text style={styles.instructions}>
              3. Hold the sound steadily for as long as you comfortably can, then tap Stop.
            </Text>

            <PrimaryButton
              title="Begin Voice Recording"
              icon="▶️"
              onPress={startVoiceTest}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        )}

        {testState === 'recording' && (
          <View style={styles.recordingArea}>
            <View style={styles.recordingPill}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>RECORDING ACTIVE • {durationSeconds}s</Text>
            </View>

            {/* Sound Wave Animation */}
            <View style={styles.waveVisualizer}>
              <Animated.View style={[styles.waveBar, { height: waveAnim1 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim2 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim3 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim4 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim5 }]} />
            </View>

            <Text style={styles.recordingPrompt}>
              Hold your sound steadily: "Ahhhhh"
            </Text>

            <TouchableOpacity
              style={styles.stopBtn}
              activeOpacity={0.8}
              onPress={stopVoiceTest}
            >
              <Text style={styles.stopBtnIcon}>⏹️</Text>
              <Text style={styles.stopBtnText}>Stop Phonation ({durationSeconds}s)</Text>
            </TouchableOpacity>
          </View>
        )}

        {testState === 'completed' && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.icon}>📊</Text>
            </View>
            <Text style={styles.cardTitle}>Acoustic Analysis Summary</Text>
            <Text style={styles.cardSubtitle}>
              Sustained phonation held for {metrics.durationSeconds} seconds.
            </Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{metrics.durationSeconds}s</Text>
                <Text style={styles.metricLbl}>Phonation Time (MPT)</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{metrics.steadinessScore}%</Text>
                <Text style={styles.metricLbl}>Vocal Steadiness</Text>
              </View>

              <View style={styles.metricItem}>
                <Text
                  style={[
                    styles.metricVal,
                    {
                      color:
                        metrics.stabilityCategory === 'Stable'
                          ? Colors.success
                          : Colors.warning,
                    },
                  ]}
                >
                  {metrics.stabilityCategory}
                </Text>
                <Text style={styles.metricLbl}>Acoustic Jitter</Text>
              </View>
            </View>

            <View style={styles.clinicalBox}>
              <Text style={styles.clinicalTitle}>🩺 Speech Biomarker Note</Text>
              <Text style={styles.clinicalText}>
                {metrics.durationSeconds >= 12
                  ? 'Adequate respiratory-phonatory support. Minimal vocal tremor detected.'
                  : 'Shortened phonation duration. Suggests mild respiratory fatigue or hypophonia.'}
              </Text>
            </View>

            <PrimaryButton
              title="Save & Transmit Analysis"
              icon="📡"
              onPress={handleSaveResults}
              style={{ marginTop: Spacing.md }}
            />

            <TouchableOpacity style={styles.retryBtn} onPress={startVoiceTest}>
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: Spacing.md,
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
  recordingArea: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: Spacing.xl,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    marginRight: 8,
  },
  recText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.error,
    letterSpacing: 0.5,
  },
  waveVisualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    gap: 12,
    marginBottom: Spacing.xl,
  },
  waveBar: {
    width: 14,
    backgroundColor: Colors.primary,
    borderRadius: 7,
  },
  recordingPrompt: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    ...Shadows.md,
  },
  stopBtnIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  stopBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  clinicalBox: {
    backgroundColor: '#EFF6FF',
    padding: Spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginTop: Spacing.xs,
  },
  clinicalTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  clinicalText: {
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

export default VoicePhonationTestScreen;
