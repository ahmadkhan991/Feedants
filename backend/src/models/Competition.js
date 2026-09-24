const mongoose = require('mongoose');

// --- Sub-schemas (embedded: these only ever exist in the context of one
// competition, are small, and are always read together with it, so
// embedding avoids extra round trips on the hot "get details" path) ---

const judgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true }, // e.g. "Professional Kathak Dancer"
    experienceLabel: { type: String, default: null }, // e.g. "12+ Years of Experience"
    photoUrl: { type: String, default: null },
    introVideoUrl: { type: String, default: null },
  },
  { _id: false }
);

const rewardSchema = new mongoose.Schema(
  {
    position: { type: Number, required: true }, // 1, 2, 3...
    label: { type: String, required: true }, // "1st Winner"
    amountPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const winnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    position: { type: Number, required: true },
    positionLabel: { type: String, required: true }, // "1st Winner"
    videoUrl: { type: String, default: null },
    // Optional link back to the edition this winner came from, so a
    // recurring competition (e.g. run monthly) can show a shared winners
    // rail without duplicating documents.
    fromCompetition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', default: null },
    // Optional link to the actual account, so we can answer "did *I* win"
    // for the logged-in user once results are published (see `results`
    // below) without fuzzy name-matching.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const competitionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    tags: { type: [String], default: [] }, // ["Dance", "Multi-Win"]
    hasCertificateForWinners: { type: Boolean, default: false },

    prizePoolPaise: { type: Number, required: true, min: 0 },
    entryFeePaise: { type: Number, required: true, min: 0 },

    // --- Capacity: spotsRemaining is the atomically-decremented source of
    // truth used for booking (see registrationService). totalSpots is kept
    // alongside it purely for display ("1 / 20 Booked") and never mutated
    // after creation.
    totalSpots: { type: Number, required: true, min: 1 },
    spotsRemaining: { type: Number, required: true, min: 0 },

    judge: { type: judgeSchema, required: true },

    // --- Lifecycle timestamps. Every date on the design maps to one of
    // these; the *state* shown in the UI (badges, button label/enabled-ness,
    // countdown target) is always derived from "now vs. these", never
    // stored, so it can never drift out of sync - see utils/competitionState.js
    registrationOpensAt: { type: Date, default: null }, // null = open immediately on publish
    registrationClosesAt: { type: Date, required: true },
    submissionStartsAt: { type: Date, required: true },
    submissionEndsAt: { type: Date, required: true },
    resultDate: { type: Date, required: true },

    rewards: { type: [rewardSchema], default: [] },

    // Social proof from *earlier* editions of this competition series -
    // shown regardless of this edition's own lifecycle stage.
    previousWinners: { type: [winnerSchema], default: [] },

    // This edition's own outcome. Empty until a judge/admin publishes it
    // (after resultDate). Kept separate from previousWinners so "has this
    // edition been judged yet" is a simple emptiness check, and so a
    // registered user's own result can be looked up by `user` ref.
    results: { type: [winnerSchema], default: [] },
    resultsPublishedAt: { type: Date, default: null },

    content: {
      aboutCompetition: { type: String, default: '' },
      judgingParameters: { type: String, default: '' },
      rulesAndEligibility: { type: String, default: '' },
    },

    disclaimer: { type: String, default: '' },
    prizeMoneyInfoVideoUrl: { type: String, default: null },
    refundPolicyUrl: { type: String, default: null },
    paymentProvider: { type: String, default: 'razorpay' },

    referral: {
      enabled: { type: Boolean, default: true },
      earnPerSignupPaise: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'archived'],
      default: 'draft',
      index: true,
    },

    // Optimistic-concurrency guard in addition to the atomic $inc below;
    // bumped by Mongoose automatically when { optimisticConcurrency: true }.
  },
  { timestamps: true, optimisticConcurrency: true }
);

competitionSchema.index({ status: 1, registrationClosesAt: 1 });

// Never allow spotsRemaining to be set above totalSpots by a stray update.
competitionSchema.pre('save', function preSave(next) {
  if (this.spotsRemaining > this.totalSpots) {
    this.spotsRemaining = this.totalSpots;
  }
  next();
});

module.exports = mongoose.model('Competition', competitionSchema);
