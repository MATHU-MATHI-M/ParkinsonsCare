import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import HealthScoreBar from '../../components/HealthScoreBar';
import mlInferenceService from '../../services/mlInferenceService';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

export const PatientHomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const { currentPatient, prediction, latestMultiModal } = useData();

  const domainScores = useMemo(() => {
    if (!currentPatient?.visits?.length) return [];
    const latest = currentPatient.visits[currentPatient.visits.length - 1];
    return mlInferenceService.computeDomainScores(latest, latestMultiModal);
  }, [currentPatient, latestMultiModal]);

  if (!currentPatient) {
    return (
      <View style={styles.container}>
        <AppHeader title="My Health" />
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Loading your health data…</Text>
        </View>
      </View>
    );
  }

  const overallScore = prediction?.overallNonMotorBurdenScore ?? 30;
  const progression = prediction?.progressionSpeed ?? 'Stable';

  // Plain-English status
  const statusConfig = (() => {
    if (overallScore < 30) return { emoji: '✅', label: 'Looking Good', color: '#10B981', bg: '#ECFDF5', desc: 'Your health scores are in a good range. Keep up your daily routine!' };
    if (overallScore < 60) return { emoji: '⚡', label: 'Fair', color: '#F59E0B', bg: '#FFFBEB', desc: 'Some areas need a little attention. Check the details below.' };
    return { emoji: '⚠️', label: 'Needs Attention', color: '#EF4444', bg: '#FEF2F2', desc: 'A few health areas need attention. Please review and contact your care team.' };
  })();

  // Motor test cards
  const motorTests = [
    {
      emoji: '⚡', title: 'Finger Tap',
      value: latestMultiModal?.fingerTap ? `${latestMultiModal.fingerTap.cadenceHz} Hz` : 'Not done yet',
      desc: 'Hand speed test',
      color: '#0284C7',
      onPress: () => onNavigate('fingerTap'),
      done: !!latestMultiModal?.fingerTap,
    },
    {
      emoji: '🌀', title: 'Spiral Draw',
      value: latestMultiModal?.spiralDrawing ? `${latestMultiModal.spiralDrawing.smoothnessScore}% smooth` : 'Not done yet',
      desc: 'Hand steadiness',
      color: '#7C3AED',
      onPress: () => onNavigate('spiralDrawing'),
      done: !!latestMultiModal?.spiralDrawing,
    },
    {
      emoji: '⏱️', title: 'Reaction',
      value: latestMultiModal?.reactionSpeed ? `${latestMultiModal.reactionSpeed.meanReactionTimeMs}ms` : 'Not done yet',
      desc: 'Response speed',
      color: '#059669',
      onPress: () => onNavigate('reactionSpeed'),
      done: !!latestMultiModal?.reactionSpeed,
    },
    {
      emoji: '🎙️', title: 'Voice',
      value: latestMultiModal?.voicePhonation ? `${latestMultiModal.voicePhonation.steadinessScore}% steady` : 'Not done yet',
      desc: 'Voice steadiness',
      color: '#D97706',
      onPress: () => onNavigate('voicePhonation'),
      done: !!latestMultiModal?.voicePhonation,
    },
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        title={`Hi, ${currentPatient.name?.split(' ')[0] ?? 'there'} 👋`}
        subtitle="Here's how you're doing today"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Welcome Onboarding Card for Fresh Patients ── */}
        {(!currentPatient.visits || currentPatient.visits.length === 0) && (
          <View style={styles.onboardingCard}>
            <View style={styles.onboardingHeader}>
              <Text style={styles.onboardingEmoji}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.onboardingTitle}>Welcome, {currentPatient.name?.split(' ')[0] ?? 'there'}!</Text>
                <Text style={styles.onboardingSubtitle}>
                  Take your 3-minute Non-Motor Health Checkup so our PPMI-trained AI model can compute your personalized baseline health score.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.onboardingBtn}
              activeOpacity={0.85}
              onPress={() => onNavigate('assessment')}
            >
              <Text style={styles.onboardingBtnText}>Start Health Checkup (3 mins) →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Overall Health Score Card ── */}
        <View style={[styles.heroCard, { backgroundColor: statusConfig.bg, borderColor: statusConfig.color + '40' }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>YOUR HEALTH SCORE</Text>
              <View style={styles.heroScoreRow}>
                <Text style={[styles.heroScore, { color: statusConfig.color }]}>{overallScore}</Text>
                <Text style={styles.heroScoreMax}>/100</Text>
              </View>
              <Text style={styles.heroSub}>Lower is better</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusEmoji}>{statusConfig.emoji}</Text>
              <Text style={styles.statusLabel}>{statusConfig.label}</Text>
            </View>
          </View>
          <Text style={[styles.heroDesc, { color: statusConfig.color }]}>{statusConfig.desc}</Text>

          {/* Top concern */}
          {prediction && prediction.topRiskFactors.length > 0 && overallScore >= 30 && (
            <View style={styles.topConcernRow}>
              <Text style={styles.topConcernLabel}>⚡ Top concern: </Text>
              <Text style={styles.topConcernVal}>{prediction.topRiskFactors[0]}</Text>
            </View>
          )}

          {/* Progression pill */}
          <View style={styles.progressionRow}>
            <Text style={styles.progressionLabel}>Progression trend: </Text>
            <View style={[styles.progressionPill, {
              backgroundColor: progression === 'Stable' || progression === 'Slow' ? '#DCFCE7' : progression === 'Moderate' ? '#FEF9C3' : '#FEE2E2'
            }]}>
              <Text style={[styles.progressionPillText, {
                color: progression === 'Stable' || progression === 'Slow' ? '#15803D' : progression === 'Moderate' ? '#92400E' : '#991B1B'
              }]}>{progression}</Text>
            </View>
          </View>
        </View>

        {/* ── Featured Daily Action Cards ── */}
        <Text style={styles.sectionTitle}>Daily Activities</Text>
        <View style={styles.featuredActionsRow}>
          <TouchableOpacity
            style={styles.featuredExerciseCard}
            onPress={() => onNavigate('videoExercise')}
            activeOpacity={0.85}
          >
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>INTERACTIVE</Text>
            </View>
            <Text style={styles.featuredCardEmoji}>📹</Text>
            <Text style={styles.featuredCardTitle}>Guided Video Exercise</Text>
            <Text style={styles.featuredCardSub}>Live motion tracking & ML cadence detection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featuredCheckupCard}
            onPress={() => onNavigate('assessment')}
            activeOpacity={0.85}
          >
            <View style={[styles.featuredBadge, { backgroundColor: '#FDF2F8' }]}>
              <Text style={[styles.featuredBadgeText, { color: '#BE185D' }]}>DAILY CHECKUP</Text>
            </View>
            <Text style={styles.featuredCardEmoji}>📋</Text>
            <Text style={styles.featuredCardTitle}>Health Assessment</Text>
            <Text style={styles.featuredCardSub}>All 35 non-motor markers checkup</Text>
          </TouchableOpacity>
        </View>

        {/* ── Domain Health Overview ── */}
        <Text style={styles.sectionTitle}>Health Areas at a Glance</Text>
        <View style={styles.domainsCard}>
          {domainScores.map((domain) => (
            <TouchableOpacity
              key={domain.domain}
              style={styles.domainRow}
              onPress={() => onNavigate('symptoms')}
              activeOpacity={0.7}
            >
              <Text style={styles.domainIcon}>{domain.icon}</Text>
              <View style={styles.domainInfo}>
                <Text style={styles.domainName}>{domain.plainLabel}</Text>
                <HealthScoreBar score={domain.score} color={domain.color} label={domain.label} />
              </View>
              <Text style={styles.domainChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Today's Tests ── */}
        <Text style={styles.sectionTitle}>Today's Physical Tests</Text>
        <Text style={styles.sectionSubtitle}>Tap a test to run it. Takes less than 1 minute each.</Text>
        <View style={styles.testsGrid}>
          {motorTests.map((test) => (
            <TouchableOpacity
              key={test.title}
              style={[styles.testCard, { borderTopColor: test.color }]}
              onPress={test.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.testEmoji}>{test.emoji}</Text>
              <Text style={styles.testTitle}>{test.title}</Text>
              <Text style={[styles.testValue, { color: test.done ? test.color : Colors.textTertiary }]}>
                {test.value}
              </Text>
              <Text style={styles.testDesc}>{test.desc}</Text>
              {test.done && <View style={[styles.doneDot, { backgroundColor: test.color }]} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => onNavigate('symptoms')}>
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionTitle}>Full Health Details</Text>
            <Text style={styles.actionSub}>All 35 markers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => onNavigate('assessmentHub')}>
            <Text style={styles.actionEmoji}>🎯</Text>
            <Text style={styles.actionTitle}>Run All Tests</Text>
            <Text style={styles.actionSub}>Motor & cognitive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => onNavigate('careteam')}>
            <Text style={styles.actionEmoji}>🤝</Text>
            <Text style={styles.actionTitle}>Care Team</Text>
            <Text style={styles.actionSub}>Doctor & caretaker</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tip of the day ── */}
        {prediction?.recommendedInterventions?.[0] && (
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Tip for You</Text>
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
  emptyBox: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },

  // Hero card
  heroCard: {
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1.5,
    ...Shadows.md,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  heroLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1, marginBottom: 2 },
  heroScoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroScore: { fontSize: 52, fontWeight: '900' },
  heroScoreMax: { fontSize: 18, fontWeight: '700', color: '#94A3B8', marginLeft: 4 },
  heroSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statusBadge: {
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', minWidth: 90,
  },
  statusEmoji: { fontSize: 20, marginBottom: 2 },
  statusLabel: { fontSize: 11, fontWeight: '800', color: '#fff' },
  heroDesc: { fontSize: 13, fontWeight: '600', lineHeight: 20, marginBottom: 8 },
  topConcernRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  topConcernLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  topConcernVal: { fontSize: 12, fontWeight: '800', color: '#1E293B', flex: 1 },
  progressionRow: { flexDirection: 'row', alignItems: 'center' },
  progressionLabel: { fontSize: 12, color: '#64748B' },
  progressionPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  progressionPillText: { fontSize: 12, fontWeight: '800' },

  // Domain summary
  sectionTitle: { ...Typography.h3, fontWeight: '800', color: '#1E293B', marginBottom: 4, marginTop: 4 },
  sectionSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  domainsCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: Spacing.md,
    marginBottom: Spacing.base, ...Shadows.sm,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  domainRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  domainIcon: { fontSize: 24, marginRight: 12 },
  domainInfo: { flex: 1 },
  domainName: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  domainChevron: { fontSize: 20, color: '#94A3B8', marginLeft: 8 },

  // Tests grid
  testsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.base,
  },
  testCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 14,
    padding: 12, borderTopWidth: 4, alignItems: 'center',
    ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0',
    position: 'relative',
  },
  testEmoji: { fontSize: 26, marginBottom: 4 },
  testTitle: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  testValue: { fontSize: 13, fontWeight: '900', marginTop: 4 },
  testDesc: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  doneDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
  },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.base },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12,
    alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: '#E2E8F0',
  },
  actionEmoji: { fontSize: 24, marginBottom: 4 },
  actionTitle: { fontSize: 11, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  actionSub: { fontSize: 10, color: '#94A3B8', marginTop: 2, textAlign: 'center' },

  // Tip
  tipCard: {
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: Spacing.md,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  tipTitle: { fontSize: 13, fontWeight: '800', color: '#1D4ED8', marginBottom: 4 },
  tipText: { fontSize: 13, color: '#1E40AF', lineHeight: 20 },

  // Onboarding
  onboardingCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    ...Shadows.sm,
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  onboardingEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  onboardingTitle: {
    ...Typography.h3,
    color: '#312E81',
    fontSize: 16,
  },
  onboardingSubtitle: {
    ...Typography.bodySmall,
    color: '#4338CA',
    marginTop: 2,
    lineHeight: 18,
  },
  onboardingBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  onboardingBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Featured Daily Actions
  featuredActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.base,
  },
  featuredExerciseCard: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    ...Shadows.sm,
  },
  featuredCheckupCard: {
    flex: 1,
    backgroundColor: '#FDF2F8',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    ...Shadows.sm,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  featuredCardEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  featuredCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  featuredCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
});

export default PatientHomeScreen;
