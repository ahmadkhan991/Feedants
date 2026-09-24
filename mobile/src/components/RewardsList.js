import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

const MEDAL = { 1: '🏆', 2: '🥈', 3: '🥉' };

export default function RewardsList({ rewards, disclaimer }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Rewards <Text style={styles.sub}>(All Positions)</Text></Text>
      {rewards.map((r) => (
        <View key={r.position} style={styles.row}>
          <Text style={styles.medal}>{MEDAL[r.position] || '⭐'}</Text>
          <Text style={styles.label}>{r.label}</Text>
          <Text style={styles.amount}>₹ {r.amount.toLocaleString('en-IN')}</Text>
        </View>
      ))}
      {disclaimer ? (
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerIcon}>ⓘ</Text>
          <Text style={styles.disclaimerText}>Disclaimer: {disclaimer}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: { fontWeight: '700', color: colors.navy, marginBottom: spacing.sm },
  sub: { fontWeight: '400', color: colors.textMuted, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.background },
  medal: { fontSize: 16, width: 28 },
  label: { flex: 1, fontSize: 14, color: colors.text },
  amount: { fontSize: 14, fontWeight: '700', color: colors.primary },
  disclaimer: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, backgroundColor: colors.primarySoft, padding: spacing.sm, borderRadius: radius.sm },
  disclaimerIcon: { color: colors.primaryDark },
  disclaimerText: { flex: 1, fontSize: 11, color: colors.primaryDark },
});
