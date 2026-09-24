import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';
import { useCountdown } from '../hooks/useCountdown';

// `countdown` is the { label, target, isHurryUp } object straight from the
// API response - label and isHurryUp already reflect whichever lifecycle
// stage the competition is in (registration closing, submissions closing,
// results pending...), so this component doesn't need to know about stages
// at all, just how to render one.
export default function CountdownBanner({ countdown }) {
  const clock = useCountdown(countdown?.target);
  if (!countdown?.target || clock.expired) return null;

  return (
    <View style={[styles.banner, countdown.isHurryUp && styles.bannerUrgent]}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.label}>{countdown.label}</Text>
      <Text style={styles.time}>{clock.label}</Text>
      {countdown.isHurryUp && <Text style={styles.hurryUp}>⏱ Hurry up!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  bannerUrgent: { backgroundColor: '#FDECEA' },
  icon: { fontSize: 16 },
  label: { color: colors.text, fontSize: 13, flexShrink: 1 },
  time: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  hurryUp: { marginLeft: 'auto', color: colors.danger, fontWeight: '600', fontSize: 12 },
});
