const mongoose = require('mongoose');
const Order = require('../models/Order');

const getSafeRedirectPath = (value, fallback = '/dashboard') => {
    return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
        ? value
        : fallback;
};

/**
 * GET /orders
 * Fetch and display the logged-in user's order history.
 */
exports.getOrderHistory = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.session.userId })
            .sort({ createdAt: -1 })
            .lean();

        return res.render('user/user_order_history', {
            title: 'My Orders | Luxe Scents',
            orders
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * POST /orders/:id/cancel
 * Cancel a pending order owned by the logged-in user.
 */
exports.cancelOrder = async (req, res, next) => {
    const redirectPath = getSafeRedirectPath(req.body?.redirectTo);

    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            req.flash('error', 'Invalid order ID.');
            return res.redirect(redirectPath);
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.userId
        })
            .select('status')
            .lean();

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect(redirectPath);
        }

        if (order.status !== 'Pending') {
            req.flash('error', 'Only pending orders can be cancelled.');
            return res.redirect(redirectPath);
        }

        const cancelledOrder = await Order.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.session.userId,
                status: 'Pending'
            },
            { $set: { status: 'Cancelled' } },
            { new: true, runValidators: true }
        );

        if (!cancelledOrder) {
            req.flash('error', 'This order can no longer be cancelled.');
            return res.redirect(redirectPath);
        }

        req.flash('success', 'Order cancelled successfully.');
        return res.redirect(redirectPath);
    } catch (err) {
        return next(err);
    }
};

/**
 * GET /orders/:id
 * Fetch and display a single order's details.
 * Only allows the owning user to view their own order.
 */
exports.getOrderDetail = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            req.flash('error', 'Invalid order ID.');
            return res.redirect('/orders');
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.userId
        }).lean();

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/orders');
        }

        return res.render('user/user_order_detail', {
            title: `Order #${order._id.toString().slice(-6).toUpperCase()} | Luxe Scents`,
            order
        });
    } catch (err) {
        return next(err);
    }
};
