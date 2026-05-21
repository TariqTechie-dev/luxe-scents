const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
const adminOrderController = require('../controllers/adminOrderController');
const adminProductController = require('../controllers/adminProductController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const adminCustomerController = require('../controllers/adminCustomerController');
const PRODUCT_CATEGORIES = ['Floral', 'Woody', 'Citrus', 'Amber', 'Aquatic', 'Gourmand', 'Other'];

// ─── All admin routes require authentication AND admin role ───────────────────
router.use(isAuthenticated, isAdmin);

const productIdValidation = [
    param('id').custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid product identifier.')
];

const logAdminProductValidationErrors = (context, errors, req) => {
    console.error(`[Admin Product] ${context} validation failed`, {
        errors: errors.array().map((error) => ({
            field: error.path,
            message: error.msg,
            value: error.value
        })),
        bodyKeys: req.body ? Object.keys(req.body) : []
    });
};

// GET /admin/products — List all products
router.get('/products', adminProductController.getAllProducts);

// POST /admin/products — Add a new product (corrected RESTful path)
const addProductValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage('Product name is required and must be between 2 and 120 characters.')
        .bail()
        .escape(),
    body('sku')
        .trim()
        .notEmpty()
        .withMessage('SKU is required.')
        .bail()
        .isLength({ max: 50 })
        .withMessage('SKU must be 50 characters or fewer.')
        .bail()
        .matches(/^[A-Z0-9_-]+$/i)
        .withMessage('SKU may only contain letters, numbers, hyphens, and underscores.')
        .toUpperCase(),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number.')
        .toFloat(),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer.')
        .toInt(),
    body('category')
        .isIn(PRODUCT_CATEGORIES)
        .withMessage('Invalid category.'),
    body('imageUrl')
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Image URL must be a valid URL.'),
    body('description')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters.')
        .escape()
    ,
    body('topNotes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Top notes cannot exceed 300 characters.'),
    body('heartNotes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Heart notes cannot exceed 300 characters.'),
    body('baseNotes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Base notes cannot exceed 300 characters.')
];

router.post('/products/add', addProductValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logAdminProductValidationErrors('Create product', errors, req);
        req.flash('openAddProductModal', 'true');
        req.flash('error', errors.array().map((e) => e.msg).join(' '));
        return res.redirect('/admin/products');
    }
    adminProductController.addProduct(req, res, next);
});

// GET /admin/products/:id/edit — Show edit product form
router.get('/products/:id/edit', (req, res, next) => {
    // Validate product ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        req.flash('error', 'Invalid product ID.');
        return res.redirect('/admin/products');
    }
    adminProductController.getEditProductPage(req, res, next);
});

// POST /admin/products/:id/edit — Update product
const updateProductValidation = [
    param('id').custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid product ID.'),
    body('name')
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage('Product name is required and must be between 2 and 120 characters.')
        .bail()
        .escape(),
    body('sku')
        .trim()
        .notEmpty()
        .withMessage('SKU is required.')
        .bail()
        .isLength({ max: 50 })
        .withMessage('SKU must be 50 characters or fewer.')
        .bail()
        .matches(/^[A-Z0-9_-]+$/i)
        .withMessage('SKU may only contain letters, numbers, hyphens, and underscores.')
        .toUpperCase(),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number.')
        .toFloat(),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer.')
        .toInt(),
    body('category')
        .isIn(PRODUCT_CATEGORIES)
        .withMessage('Invalid category.'),
    body('imageUrl')
        .optional({ checkFalsy: true })
        .trim()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Image URL must be a valid URL.'),
    body('description')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters.')
        .escape()
    ,
    body('topNotes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Top notes cannot exceed 300 characters.'),
    body('heartNotes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Heart notes cannot exceed 300 characters.'),
    body('baseNotes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Base notes cannot exceed 300 characters.')
];

router.post('/products/:id/edit', updateProductValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logAdminProductValidationErrors('Update product', errors, req);
        req.flash('error', errors.array()[0].msg);
        return res.redirect(`/admin/products/${req.params.id}/edit`);
    }
    adminProductController.updateProduct(req, res, next);
});

// POST /admin/products/:id/toggle — Toggle product active status
router.post('/products/:id/toggle', productIdValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/admin/products');
    }
    adminProductController.toggleProductStatus(req, res, next);
});

// POST /admin/products/:id/delete — Delete product
router.post('/products/:id/delete', productIdValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/admin/products');
    }
    adminProductController.deleteProduct(req, res, next);
});

// GET /admin/orders — Order Management (list all orders)
router.get('/orders', adminOrderController.getAllOrders);

// GET /admin/orders/:id — View order details
router.get('/orders/:id', (req, res, next) => {
    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        req.flash('error', 'Invalid order ID.');
        return res.redirect('/admin/orders');
    }
    adminOrderController.getOrderDetail(req, res, next);
});

// POST /admin/orders/:id/status — Update order status
const updateOrderStatusValidation = [
    param('id').custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid order ID.'),
    body('status')
        .trim()
        .isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])
        .withMessage('Invalid status. Must be one of: Pending, Processing, Shipped, Delivered, Cancelled.')
];

router.post('/orders/:id/status', updateOrderStatusValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/admin/orders');
    }
    adminOrderController.updateOrderStatus(req, res, next);
});

// POST /admin/orders/:id/payment-status — Update payment status
const updatePaymentStatusValidation = [
    param('id').custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid order ID.'),
    body('paymentStatus')
        .trim()
        .isIn(['Pending', 'Paid', 'Refunded'])
        .withMessage('Invalid payment status. Must be one of: Pending, Paid, Refunded.')
];

router.post('/orders/:id/payment-status', updatePaymentStatusValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/admin/orders');
    }
    adminOrderController.updatePaymentStatus(req, res, next);
});

// GET /admin/analytics — Analytics Dashboard
router.get('/analytics', adminAnalyticsController.getDashboardStats);

// GET /admin/customers — List all customers
router.get('/customers', adminCustomerController.getCustomers);

// GET /admin/customers/:id — Customer details
router.get('/customers/:id', (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    req.flash('error', 'Invalid customer ID.');
    return res.redirect('/admin/customers');
  }
  adminCustomerController.getCustomerDetail(req, res, next);
});

module.exports = router;
