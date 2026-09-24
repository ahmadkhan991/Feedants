import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

const TABS = [
  { key: 'aboutCompetition', label: 'About Competition' },
  { key: 'judgingParameters', label: 'Judging Parameters' },
  { key: 'rulesAndEligibility', label: 'Rules & Eligibility' },
];

const COLLAPSED_CHARS = 140;

export default function TabsSection({ content }) {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [expanded, setExpanded] = useState(false);

  const text = content?.[activeTab] || '';
  const isLong = text.length > COLLAPSED_CHARS;
  const shown = expanded || !isLong ? text : `${text.slice(0, COLLAPSED_CHARS)}…`;

  return (
    <View style={styles.card}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => { setActiveTab(tab.key); setExpanded(false); }}
            style={styles.tabButton}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            {activeTab === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.body}>{shown || 'No details provided yet.'}</Text>

      {isLong && (
        <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
          <Text style={styles.viewMore}>{expanded ? 'View less ▲' : 'View more ▼'}</Text>
        </TouchableOpacity>
      )}
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
  tabBar: { flexDirection: 'row', gap: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  tabButton: { alignItems: 'center' },
  tabLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  tabLabelActive: { color: colors.primary },
  tabUnderline: { height: 2, backgroundColor: colors.primary, marginTop: 6, width: '100%', borderRadius: radius.pill },
  body: { marginTop: spacing.md, fontSize: 13, lineHeight: 20, color: colors.text },
  viewMore: { marginTop: spacing.sm, color: colors.primary, fontWeight: '600', fontSize: 12, textAlign: 'center' },
});
