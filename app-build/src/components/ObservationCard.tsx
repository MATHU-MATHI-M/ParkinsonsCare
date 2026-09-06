import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CaretakerObservation } from '../types';
import { Colors, Spacing, Typography, Shadows } from '../theme';
import SeverityBadge from './SeverityBadge';

interface ObservationCardProps {
  observation: CaretakerObservation;
}

export const ObservationCard: React.FC<ObservationCardProps> = ({ observation }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Text style={styles.caretakerIcon}>🧑‍⚕️</Text>
          <View>
            <Text style={styles.caretakerName}>{observation.caretakerName}</Text>
            <Text style={styles.date}>{observation.timestamp}</Text>
          </View>
        </View>

        <SeverityBadge level={observation.severity} />
      </View>

      <View style={styles.domainTag}>
        <Text style={styles.domainTagText}>{observation.domain.toUpperCase()}</Text>
      </View>

      <Text style={styles.note}>{observation.note}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    ...Shadows.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caretakerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  caretakerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  domainTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.neutral100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginVertical: 4,
  },
  domainTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.neutral700,
  },
  note: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginTop: 4,
  },
});

export default ObservationCard;
