import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import PrimaryButton from '../../components/PrimaryButton';

interface Props {
  onBack: () => void;
  onComplete?: () => void;
}

const SHAPES = ['🔵', '🔺', '🟩', '⭐', '💎'];

export const ReactionSpeedTestScreen: React.FC<Props> = ({ onBack, onComplete }) => {
  const { recordMultiModalAssessment } = useData();

  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'completed'>('idle');
  const [currentRound, setCurrentRound] = useState(0);
  const [targetShape, setTargetShape] = useState('⭐');
  const [displayShape, setDisplayShape] = useState('');
  const [roundReactionTimes, setRoundReactionTimes] = useState<number[]>([]);
  const [accuracyHits, setAccuracyHits] = useState(0);

  const cueTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const TOTAL_ROUNDS = 5;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startGame = () => {
    setRoundReactionTimes([]);
    setAccuracyHits(0);
    setCurrentRound(0);
    startNextRound(1);
  };

  const startNextRound = (roundNum: number) => {
    setCurrentRound(roundNum);
    setGameState('waiting');
    setDisplayShape('⏳');

    // Random delay between 1.2s and 2.8s
    const delay = Math.floor(Math.random() * 1600) + 1200;

    timeoutRef.current = setTimeout(() => {
      // 60% chance it's the target shape
      const isTarget = Math.random() < 0.65;
      const shape = isTarget
        ? targetShape
        : SHAPES.filter((s) => s !== targetShape)[Math.floor(Math.random() * 4)];

      setDisplayShape(shape);
      cueTimeRef.current = Date.now();
      setGameState('ready');
    }, delay);
  };

  const handleTap = () => {
    if (gameState === 'waiting') {
      // Tapped too early
      Alert.alert('Too early!', 'Wait for the shape to appear before tapping.');
      return;
    }

    if (gameState === 'ready') {
      const latency = Date.now() - cueTimeRef.current;
      const isCorrect = displayShape === targetShape;

      if (isCorrect) {
        setAccuracyHits((prev) => prev + 1);
        setRoundReactionTimes((prev) => [...prev, latency]);
      } else {
        // False positive
        setRoundReactionTimes((prev) => [...prev, latency + 200]);
      }

      if (currentRound < TOTAL_ROUNDS) {
        startNextRound(currentRound + 1);
      } else {
        setGameState('completed');
      }
    }
  };

  const computeMetrics = () => {
    if (roundReactionTimes.length === 0) {
      return {
        meanReactionMs: 480,
        accuracyPct: 80,
        speedCategory: 'Normal' as const,
      };
    }
    const mean = Math.round(
      roundReactionTimes.reduce((a, b) => a + b, 0) / roundReactionTimes.length
    );
    const accuracy = Math.round((accuracyHits / TOTAL_ROUNDS) * 100);

    let speedCategory: 'Normal' | 'Mild Delay' | 'Significant Delay' = 'Normal';
    if (mean > 650 || accuracy < 60) speedCategory = 'Significant Delay';
    else if (mean > 460 || accuracy < 80) speedCategory = 'Mild Delay';

    return {
      meanReactionMs: mean,
      accuracyPct: accuracy,
      speedCategory,
    };
  };

  const metrics = computeMetrics();

  const handleSaveResults = () => {
    recordMultiModalAssessment({
      reactionSpeed: {
        meanReactionTimeMs: metrics.meanReactionMs,
        accuracyPct: metrics.accuracyPct,
        correctCount: accuracyHits,
        totalTrials: TOTAL_ROUNDS,
        speedCategory: metrics.speedCategory,
        timestamp: new Date().toISOString(),
      },
    });

    Alert.alert(
      'Cognitive Speed Saved! ⏱️',
      `Reaction latency: ${metrics.meanReactionMs} ms • Accuracy: ${metrics.accuracyPct}%\n\nSynchronized with your Doctor's executive function dashboard.`,
      [{ text: 'OK', onPress: () => (onComplete ? onComplete() : onBack()) }]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Processing Speed Test"
        subtitle="PPMI SDMT & Executive Latency Protocol"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {gameState === 'idle' && (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>⏱️</Text>
            </View>
            <Text style={styles.cardTitle}>Cognitive Processing Speed</Text>
            <Text style={styles.instructions}>
              Target Symbol: <Text style={styles.targetHighlight}>{targetShape}</Text>
            </Text>
            <Text style={styles.instructions}>
              Whenever you see <Text style={styles.targetHighlight}>{targetShape}</Text> appear on the screen, tap the action button as quickly as possible.
            </Text>
            <Text style={styles.instructions}>
              Do NOT tap if any other symbol appears!
            </Text>

            <PrimaryButton
              title="Start Reaction Trials"
              icon="▶️"
              onPress={startGame}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        )}

        {(gameState === 'waiting' || gameState === 'ready') && (
          <View style={styles.gameArea}>
            <View style={styles.roundBanner}>
              <Text style={styles.roundText}>
                Trial {currentRound} of {TOTAL_ROUNDS}
              </Text>
              <Text style={styles.targetMini}>Target: {targetShape}</Text>
            </View>

            {/* Stimulus Box */}
            <View
              style={[
                styles.stimulusBox,
                gameState === 'ready' && displayShape === targetShape && styles.stimulusBoxTarget,
              ]}
            >
              <Text style={styles.stimulusText}>{displayShape}</Text>
            </View>

            {/* Tap Action Button */}
            <TouchableOpacity
              style={[
                styles.actionTapBtn,
                gameState === 'ready' && styles.actionTapBtnReady,
              ]}
              activeOpacity={0.7}
              onPress={handleTap}
            >
              <Text style={styles.actionTapBtnText}>
                {gameState === 'ready' ? '⚡ TAP NOW!' : 'Get Ready...'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'completed' && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Text style={styles.icon}>🎯</Text>
            </View>
            <Text style={styles.cardTitle}>Processing Speed Summary</Text>
            <Text style={styles.cardSubtitle}>
              Completed 5 cognitive reaction trials.
            </Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{metrics.meanReactionMs} ms</Text>
                <Text style={styles.metricLbl}>Mean Latency</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{metrics.accuracyPct}%</Text>
                <Text style={styles.metricLbl}>Accuracy</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: metrics.speedCategory === 'Normal' ? Colors.success : Colors.warning }]}>
                  {metrics.speedCategory}
                </Text>
                <Text style={styles.metricLbl}>Speed Category</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{accuracyHits}/{TOTAL_ROUNDS}</Text>
                <Text style={styles.metricLbl}>Target Hits</Text>
              </View>
            </View>

            <PrimaryButton
              title="Save & Transmit"
              icon="📡"
              onPress={handleSaveResults}
              style={{ marginTop: Spacing.md }}
            />

            <TouchableOpacity style={styles.retryBtn} onPress={startGame}>
              <Text style={styles.retryText}>🔄 Retake Trials</Text>
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
  targetHighlight: {
    fontSize: 20,
    fontWeight: '800',
  },
  gameArea: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  roundBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  roundText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  targetMini: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  stimulusBox: {
    width: 180,
    height: 180,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    borderWidth: 3,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  stimulusBoxTarget: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  stimulusText: {
    fontSize: 72,
  },
  actionTapBtn: {
    width: '100%',
    height: 80,
    borderRadius: 16,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  actionTapBtnReady: {
    backgroundColor: Colors.primary,
  },
  actionTapBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
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

export default ReactionSpeedTestScreen;
