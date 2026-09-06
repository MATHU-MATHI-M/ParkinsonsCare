import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import SeverityBadge from '../../components/SeverityBadge';
import TrendChart from '../../components/TrendChart';
import ObservationCard from '../../components/ObservationCard';
import PrimaryButton from '../../components/PrimaryButton';

interface Props {
  patientId: string;
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const DoctorPatientProfileScreen: React.FC<Props> = ({ patientId, onBack, onNavigate }) => {
  const { patients, doctorNotes, addDoctorNote, deleteDoctorNote, prediction } = useData();
  const [newNote, setNewNote] = useState('');

  const patient = patients.find(p => p.id === patientId) || patients[0];
  const patientVisits = patient?.visits || [];
  const latestVisit = patientVisits.length > 0 ? patientVisits[patientVisits.length - 1] : undefined;

  const patientNotes = doctorNotes.filter(n => n.patientId === patient?.id);

  const handleAddNote = () => {
    if (!newNote.trim()) {
      Alert.alert('Empty Note', 'Please enter clinical notes before saving.');
      return;
    }
    if (!patient) return;
    addDoctorNote({
      patientId: patient.id,
      doctorName: 'Dr. Sarah Chen',
      note: newNote.trim(),
    });
    setNewNote('');
    Alert.alert('Clinical Note Saved', 'The note has been logged to patient medical history.');
  };

  const mocaData = patientVisits.map(v => ({
    label: v.visitId || v.event_id || 'BL',
    value: v.mocaTotal ?? v.moca_total ?? 0,
  }));

  if (!patient) return null;

  return (
    <View style={styles.container}>
      <AppHeader
        title={patient.name}
        subtitle={`Patient ID: ${patient.displayId || patient.id} • ${patient.age || 60} yrs • ${patient.gender || 'Patient'}`}
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Risk Summary Header Box */}
        <View style={styles.riskCard}>
          <View style={styles.riskTop}>
            <View>
              <Text style={styles.riskLabel}>NON-MOTOR BURDEN</Text>
              <Text style={styles.riskVal}>{patient.overallBurdenScore} / 100</Text>
            </View>
            <SeverityBadge
              level={patient.riskStatus === 'high' ? 'severe' : patient.riskStatus === 'medium' ? 'moderate' : 'normal'}
              text={`${patient.riskStatus.toUpperCase()} RISK`}
              size="large"
            />
          </View>

          {prediction && (
            <View style={styles.mlBox}>
              <Text style={styles.mlTitle}>🧠 ML Model Progression Analysis:</Text>
              <Text style={styles.mlText}>• Progression Speed: {prediction.progressionSpeed}</Text>
              <Text style={styles.mlText}>• MCI Probability: {(prediction.mciProbability * 100).toFixed(0)}%</Text>
              <Text style={styles.mlText}>• Top Risk: {prediction.topRiskFactors.join('; ')}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.modelBtn} onPress={() => onNavigate('model')}>
            <Text style={styles.modelBtnText}>View Full ML Feature Importances →</Text>
          </TouchableOpacity>
        </View>

        {/* Longitudinal Chart */}
        <TrendChart
          title="MoCA Trajectory (Cognition)"
          subtitle={`Longitudinal score over ${patientVisits.length} clinical visits`}
          data={mocaData}
          maxValue={30}
          minValue={0}
          color={Colors.primary}
        />

        {/* Non-Motor Domain Summary */}
        <Text style={styles.sectionTitle}>Latest Visit Markers ({latestVisit?.visitId ?? 'BL'})</Text>
        <View style={styles.markerGrid}>
          <View style={styles.markerBox}>
            <Text style={styles.markerLabel}>MoCA Score</Text>
            <Text style={styles.markerValue}>{latestVisit?.mocaTotal ?? 'N/A'}/30</Text>
          </View>
          <View style={styles.markerBox}>
            <Text style={styles.markerLabel}>ESS Sleep</Text>
            <Text style={styles.markerValue}>{latestVisit?.essTotal ?? 'N/A'}/24</Text>
          </View>
          <View style={styles.markerBox}>
            <Text style={styles.markerLabel}>GDS Mood</Text>
            <Text style={styles.markerValue}>{latestVisit?.gdsScore ?? 'N/A'}/15</Text>
          </View>
          <View style={styles.markerBox}>
            <Text style={styles.markerLabel}>SCOPA Autonomic</Text>
            <Text style={styles.markerValue}>{latestVisit?.scopaTotal ?? 'N/A'}/42</Text>
          </View>
        </View>

        {/* Clinical Notes CRUD Section */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Clinical Notes & Plan</Text>

          <TextInput
            style={styles.textArea}
            placeholder="Type clinical evaluation notes, medication adjustments, or non-motor management recommendations..."
            placeholderTextColor={Colors.neutral400}
            multiline
            numberOfLines={4}
            value={newNote}
            onChangeText={setNewNote}
          />
          <PrimaryButton
            title="+ Save Clinical Note"
            onPress={handleAddNote}
            style={styles.addNoteBtn}
          />

          <View style={styles.notesList}>
            {patientNotes.map(n => (
              <View key={n.id} style={styles.noteItem}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteAuthor}>{n.doctorName}</Text>
                  <Text style={styles.noteDate}>{n.timestamp}</Text>
                </View>
                <Text style={styles.noteText}>{n.note}</Text>
                <TouchableOpacity onPress={() => deleteDoctorNote(n.id)} style={styles.delBtn}>
                  <Text style={styles.delText}>Delete Note</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
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
  riskCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    ...Shadows.md,
  },
  riskTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  riskVal: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  mlBox: {
    backgroundColor: Colors.primarySurface,
    padding: Spacing.md,
    borderRadius: 10,
    marginVertical: Spacing.md,
  },
  mlTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  mlText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  modelBtn: {
    alignSelf: 'flex-start',
  },
  modelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  markerGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  markerBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    alignItems: 'center',
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  markerValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  notesSection: {
    marginTop: Spacing.sm,
  },
  textArea: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral300,
    borderRadius: 10,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    height: 90,
  },
  addNoteBtn: {
    marginVertical: Spacing.md,
  },
  notesList: {
    gap: 10,
  },
  noteItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral200,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  noteDate: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  delBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  delText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
  },
});

export default DoctorPatientProfileScreen;
