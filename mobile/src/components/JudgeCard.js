import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function JudgeCard({ judge, onPlayIntro }) {
  return (
    <View style={styles.card}>
      {judge.photoUrl ? (
        <Image source={{ uri: judge.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{judge.name?.[0] || '?'}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.label}>Judge</Text>
        <Text style={styles.name}>{judge.name}</Text>
        <Text style={styles.title}>{judge.title}</Text>
        {judge.experienceLabel ? <Text style={styles.experience}>{judge.experienceLabel}</Text> : null}
      </View>
      {judge.introVideoUrl && (
        <TouchableOpacity style={styles.playButton} onPress={() => onPlayIntro?.(judge.introVideoUrl)}>
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.playLabel}>Intro Video</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: colors.primaryDark },
  info: { flex: 1, marginLeft: spacing.md },
  label: { fontSize: 11, color: colors.textMuted },
  name: { fontSize: 16, fontWeight: '700', color: colors.navy, marginTop: 2 },
  title: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  experience: { fontSize: 12, color: colors.textMuted },
  playButton: { alignItems: 'center', gap: 4 },
  playIcon: { fontSize: 20, color: colors.primary },
  playLabel: { fontSize: 10, color: colors.textMuted },
});
