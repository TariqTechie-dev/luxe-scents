const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const hydrateOrderUserDisplay = (order) => {
    if (!order || !order.user) {
        return order;
    }

    const displayName = order.user.name || order.user.fullName || '';
    order.user.name = displayName;
    order.user.fullName = displayName;

    return order;
};

// ─── GET /admin/orders ────────────────────────────────────────────────────────
/**
 * Fetch and display all orders from database with user information populated.
 * Sorted by most recent first.
 */
exports.getAllOrders = async (req, res, next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = 15; // orders per page
        const skip  = (page - 1) * limit;
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        const requestedStatus = typeof req.query.status === 'string' ? req.query.status.trim() : '';
        const selectedStatus = ORDER_STATUSES.includes(requestedStatus) ? requestedStatus : '';
        const orderQuery = {};

        if (selectedStatus) {
            orderQuery.status = selectedStatus;
        }

        if (q) {
            const searchRegex = new RegExp(escapeRegex(q), 'i');
            const orderIdSearch = q.replace(/^#/, '').trim();
            const searchConditions = [];

            if (orderIdSearch) {
                searchConditions.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: '$_id' },
                            regex: escapeRegex(orderIdSearch),
                            options: 'i'
                        }
                    }
                });
            }

            const matchingUsers = await User.find({ name: searchRegex }).select('_id').lean();
            const matchingUserIds = matchingUsers.map((user) => user._id);

            if (matchingUserIds.length) {
                searchConditions.push({ user: { $in: matchingUserIds } });
            }

            orderQuery.$or = searchConditions.length ? searchConditions : [{ _id: null }];
        }

        // Run count and paginated fetch in parallel
        const [totalOrders, orders] = await Promise.all([
            Order.countDocuments(orderQuery),
            Order.find(orderQuery)
                .populate('user', 'name email')
                .populate('items.product', 'name sku')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        orders.forEach(hydrateOrderUserDisplay);

        const totalPages = Math.max(1, Math.ceil(totalOrders / limit));

        // Calculate summary stats using aggregation (not loading all orders)
        const [statAgg] = await Order.aggregate([
            { $group: {
                _id: null,
                total:       { $sum: 1 },
                pending:     { $sum: { $cond: [{ $eq: ['$status', 'Pending'] },    1, 0] } },
                processing:  { $sum: { $cond: [{ $eq: ['$status', 'Processing'] }, 1, 0] } },
                pendingShipments: { $sum: { $cond: [{ $in: ['$status', ['Pending', 'Processing']] }, 1, 0] } },
                shipped:     { $sum: { $cond: [{ $eq: ['$status', 'Shipped'] },    1, 0] } },
                delivered:   { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] },  1, 0] } },
                cancelled:   { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] },  1, 0] } },
                totalRevenue:{ $sum: '$totalAmount' }
            }}
        ]);

        const stats = statAgg || { total: 0, pending: 0, processing: 0, pendingShipments: 0, shipped: 0, delivered: 0, cancelled: 0, totalRevenue: 0 };

        return res.render('admin/admin_order_management', {
            title: 'Order Management',
            orders,
            stats,
            filters: { q, status: selectedStatus },
            pagination: { currentPage: page, totalPages, totalOrders, limit }
        });
    } catch (err) {
        return next(err);
    }
};


// ─── POST /admin/orders/:id/status ────────────────────────────────────────────
/**
 * Update the status of a specific order.
 * Validates that order exists and new status is valid.
 */
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate ID format
        if (!mongoose.isValidObjectId(id)) {
            req.flash('error', 'Invalid order ID.');
            return res.redirect('/admin/orders');
        }

        // Validate status value
        if (!ORDER_STATUSES.includes(status)) {
            req.flash('error', `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}`);
            return res.redirect('/admin/orders');
        }

        // Find and update order
        const order = await Order.findById(id);
        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/admin/orders');
        }

        const oldStatus = order.status;
        order.status = status;
        await order.save();

        req.flash('success', `Order #${id.toString().slice(-6).toUpperCase()} status updated from "${oldStatus}" to "${status}".`);
        return res.redirect('/admin/orders');
    } catch (err) {
        return next(err);
    }
};

// ─── POST /admin/orders/:id/payment-status ────────────────────────────────────
/**
 * Update the payment status of a specific order.
 * Optional but useful for tracking payment flow.
 */
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        // Validate ID format
        if (!mongoose.isValidObjectId(id)) {
            req.flash('error', 'Invalid order ID.');
            return res.redirect('/admin/orders');
        }

        // Validate payment status value
        const validPaymentStatuses = ['Pending', 'Paid', 'Refunded'];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            req.flash('error', `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`);
            return res.redirect('/admin/orders');
        }

        // Find and update order
        const order = await Order.findById(id);
        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/admin/orders');
        }

        const oldPaymentStatus = order.paymentStatus;
        order.paymentStatus = paymentStatus;
        await order.save();

        req.flash('success', `Order #${id.toString().slice(-6).toUpperCase()} payment status updated from "${oldPaymentStatus}" to "${paymentStatus}".`);
        return res.redirect('/admin/orders');
    } catch (err) {
        return next(err);
    }
};

// ─── GET /admin/orders/:id ────────────────────────────────────────────────────
/**
 * Fetch and display details of a single order with all related information.
 * Admin can view any order (no ownership restriction).
 */
exports.getOrderDetail = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.isValidObjectId(id)) {
            req.flash('error', 'Invalid order ID.');
            return res.redirect('/admin/orders');
        }

        // Fetch order with full details
        const order = await Order.findById(id)
            .populate('user', 'name email phone')
            .populate('items.product', 'name sku price category');

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/admin/orders');
        }

        hydrateOrderUserDisplay(order);

        return res.render('admin/admin_order_details', {
            title: `Order #${id.toString().slice(-6).toUpperCase()} Details`,
            order
        });
    } catch (err) {
        return next(err);
    }
};
