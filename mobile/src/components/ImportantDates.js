import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return { datePart, timePart };
}

function DateCell({ icon, label, iso }) {
  const { datePart, timePart } = formatDate(iso);
  return (
    <View style={styles.cell}>
      <Text style={styles.icon}>{icon}</Text>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.date}>{datePart}</Text>
        <Text style={styles.time}>{timePart}</Text>
      </View>
    </View>
  );
}

export default function ImportantDates({ dates }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Important Dates</Text>
      <View style={styles.grid}>
        <DateCell icon="📅" label="Register Before" iso={dates.registrationClosesAt} />
        <DateCell icon="📤" label="Submission Starts" iso={dates.submissionStartsAt} />
        <DateCell icon="⬆️" label="Submission Ends" iso={dates.submissionEndsAt} />
        <DateCell icon="🏆" label="Result Date" iso={dates.resultDate} />
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
  heading: { fontWeight: '700', color: colors.navy, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  cell: { flexDirection: 'row', gap: spacing.sm, width: '45%' },
  icon: { fontSize: 16, marginTop: 2 },
  label: { fontSize: 11, color: colors.textMuted },
  date: { fontSize: 13, fontWeight: '700', color: colors.navy, marginTop: 2 },
  time: { fontSize: 12, color: colors.textMuted },
});
