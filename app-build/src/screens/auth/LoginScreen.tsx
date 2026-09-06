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

interface LoginScreenProps {
  initialRole?: UserRole;
  onNavigateToSignUp: () => void;
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  initialRole = 'patient',
  onNavigateToSignUp,
}) => {
  const { login, loginAsDemo, error } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
    24
  ) + 12;

  const roleMeta: Record<UserRole, { title: string; subtitle: string; icon: string; color: string }> = {
    patient: {
      title: 'Patient Portal',
      subtitle: 'Sign in to access your health scores & exercises',
      icon: '👤',
      color: Colors.primary,
    },
    caretaker: {
      title: 'Family Caregiver Portal',
      subtitle: 'Sign in to view patient updates & care logs',
      icon: '🧑‍⚕️',
      color: Colors.accent,
    },
    doctor: {
      title: 'Doctor Portal',
      subtitle: 'Sign in to review clinical analytics & patient profiles',
      icon: '🩺',
      color: Colors.secondary,
    },
  };

  const activeMeta = roleMeta[selectedRole];

  const handleLogin = async () => {
    setLocalError(null);
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password.trim(), selectedRole);
    setLoading(false);

    if (!result.success) {
      const errMsg = result.error || error || 'No matching account found for this email and role.';
      setLocalError(errMsg);
      Alert.alert('Sign In Failed', errMsg);
    }
  };

  const fillDemoCredentials = (role: UserRole) => {
    setSelectedRole(role);
    setLocalError(null);
    loginAsDemo(role);
  };

  return (
    <View style={[styles.container, { paddingTop: safeTopPadding }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandHero}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🧠</Text>
          </View>
          <Text style={styles.appName}>NeuroCare</Text>
          <Text style={styles.tagline}>Welcome Back</Text>
        </View>

        {/* Role Selector Tabs */}
        <View style={styles.roleTabsRow}>
          {(['patient', 'caretaker', 'doctor'] as UserRole[]).map((role) => {
            const isSelected = selectedRole === role;
            const meta = roleMeta[role];
            return (
              <TouchableOpacity
                key={role}
                style={[
                  styles.tabButton,
                  isSelected && [styles.tabButtonActive, { borderBottomColor: meta.color }],
                ]}
                onPress={() => {
                  setSelectedRole(role);
                  setLocalError(null);
                }}
              >
                <Text style={styles.tabEmoji}>{meta.icon}</Text>
                <Text style={[styles.tabLabel, isSelected && [styles.tabLabelActive, { color: meta.color }]]}>
                  {role === 'caretaker' ? 'Caregiver' : role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{activeMeta.title}</Text>
            <Text style={styles.cardSubtitle}>{activeMeta.subtitle}</Text>
          </View>

          {/* Inline Error Banner */}
          {(localError || error) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
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
              placeholder="Enter your password"
              placeholderTextColor={Colors.neutral400}
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                setLocalError(null);
              }}
              secureTextEntry
            />
          </View>

          <PrimaryButton
            title={`Sign In as ${selectedRole.toUpperCase()}`}
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          {/* Quick Demo Access */}
          <View style={styles.demoSection}>
            <Text style={styles.demoSectionTitle}>⚡ One-Tap Quick Access (No Password Required)</Text>
            <View style={styles.demoChipsRow}>
              <TouchableOpacity
                style={[styles.demoChip, { borderColor: Colors.primary }]}
                onPress={() => fillDemoCredentials('patient')}
              >
                <Text style={styles.demoChipText}>👤 Patient</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoChip, { borderColor: Colors.accent }]}
                onPress={() => fillDemoCredentials('caretaker')}
              >
                <Text style={styles.demoChipText}>🧑‍⚕️ Caregiver</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoChip, { borderColor: Colors.secondary }]}
                onPress={() => fillDemoCredentials('doctor')}
              >
                <Text style={styles.demoChipText}>🩺 Doctor</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Switch to SignUp */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignUp}>
              <Text style={styles.signupLink}>Create Account →</Text>
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
    marginTop: 2,
  },
  roleTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#F8FAFC',
  },
  tabEmoji: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  cardHeader: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h2,
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
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
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  signupText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  signupLink: {
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

export default LoginScreen;
