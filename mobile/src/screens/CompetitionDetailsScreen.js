import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert, Linking, RefreshControl,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { CompetitionApi } from '../api/client';
import { colors, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import CompetitionSummaryCard from '../components/CompetitionSummaryCard';
import JudgeCard from '../components/JudgeCard';
import CountdownBanner from '../components/CountdownBanner';
import ImportantDates from '../components/ImportantDates';
import PreviousWinners from '../components/PreviousWinners';
import TabsSection from '../components/TabsSection';
import RewardsList from '../components/RewardsList';
import ReferralCard from '../components/ReferralCard';
import StickyActionButton from '../components/StickyActionButton';

/**
 * The screen itself holds almost no business logic. It:
 *  1. Fetches /competitions/:id (personalized when authenticated)
 *  2. Renders the sub-components with that data
 *  3. Maps `viewer.button.action` -> the actual side effect (checkout,
 *     file picker, refetch) when the sticky button is pressed
 *
 * Every "is this open/closed/full/registered" decision already happened on
 * the server (see backend/src/utils/competitionState.js) - this file never
 * re-derives it from raw dates, which is what keeps the UI from ever
 * disagreeing with the backend about what state the competition is in.
 */
export default function CompetitionDetailsScreen({ route, navigation }) {
  const competitionId = route?.params?.competitionId || 'feedants-classical-dance';
  const { user } = useAuth();

  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await CompetitionApi.getDetails(competitionId);
      setCompetition(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [competitionId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load({ silent: true }); };

  const openVideo = (url) => Linking.openURL(url).catch(() => Alert.alert('Unable to open video'));

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      const result = await CompetitionApi.register(competitionId);
      if (result.razorpayOrder) {
        // In a full build this hands off to react-native-razorpay's
        // Checkout.open({ ...result.razorpayOrder }) and, on success,
        // calls CompetitionApi.confirmPayment(result.registrationId, {...}).
        // Left as a clear seam here since it needs live Razorpay
        // credentials and a native module link to actually run.
        Alert.alert(
          'Spot reserved',
          `₹${result.amountDue} due - hand off to the Razorpay Checkout SDK here, then call confirmPayment() on success.`
        );
      } else {
        Alert.alert('Registered!', 'Your free registration is confirmed.');
      }
      await load({ silent: true });
    } catch (err) {
      Alert.alert('Could not register', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadSubmission = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['video/*', 'image/*'] });
    if (picked.canceled) return;
    const asset = picked.assets[0];

    setActionLoading(true);
    try {
      await CompetitionApi.uploadSubmission(competitionId, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      });
      Alert.alert('Submitted!', 'Your entry has been uploaded.');
      await load({ silent: true });
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleButtonPress = (action) => {
    switch (action) {
      case 'register': return handleRegister();
      case 'complete_payment': return handleRegister(); // re-hits register; server returns the existing pending order
      case 'upload_submission': return handleUploadSubmission();
      case 'view_results': return navigation?.navigate?.('CompetitionResults', { competitionId });
      default: return undefined;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !competition) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Competition not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
          <Text style={styles.retryLabel}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const referralLink = `https://feedants.com/r/${user?.referralCode || 'guest'}`;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backLabel}>← Go back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <CompetitionSummaryCard competition={competition} />
        <JudgeCard judge={competition.judge} onPlayIntro={openVideo} />
        <CountdownBanner countdown={competition.countdown} />
        <ImportantDates dates={competition.dates} />
        <PreviousWinners winners={competition.previousWinners} onPlay={openVideo} />
        <TabsSection content={competition.content} />
        <RewardsList rewards={competition.rewards} disclaimer={competition.disclaimer} />
        <ReferralCard referral={competition.referral} referralLink={referralLink} />
      </ScrollView>

      <StickyActionButton
        button={competition.viewer.button}
        loading={actionLoading}
        onPress={handleButtonPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backLabel: { fontSize: 15, fontWeight: '600', color: colors.navy },
  scrollContent: { paddingBottom: spacing.xl },
  errorText: { color: colors.danger, textAlign: 'center', marginBottom: spacing.lg },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 8 },
  retryLabel: { color: colors.surface, fontWeight: '700' },
});
