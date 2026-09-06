import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { useData } from '../../context/DataContext';
import { PatientVisit } from '../../types';
import AppHeader from '../../components/AppHeader';
import TrendChart from '../../components/TrendChart';

interface Props {
  onBack: () => void;
}

export const TrendsScreen: React.FC<Props> = ({ onBack }) => {
  const { currentPatient } = useData();

  if (!currentPatient) return null;

  const visits = currentPatient.visits || [];

  // Prepare chart data series
  const mocaData = visits.map((v: PatientVisit) => ({
    label: v.visitId || v.event_id || 'BL',
    value: v.mocaTotal ?? v.moca_total ?? 0,
  }));

  const sleepData = visits.map((v: PatientVisit) => ({
    label: v.visitId || v.event_id || 'BL',
    value: v.essTotal ?? v.ess_score ?? 0,
    secondaryValue: v.rbdsqScore ?? v.rbdsq_score ?? 0,
  }));

  const moodData = visits.map((v: PatientVisit) => ({
    label: v.visitId || v.event_id || 'BL',
    value: v.gdsScore ?? v.gds_score ?? 0,
  }));

  const scopaData = visits.map((v: PatientVisit) => ({
    label: v.visitId || v.event_id || 'BL',
    value: v.scopaTotal ?? v.scopa_total ?? 0,
  }));

  return (
    <View style={styles.container}>
      <AppHeader
        title="Health Trends"
        subtitle={`${visits.length} Assessment History Recorded`}
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {visits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyTitle}>No Trend Data Yet</Text>
            <Text style={styles.emptyDesc}>
              Complete your first non-motor health assessment to start tracking your health trends over time.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.infoBanner}>
              📊 Track how your cognitive, sleep, mood, and body systems progress over time.
            </Text>

        <TrendChart
          title="Cognition: MoCA Progression"
          subtitle="Montreal Cognitive Assessment score (0-30 scale, <26 indicates MCI risk)"
          data={mocaData}
          maxValue={30}
          minValue={0}
          color={Colors.primary}
          primaryLabel="MoCA Score"
        />

        <TrendChart
          title="Sleep: Daytime Somnolence & REM Sleep"
          subtitle="ESS Daytime Sleepiness (0-24) vs. RBDSQ REM Sleep Disorder Score (0-13)"
          data={sleepData}
          maxValue={24}
          minValue={0}
          color={Colors.warning}
          secondaryColor={Colors.accent}
          primaryLabel="ESS Daytime Sleepiness"
          secondaryLabel="RBDSQ REM Sleep"
        />

        <TrendChart
          title="Mood: Geriatric Depression Scale"
          subtitle="GDS-15 Score (0-15 scale, ≥5 indicates depression risk)"
          data={moodData}
          maxValue={15}
          minValue={0}
          color={Colors.error}
          primaryLabel="GDS-15 Score"
        />

        <TrendChart
          title="Autonomic Burden: SCOPA-AUT"
          subtitle="SCOPA-AUT Total Score (0-42 scale)"
          data={scopaData}
          maxValue={42}
          minValue={0}
          color={Colors.info}
          primaryLabel="SCOPA-AUT Total"
        />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.neutral200,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBanner: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    backgroundColor: Colors.neutral100,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
});

export default TrendsScreen;
