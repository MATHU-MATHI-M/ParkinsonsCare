import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import HealthScoreBar from '../../components/HealthScoreBar';
import mlInferenceService, { DomainRiskScore, FeatureDetail } from '../../services/mlInferenceService';

interface Props {
  onBack: () => void;
}

/** A single feature row with bar and explanation */
const FeatureRow: React.FC<{ feature: FeatureDetail }> = ({ feature }) => {
  const [expanded, setExpanded] = useState(false);
  const color = feature.status === 'good' ? '#10B981' : feature.status === 'fair' ? '#F59E0B' : '#EF4444';
  const bg = feature.status === 'good' ? '#ECFDF5' : feature.status === 'fair' ? '#FFFBEB' : '#FEF2F2';

  return (
    <TouchableOpacity
      style={[styles.featureRow, { backgroundColor: bg, borderColor: color + '30' }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.featureTop}>
        <View style={styles.featureLeft}>
          <Text style={styles.featureName}>{feature.plainName}</Text>
          <Text style={styles.featureValue}>
            {feature.value !== null ? `${feature.value} ${feature.unit}` : 'No data'}
          </Text>
        </View>
        <View style={styles.featureRight}>
          <View style={[styles.statusPill, { backgroundColor: color }]}>
            <Text style={styles.statusPillText}>
              {feature.status === 'good' ? '✓ Good' : feature.status === 'fair' ? '~ Fair' : '! Attention'}
            </Text>
          </View>
          <Text style={styles.expandChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </View>

      <View style={styles.featureBarRow}>
        <HealthScoreBar score={feature.score} color={color} label="" height={6} />
      </View>

      {expanded && (
        <Text style={[styles.featureExplanation, { color }]}>{feature.explanation}</Text>
      )}
    </TouchableOpacity>
  );
};

/** A domain section card */
const DomainSection: React.FC<{ domain: DomainRiskScore; defaultOpen?: boolean }> = ({ domain, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={[styles.domainCard, { borderLeftColor: domain.color }]}>
      {/* Domain Header */}
      <TouchableOpacity style={styles.domainHeader} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={styles.domainHeaderLeft}>
          <Text style={styles.domainEmoji}>{domain.icon}</Text>
          <View>
            <Text style={styles.domainName}>{domain.plainLabel}</Text>
            <Text style={[styles.domainStatus, { color: domain.color }]}>{domain.label}</Text>
          </View>
        </View>
        <View style={styles.domainHeaderRight}>
          <View style={styles.domainBarWrap}>
            <HealthScoreBar score={domain.score} color={domain.color} label="" height={6} />
          </View>
          <Text style={styles.domainChevron}>{open ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Domain insight */}
      <Text style={styles.domainInsight}>{domain.insight}</Text>

      {/* Feature list (expandable) */}
      {open && (
        <View style={styles.featuresList}>
          <Text style={styles.featuresHint}>Tap any item to see what it means</Text>
          {domain.features.map((f) => (
            <FeatureRow key={f.key} feature={f} />
          ))}
        </View>
      )}

      {!open && (
        <TouchableOpacity onPress={() => setOpen(true)} style={styles.showMoreBtn}>
          <Text style={styles.showMoreText}>Show {domain.features.length} measurements ›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const SymptomScreen: React.FC<Props> = ({ onBack }) => {
  const { currentPatient, latestMultiModal, prediction } = useData();

  const domainScores = useMemo(() => {
    if (!currentPatient?.visits?.length) return [];
    const latest = currentPatient.visits[currentPatient.visits.length - 1];
    return mlInferenceService.computeDomainScores(latest, latestMultiModal);
  }, [currentPatient, latestMultiModal]);

  if (!currentPatient) return null;

  const overallScore = prediction?.overallNonMotorBurdenScore ?? 30;
  const overallColor = overallScore < 30 ? '#10B981' : overallScore < 60 ? '#F59E0B' : '#EF4444';
  const overallLabel = overallScore < 30 ? 'Good' : overallScore < 60 ? 'Fair' : 'Needs Attention';

  const totalFeatures = domainScores.reduce((sum, d) => sum + d.features.length, 0);
  const goodFeatures = domainScores.reduce(
    (sum, d) => sum + d.features.filter(f => f.status === 'good').length, 0
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="My Health Details"
        subtitle="All your non-motor health markers"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Summary banner */}
        <View style={[styles.summaryBanner, { borderColor: overallColor + '40', backgroundColor: overallColor + '10' }]}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryScoreLabel}>Overall Health Score</Text>
            <Text style={[styles.summaryScore, { color: overallColor }]}>{overallScore}<Text style={styles.summaryMax}>/100</Text></Text>
            <Text style={styles.summaryLower}>Lower is better</Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryGoodCount}>
              <Text style={styles.summaryGoodNum}>{goodFeatures}</Text>
              <Text style={styles.summaryTotalStr}> / {totalFeatures}</Text>
            </Text>
            <Text style={styles.summaryGoodLabel}>markers healthy</Text>
            <View style={[styles.summaryBadge, { backgroundColor: overallColor }]}>
              <Text style={styles.summaryBadgeText}>{overallLabel}</Text>
            </View>
          </View>
        </View>

        {/* Plain-English how to read guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>📖 How to read this page</Text>
          <Text style={styles.guideText}>
            Each section below shows a health area. <Text style={{ color: '#10B981', fontWeight: '700' }}>Green = Good</Text>,{' '}
            <Text style={{ color: '#F59E0B', fontWeight: '700' }}>Yellow = Fair</Text>,{' '}
            <Text style={{ color: '#EF4444', fontWeight: '700' }}>Red = Needs Attention</Text>.
            Tap any section to see all individual measurements. Tap a measurement to read what it means.
          </Text>
        </View>

        {/* Domain sections */}
        {domainScores.map((domain, idx) => (
          <DomainSection
            key={domain.domain}
            domain={domain}
            defaultOpen={idx === 0}
          />
        ))}

        {/* Recommendations */}
        {prediction?.recommendedInterventions && prediction.recommendedInterventions.length > 0 && (
          <View style={styles.recoCard}>
            <Text style={styles.recoTitle}>💡 Personalised Suggestions</Text>
            {prediction.recommendedInterventions.map((rec, i) => (
              <View key={i} style={styles.recoRow}>
                <Text style={styles.recoBullet}>•</Text>
                <Text style={styles.recoText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Model disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            🤖 Scores are calculated by a machine learning model trained on {(14833).toLocaleString()} PPMI clinical visits.
            These are informational only — always consult your doctor for medical decisions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: Spacing.base, paddingBottom: 40 },

  // Summary banner
  summaryBanner: {
    flexDirection: 'row', borderRadius: 18, padding: Spacing.lg,
    marginBottom: 12, borderWidth: 1.5, ...Shadows.md,
    justifyContent: 'space-between', alignItems: 'center',
  },
  summaryLeft: {},
  summaryScoreLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.8 },
  summaryScore: { fontSize: 42, fontWeight: '900' },
  summaryMax: { fontSize: 16, fontWeight: '700', color: '#94A3B8' },
  summaryLower: { fontSize: 11, color: '#94A3B8' },
  summaryRight: { alignItems: 'center' },
  summaryGoodCount: {},
  summaryGoodNum: { fontSize: 34, fontWeight: '900', color: '#10B981' },
  summaryTotalStr: { fontSize: 18, fontWeight: '700', color: '#94A3B8' },
  summaryGoodLabel: { fontSize: 11, color: '#64748B', marginBottom: 6 },
  summaryBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  summaryBadgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  // Guide
  guideCard: {
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#BFDBFE',
  },
  guideTitle: { fontSize: 13, fontWeight: '800', color: '#1D4ED8', marginBottom: 4 },
  guideText: { fontSize: 12, color: '#1E40AF', lineHeight: 18 },

  // Domain card
  domainCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    borderLeftWidth: 4, borderWidth: 1, borderColor: '#E2E8F0',
    overflow: 'hidden', ...Shadows.sm,
  },
  domainHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingBottom: 8,
  },
  domainHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  domainEmoji: { fontSize: 28, marginRight: 10 },
  domainName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  domainStatus: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  domainHeaderRight: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  domainBarWrap: { flex: 1, marginRight: 8 },
  domainChevron: { fontSize: 12, color: '#94A3B8', width: 16, textAlign: 'center' },
  domainInsight: {
    fontSize: 12, color: '#475569', lineHeight: 18,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  showMoreBtn: { paddingHorizontal: 14, paddingBottom: 12 },
  showMoreText: { fontSize: 12, color: '#3B82F6', fontWeight: '700' },
  featuresList: { paddingHorizontal: 12, paddingBottom: 12 },
  featuresHint: { fontSize: 11, color: '#94A3B8', marginBottom: 6, textAlign: 'center' },

  // Feature row
  featureRow: {
    borderRadius: 10, padding: 10, marginBottom: 6,
    borderWidth: 1,
  },
  featureTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  featureLeft: { flex: 1 },
  featureName: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  featureValue: { fontSize: 12, color: '#64748B', marginTop: 2 },
  featureRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  expandChevron: { fontSize: 10, color: '#94A3B8' },
  featureBarRow: { marginBottom: 4 },
  featureExplanation: { fontSize: 12, lineHeight: 18, fontWeight: '500', marginTop: 4 },

  // Recommendations
  recoCard: {
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0',
  },
  recoTitle: { fontSize: 13, fontWeight: '800', color: '#15803D', marginBottom: 8 },
  recoRow: { flexDirection: 'row', marginBottom: 6 },
  recoBullet: { fontSize: 14, color: '#15803D', marginRight: 6, marginTop: 1 },
  recoText: { fontSize: 13, color: '#166534', lineHeight: 20, flex: 1 },

  // Disclaimer
  disclaimer: {
    padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  disclaimerText: { fontSize: 11, color: '#94A3B8', lineHeight: 16, textAlign: 'center' },
});

export default SymptomScreen;
