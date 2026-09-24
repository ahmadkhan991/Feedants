const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createOrder({ amountPaise, receipt, notes }) {
  if (amountPaise <= 0) return null; // free registration - nothing to charge
  return razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes,
  });
}

/** Verifies the `X-Razorpay-Signature` header on the webhook payload. */
function verifyWebhookSignature({ rawBody, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  // Timing-safe compare to avoid leaking the expected signature via timing.
  return (
    expected.length === signature?.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}

/** Verifies the client-side checkout handler's order/payment/signature triplet. */
function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

module.exports = { createOrder, verifyWebhookSignature, verifyCheckoutSignature };
