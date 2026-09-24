const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { razorpayWebhook, confirmFromClient } = require('../controllers/paymentController');

const router = express.Router();

// NOTE: this route is mounted with express.raw() BEFORE the JSON body
// parser in app.js, so req.body here is a Buffer (needed for signature
// verification against the exact bytes Razorpay signed).
router.post('/webhook', razorpayWebhook);

router.post('/registrations/:registrationId/confirm', requireAuth, confirmFromClient);

module.exports = router;
