const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');

const REVIEW_PAGE_SIZE = 5;

const recalculateProductReviewStats = async (productId) => {
    const productObjectId = productId instanceof mongoose.Types.ObjectId
        ? productId
        : new mongoose.Types.ObjectId(productId);

    const stats = await Review.aggregate([
        { $match: { product: productObjectId } },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    const reviewStats = stats[0] || { averageRating: 0, reviewCount: 0 };

    await Product.findByIdAndUpdate(productObjectId, {
        averageRating: Number(reviewStats.averageRating.toFixed(2)),
        reviewCount: reviewStats.reviewCount
    });
};

/**
 * POST /products/:productId/review
 * Add one review for the logged-in user on a product.
 */
exports.addReview = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.session.userId;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID.'
            });
        }

        const product = await Product.findById(productId).select('_id').lean();
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        const ratingNum = parseInt(rating, 10);
        if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5.'
            });
        }

        const commentStr = typeof comment === 'string' ? comment.trim() : '';
        if (commentStr.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Comment must be at least 10 characters.'
            });
        }

        if (commentStr.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Comment cannot exceed 1000 characters.'
            });
        }

        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        }).select('_id').lean();

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this product. You can only submit one review per product.'
            });
        }

        const review = await Review.create({
            user: userId,
            product: productId,
            rating: ratingNum,
            comment: commentStr
        });

        await recalculateProductReviewStats(productId);

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully!',
            review: {
                _id: review._id,
                rating: review.rating,
                comment: review.comment,
                userName: req.session.userName,
                createdAt: review.createdAt,
                canDelete: true
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this product.'
            });
        }

        return next(err);
    }
};

/**
 * GET /products/:productId/reviews
 * Return public product reviews and mark only the logged-in user's own review as deletable.
 */
exports.getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const skip = (page - 1) * REVIEW_PAGE_SIZE;
        const currentUserId = req.session?.userId ? req.session.userId.toString() : null;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID.'
            });
        }

        const product = await Product.findById(productId).select('_id').lean();
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        const reviews = await Review.find({ product: productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(REVIEW_PAGE_SIZE)
            .lean();

        const totalReviews = await Review.countDocuments({ product: productId });
        const totalPages = Math.ceil(totalReviews / REVIEW_PAGE_SIZE);

        return res.status(200).json({
            success: true,
            data: {
                reviews: reviews.map((review) => {
                    const reviewUserId = review.user?._id?.toString();

                    return {
                        _id: review._id,
                        rating: review.rating,
                        comment: review.comment,
                        userName: review.user?.name || 'Customer',
                        createdAt: review.createdAt,
                        canDelete: Boolean(currentUserId && reviewUserId === currentUserId)
                    };
                }),
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalReviews,
                    hasMore: page < totalPages
                }
            }
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * DELETE /reviews/:reviewId
 * Delete a review only when it belongs to the logged-in user.
 */
exports.deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const userId = req.session.userId;

        if (!mongoose.isValidObjectId(reviewId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review ID.'
            });
        }

        const review = await Review.findOneAndDelete({
            _id: reviewId,
            user: userId
        });

        if (!review) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own review.'
            });
        }

        await recalculateProductReviewStats(review.product);

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully.'
        });
    } catch (err) {
        return next(err);
    }
};
