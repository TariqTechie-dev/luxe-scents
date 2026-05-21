const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const checkoutController  = require('../controllers/checkoutController');

// ─── Validation for checkout shipping form ────────────────────────────────────
const checkoutValidation = [
    body('street').trim().notEmpty().withMessage('Street address is required.').escape(),
    body('city').trim().notEmpty().withMessage('City is required.').escape(),
    body('state').trim().optional().escape(),
    body('zip').trim().notEmpty().withMessage('Postal code is required.').escape(),
    body('country').trim().notEmpty().withMessage('Country is required.').escape()
];

// ─── Routes ───────────────────────────────────────────────────────────────────
// GET  /checkout  →  render checkout page (must be logged in)
router.get('/checkout', isAuthenticated, checkoutController.getCheckout);

// POST /checkout  →  process the order (must be logged in)
router.post('/checkout', isAuthenticated, checkoutValidation, checkoutController.postCheckout);

module.exports = router;
