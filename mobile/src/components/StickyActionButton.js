import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

/**
 * Deliberately dumb: it renders whatever `button` the API decided
 * (label/enabled/action - see utils/competitionState.js on the backend)
 * and calls `onPress(action)`. The screen owns what each `action` string
 * actually does (open checkout, open the file picker, navigate to
 * results...). This keeps the "what state am I in" logic in exactly one
 * place - the server - instead of being re-derived (and risking drifting
 * out of sync) in the client.
 */
export default function StickyActionButton({ button, loading, onPress }) {
  if (!button) return null;
  const disabled = !button.enabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      disabled={disabled}
      onPress={() => onPress(button.action)}
    >
      {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.label}>{button.label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  buttonDisabled: { backgroundColor: colors.border },
  label: { color: colors.surface, fontWeight: '700', fontSize: 15 },
});
