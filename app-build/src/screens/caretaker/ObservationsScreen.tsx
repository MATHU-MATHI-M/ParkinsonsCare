import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import ObservationCard from '../../components/ObservationCard';
import PrimaryButton from '../../components/PrimaryButton';

interface Props {
  onBack: () => void;
}

export const ObservationsScreen: React.FC<Props> = ({ onBack }) => {
  const { observations, addObservation, currentPatient } = useData();
  const [domain, setDomain] = useState<'Sleep' | 'Mood' | 'Confusion' | 'Autonomic' | 'General'>('Sleep');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!note.trim()) {
      Alert.alert('Empty Note', 'Please enter your observation details before submitting.');
      return;
    }

    addObservation({
      patientId: currentPatient?.id || 'patient-101',
      domain,
      note: note.trim(),
      severity,
    });

    setNote('');
    Alert.alert('Observation Saved 🎉', 'Your observation log has been added to the clinical chart.');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Caretaker Logbook"
        subtitle="Daily Non-Motor Observations"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add New Observation Log</Text>

          {/* Domain Selector */}
          <Text style={styles.label}>Category Domain</Text>
          <View style={styles.selectorRow}>
            {(['Sleep', 'Mood', 'Confusion', 'Autonomic', 'General'] as const).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, domain === d && styles.chipActive]}
                onPress={() => setDomain(d)}
              >
                <Text style={[styles.chipText, domain === d && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Severity Selector */}
          <Text style={styles.label}>Severity Level</Text>
          <View style={styles.selectorRow}>
            {(['mild', 'moderate', 'severe'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, severity === s && styles.chipActive]}
                onPress={() => setSeverity(s)}
              >
                <Text style={[styles.chipText, severity === s && styles.chipTextActive]}>{s.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note Input */}
          <Text style={styles.label}>Detailed Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe any non-motor symptoms noticed today (e.g. restless sleep, vivid dreaming, low energy, postural lightheadedness)..."
            placeholderTextColor={Colors.neutral400}
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
          />

          <PrimaryButton
            title="Save Observation Log"
            icon="💾"
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </View>

        {/* History List */}
        <Text style={styles.sectionTitle}>Observation Log History</Text>
        {observations.map(obs => (
          <ObservationCard key={obs.id} observation={obs} />
        ))}
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
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    ...Shadows.md,
  },
  formTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: 6,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.neutral100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  textArea: {
    backgroundColor: Colors.neutral50,
    borderWidth: 1,
    borderColor: Colors.neutral300,
    borderRadius: 10,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    height: 90,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
});

export default ObservationsScreen;
