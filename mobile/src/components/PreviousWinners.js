import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export default function PreviousWinners({ winners, onPlay }) {
  if (!winners?.length) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Previous Winners</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {winners.map((w, idx) => (
          <TouchableOpacity key={`${w.name}-${idx}`} style={styles.item} onPress={() => w.videoUrl && onPlay?.(w.videoUrl)}>
            {w.avatarUrl ? (
              <Image source={{ uri: w.avatarUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback]}>
                <Text style={styles.thumbInitial}>{w.name[0]}</Text>
              </View>
            )}
            {w.videoUrl && (
              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>{w.name}</Text>
            <Text style={styles.position}>{w.positionLabel}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: spacing.lg },
  heading: { fontWeight: '700', color: colors.navy, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  row: { paddingHorizontal: spacing.lg, gap: spacing.md },
  item: { width: 92 },
  thumb: { width: 92, height: 92, borderRadius: radius.md, backgroundColor: colors.border },
  thumbFallback: { justifyContent: 'center', alignItems: 'center' },
  thumbInitial: { fontSize: 28, fontWeight: '700', color: colors.textMuted },
  playOverlay: {
    position: 'absolute', top: 34, left: 34, width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center',
  },
  playIcon: { fontSize: 10, color: colors.primary },
  name: { fontSize: 12, fontWeight: '600', color: colors.navy, marginTop: spacing.sm },
  position: { fontSize: 11, color: colors.primaryDark },
});
