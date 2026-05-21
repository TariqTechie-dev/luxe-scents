const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const { isAuthenticated } = require('../middlewares/authMiddleware');

const wishlistProductValidation = [
    body('productId')
        .trim()
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage('Invalid product.')
];

const getSafeBackRedirect = (req, fallback = '/wishlist') => {
    const referer = req.get('referer');

    if (!referer) {
        return fallback;
    }

    try {
        const currentOrigin = `${req.protocol}://${req.get('host')}`;
        const refererUrl = new URL(referer);

        if (refererUrl.origin !== currentOrigin) {
            return fallback;
        }

        return `${refererUrl.pathname}${refererUrl.search}`;
    } catch (err) {
        return fallback;
    }
};

// GET /wishlist — View Wishlist
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId)
            .populate({
                path: 'wishlist',
                match: { active: true }
            })
            .lean();

        if (!user) {
            req.flash('error', 'Please log in to continue.');
            return res.redirect('/login');
        }

        return res.render('pages/wishlist', {
            title: 'My Wishlist | Luxe Scents',
            wishlistProducts: user.wishlist || []
        });
    } catch (err) {
        next(err);
    }
});

// POST /wishlist/add — Add product to wishlist
router.post('/add', isAuthenticated, wishlistProductValidation, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect(getSafeBackRedirect(req));
    }

    try {
        const { productId } = req.body;
        const redirectTarget = getSafeBackRedirect(req);

        const product = await Product.findOne({ _id: productId, active: true }).lean();

        if (!product) {
            req.flash('error', 'Product not found or no longer available.');
            return res.redirect('/shop');
        }

        const user = await User.findById(req.session.userId);

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/login');
        }

        const alreadySaved = user.wishlist.some((item) => item.toString() === productId.toString());

        if (alreadySaved) {
            req.flash('success', `${product.name} is already in your wishlist.`);
            return res.redirect(redirectTarget);
        }

        user.wishlist.push(product._id);
        await user.save();

        req.flash('success', `${product.name} added to your wishlist.`);
        return res.redirect(redirectTarget);
    } catch (err) {
        next(err);
    }
});

// POST /wishlist/remove — Remove product from wishlist
router.post('/remove', isAuthenticated, wishlistProductValidation, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/wishlist');
    }

    try {
        const { productId } = req.body;

        const user = await User.findById(req.session.userId);

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/login');
        }

        const beforeCount = user.wishlist.length;
        user.wishlist = user.wishlist.filter((item) => item.toString() !== productId.toString());

        if (user.wishlist.length === beforeCount) {
            req.flash('error', 'Item was not found in your wishlist.');
            return res.redirect('/wishlist');
        }

        await user.save();

        req.flash('success', 'Item removed from your wishlist.');
        return res.redirect('/wishlist');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
