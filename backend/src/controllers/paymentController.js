const Registration = require('../models/Registration');
const ApiError = require('../utils/ApiError');
const { verifyWebhookSignature, verifyCheckoutSignature } = require('../services/paymentService');
const { confirmPayment } = require('../services/registrationService');

/**
 * POST /api/payments/webhook
 * The source of truth for payment confirmation. Registered in the
 * Razorpay dashboard against `payment.captured`. Must run BEFORE the JSON
 * body parser (see app.js) so we can verify the signature against the raw
 * bytes, not a re-serialized object which could differ byte-for-byte.
 */
async function razorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const isValid = verifyWebhookSignature({ rawBody: req.body, signature });
  if (!isValid) throw new ApiError(400, 'Invalid webhook signature');

  const payload = JSON.parse(req.body.toString('utf8'));
  if (payload.event !== 'payment.captured') {
    return res.status(200).json({ received: true, skipped: true });
  }

  const { order_id: orderId, id: paymentId } = payload.payload.payment.entity;
  const registration = await Registration.findOne({ 'payment.orderId': orderId });
  if (!registration) {
    // Don't 4xx - Razorpay will retry indefinitely. Log and 200 so it stops
    // retrying a webhook for an order we genuinely have no record of.
    // eslint-disable-next-line no-console
    console.warn(`[webhook] no registration found for order ${orderId}`);
    return res.status(200).json({ received: true, matched: false });
  }

  await confirmPayment({ registrationId: registration._id, paymentId, signatureVerified: true });
  res.status(200).json({ received: true });
}

/**
 * POST /api/registrations/:registrationId/confirm
 * Optional client-driven confirmation, called right after the Checkout
 * SDK's success callback so the app can update its own UI without waiting
 * on the webhook round trip. The webhook remains authoritative - this path
 * is purely a latency optimization and re-verifies the signature itself.
 */
async function confirmFromClient(req, res) {
  const { registrationId } = req.params;
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const isValid = verifyCheckoutSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!isValid) throw new ApiError(400, 'Invalid payment signature');

  const registration = await confirmPayment({
    registrationId,
    paymentId: razorpayPaymentId,
    signatureVerified: true,
  });
  res.json({ data: registration });
}

module.exports = { razorpayWebhook, confirmFromClient };
