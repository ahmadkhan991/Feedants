import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, radius } from '../theme/colors';

export default function ReferralCard({ referral, referralLink }) {
  if (!referral?.enabled) return null;
  const earn = (referral.earnPerSignupPaise || 0) / 100;

  return (
    <View style={styles.card}>
      <Text style={styles.icon}>📣</Text>
      <View style={styles.info}>
        <Text style={styles.heading}>Refer & Earn more discount</Text>
        <TouchableOpacity style={styles.linkBox} onPress={() => Clipboard.setStringAsync(referralLink)}>
          <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
          <Text style={styles.copyLabel}>Copy Link</Text>
        </TouchableOpacity>
        <Text style={styles.earnText}>You earn ₹{earn} for every signup</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  heading: { fontWeight: '700', color: colors.navy, marginBottom: spacing.sm },
  linkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, justifyContent: 'space-between' },
  linkText: { flex: 1, fontSize: 12, color: colors.primaryDark },
  copyLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, marginLeft: spacing.sm },
  earnText: { fontSize: 11, color: colors.primaryDark, marginTop: spacing.sm },
});
