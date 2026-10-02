const Review = require('../models/Review');

// Real review stats straight from the Review collection.
// Product docs carry denormalized reviewCount/averageRating that can go
// stale, so pages overwrite them with these before rendering.
async function attachReviewStats(products) {
    if (!Array.isArray(products) || products.length === 0) return products;

    const ids = products.map((p) => p._id).filter(Boolean);
    if (ids.length === 0) return products;

    const stats = await Review.aggregate([
        { $match: { product: { $in: ids } } },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    const byProduct = new Map(stats.map((s) => [String(s._id), s]));
    products.forEach((p) => {
        const s = byProduct.get(String(p._id));
        p.averageRating = s ? Number(s.averageRating.toFixed(1)) : 0;
        p.reviewCount = s ? s.reviewCount : 0;
    });

    return products;
}

module.exports = { attachReviewStats };
