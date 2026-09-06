import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import SignUpScreen from '../screens/auth/SignUpScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import SymptomScreen from '../screens/patient/SymptomScreen';
import AssessmentWizardScreen from '../screens/patient/AssessmentWizardScreen';
import TrendsScreen from '../screens/patient/TrendsScreen';
import CareTeamScreen from '../screens/patient/CareTeamScreen';
import AssessmentHubScreen from '../screens/patient/AssessmentHubScreen';
import FingerTappingTestScreen from '../screens/patient/FingerTappingTestScreen';
import SpiralDrawingTestScreen from '../screens/patient/SpiralDrawingTestScreen';
import ReactionSpeedTestScreen from '../screens/patient/ReactionSpeedTestScreen';
import VoicePhonationTestScreen from '../screens/patient/VoicePhonationTestScreen';
import VideoExerciseScreen from '../screens/patient/VideoExerciseScreen';

// Caretaker Screens
import CaretakerHomeScreen from '../screens/caretaker/CaretakerHomeScreen';
import AlertsScreen from '../screens/caretaker/AlertsScreen';
import ObservationsScreen from '../screens/caretaker/ObservationsScreen';

// Doctor Screens
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorPatientProfileScreen from '../screens/doctor/DoctorPatientProfileScreen';
import DoctorModelScreen from '../screens/doctor/DoctorModelScreen';

export const RootNavigator: React.FC = () => {
  const { currentUser } = useAuth();

  // Auth screen state: starts on 'signup', toggles with 'login'
  const [authScreen, setAuthScreen] = useState<'signup' | 'login'>('signup');

  // App screen navigation state
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [screenParams, setScreenParams] = useState<any>({});

  const navigateTo = (screen: string, params?: any) => {
    setCurrentScreen(screen);
    if (params) setScreenParams(params);
  };

  const goBackHome = () => {
    setCurrentScreen('home');
  };

  // 1. Unauthenticated Flow: SignUp -> Login -> (or direct demo entry)
  if (!currentUser) {
    if (authScreen === 'signup') {
      return (
        <SignUpScreen
          onNavigateToLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <LoginScreen
        onNavigateToSignUp={() => setAuthScreen('signup')}
        onBack={() => setAuthScreen('signup')}
      />
    );
  }

  // 2. Role: PATIENT
  if (currentUser.role === 'patient') {
    switch (currentScreen) {
      case 'assessmentHub':
        return (
          <AssessmentHubScreen
            onBack={goBackHome}
            onSelectTest={(testType) => {
              if (testType === 'tapping') navigateTo('fingerTap');
              else if (testType === 'spiral') navigateTo('spiralDrawing');
              else if (testType === 'reaction') navigateTo('reactionSpeed');
              else if (testType === 'voice') navigateTo('voicePhonation');
              else if (testType === 'video') navigateTo('videoExercise');
              else if (testType === 'survey') navigateTo('survey');
            }}
          />
        );
      case 'fingerTap':
        return <FingerTappingTestScreen onBack={goBackHome} onComplete={goBackHome} />;
      case 'spiralDrawing':
        return <SpiralDrawingTestScreen onBack={goBackHome} onComplete={goBackHome} />;
      case 'reactionSpeed':
        return <ReactionSpeedTestScreen onBack={goBackHome} onComplete={goBackHome} />;
      case 'voicePhonation':
        return <VoicePhonationTestScreen onBack={goBackHome} onComplete={goBackHome} />;
      case 'videoExercise':
        return <VideoExerciseScreen onBack={goBackHome} onComplete={goBackHome} />;
      case 'assessment':
      case 'survey':
        return <AssessmentWizardScreen onBack={goBackHome} onComplete={goBackHome} />;
      case 'symptoms':
        return <SymptomScreen onBack={goBackHome} />;
      case 'trends':
        return <TrendsScreen onBack={goBackHome} />;
      case 'careteam':
        return <CareTeamScreen onBack={goBackHome} />;
      default:
        return <PatientHomeScreen onNavigate={navigateTo} />;
    }
  }

  // 3. Role: CARETAKER
  if (currentUser.role === 'caretaker') {
    switch (currentScreen) {
      case 'alerts':
        return <AlertsScreen onBack={goBackHome} />;
      case 'observations':
        return <ObservationsScreen onBack={goBackHome} />;
      case 'patientDetail':
        return (
          <DoctorPatientProfileScreen
            patientId={screenParams.patientId || 'patient-101'}
            onBack={goBackHome}
            onNavigate={navigateTo}
          />
        );
      default:
        return <CaretakerHomeScreen onNavigate={navigateTo} />;
    }
  }

  // 4. Role: DOCTOR
  if (currentUser.role === 'doctor') {
    switch (currentScreen) {
      case 'patientProfile':
        return (
          <DoctorPatientProfileScreen
            patientId={screenParams.patientId || 'patient-101'}
            onBack={goBackHome}
            onNavigate={navigateTo}
          />
        );
      case 'model':
        return <DoctorModelScreen onBack={goBackHome} />;
      case 'alerts':
        return <AlertsScreen onBack={goBackHome} />;
      default:
        return <DoctorDashboardScreen onNavigate={navigateTo} />;
    }
  }

  return (
    <SignUpScreen
      onNavigateToLogin={() => setAuthScreen('login')}
    />
  );
};

export default RootNavigator;
