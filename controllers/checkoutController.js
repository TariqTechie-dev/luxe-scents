const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { validationResult, matchedData } = require('express-validator');
const { ensureCart, clearCart } = require('../utils/cartUtils');
const safepayUtil = require('../utils/safepay');

const buildCheckoutViewData = (req, cart) => ({
    title: 'Secure Checkout | Luxe Scents',
    cart,
    userEmail: req.session.userEmail || '',
    userName: req.session.userName || '',
    safepayEnabled: safepayUtil.isConfigured()
});

const createCheckoutConflict = (message) => {
    const error = new Error(message);
    error.statusCode = 409;
    return error;
};

const getStockConflictMessage = async (item) => {
    if (!mongoose.isValidObjectId(item.productId)) {
        return `Product "${item.name}" is no longer available.`;
    }

    const product = await Product.findById(item.productId).lean();

    if (!product) {
        return `Product "${item.name}" is no longer available.`;
    }

    if (!product.active) {
        return `"${product.name}" has been removed from our collection.`;
    }

    return product.stock > 0
        ? `Sorry, only ${product.stock} unit(s) of "${product.name}" are left in stock.`
        : `"${product.name}" is now out of stock.`;
};

const rollbackStockDeductions = async (deductedItems) => {
    for (const item of [...deductedItems].reverse()) {
        await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } }
        );
    }
};

// ─── GET /checkout ─────────────────────────────────────────────────────────────
exports.getCheckout = (req, res) => {
    const cart = ensureCart(req.session);

    if (!cart.items.length) {
        req.flash('error', 'Your cart is empty. Add some fragrances first!');
        return res.redirect('/cart');
    }

    return res.render('checkout/cart_secure_checkout', buildCheckoutViewData(req, cart));
};

// ─── POST /checkout ────────────────────────────────────────────────────────────
exports.postCheckout = async (req, res, next) => {
    const cart = ensureCart(req.session);
    const errors = validationResult(req);

    if (!cart.items.length) {
        req.flash('error', 'Your cart is empty.');
        return res.redirect('/cart');
    }

    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map((e) => e.msg).join(' '));
        return res.redirect('/checkout');
    }

    const data = matchedData(req, {
        locations: ['body'],
        includeOptionals: true
    });

    const shippingAddress = {
        street: (data.street || '').trim(),
        city: (data.city || '').trim(),
        state: (data.state || '').trim(),
        zip: (data.zip || '').trim(),
        country: (data.country || '').trim()
    };

    if (req.body.paymentMethod === 'safepay') {
        return postSafepayCheckout(req, res, next, cart, shippingAddress);
    }

    try {
        const orderItems = [];
        const deductedItems = [];
        let computedTotal = 0;
        let newOrder;

        try {
            for (const item of cart.items) {
                const quantity = parseInt(item.quantity, 10);

                if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(quantity) || quantity < 1) {
                    throw createCheckoutConflict(`Product "${item.name || 'Unknown'}" is no longer available.`);
                }

                const dbProduct = await Product.findOneAndUpdate(
                    {
                        _id: item.productId,
                        active: true,
                        stock: { $gte: quantity }
                    },
                    {
                        $inc: { stock: -quantity }
                    },
                    {
                        new: false,
                    }
                );

                if (!dbProduct) {
                    throw createCheckoutConflict(await getStockConflictMessage(item));
                }

                deductedItems.push({
                    productId: dbProduct._id,
                    quantity
                });

                const price = Number(dbProduct.price);

                orderItems.push({
                    product: dbProduct._id,
                    name: dbProduct.name,
                    quantity,
                    price
                });

                computedTotal += price * quantity;
            }

            newOrder = await Order.create({
                user: req.session.userId,
                items: orderItems,
                totalAmount: Number(computedTotal.toFixed(2)),
                status: 'Pending',
                paymentStatus: 'Pending',
                paymentMethod: 'cod',
                shippingAddress
            });
        } catch (err) {
            if (deductedItems.length) {
                await rollbackStockDeductions(deductedItems);
            }
            throw err;
        }

        clearCart(req.session);
        req.session.lastOrderId = newOrder._id.toString();
        req.flash('success', 'Your order has been placed successfully!');

        return req.session.save((saveErr) => {
            if (saveErr) return next(saveErr);
            return res.redirect('/order-success');
        });

    } catch (err) {
        if (err && err.statusCode === 409) {
            req.flash('error', err.message);
            return res.redirect('/cart');
        }
        return next(err);
    }
};

// ─── POST /checkout (Pay Online via SafePay) ───────────────────────────────────
// Creates the order WITHOUT touching stock, then hands the customer to
// SafePay's hosted checkout. Stock moves only after the webhook confirms payment.
const postSafepayCheckout = async (req, res, next, cart, shippingAddress) => {
    const safepay = safepayUtil.getClient();

    if (!safepay) {
        req.flash('error', 'Online payment is not available right now. Please choose Cash on Delivery.');
        return res.redirect('/checkout');
    }

    try {
        const orderItems = [];
        let computedTotal = 0;

        for (const item of cart.items) {
            const quantity = parseInt(item.quantity, 10);

            if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(quantity) || quantity < 1) {
                throw createCheckoutConflict(`Product "${item.name || 'Unknown'}" is no longer available.`);
            }

            const dbProduct = await Product.findOne({ _id: item.productId, active: true }).lean();

            if (!dbProduct) {
                throw createCheckoutConflict(await getStockConflictMessage(item));
            }

            if (dbProduct.stock < quantity) {
                throw createCheckoutConflict(await getStockConflictMessage(item));
            }

            const price = Number(dbProduct.price);

            orderItems.push({
                product: dbProduct._id,
                name: dbProduct.name,
                quantity,
                price
            });

            computedTotal += price * quantity;
        }

        const newOrder = await Order.create({
            user: req.session.userId,
            items: orderItems,
            totalAmount: Number(computedTotal.toFixed(2)),
            status: 'Pending',
            paymentStatus: 'Pending',
            paymentMethod: 'safepay',
            shippingAddress
        });

        const { token } = await safepay.payments.create({
            amount: Math.round(newOrder.totalAmount),
            currency: 'PKR'
        });

        newOrder.safepayToken = token;
        await newOrder.save();

        req.session.pendingSafepayOrderId = newOrder._id.toString();

        const baseUrl = safepayUtil.getBaseUrl(req);
        const checkoutUrl = safepay.checkout.create({
            token,
            orderId: newOrder._id.toString(),
            cancelUrl: `${baseUrl}/checkout/payment-cancelled`,
            redirectUrl: `${baseUrl}/checkout/payment-return`,
            webhooks: true
        });

        return req.session.save((saveErr) => {
            if (saveErr) return next(saveErr);
            return res.redirect(checkoutUrl);
        });
    } catch (err) {
        if (err && err.statusCode === 409) {
            req.flash('error', err.message);
            return res.redirect('/cart');
        }
        return next(err);
    }
};

// ─── GET /checkout/payment-return ──────────────────────────────────────────────
// SafePay sends the customer back here after payment. If the return URL carries
// the payment tracker matching our record, the order is marked Paid right here.
exports.safepayReturn = async (req, res, next) => {
    try {
        let order = null;
        const orderId = req.query.order || req.session.pendingSafepayOrderId;

        if (orderId && mongoose.isValidObjectId(orderId)) {
            order = await Order.findOne({ _id: orderId, user: req.session.userId }).lean();
        }

        if (!order) {
            order = await Order.findOne({ user: req.session.userId, paymentMethod: 'safepay', paymentStatus: 'Pending' }).sort({ createdAt: -1 }).lean();
        }

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/orders');
        }

        delete req.session.pendingSafepayOrderId;

        if (order.paymentStatus === 'Paid') {
            clearCart(req.session);
            req.session.lastOrderId = order._id.toString();
            req.flash('success', 'Payment received! Your order has been placed successfully.');

            return req.session.save((saveErr) => {
                if (saveErr) return next(saveErr);
                return res.redirect('/order-success');
            });
        }

        const returnTracker = req.query.tracker;
        if (returnTracker && order.safepayToken && returnTracker === order.safepayToken) {
            const marked = await Order.findOneAndUpdate(
                { _id: order._id, paymentStatus: 'Pending' },
                { $set: { paymentStatus: 'Paid' } },
                { new: true }
            );

            if (marked) {
                for (const item of marked.items) {
                    await Product.findOneAndUpdate(
                        { _id: item.product, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity } }
                    );
                }
                clearCart(req.session);
                req.session.lastOrderId = marked._id.toString();
                req.flash('success', 'Payment received! Your order has been placed successfully.');

                return req.session.save((saveErr) => {
                    if (saveErr) return next(saveErr);
                    return res.redirect('/order-success');
                });
            }
        }

        return res.render('checkout/payment_confirming', {
            title: 'Confirming Payment | Luxe Scents',
            orderId: order._id.toString()
        });
    } catch (err) {
        return next(err);
    }
};

// ─── GET /checkout/payment-cancelled ───────────────────────────────────────────
exports.safepayCancel = (req, res) => {
    req.flash('error', 'Online payment was cancelled. Your cart is untouched — try again or choose Cash on Delivery.');
    return res.redirect('/checkout');
};

// ─── POST /webhooks/safepay ────────────────────────────────────────────────────
// Server-to-server notification from SafePay. Verifies the HMAC signature,
// then marks the matching order Paid and deducts stock. Safe to receive twice.
exports.safepayWebhook = async (req, res) => {
    const safepay = safepayUtil.getClient();
    if (!safepay) return res.sendStatus(503);

    let valid = false;
    try {
        valid = safepay.verify.webhook(req);
    } catch (err) {
        valid = false;
    }

    if (!valid) return res.sendStatus(401);

    const { type, data } = req.body || {};
    const eventType = String(type || '').toLowerCase();
    const isPaid = data && String(data.state || '').toUpperCase() === 'PAID';
    if (!data || !(isPaid || eventType === 'payment.succeeded')) return res.sendStatus(200);

    try {
        let order = null;

        if (data.tracker) {
            order = await Order.findOne({ safepayToken: data.tracker });
        }

        const metaOrderId = (data.meta && data.meta.order_id) || (data.metadata && data.metadata.order_id);
        if (!order && metaOrderId && mongoose.isValidObjectId(metaOrderId)) {
            order = await Order.findById(metaOrderId);
        }

        if (!order || order.paymentMethod !== 'safepay') return res.sendStatus(200);

        if (Math.round(order.totalAmount) !== Number(data.amount)) {
            console.error(`[safepay] amount mismatch for order ${order._id}: expected ${Math.round(order.totalAmount)}, got ${data.amount}`);
            return res.sendStatus(200);
        }

        const marked = await Order.findOneAndUpdate(
            { _id: order._id, paymentStatus: 'Pending' },
            { $set: { paymentStatus: 'Paid' } },
            { new: true }
        );

        if (!marked) return res.sendStatus(200);

        for (const item of marked.items) {
            await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } }
            );
        }

        return res.sendStatus(200);
    } catch (err) {
        console.error('[safepay] webhook error:', err);
        return res.sendStatus(500);
    }
};

// ─── POST /checkout/payment-return (SafePay server notification) ───────────────
// SafePay POSTs server-to-server to our redirectUrl after payment with
// { tracker, token, orderId, ref, sig }. The sig is HMAC-SHA256 of the tracker
// (verified with the v1 secret). No session here, so no login/CSRF — the HMAC
// is the authentication. Runs the same idempotent fulfillment as the webhook,
// so payment completes even if the dashboard webhook endpoint isn't configured.
exports.safepayRedirectNotify = async (req, res) => {
    const safepay = safepayUtil.getClient();
    if (!safepay) return res.sendStatus(503);

    let valid = false;
    try {
        valid = safepay.verify.signature(req);
    } catch (err) {
        valid = false;
    }

    if (!valid) return res.sendStatus(401);

    const body = req.body || {};
    const tracker = body.tracker;
    const ref = body.orderId || body.order_id;

    try {
        let order = null;

        if (tracker) {
            order = await Order.findOne({ safepayToken: tracker });
        }

        if (!order && ref && mongoose.isValidObjectId(ref)) {
            order = await Order.findById(ref);
        }

        if (!order || order.paymentMethod !== 'safepay') return res.sendStatus(200);

        const marked = await Order.findOneAndUpdate(
            { _id: order._id, paymentStatus: 'Pending' },
            { $set: { paymentStatus: 'Paid' } },
            { new: true }
        );

        if (!marked) return res.sendStatus(200);

        for (const item of marked.items) {
            await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } }
            );
        }

        return res.sendStatus(200);
    } catch (err) {
        console.error('[safepay] redirect-notify error:', err);
        return res.sendStatus(500);
    }
};
