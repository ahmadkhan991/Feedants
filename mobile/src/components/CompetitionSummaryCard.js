import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function CompetitionSummaryCard({ competition }) {
  const { title, tags, hasCertificateForWinners, prizePool, entryFee, spots } = competition;
  const bookedFraction = spots.total > 0 ? spots.booked / spots.total : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {competition.viewer.registrationStatus === 'confirmed' && (
          <View style={styles.registeredBadge}>
            <Text style={styles.registeredBadgeText}>✓ Registered</Text>
          </View>
        )}
      </View>

      <View style={styles.tagRow}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {hasCertificateForWinners && <Text style={styles.certificateNote}>🏆 Winners get certificate</Text>}
      </View>

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>Prize Pool</Text>
          <Text style={styles.statValue}>₹ {prizePool.toLocaleString('en-IN')}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Entry Fee</Text>
          <Text style={styles.statValue}>₹ {entryFee}</Text>
        </View>
        <View style={styles.spotsBlock}>
          <Text style={styles.statLabel}>
            {spots.remaining > 0 ? `Only ${spots.remaining} spots left` : 'Spots full'}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(bookedFraction * 100, 100)}%` }]} />
          </View>
          <Text style={styles.bookedLabel}>{spots.booked} / {spots.total} Booked</Text>
        </View>
      </View>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: '700', color: colors.navy, flex: 1, marginRight: spacing.sm },
  registeredBadge: { backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  registeredBadgeText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
  tagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.sm, gap: spacing.sm },
  tag: { backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  tagText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  certificateNote: { fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary, marginTop: 2 },
  spotsBlock: { flex: 1, marginLeft: spacing.lg, maxWidth: 160 },
  progressTrack: { height: 4, backgroundColor: colors.border, borderRadius: radius.pill, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  bookedLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
