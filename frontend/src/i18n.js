import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      nav_dashboard: 'Dashboard',
      nav_survey: 'Daily Survey',
      nav_cognitive: 'Cognitive Hub',
      nav_analytics: 'Bio-Analytics',
      nav_assistant: 'AI Assistant',
      nav_medications: 'Medications',
      nav_timeline: 'Timeline',
      nav_forecast: 'Forecast',
      nav_motion: 'Motion Coach',
      nav_logout: 'Log Out',

      // Dashboard
      welcome: 'Welcome to ParkinsonCare AI',
      welcome_desc: 'Complete your profile details and baseline tests to unlock progress charts and clinician assessments.',
      configure_profile: 'Configure Profile',
      medication_reminders: 'Medication Reminders',
      add_medicine: 'Add Medicine',
      save_prescription: 'Save Prescription',
      medicine_name: 'Medicine Name',
      dosage: 'Dosage',
      time: 'Time',
      phone_number: 'Phone Number',
      reminder_type: 'Reminder Type',
      taken_today: 'Taken Today',
      mark_taken: 'Mark Taken',
      simulate_call: 'Simulate Twilio Call',
      no_medications: 'No medication schedules configured. Click the plus button to add prescriptions.',

      // Games
      games_title: 'AI Assessment & Cognitive Hub',
      games_desc: 'Select an active digital biomarker test to start clinical tracing',
      launch_test: 'Launch Test',
      memory_match: 'Memory Match',
      reaction_tap: 'Reaction Tap',
      spiral_drawing: 'Spiral Drawing',
      word_recall: 'Word Recall',
      number_span: 'Number Span',
      dual_task: 'Dual Task Challenge',

      // Common
      score: 'Score',
      loading: 'Loading...',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      start: 'Start',
      complete: 'Complete',
      pending: 'Pending',

      // Analytics
      analytics_title: 'Bio-Analytics Console',
      no_records: 'No Progression Records Logged',

      // Forecast
      forecast_title: '7-Day & 30-Day Forecast',
      forecast_desc: 'AI-powered progression predictions based on your historical data',

      // Timeline
      timeline_title: 'Digital Health Timeline',
      timeline_desc: 'Complete chronological record of all clinical events',

      // Voice
      voice_listening: 'Listening...',
      voice_ready: 'Voice Navigation Ready',

      // Settings
      settings_title: 'Clinical Profile Configuration',
      age: 'Age',
      height: 'Height',
      weight: 'Weight',
      gender: 'Gender',
      disease_stage: 'Disease Stage',
      emergency_contact: 'Emergency Contact',
    }
  },
  hi: {
    translation: {
      nav_dashboard: 'डैशबोर्ड',
      nav_survey: 'दैनिक सर्वेक्षण',
      nav_cognitive: 'संज्ञानात्मक हब',
      nav_analytics: 'जैव-विश्लेषण',
      nav_assistant: 'AI सहायक',
      nav_medications: 'दवाइयाँ',
      nav_timeline: 'समयरेखा',
      nav_forecast: 'पूर्वानुमान',
      nav_motion: 'गति कोच',
      nav_logout: 'लॉग आउट',
      welcome: 'ParkinsonCare AI में आपका स्वागत है',
      welcome_desc: 'प्रगति चार्ट और चिकित्सक मूल्यांकन अनलॉक करने के लिए अपना प्रोफाइल पूरा करें।',
      configure_profile: 'प्रोफाइल कॉन्फ़िगर करें',
      medication_reminders: 'दवा रिमाइंडर',
      add_medicine: 'दवा जोड़ें',
      save_prescription: 'प्रिस्क्रिप्शन सहेजें',
      medicine_name: 'दवा का नाम',
      dosage: 'खुराक',
      time: 'समय',
      phone_number: 'फ़ोन नंबर',
      reminder_type: 'रिमाइंडर प्रकार',
      taken_today: 'आज ली गई',
      mark_taken: 'ली गई चिह्नित करें',
      simulate_call: 'Twilio कॉल सिमुलेट करें',
      no_medications: 'कोई दवा शेड्यूल कॉन्फ़िगर नहीं किया गया।',
      games_title: 'AI मूल्यांकन और संज्ञानात्मक हब',
      games_desc: 'नैदानिक ट्रेसिंग शुरू करने के लिए एक परीक्षण चुनें',
      launch_test: 'परीक्षण शुरू करें',
      memory_match: 'मेमोरी मैच',
      reaction_tap: 'रिएक्शन टैप',
      spiral_drawing: 'स्पाइरल ड्राइंग',
      word_recall: 'शब्द स्मरण',
      number_span: 'अंक स्मरण',
      dual_task: 'दोहरी कार्य चुनौती',
      score: 'स्कोर',
      loading: 'लोड हो रहा है...',
      submit: 'जमा करें',
      cancel: 'रद्द करें',
      save: 'सहेजें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      back: 'वापस',
      next: 'अगला',
      start: 'शुरू',
      complete: 'पूर्ण',
      pending: 'लंबित',
      analytics_title: 'जैव-विश्लेषण कंसोल',
      no_records: 'कोई प्रगति रिकॉर्ड दर्ज नहीं',
      forecast_title: '7-दिन और 30-दिन का पूर्वानुमान',
      forecast_desc: 'आपके ऐतिहासिक डेटा पर आधारित AI पूर्वानुमान',
      timeline_title: 'डिजिटल स्वास्थ्य समयरेखा',
      timeline_desc: 'सभी नैदानिक घटनाओं का पूर्ण कालानुक्रमिक रिकॉर्ड',
      voice_listening: 'सुन रहा है...',
      voice_ready: 'वॉइस नेविगेशन तैयार',
      settings_title: 'नैदानिक प्रोफाइल कॉन्फ़िगरेशन',
      age: 'आयु',
      height: 'ऊंचाई',
      weight: 'वजन',
      gender: 'लिंग',
      disease_stage: 'रोग चरण',
      emergency_contact: 'आपातकालीन संपर्क',
    }
  },
  ta: {
    translation: {
      nav_dashboard: 'டாஷ்போர்டு',
      nav_survey: 'தினசரி ஆய்வு',
      nav_cognitive: 'அறிவாற்றல் மையம்',
      nav_analytics: 'உயிர் பகுப்பாய்வு',
      nav_assistant: 'AI உதவியாளர்',
      nav_medications: 'மருந்துகள்',
      nav_timeline: 'காலவரிசை',
      nav_forecast: 'கணிப்பு',
      nav_motion: 'இயக்க பயிற்சியாளர்',
      nav_logout: 'வெளியேறு',
      welcome: 'ParkinsonCare AI-க்கு வருக',
      configure_profile: 'சுயவிவரம் அமை',
      medication_reminders: 'மருந்து நினைவூட்டல்கள்',
      medicine_name: 'மருந்தின் பெயர்',
      dosage: 'அளவு',
      score: 'மதிப்பெண்',
      loading: 'ஏற்றுகிறது...',
      submit: 'சமர்ப்பி',
      start: 'தொடங்கு',
    }
  },
  es: {
    translation: {
      nav_dashboard: 'Tablero',
      nav_survey: 'Encuesta Diaria',
      nav_cognitive: 'Centro Cognitivo',
      nav_analytics: 'Bio-Análisis',
      nav_assistant: 'Asistente IA',
      nav_medications: 'Medicamentos',
      nav_timeline: 'Línea de Tiempo',
      nav_forecast: 'Pronóstico',
      nav_motion: 'Entrenador de Movimiento',
      nav_logout: 'Cerrar Sesión',
      welcome: 'Bienvenido a ParkinsonCare AI',
      configure_profile: 'Configurar Perfil',
      medication_reminders: 'Recordatorios de Medicación',
      medicine_name: 'Nombre del Medicamento',
      dosage: 'Dosis',
      score: 'Puntuación',
      loading: 'Cargando...',
      submit: 'Enviar',
      start: 'Iniciar',
      games_title: 'Centro de Evaluación Cognitiva IA',
      analytics_title: 'Consola de Bio-Análisis',
      forecast_title: 'Pronóstico de 7 y 30 Días',
      timeline_title: 'Línea de Tiempo de Salud Digital',
    }
  },
  fr: {
    translation: {
      nav_dashboard: 'Tableau de Bord',
      nav_survey: 'Enquête Quotidienne',
      nav_cognitive: 'Centre Cognitif',
      nav_analytics: 'Bio-Analytique',
      nav_assistant: 'Assistant IA',
      nav_medications: 'Médicaments',
      nav_timeline: 'Chronologie',
      nav_forecast: 'Prévision',
      nav_motion: 'Coach de Mouvement',
      nav_logout: 'Déconnexion',
      welcome: 'Bienvenue sur ParkinsonCare AI',
      configure_profile: 'Configurer le Profil',
      medication_reminders: 'Rappels de Médicaments',
      medicine_name: 'Nom du Médicament',
      dosage: 'Dosage',
      score: 'Score',
      loading: 'Chargement...',
      submit: 'Soumettre',
      start: 'Commencer',
    }
  },
  de: {
    translation: {
      nav_dashboard: 'Übersicht',
      nav_survey: 'Tägliche Umfrage',
      nav_cognitive: 'Kognitives Zentrum',
      nav_analytics: 'Bio-Analytik',
      nav_assistant: 'KI-Assistent',
      nav_medications: 'Medikamente',
      nav_logout: 'Abmelden',
      welcome: 'Willkommen bei ParkinsonCare AI',
      configure_profile: 'Profil Konfigurieren',
      medication_reminders: 'Medikamenten-Erinnerungen',
      medicine_name: 'Medikamentenname',
      dosage: 'Dosierung',
      score: 'Punktzahl',
      loading: 'Laden...',
      submit: 'Absenden',
      start: 'Starten',
    }
  },
  ar: {
    translation: {
      nav_dashboard: 'لوحة المعلومات',
      nav_survey: 'الاستطلاع اليومي',
      nav_cognitive: 'المركز المعرفي',
      nav_analytics: 'التحليلات الحيوية',
      nav_assistant: 'مساعد الذكاء الاصطناعي',
      nav_medications: 'الأدوية',
      nav_logout: 'تسجيل الخروج',
      welcome: 'مرحباً بك في ParkinsonCare AI',
      medication_reminders: 'تذكيرات الأدوية',
      medicine_name: 'اسم الدواء',
      dosage: 'الجرعة',
      score: 'النتيجة',
      loading: '...جار التحميل',
      submit: 'إرسال',
      start: 'ابدأ',
    }
  },
  ml: {
    translation: {
      nav_dashboard: 'ഡാഷ്ബോർഡ്',
      nav_survey: 'ദൈനംദിന സർവ്വേ',
      nav_medications: 'മരുന്നുകൾ',
      welcome: 'ParkinsonCare AI-ലേക്ക് സ്വാഗതം',
      medicine_name: 'മരുന്നിന്റെ പേര്',
      score: 'സ്കോർ',
      start: 'ആരംഭിക്കുക',
    }
  },
  kn: {
    translation: {
      nav_dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      nav_survey: 'ದೈನಂದಿನ ಸಮೀಕ್ಷೆ',
      nav_medications: 'ಔಷಧಿಗಳು',
      welcome: 'ParkinsonCare AI ಗೆ ಸ್ವಾಗತ',
      medicine_name: 'ಔಷಧಿ ಹೆಸರು',
      score: 'ಅಂಕ',
      start: 'ಪ್ರಾರಂಭಿಸಿ',
    }
  },
  te: {
    translation: {
      nav_dashboard: 'డాష్‌బోర్డ్',
      nav_survey: 'రోజువారీ సర్వే',
      nav_medications: 'మందులు',
      welcome: 'ParkinsonCare AI కి స్వాగతం',
      medicine_name: 'మందు పేరు',
      score: 'స్కోర్',
      start: 'ప్రారంభించు',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
