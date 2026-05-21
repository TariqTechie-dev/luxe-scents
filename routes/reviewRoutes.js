const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const reviewController = require('../controllers/reviewController');
const wrapAsync = require('../utils/WrapAsync');

// ─── POST /products/:productId/review ──────────────────────────────────────────
// Add a review for a product (authenticated users only)
router.post('/products/:productId/review', isAuthenticated, wrapAsync(reviewController.addReview));

// ─── GET /products/:productId/reviews ──────────────────────────────────────────
// Get all reviews for a product (public endpoint)
router.get('/products/:productId/reviews', wrapAsync(reviewController.getProductReviews));

// ─── DELETE /reviews/:reviewId ────────────────────────────────────────────────
// Delete a review (review author only)
router.delete('/reviews/:reviewId', isAuthenticated, wrapAsync(reviewController.deleteReview));

module.exports = router;
