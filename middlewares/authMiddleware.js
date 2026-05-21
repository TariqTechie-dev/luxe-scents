/**
 * Auth Middleware
 * Protects routes that require authentication or admin role.
 */

const isSafeReturnPath = (value) => {
    return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
};

// Ensure the user is logged in
exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }

    if (req.session && req.method === 'GET' && isSafeReturnPath(req.originalUrl)) {
        req.session.returnTo = req.originalUrl;
    }

    req.flash('error', 'Please log in to access that page.');
    return res.redirect('/login');
};

// Ensure the user has admin role
exports.isAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }

    return res.status(403).render('errors/403', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page.'
    });
};