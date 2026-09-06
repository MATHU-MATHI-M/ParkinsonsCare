import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import PrimaryButton from '../../components/PrimaryButton';

interface SignUpScreenProps {
  onNavigateToLogin: (defaultRole?: UserRole) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToLogin }) => {
  const { signup, loginAsDemo, error } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
    24
  ) + 12;

  const handleSignUp = async () => {
    setLocalError(null);
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters long (Firebase requirement).');
      return;
    }

    setLoading(true);
    const result = await signup({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      role: selectedRole,
    });
    setLoading(false);

    if (!result.success) {
      const errMsg = result.error || error || 'Failed to create account. Please try again.';
      setLocalError(errMsg);
      Alert.alert('Sign Up Failed', errMsg);
    }
  };

  const roleOptions: { role: UserRole; title: string; desc: string; icon: string; color: string }[] = [
    {
      role: 'patient',
      title: 'Patient',
      desc: 'Track health, do guided exercises & monitor score',
      icon: '👤',
      color: Colors.primary,
    },
    {
      role: 'caretaker',
      title: 'Family Caregiver',
      desc: 'Stay informed, log observations & get alerts',
      icon: '🧑‍⚕️',
      color: Colors.accent,
    },
    {
      role: 'doctor',
      title: 'Doctor / Specialist',
      desc: 'View patient analytics & clinical AI reports',
      icon: '🩺',
      color: Colors.secondary,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: safeTopPadding }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandHero}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🧠</Text>
          </View>
          <Text style={styles.appName}>NeuroCare</Text>
          <Text style={styles.tagline}>Parkinson's Health Tracking & AI Care Support</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSubtitle}>Choose how you will be using NeuroCare</Text>

          {/* Inline Error Banner */}
          {(localError || error) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          )}

          {/* Role Selection Cards */}
          <View style={styles.roleGrid}>
            {roleOptions.map((opt) => {
              const isSelected = selectedRole === opt.role;
              return (
                <TouchableOpacity
                  key={opt.role}
                  activeOpacity={0.8}
                  style={[
                    styles.roleCard,
                    isSelected && [styles.roleCardSelected, { borderColor: opt.color }],
                  ]}
                  onPress={() => {
                    setSelectedRole(opt.role);
                    setLocalError(null);
                  }}
                >
                  <Text style={styles.roleCardIcon}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleCardTitle, isSelected && { color: opt.color }]}>
                      {opt.title}
                    </Text>
                    <Text style={styles.roleCardDesc}>{opt.desc}</Text>
                  </View>
                  <View style={[styles.checkCircle, isSelected && { backgroundColor: opt.color, borderColor: opt.color }]}>
                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Input Fields */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Miller"
              placeholderTextColor={Colors.neutral400}
              value={name}
              onChangeText={(txt) => {
                setName(txt);
                setLocalError(null);
              }}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.neutral400}
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                setLocalError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.neutral400}
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                setLocalError(null);
              }}
              secureTextEntry
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              {selectedRole === 'doctor'
                ? 'Hospital / Clinic Specialty (Optional)'
                : selectedRole === 'caretaker'
                ? 'Relationship to Patient (Optional)'
                : 'Year of Diagnosis (Optional)'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                selectedRole === 'doctor'
                  ? 'e.g. Movement Disorders Clinic'
                  : selectedRole === 'caretaker'
                  ? 'e.g. Spouse / Daughter'
                  : 'e.g. 2022'
              }
              placeholderTextColor={Colors.neutral400}
              value={extraInfo}
              onChangeText={setExtraInfo}
            />
          </View>

          <PrimaryButton
            title={`Get Started as ${selectedRole.toUpperCase()}`}
            onPress={handleSignUp}
            loading={loading}
            style={styles.submitBtn}
          />

          {/* Quick Demo Access */}
          <View style={styles.demoSection}>
            <Text style={styles.demoSectionTitle}>⚡ One-Tap Quick Access (No Account Required)</Text>
            <View style={styles.demoChipsRow}>
              <TouchableOpacity
                style={[styles.demoChip, { borderColor: Colors.primary }]}
                onPress={() => loginAsDemo('patient')}
              >
                <Text style={styles.demoChipText}>👤 Patient Demo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoChip, { borderColor: Colors.accent }]}
                onPress={() => loginAsDemo('caretaker')}
              >
                <Text style={styles.demoChipText}>🧑‍⚕️ Caregiver Demo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoChip, { borderColor: Colors.secondary }]}
                onPress={() => loginAsDemo('doctor')}
              >
                <Text style={styles.demoChipText}>🩺 Doctor Demo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Switch to Login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => onNavigateToLogin(selectedRole)}>
              <Text style={styles.loginLink}>Sign In →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl * 2,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  logoEmoji: {
    fontSize: 32,
  },
  appName: {
    ...Typography.h1,
    color: '#1E293B',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  tagline: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  cardTitle: {
    ...Typography.h2,
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  roleGrid: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  roleCardSelected: {
    backgroundColor: '#F0FDF4',
  },
  roleCardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  roleCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  submitBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  loginText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  loginLink: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
    lineHeight: 18,
  },
  demoSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  demoChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  demoChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
});

export default SignUpScreen;
