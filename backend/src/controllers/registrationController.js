const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const ApiError = require('../utils/ApiError');
const { reserveSpot } = require('../services/registrationService');
const { createOrder } = require('../services/paymentService');

/**
 * POST /api/competitions/:id/register
 * body: { referralCode?: string }
 *
 * Reserves a spot (atomically) and, if the entry fee is non-zero, creates a
 * Razorpay order for the client to complete via the Checkout SDK. Free
 * competitions are confirmed immediately by the service.
 */
async function register(req, res) {
  const { id: competitionId } = req.params;
  const { referralCode } = req.body || {};

  const registration = await reserveSpot({ competitionId, userId: req.user.id, referralCode });

  let order = null;
  if (registration.status === 'pending_payment') {
    order = await createOrder({
      amountPaise: registration.amountDuePaise,
      receipt: String(registration._id),
      notes: { competitionId, userId: req.user.id },
    });
    registration.payment.orderId = order.id;
    await registration.save();
  }

  res.status(201).json({
    data: {
      registrationId: registration._id,
      status: registration.status,
      amountDue: registration.amountDuePaise / 100,
      holdExpiresAt: registration.holdExpiresAt,
      razorpayOrder: order ? { id: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID } : null,
    },
  });
}

/**
 * GET /api/competitions/:id/registration/me
 * Lightweight status check the app can poll after returning from checkout,
 * in case the webhook hasn't landed yet.
 */
async function getMyRegistration(req, res) {
  const { id: competitionId } = req.params;
  const registration = await Registration.findOne({ competition: competitionId, user: req.user.id });
  if (!registration) throw new ApiError(404, 'No registration found');
  res.json({ data: registration });
}

/** POST /api/competitions/:id/registration/cancel */
async function cancelRegistration(req, res) {
  const { id: competitionId } = req.params;
  const registration = await Registration.findOne({ competition: competitionId, user: req.user.id });
  if (!registration) throw new ApiError(404, 'No registration found');
  if (registration.status !== 'confirmed') throw new ApiError(409, 'Only a confirmed registration can be cancelled');

  registration.status = 'cancelled';
  registration.cancelledAt = new Date();
  await registration.save();

  // Deliberately NOT re-incrementing spotsRemaining here - see README
  // "Trade-offs" on why a cancellation after confirmation does not
  // automatically reopen a spot in this implementation.
  res.json({ data: registration });
}

module.exports = { register, getMyRegistration, cancelRegistration };
