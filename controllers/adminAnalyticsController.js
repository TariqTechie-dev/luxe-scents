const Order = require('../models/Order');

// ─── GET /admin/analytics ─────────────────────────────────────────────────────
/**
 * Fetch and display real analytics dashboard data.
 * Uses MongoDB aggregation pipelines for efficient calculations.
 */
exports.getDashboardStats = async (req, res, next) => {
    try {
        // Parallel aggregation queries for performance
        const [
            totalOrdersResult,
            totalRevenueResult,
            pendingOrdersResult,
            topProductsResult
        ] = await Promise.all([
            getTotalOrders(),
            getTotalRevenue(),
            getPendingOrders(),
            getTopSellingProducts()
        ]);

        const stats = {
            totalOrders: totalOrdersResult[0]?.count || 0,
            totalRevenue: totalRevenueResult[0]?.revenue || 0,
            pendingOrders: pendingOrdersResult[0]?.count || 0,
            topProducts: topProductsResult
        };

        return res.render('admin/admin_analytics_overview', {
            title: 'Analytics Overview',
            stats
        });
    } catch (err) {
        return next(err);
    }
};

// ─── AGGREGATION QUERY: Total Orders Count ────────────────────────────────────
/**
 * Count all orders in the system (all statuses).
 */
async function getTotalOrders() {
    return await Order.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ]);
}

// ─── AGGREGATION QUERY: Total Revenue ─────────────────────────────────────────
/**
 * Sum revenue from orders with status 'Delivered' or paymentStatus 'Paid'.
 * More conservative: only includes confirmed revenue.
 */
async function getTotalRevenue() {
    return await Order.aggregate([
        {
            $match: {
                $or: [
                    { status: 'Delivered' },
                    { paymentStatus: 'Paid' }
                ]
            }
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: '$totalAmount' }
            }
        }
    ]);
}

// ─── AGGREGATION QUERY: Pending Orders Count ──────────────────────────────────
/**
 * Count orders with status 'Pending'.
 */
async function getPendingOrders() {
    return await Order.aggregate([
        {
            $match: { status: 'Pending' }
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ]);
}

// ─── AGGREGATION QUERY: Top 5 Selling Products ────────────────────────────────
/**
 * Find the top 5 products by total quantity sold across all orders.
 * Returns product name, quantity sold, and total revenue from that product.
 */
async function getTopSellingProducts() {
    return await Order.aggregate([
        {
            // Unwind items array to create separate documents for each item
            $unwind: '$items'
        },
        {
            // Group by product and sum quantities
            $group: {
                _id: '$items.product',
                productName: { $first: '$items.name' },
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
            }
        },
        {
            // Sort by quantity sold descending
            $sort: { totalQuantity: -1 }
        },
        {
            // Limit to top 5
            $limit: 5
        },
        {
            // Lookup to get full product details
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        {
            // Project the final shape
            $project: {
                _id: 1,
                productName: 1,
                totalQuantity: 1,
                totalRevenue: {
                    $round: ['$totalRevenue', 2]
                },
                price: { $arrayElemAt: ['$productDetails.price', 0] },
                sku: { $arrayElemAt: ['$productDetails.sku', 0] }
            }
        }
    ]);
}

// ─── OPTIONAL: Get order status breakdown (useful for charts) ─────────────────
/**
 * Get count of orders by status for dashboard visualization.
 */
async function getOrderStatusBreakdown() {
    return await Order.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
}

// Export helper for use in other controllers if needed
exports.getOrderStatusBreakdown = getOrderStatusBreakdown;
