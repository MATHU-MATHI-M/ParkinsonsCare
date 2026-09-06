import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Shadows } from '../theme';
import { useAuth } from '../context/AuthContext';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBack,
  rightAction
}) => {
  const { currentUser, logout } = useAuth();
  const insets = useSafeAreaInsets();

  // Dynamic safe top inset for Android (Vivo Y100A punch hole / status bar) and iOS notch
  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
    26
  ) + 8;

  return (
    <View style={[styles.container, { paddingTop: safeTopPadding }]}>
      {/* Top action row */}
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backIcon}>‹</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.brandBadge}>
            <Text style={styles.brandIcon}>🧠</Text>
            <Text style={styles.brandName}>NeuroCare</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          {rightAction}
          {currentUser && (
            <View style={styles.userPill}>
              <Text style={styles.roleBadge}>{currentUser.role.toUpperCase()}</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser.name}
              </Text>
              <TouchableOpacity onPress={logout} style={styles.logoutBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={styles.logoutText}>Exit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Screen Title Row */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    minHeight: 40,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  backIcon: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '800',
    color: Colors.primary,
    marginRight: 4,
  },
  backText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  brandIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral100,
    borderRadius: 20,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.xs,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.neutral200,
  },
  roleBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
    overflow: 'hidden',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 6,
    maxWidth: 90,
  },
  logoutBtn: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  logoutText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
  },
  titleRow: {
    marginTop: 6,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});

export default AppHeader;
