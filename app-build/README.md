# NeuroCare – Parkinson's Health Tracking & Clinical AI Mobile App

NeuroCare is a cross-platform React Native (Expo) mobile application for Parkinson's disease monitoring, symptom logging, multimodal motor & cognitive testing, and clinical risk prediction using a machine-learning model trained on the PPMI (Parkinson's Progression Markers Initiative) dataset.

---

## 🌟 Key Features

### 1. Patient Portal
- **Multimodal Neurological Assessments:**
  - 👆 **Finger Tapping Test:** Measures bradykinesia, tapping frequency, rhythm regularity, and fatigue rate.
  - 🌀 **Spiral Drawing Test:** Assesses tremor severity, smoothness, and kinematic tremor index.
  - ⚡ **Reaction Speed Test:** Visual stimulus reaction time with millisecond precision.
  - 🎙️ **Voice Phonation Test:** Sustained phonation jitter/shimmer and acoustic stability.
  - 📋 **Non-Motor Symptom Survey:** MoCA, sleep (ESS), mood (GDS), autonomic (SCOPA), and fatigue checks.
  - 📹 **Guided Video Exercises:** Physical therapy routines with timer and progress tracking.
- **AI Health Score:** Dynamic composite score based on multimodal test performance and symptom trends.
- **Longitudinal Trends:** Visual progress charts tracking motor stability and cognitive scores over time.

### 2. Caregiver Portal
- **Real-Time Patient Updates:** Monitored alert feeds for tremors, missed assessments, and fall risks.
- **Daily Care Observations:** Log qualitative behavioral and physical notes shared directly with the clinical team.

### 3. Clinician / Doctor Portal
- **Clinical Analytics Dashboard:** Cohort overview with progression risk stratification.
- **Patient Deep-Dive:** Detailed breakdown of motor tests, cognitive sub-scores, and longitudinal biomarker shifts.
- **Explainable ML Insights:** Feature importance rankings and domain contribution weights based on PPMI data.

---

## 🧠 PPMI Machine Learning Model
The app incorporates an on-device inference engine powered by Random Forest and Logistic Regression classifiers trained on **14,833 clinical patient visits** from the PPMI cohort:
- **Test Accuracy:** **99.65%** (5-Fold Cross-Validation: **99.77%**)
- **ROC-AUC Score:** **1.000**
- **Sensitivity:** **100.00%**
- **Specificity:** **99.42%**
- **Precision:** **99.13%**
- **Top Predictive Features:**
  1. `np1_cog` (UPDRS Cognitive Impairment)
  2. `moca_total` (Montreal Cognitive Assessment)
  3. `ess_score` (Epworth Sleepiness Scale)

Model weights and normalisation parameters are exported in `src/data/ppmiModel.json` for offline explainable scoring.

---

## 🛠️ Tech Stack
- **Framework:** React Native (Expo SDK 57)
- **Language:** TypeScript 5.9+ (100% strict type safety)
- **Backend:** Firebase Authentication (Email/Password) & Firestore Database
- **Storage & State:** React Context API + `@react-native-async-storage/async-storage` for offline persistence
- **Safe Area & UI:** `react-native-safe-area-context`, Vanilla React Native StyleSheet design system

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node 20/22 LTS recommended)
- Expo Go app on iOS or Android

### Installation & Launch
```bash
# Navigate to the app-build directory
cd app-build

# Install dependencies
npm install

# Start Metro Bundler with clear cache
npx expo start -c --lan
```

Scan the QR code shown in the terminal with the **Expo Go** app to launch immediately on your physical device.

---

## ⚡ Instant Demo Access
The app supports one-tap demo profiles without requiring password setup:
- **Patient:** `patient@demo.com` (password: `demo1234`)
- **Caregiver:** `caretaker@demo.com` (password: `demo1234`)
- **Doctor:** `doctor@demo.com` (password: `demo1234`)
