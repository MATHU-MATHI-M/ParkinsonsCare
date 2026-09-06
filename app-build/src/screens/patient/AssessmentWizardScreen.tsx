import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useData } from '../../context/DataContext';
import { NON_MOTOR_DOMAINS, NON_MOTOR_QUESTIONS, NonMotorQuestion } from '../../services/assessmentService';
import AppHeader from '../../components/AppHeader';
import PrimaryButton from '../../components/PrimaryButton';

interface Props {
  onBack: () => void;
  onComplete: () => void;
}

export const AssessmentWizardScreen: React.FC<Props> = ({ onBack, onComplete }) => {
  const { submitFullAssessment } = useData();

  // Current domain step (0 to 4)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Initialize answers with default healthy values for all questions
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    NON_MOTOR_QUESTIONS.forEach(q => {
      initial[q.featureKey] = q.defaultValue;
    });
    return initial;
  });

  const currentDomain = NON_MOTOR_DOMAINS[currentStepIndex];
  const domainQuestions = NON_MOTOR_QUESTIONS.filter(q => q.domain === currentDomain.key);

  const handleSelectOption = (featureKey: string, value: number) => {
    setAnswers(prev => ({ ...prev, [featureKey]: value }));
  };

  // Quick preset: Set all in current domain to normal/healthy
  const handleSetAllNormal = () => {
    setAnswers(prev => {
      const updated = { ...prev };
      domainQuestions.forEach(q => {
        updated[q.featureKey] = q.defaultValue;
      });
      return updated;
    });
    Alert.alert('Baseline Set', `All questions in ${currentDomain.label} have been set to healthy normal baseline.`);
  };

  const handleNext = () => {
    if (currentStepIndex < NON_MOTOR_DOMAINS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Final submission: submit full assessment to ML engine
      submitFullAssessment(answers);

      Alert.alert(
        'Assessment Completed! 🎉',
        'Your non-motor symptom assessment has been processed by the PPMI-trained AI model.\nYour personalized health scores are now live!',
        [{ text: 'View My Health Dashboard', onPress: onComplete }]
      );
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const progressPct = Math.round(((currentStepIndex + 1) / NON_MOTOR_DOMAINS.length) * 100);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Health Checkup"
        subtitle={`Domain ${currentStepIndex + 1} of 5: ${currentDomain.label}`}
        showBack
        onBack={onBack}
      />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>

      {/* Step Domain Stepper Header */}
      <View style={styles.stepperRow}>
        {NON_MOTOR_DOMAINS.map((dom, idx) => {
          const isActive = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;
          return (
            <TouchableOpacity
              key={dom.key}
              style={[
                styles.stepTab,
                isActive && styles.stepTabActive,
                isDone && styles.stepTabDone,
              ]}
              onPress={() => setCurrentStepIndex(idx)}
            >
              <Text style={styles.stepTabIcon}>{dom.icon}</Text>
              <Text
                style={[
                  styles.stepTabText,
                  isActive && styles.stepTabTextActive,
                  isDone && styles.stepTabTextDone,
                ]}
                numberOfLines={1}
              >
                {dom.label.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Domain Hero Banner */}
        <View style={styles.domainBanner}>
          <View style={styles.domainBannerLeft}>
            <Text style={styles.domainBannerEmoji}>{currentDomain.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.domainBannerTitle}>{currentDomain.label}</Text>
              <Text style={styles.domainBannerSubtitle}>{currentDomain.desc}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.normalPresetBtn} onPress={handleSetAllNormal}>
            <Text style={styles.normalPresetBtnText}>✨ Mark All Normal</Text>
          </TouchableOpacity>
        </View>

        {/* Questions in this domain */}
        {domainQuestions.map((q: NonMotorQuestion, qIdx: number) => {
          const currentValue = answers[q.featureKey] ?? q.defaultValue;

          return (
            <View key={q.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>{qIdx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questionTitle}>{q.title}</Text>
                  <Text style={styles.questionSubtitle}>{q.subtitle}</Text>
                </View>
              </View>

              <View style={styles.optionsList}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = currentValue === opt.value;
                  return (
                    <TouchableOpacity
                      key={optIdx}
                      activeOpacity={0.8}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                      ]}
                      onPress={() => handleSelectOption(q.featureKey, opt.value)}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <View style={styles.optionTextCol}>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                          {opt.label}
                        </Text>
                        {opt.description ? (
                          <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                            {opt.description}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Navigation Buttons */}
        <View style={styles.navRow}>
          {currentStepIndex > 0 ? (
            <PrimaryButton
              title="← Back"
              variant="outline"
              onPress={handlePrev}
              style={styles.backBtn}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <PrimaryButton
            title={currentStepIndex === NON_MOTOR_DOMAINS.length - 1 ? 'Complete Checkup 🎉' : 'Next Domain →'}
            onPress={handleNext}
            style={styles.nextBtn}
          />
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
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.neutral200,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral200,
  },
  stepTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  stepTabActive: {
    backgroundColor: '#EEF2FF',
  },
  stepTabDone: {
    backgroundColor: '#F3F4F6',
  },
  stepTabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  stepTabText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  stepTabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  stepTabTextDone: {
    color: Colors.neutral400,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl * 1.5,
  },
  domainBanner: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    ...Shadows.sm,
  },
  domainBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  domainBannerEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  domainBannerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  domainBannerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  normalPresetBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  normalPresetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    ...Shadows.sm,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  questionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 13,
    fontWeight: '700',
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  questionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  questionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  optionsList: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: Colors.neutral200,
  },
  optionCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.primary,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutral300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionTextCol: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  optionDescSelected: {
    color: '#4338CA',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backBtn: {
    flex: 1,
  },
  nextBtn: {
    flex: 2,
  },
});

export default AssessmentWizardScreen;
