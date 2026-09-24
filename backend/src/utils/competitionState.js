/**
 * All time-dependent UI in the design (the countdown banner, the
 * "Registered" badge, whether the bottom button says "Register Now" or
 * "Upload Submission" or is disabled) is derived here, on every request,
 * from `now` vs. the competition's stored timestamps + the caller's
 * registration/submission documents.
 *
 * Nothing about "is registration open" is ever cached as a boolean in the
 * database - that would drift out of sync the moment a deadline passes
 * with no write to trigger a recompute. Deriving it on read is cheap
 * (a handful of Date comparisons) and always correct.
 */

const HURRY_UP_THRESHOLD_MS = (Number(process.env.HURRY_UP_THRESHOLD_HOURS) || 24) * 60 * 60 * 1000;

/** @returns {string} one of the COMPETITION_STAGES below */
function getCompetitionStage(competition, now = new Date()) {
  const {
    registrationOpensAt,
    registrationClosesAt,
    submissionStartsAt,
    submissionEndsAt,
    resultDate,
    spotsRemaining,
  } = competition;

  if (now >= resultDate) return 'results_declared';
  if (now >= submissionEndsAt) return 'submission_closed';
  if (now >= submissionStartsAt) return 'submission_open';
  if (now >= registrationClosesAt) return 'awaiting_submission_window';
  if (registrationOpensAt && now < registrationOpensAt) return 'registration_upcoming';
  if (spotsRemaining <= 0) return 'registration_closed_full';
  return 'registration_open';
}

const STAGE_COUNTDOWN_TARGET = {
  registration_upcoming: (c) => ({ label: 'Registration opens in', target: c.registrationOpensAt }),
  registration_open: (c) => ({ label: 'Registration closes in', target: c.registrationClosesAt }),
  registration_closed_full: (c) => ({ label: 'Submissions open in', target: c.submissionStartsAt }),
  awaiting_submission_window: (c) => ({ label: 'Submissions open in', target: c.submissionStartsAt }),
  submission_open: (c) => ({ label: 'Submission closes in', target: c.submissionEndsAt }),
  submission_closed: (c) => ({ label: 'Results in', target: c.resultDate }),
  results_declared: () => ({ label: null, target: null }),
};

function getCountdown(competition, now = new Date()) {
  const stage = getCompetitionStage(competition, now);
  const { label, target } = STAGE_COUNTDOWN_TARGET[stage](competition);
  if (!target) return { stage, label: null, target: null, isHurryUp: false };
  const msRemaining = new Date(target).getTime() - now.getTime();
  return {
    stage,
    label,
    target, // ISO timestamp - the client computes the live ticking display,
    // never the server, to avoid clock-skew and request-latency drift.
    isHurryUp: msRemaining > 0 && msRemaining <= HURRY_UP_THRESHOLD_MS,
  };
}

/**
 * Folds the competition stage together with *this* user's registration and
 * submission (if any) into the single piece of state the "sticky bottom
 * button" needs: what to say, whether it's tappable, and what tapping it
 * should do.
 */
function getUserParticipationState({ competition, stage, registration, submission }) {
  if (!registration) {
    if (stage === 'registration_open') {
      return { code: 'can_register', buttonLabel: 'Register Now', buttonEnabled: true, action: 'register' };
    }
    if (stage === 'registration_upcoming') {
      return { code: 'registration_not_open_yet', buttonLabel: 'Registration Opens Soon', buttonEnabled: false, action: null };
    }
    if (stage === 'registration_closed_full') {
      return { code: 'sold_out', buttonLabel: 'Spots Full', buttonEnabled: false, action: null };
    }
    return { code: 'registration_closed', buttonLabel: 'Registration Closed', buttonEnabled: false, action: null };
  }

  if (registration.status === 'pending_payment') {
    return { code: 'payment_pending', buttonLabel: 'Complete Payment', buttonEnabled: true, action: 'complete_payment' };
  }

  if (registration.status === 'cancelled' || registration.status === 'expired') {
    // Their hold lapsed or they cancelled; treat like a fresh visitor,
    // constrained by the current stage (mirrors the no-registration branch).
    return getUserParticipationState({ competition, stage, registration: null, submission });
  }

  // registration.status === 'confirmed' from here on.
  if (stage === 'results_declared') {
    return { code: 'results_declared', buttonLabel: 'View Results', buttonEnabled: true, action: 'view_results' };
  }
  if (stage === 'submission_closed') {
    return { code: 'submission_window_closed', buttonLabel: submission ? 'Submitted' : 'Submission Closed', buttonEnabled: false, action: null };
  }
  if (stage === 'submission_open') {
    return submission
      ? { code: 'submitted', buttonLabel: 'Update Submission', buttonEnabled: true, action: 'upload_submission' }
      : { code: 'can_submit', buttonLabel: 'Upload Submission', buttonEnabled: true, action: 'upload_submission' };
  }
  // registered, but before the submission window has opened
  return { code: 'registered_awaiting_submission', buttonLabel: 'Registered', buttonEnabled: false, action: null };
}

module.exports = {
  getCompetitionStage,
  getCountdown,
  getUserParticipationState,
};
