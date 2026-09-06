import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  size = 'medium'
}) => {
  let bg = Colors.primary;
  let textCol = Colors.white;
  let borderCol = 'transparent';

  if (variant === 'secondary') {
    bg = Colors.secondary;
    textCol = Colors.white;
  } else if (variant === 'outline') {
    bg = Colors.white;
    textCol = Colors.primary;
    borderCol = Colors.primary;
  } else if (variant === 'danger') {
    bg = Colors.error;
    textCol = Colors.white;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textCol = Colors.primary;
  }

  if (disabled) {
    bg = Colors.neutral200;
    textCol = Colors.neutral400;
    borderCol = 'transparent';
  }

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: bg, borderColor: borderCol, borderWidth: borderCol !== 'transparent' ? 1.5 : 0 },
        isSmall && styles.btnSmall,
        isLarge && styles.btnLarge,
        variant === 'primary' && !disabled && Shadows.sm,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textCol} size="small" />
      ) : (
        <>
          {icon && <Text style={[styles.icon, { color: textCol }]}>{icon}</Text>}
          <Text
            style={[
              styles.text,
              { color: textCol },
              isSmall && styles.textSmall,
              isLarge && styles.textLarge,
              textStyle
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  btnSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  btnLarge: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: 14,
  },
  icon: {
    marginRight: 6,
    fontSize: 16,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  textLarge: {
    fontSize: 17,
  },
});

export default PrimaryButton;
