const { getCompetitionStage, getCountdown, getUserParticipationState } = require('./competitionState');

const rupees = (paise) => Math.round(paise) / 100;

function serializeCompetition(competition, { registration = null, submission = null, now = new Date() } = {}) {
  const stage = getCompetitionStage(competition, now);
  const countdown = getCountdown(competition, now);
  const participation = getUserParticipationState({ competition, stage, registration, submission });

  return {
    id: competition._id,
    title: competition.title,
    slug: competition.slug,
    tags: competition.tags,
    hasCertificateForWinners: competition.hasCertificateForWinners,

    prizePool: rupees(competition.prizePoolPaise),
    entryFee: rupees(competition.entryFeePaise),

    spots: {
      total: competition.totalSpots,
      remaining: competition.spotsRemaining,
      booked: competition.totalSpots - competition.spotsRemaining,
    },

    judge: competition.judge,

    dates: {
      registrationOpensAt: competition.registrationOpensAt,
      registrationClosesAt: competition.registrationClosesAt,
      submissionStartsAt: competition.submissionStartsAt,
      submissionEndsAt: competition.submissionEndsAt,
      resultDate: competition.resultDate,
    },

    rewards: competition.rewards.map((r) => ({ position: r.position, label: r.label, amount: rupees(r.amountPaise) })),
    previousWinners: competition.previousWinners.map((w) => ({
      name: w.name,
      avatarUrl: w.avatarUrl,
      position: w.position,
      positionLabel: w.positionLabel,
      videoUrl: w.videoUrl,
    })),

    content: competition.content,
    disclaimer: competition.disclaimer,
    prizeMoneyInfoVideoUrl: competition.prizeMoneyInfoVideoUrl,
    refundPolicyUrl: competition.refundPolicyUrl,
    paymentProvider: competition.paymentProvider,
    referral: competition.referral,

    // --- everything below is *derived*, computed fresh on every request ---
    stage, // machine-readable; the app maps this + countdown to copy/urgency styling
    countdown, // { label, target (ISO), isHurryUp } - client ticks the clock itself
    viewer: {
      participationCode: participation.code,
      registrationStatus: registration?.status || null,
      hasSubmission: Boolean(submission),
      button: {
        label: participation.buttonLabel,
        enabled: participation.buttonEnabled,
        action: participation.action,
      },
    },

    results: stage === 'results_declared' ? competition.results.map((r) => ({
      name: r.name, position: r.position, positionLabel: r.positionLabel, avatarUrl: r.avatarUrl, videoUrl: r.videoUrl,
    })) : [],
  };
}

module.exports = { serializeCompetition };
