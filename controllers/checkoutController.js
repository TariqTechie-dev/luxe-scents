const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { validationResult, matchedData } = require('express-validator');
const { ensureCart, clearCart } = require('../utils/cartUtils');

const buildCheckoutViewData = (req, cart) => ({
    title: 'Secure Checkout | Luxe Scents',
    cart,
    userEmail: req.session.userEmail || '',
    userName: req.session.userName || ''
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
