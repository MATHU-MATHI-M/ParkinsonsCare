import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../theme';

interface SeverityBadgeProps {
  level: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical' | 'low' | 'medium' | 'high';
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ level, text, size = 'medium' }) => {
  const normLevel = level.toLowerCase();
  
  let bg = Colors.successLight;
  let fg = Colors.successDark;
  let label = text || level.toUpperCase();

  if (normLevel === 'normal' || normLevel === 'low') {
    bg = Colors.successLight;
    fg = Colors.successDark;
  } else if (normLevel === 'mild' || normLevel === 'medium') {
    bg = Colors.infoLight;
    fg = Colors.infoDark;
  } else if (normLevel === 'moderate' || normLevel === 'high') {
    bg = Colors.warningLight;
    fg = Colors.warningDark;
  } else if (normLevel === 'severe' || normLevel === 'critical') {
    bg = Colors.errorLight;
    fg = Colors.errorDark;
  }

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        isSmall && styles.badgeSmall,
        isLarge && styles.badgeLarge,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text
        style={[
          styles.text,
          { color: fg },
          isSmall && styles.textSmall,
          isLarge && styles.textLarge,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 9,
  },
  textLarge: {
    fontSize: 13,
  },
});

export default SeverityBadge;
