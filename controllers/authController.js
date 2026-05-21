const User = require('../models/User');
const { validationResult } = require('express-validator');
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const getRedirectTarget = (req, fallback = '/dashboard') => {
    const candidate = req.session && typeof req.session.returnTo === 'string'
        ? req.session.returnTo
        : fallback;

    if (req.session) {
        delete req.session.returnTo;
    }

    if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
        return fallback;
    }

    return candidate;
};

const normalizeNameForSession = (name) => {
    return typeof name === 'string' ? name.trim() : '';
};

const normalizeNameInput = (name) => {
    return typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
};

const getSessionHome = (req) => {
    return req.session && req.session.role === 'admin' ? '/admin/products' : '/dashboard';
};

// ─── GET /login ────────────────────────────────────────────────────────────────
exports.getLoginPage = (req, res) => {
    if (req.session.userId) return res.redirect(getSessionHome(req));
    res.render('user/user_authentication_page', {
        title: 'Login | Luxe Scents'
    });
};

// ─── POST /login ───────────────────────────────────────────────────────────────
exports.postLogin = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/login');
    }

    const email = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user || typeof user.password !== 'string' || !BCRYPT_HASH_REGEX.test(user.password)) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        let isPasswordValid = false;
        try {
            isPasswordValid = await user.comparePassword(password);
        } catch (compareError) {
            isPasswordValid = false;
        }

        if (!isPasswordValid) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        const returnTo = getRedirectTarget(req);
        const redirectTo = user.role === 'admin' ? '/admin/products' : returnTo;
        const existingCart = req.session && req.session.cart ? req.session.cart : undefined;
        const existingLastOrderId = req.session && req.session.lastOrderId ? req.session.lastOrderId : undefined;

        req.session.regenerate((err) => {
            if (err) return next(err);

            req.session.userId = user._id.toString();
            req.session.role = user.role;
            req.session.userName = normalizeNameForSession(user.name);
            req.session.userEmail = user.email;

            if (existingCart) {
                req.session.cart = existingCart;
            }

            if (existingLastOrderId) {
                req.session.lastOrderId = existingLastOrderId;
            }

            req.flash('success', `Welcome back, ${user.name}!`);
            req.session.save((saveErr) => {
                if (saveErr) return next(saveErr);
                return res.redirect(redirectTo);
            });
        });
    } catch (err) {
        next(err);
    }
};

// ─── GET /register ─────────────────────────────────────────────────────────────
exports.getRegisterPage = (req, res) => {
    if (req.session.userId) return res.redirect(getSessionHome(req));
    res.render('user/user_register_page', {
        title: 'Create Account | Luxe Scents'
    });
};

// ─── POST /register ────────────────────────────────────────────────────────────
exports.postRegister = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map((e) => e.msg).join(' '));
        return res.redirect('/register');
    }

    const name = normalizeNameInput(req.body.name);
    const email = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'An account with that email already exists.');
            return res.redirect('/register');
        }

        const user = new User({
            name,
            email,
            password
        });
        await user.save();

        req.flash('success', 'Account created successfully! Please log in.');
        return res.redirect('/login');
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            req.flash('error', messages.join(' '));
            return res.redirect('/register');
        }
        if (err.code === 11000) {
            req.flash('error', 'An account with that email already exists.');
            return res.redirect('/register');
        }
        req.flash('error', 'Unable to create your account right now. Please try again.');
        return res.redirect('/register');
    }
};

// ─── POST /logout ──────────────────────────────────────────────────────────────
exports.postLogout = (req, res, next) => {
    // Destroy the current session to remove all session data and the old session ID.
    req.session.destroy((err) => {
        if (err) return next(err);
        // Clear authentication and CSRF cookies.
        res.clearCookie('sid');
        res.clearCookie('__csrf');
        // Optionally, regenerate a fresh session for the next request (not needed for logout).
        return res.redirect('/login');
    });
};
