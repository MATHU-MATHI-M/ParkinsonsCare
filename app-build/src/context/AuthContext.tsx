import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseAuth } from '../services/firebaseConfig';
import { User, UserRole } from '../types';
import { DEMO_USERS } from '../data/demoData';

export interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, role?: UserRole) => Promise<AuthResult>;
  signup: (userData: { name: string; email: string; password: string; role: UserRole }) => Promise<AuthResult>;
  loginAsDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function formatAuthError(e: any): string {
  if (!e) return 'An unknown error occurred.';
  const code = (e.code || '').toLowerCase();
  const msg = e.message || '';

  if (code.includes('invalid-credential')) {
    return 'Invalid email or password. If you have not created an account yet, please tap Create Account first.';
  }
  if (code.includes('user-not-found')) {
    return 'No account found with this email. Please tap Create Account to register.';
  }
  if (code.includes('wrong-password')) {
    return 'Incorrect password. Please verify your password and try again.';
  }
  if (code.includes('missing-password')) {
    return 'Please enter your password.';
  }
  if (code.includes('weak-password')) {
    return 'Password is too weak. Firebase requires at least 6 characters.';
  }
  if (code.includes('email-already-in-use')) {
    return 'This email address is already registered. Please sign in instead.';
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'Email/Password sign-in is disabled in Firebase Console. Please enable it under Authentication > Sign-in method.';
  }
  if (code.includes('network-request-failed')) {
    return 'Network connection failed. Please check your internet connection.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many failed attempts. Please wait a moment before trying again.';
  }
  return msg || 'Authentication failed. Please try again.';
}

export function AuthProvider({ children }: { children: any }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loginAsDemo = useCallback((demoRole: UserRole = 'patient') => {
    const demoUser = DEMO_USERS.find((u) => u.role === demoRole) || DEMO_USERS[0];
    setCurrentUser(demoUser);
    setError(null);
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        let profile: any = {};
        try {
          const userDoc = await getDoc(doc(db, 'patients', firebaseUser.uid));
          if (userDoc.exists()) {
            profile = userDoc.data();
          }
        } catch (dbErr) {
          console.warn('Could not read user profile from Firestore:', dbErr);
        }

        const appUser: User = {
          id: firebaseUser.uid,
          name: profile.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email ?? '',
          role: profile.role || 'patient',
          patientId: profile.patientId,
          assignedPatients: profile.assignedPatients,
        };
        setCurrentUser(appUser);
      } else {
        setCurrentUser((prev) => (prev?.id?.startsWith('demo-') ? prev : null));
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string, role?: UserRole): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    const lowerEmail = email.toLowerCase().trim();
    if (lowerEmail === 'patient@demo.com' && password === 'demo1234') {
      loginAsDemo('patient');
      setIsLoading(false);
      return { success: true };
    }
    if (lowerEmail === 'caretaker@demo.com' && password === 'demo1234') {
      loginAsDemo('caretaker');
      setIsLoading(false);
      return { success: true };
    }
    if (lowerEmail === 'doctor@demo.com' && password === 'demo1234') {
      loginAsDemo('doctor');
      setIsLoading(false);
      return { success: true };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      if (role && userCredential.user) {
        try {
          const userDocRef = doc(db, 'patients', userCredential.user.uid);
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists() || !userSnap.data()?.role) {
            await setDoc(userDocRef, { role }, { merge: true });
          }
        } catch (e) {
          // ignore profile merge error
        }
      }
      return { success: true };
    } catch (e: any) {
      const formatted = formatAuthError(e);
      setError(formatted);
      return { success: false, error: formatted };
    } finally {
      setIsLoading(false);
    }
  }, [loginAsDemo]);

  const signup = useCallback(async (userData: { name: string; email: string; password: string; role: UserRole }): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, userData.email, userData.password);
      const uid = cred.user.uid;
      try {
        await setDoc(doc(db, 'patients', uid), {
          name: userData.name,
          role: userData.role,
          email: userData.email,
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('Firestore user profile document write warning:', dbErr);
      }
      return { success: true };
    } catch (e: any) {
      const formatted = formatAuthError(e);
      setError(formatted);
      return { success: false, error: formatted };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (firebaseAuth.currentUser) {
        await signOut(firebaseAuth);
      }
    } catch (e: any) {
      console.warn('SignOut warning:', e);
    } finally {
      setCurrentUser(null);
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    currentUser,
    role: currentUser?.role ?? null,
    isAuthenticated: !!currentUser,
    isLoading,
    error,
    login,
    signup,
    loginAsDemo,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
