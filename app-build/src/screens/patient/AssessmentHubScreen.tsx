import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import HealthScoreBar from '../../components/HealthScoreBar';

interface Props {
  onBack: () => void;
  onSelectTest: (testType: 'tapping' | 'spiral' | 'reaction' | 'voice' | 'video' | 'survey') => void;
}

export const AssessmentHubScreen: React.FC<Props> = ({ onBack, onSelectTest }) => {
  const { latestMultiModal, prediction } = useData();

  const completedCount = [
    latestMultiModal?.fingerTap,
    latestMultiModal?.spiralDrawing,
    latestMultiModal?.reactionSpeed,
    latestMultiModal?.voicePhonation,
  ].filter(Boolean).length;

  const tests = [
    {
      id: 'video' as const,
      emoji: '📹',
      title: 'Guided Video Exercise',
      friendlyDesc: 'Rhythmic hand, finger, and facial exercises with live motion tracking and ML cadence detection.',
      time: '~1 min',
      color: '#4F46E5',
      bg: '#EEF2FF',
      result: latestMultiModal?.fingerTap
        ? `Last session: ${latestMultiModal.fingerTap.cadenceHz} Hz cadence`
        : null,
      done: !!latestMultiModal?.fingerTap,
      resultGood: latestMultiModal?.fingerTap ? latestMultiModal.fingerTap.variabilityCv < 25 : null,
    },
    {
      id: 'tapping' as const,
      emoji: '⚡',
      title: 'Finger Tapping',
      friendlyDesc: 'Tap the button as fast as you can for 10 seconds. This checks how quickly and steadily your hands move.',
      time: '~30 sec',
      color: '#0284C7',
      bg: '#E0F2FE',
      result: latestMultiModal?.fingerTap
        ? `Last result: ${latestMultiModal.fingerTap.cadenceHz} taps/sec`
        : null,
      done: !!latestMultiModal?.fingerTap,
      resultGood: latestMultiModal?.fingerTap ? latestMultiModal.fingerTap.cadenceHz >= 3.5 : null,
    },
    {
      id: 'spiral' as const,
      emoji: '🌀',
      title: 'Draw a Spiral',
      friendlyDesc: 'Draw a spiral on your screen as smoothly as you can. This checks for hand tremors and steadiness.',
      time: '~45 sec',
      color: '#7C3AED',
      bg: '#EDE9FE',
      result: latestMultiModal?.spiralDrawing
        ? `Last result: ${latestMultiModal.spiralDrawing.smoothnessScore}% smooth`
        : null,
      done: !!latestMultiModal?.spiralDrawing,
      resultGood: latestMultiModal?.spiralDrawing ? latestMultiModal.spiralDrawing.smoothnessScore >= 65 : null,
    },
    {
      id: 'reaction' as const,
      emoji: '⏱️',
      title: 'Reaction Speed',
      friendlyDesc: 'Tap the screen as soon as you see a colour change. This measures how quickly your brain responds.',
      time: '~1 min',
      color: '#059669',
      bg: '#D1FAE5',
      result: latestMultiModal?.reactionSpeed
        ? `Last result: ${latestMultiModal.reactionSpeed.meanReactionTimeMs}ms response`
        : null,
      done: !!latestMultiModal?.reactionSpeed,
      resultGood: latestMultiModal?.reactionSpeed ? latestMultiModal.reactionSpeed.meanReactionTimeMs <= 650 : null,
    },
    {
      id: 'voice' as const,
      emoji: '🎙️',
      title: 'Voice Steadiness',
      friendlyDesc: 'Hold a steady "Aaah" sound for as long as you can. This checks your vocal strength and steadiness.',
      time: '~30 sec',
      color: '#D97706',
      bg: '#FEF3C7',
      result: latestMultiModal?.voicePhonation
        ? `Last result: ${latestMultiModal.voicePhonation.steadinessScore}% steady`
        : null,
      done: !!latestMultiModal?.voicePhonation,
      resultGood: latestMultiModal?.voicePhonation ? latestMultiModal.voicePhonation.steadinessScore >= 65 : null,
    },
    {
      id: 'survey' as const,
      emoji: '📋',
      title: 'Symptom Check-In',
      friendlyDesc: 'Answer a few simple questions about how you\'ve been feeling — sleep, mood, energy, and body comfort.',
      time: '~3 min',
      color: Colors.primary,
      bg: Colors.primarySurface,
      result: null,
      done: false,
      resultGood: null,
    },
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        title="Daily Tests"
        subtitle="Track your health with quick check-ins"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Progress bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressCount}>
              <Text style={styles.progressDone}>{completedCount}</Text>
              <Text style={styles.progressTotal}> / 4 tests done</Text>
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(completedCount / 4) * 100}%` }]} />
          </View>
          {completedCount === 4
            ? <Text style={styles.progressComplete}>✅ All physical tests complete for today!</Text>
            : <Text style={styles.progressRemaining}>{4 - completedCount} test{4 - completedCount !== 1 ? 's' : ''} remaining</Text>
          }
        </View>

        {/* Why these tests */}
        <View style={styles.whyCard}>
          <Text style={styles.whyTitle}>🧬 Why do these tests?</Text>
          <Text style={styles.whyText}>
            These short tests detect subtle changes in your movement, thinking speed, and voice that can be early signs of Parkinson's progression — often before you notice them yourself. The results feed directly into your health score.
          </Text>
        </View>

        {/* Test list */}
        <Text style={styles.sectionTitle}>Available Tests</Text>
        {tests.map((test) => (
          <TouchableOpacity
            key={test.id}
            style={[styles.testCard, { borderLeftColor: test.color }]}
            onPress={() => onSelectTest(test.id)}
            activeOpacity={0.85}
          >
            <View style={styles.testHeader}>
              <View style={[styles.testIconBox, { backgroundColor: test.bg }]}>
                <Text style={styles.testEmoji}>{test.emoji}</Text>
              </View>
              <View style={styles.testTitleBox}>
                <View style={styles.testTitleRow}>
                  <Text style={styles.testTitle}>{test.title}</Text>
                  {test.done && (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>✓ Done</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.testTime}>⏱ {test.time}</Text>
              </View>
              <Text style={[styles.testArrow, { color: test.color }]}>›</Text>
            </View>

            <Text style={styles.testDesc}>{test.friendlyDesc}</Text>

            {test.result && (
              <View style={[styles.resultRow, { backgroundColor: test.bg }]}>
                <Text style={[styles.resultText, { color: test.color }]}>{test.result}</Text>
                {test.resultGood !== null && (
                  <Text style={styles.resultStatus}>{test.resultGood ? '✅' : '⚠️'}</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Recommendations from ML */}
        {prediction?.recommendedInterventions?.[0] && (
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Your latest suggestion</Text>
            <Text style={styles.tipText}>{prediction.recommendedInterventions[0]}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: Spacing.base, paddingBottom: 40 },

  // Progress
  progressCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: Spacing.md,
    marginBottom: 12, ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0',
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  progressCount: {},
  progressDone: { fontSize: 22, fontWeight: '900', color: '#10B981' },
  progressTotal: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  progressBarTrack: {
    height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', marginBottom: 6,
  },
  progressBarFill: {
    height: '100%', backgroundColor: '#10B981', borderRadius: 5,
  },
  progressComplete: { fontSize: 12, color: '#15803D', fontWeight: '700' },
  progressRemaining: { fontSize: 12, color: '#94A3B8' },

  // Why card
  whyCard: {
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#BFDBFE',
  },
  whyTitle: { fontSize: 13, fontWeight: '800', color: '#1D4ED8', marginBottom: 4 },
  whyText: { fontSize: 12, color: '#1E40AF', lineHeight: 18 },

  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 10,
  },

  // Test card
  testCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    marginBottom: 10, borderLeftWidth: 5, borderWidth: 1,
    borderColor: '#E2E8F0', ...Shadows.sm,
  },
  testHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  testIconBox: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  testEmoji: { fontSize: 24 },
  testTitleBox: { flex: 1 },
  testTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  testTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  doneBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  doneBadgeText: { fontSize: 10, fontWeight: '800', color: '#15803D' },
  testTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  testArrow: { fontSize: 24, fontWeight: '300' },
  testDesc: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 8 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 8, borderRadius: 8,
  },
  resultText: { fontSize: 12, fontWeight: '700' },
  resultStatus: { fontSize: 16 },

  // Tip
  tipCard: {
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14,
    marginTop: 4, borderWidth: 1, borderColor: '#BBF7D0',
  },
  tipTitle: { fontSize: 13, fontWeight: '800', color: '#15803D', marginBottom: 4 },
  tipText: { fontSize: 13, color: '#166534', lineHeight: 20 },
});

export default AssessmentHubScreen;
