const mongoose = require('mongoose');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const ApiError = require('../utils/ApiError');
const { getCompetitionStage } = require('../utils/competitionState');

const PENDING_HOLD_MINUTES = Number(process.env.PENDING_HOLD_MINUTES) || 10;

/**
 * Reserve a spot and create a pending_payment Registration.
 *
 * CONCURRENCY: this is the operation thousands of users could hit in the
 * same second when a popular competition opens. The safety comes from two
 * things working together:
 *
 *   1. `Competition.spotsRemaining` is decremented with a single atomic
 *      findOneAndUpdate whose filter re-checks `spotsRemaining > 0` in the
 *      same operation as the decrement. MongoDB guarantees no two
 *      concurrent requests can both pass that filter and both decrement -
 *      one will see spotsRemaining already at 0 and get back null, which we
 *      treat as "sold out" (409). There is no read-then-write gap to race.
 *
 *   2. That decrement and the Registration insert happen inside a single
 *      multi-document transaction, so if the insert fails for any reason
 *      (including the unique (competition,user) index rejecting a double
 *      registration), the decrement is rolled back automatically - we never
 *      leak a spot that has no matching registration.
 *
 * This requires MongoDB to be running as a replica set (Atlas gives you
 * this by default; a local single-node instance needs `rs.initiate()`).
 * See README for the non-transactional fallback discussed for extreme
 * write throughput (Redis-based reservation + async reconciliation).
 */
async function reserveSpot({ competitionId, userId, referralCode = null }) {
  const session = await mongoose.startSession();
  try {
    let registration;

    await session.withTransaction(async () => {
      const now = new Date();

      // Re-fetch inside the transaction so the stage check uses a
      // consistent snapshot, then fold the "is registration even open"
      // business rule into the same atomic filter as the spot decrement.
      const existingComp = await Competition.findById(competitionId).session(session);
      if (!existingComp || existingComp.status !== 'published') {
        throw new ApiError(404, 'Competition not found');
      }
      const stage = getCompetitionStage(existingComp, now);
      if (stage !== 'registration_open') {
        throw new ApiError(409, `Registration is not open (current stage: ${stage})`);
      }

      const updatedComp = await Competition.findOneAndUpdate(
        { _id: competitionId, spotsRemaining: { $gt: 0 }, status: 'published' },
        { $inc: { spotsRemaining: -1 } },
        { new: true, session }
      );
      if (!updatedComp) {
        throw new ApiError(409, 'No spots remaining');
      }

      const discountPaise = referralCode ? updatedComp.referral?.earnPerSignupPaise || 0 : 0;
      const amountDuePaise = Math.max(updatedComp.entryFeePaise - discountPaise, 0);

      try {
        const [created] = await Registration.create(
          [
            {
              competition: competitionId,
              user: userId,
              status: amountDuePaise === 0 ? 'confirmed' : 'pending_payment',
              amountDuePaise,
              discountAppliedPaise: discountPaise,
              referralCodeUsed: referralCode,
              holdExpiresAt: amountDuePaise === 0 ? null : new Date(now.getTime() + PENDING_HOLD_MINUTES * 60 * 1000),
              confirmedAt: amountDuePaise === 0 ? now : null,
            },
          ],
          { session }
        );
        registration = created;
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate (competition, user) - they already have a registration.
          // Throwing here aborts the transaction, which automatically
          // rolls back the $inc above, so the spot is not lost.
          throw new ApiError(409, 'You already have a registration for this competition');
        }
        throw err;
      }
    });

    return registration;
  } finally {
    session.endSession();
  }
}

/**
 * Called from the Razorpay webhook once payment is verified. Idempotent:
 * confirming an already-confirmed registration is a no-op rather than an
 * error, since webhooks can be retried/delivered more than once.
 */
async function confirmPayment({ registrationId, paymentId, signatureVerified }) {
  const registration = await Registration.findById(registrationId);
  if (!registration) throw new ApiError(404, 'Registration not found');
  if (registration.status === 'confirmed') return registration; // idempotent

  if (registration.status !== 'pending_payment') {
    throw new ApiError(409, `Cannot confirm a registration in status "${registration.status}"`);
  }
  if (registration.holdExpiresAt && registration.holdExpiresAt < new Date()) {
    throw new ApiError(409, 'This registration hold has expired; the spot was released. Please register again.');
  }

  registration.status = 'confirmed';
  registration.confirmedAt = new Date();
  registration.payment.paymentId = paymentId;
  registration.payment.signatureVerified = signatureVerified;
  await registration.save();
  return registration;
}

/**
 * Releases any pending_payment registrations whose hold has lapsed,
 * returning their spot to the pool. Intended to run on a short interval
 * (see jobs/releaseExpiredHolds.js) rather than relying on a bare Mongo TTL
 * index, because releasing must also increment Competition.spotsRemaining
 * atomically alongside marking the registration expired.
 */
async function releaseExpiredHolds(batchSize = 100) {
  const now = new Date();
  const expired = await Registration.find({
    status: 'pending_payment',
    holdExpiresAt: { $lt: now },
  })
    .limit(batchSize)
    .select('_id competition');

  let released = 0;
  for (const reg of expired) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const res = await Registration.updateOne(
          { _id: reg._id, status: 'pending_payment' },
          { $set: { status: 'expired' } },
          { session }
        );
        if (res.modifiedCount === 1) {
          await Competition.updateOne(
            { _id: reg.competition },
            { $inc: { spotsRemaining: 1 } },
            { session }
          );
          released += 1;
        }
      });
    } finally {
      session.endSession();
    }
  }
  return released;
}

module.exports = { reserveSpot, confirmPayment, releaseExpiredHolds };
