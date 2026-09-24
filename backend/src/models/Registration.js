const mongoose = require('mongoose');

// A Registration represents one user's claim on one spot in one competition.
//
// Lifecycle: pending_payment -> confirmed
//                            \-> expired   (hold timed out, spot released)
//            confirmed -> cancelled        (refund flow, spot NOT auto-reopened
//                                            by default - see README trade-offs)
//
// The compound unique index is the last line of defence against a user
// ending up with two registrations for the same competition (double click,
// retried request, race condition) even if a service-layer check is
// bypassed or racy.
const registrationSchema = new mongoose.Schema(
  {
    competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'expired', 'cancelled'],
      default: 'pending_payment',
      index: true,
    },

    amountDuePaise: { type: Number, required: true, min: 0 },
    discountAppliedPaise: { type: Number, default: 0 },
    referralCodeUsed: { type: String, default: null },

    // Only meaningful while status === 'pending_payment'. A TTL-style field
    // checked by the release job (jobs/releaseExpiredHolds.js) rather than a
    // Mongo TTL index, because releasing the hold must also increment
    // Competition.spotsRemaining atomically - a bare TTL delete can't do that.
    holdExpiresAt: { type: Date, default: null },

    payment: {
      provider: { type: String, default: 'razorpay' },
      orderId: { type: String, default: null },
      paymentId: { type: String, default: null },
      signatureVerified: { type: Boolean, default: false },
    },

    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

registrationSchema.index({ competition: 1, user: 1 }, { unique: true });
registrationSchema.index({ status: 1, holdExpiresAt: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
