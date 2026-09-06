// firebaseConfig.ts  – uses the standard Firebase JS SDK (works in Expo Go)
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is provided by React Native platform build of firebase/auth
import { getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 👉 Replace below with the config from Firebase console (Project Settings → General → Your apps → Web)
const firebaseConfig = {
  apiKey: "AIzaSyDX-h_4P_9bYU4Uu-dJAp0VGNyF9F2F9qE",
  authDomain: "parkinson-care-app.firebaseapp.com",
  projectId: "parkinson-care-app",
  storageBucket: "parkinson-care-app.firebasestorage.app",
  messagingSenderId: "560667029734",
  appId: "1:560667029734:web:05f019649cb7eb7423cb27",
  measurementId: "G-69LS2DFY5J"
};

// Prevent re-initializing on hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
// Initialize Auth with async‑storage persistence, but avoid double‑initialization
let authInstance: any;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // If Auth was already initialized (common during hot reload), just grab the existing instance
  authInstance = getAuth(app);
}
export const firebaseAuth = authInstance;
