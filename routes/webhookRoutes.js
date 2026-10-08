const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// POST /webhooks/safepay — SafePay server-to-server payment notification.
// Mounted before the CSRF middleware in server.js: external services
// cannot send CSRF tokens, and the webhook carries its own HMAC signature.
router.post('/safepay', checkoutController.safepayWebhook);

module.exports = router;
