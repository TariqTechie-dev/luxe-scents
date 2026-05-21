const mongoose = require('mongoose');
const Product = require('../models/Product');

const PRODUCT_FIELDS = ['name', 'sku', 'price', 'stock', 'category', 'imageUrl', 'description', 'topNotes', 'heartNotes', 'baseNotes'];

const normalizeOptionalText = (value) => {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const buildProductPayload = (body = {}) => {
    return {
        name: typeof body.name === 'string' ? body.name.trim() : '',
        sku: typeof body.sku === 'string' ? body.sku.trim().toUpperCase() : '',
        price: Number.parseFloat(body.price),
        stock: body.stock === undefined || body.stock === '' ? 0 : Number.parseInt(body.stock, 10),
        category: body.category || 'Other',
        imageUrl: normalizeOptionalText(body.imageUrl),
        description: normalizeOptionalText(body.description),
        topNotes: body.topNotes,
        heartNotes: body.heartNotes,
        baseNotes: body.baseNotes
    };
};

const logProductError = (context, err, req) => {
    console.error(`[Admin Product] ${context} failed`, {
        message: err.message,
        name: err.name,
        code: err.code,
        keyValue: err.keyValue,
        validationErrors: err.errors
            ? Object.values(err.errors).map((error) => error.message)
            : undefined,
        bodyKeys: req.body ? Object.keys(req.body).filter((key) => PRODUCT_FIELDS.includes(key)) : []
    });
};

// ─── GET /admin/products ───────────────────────────────────────────────────────
/**
 * Fetch and display all products from database.
 * Sorted by most recent first.
 */
exports.getAllProducts = async (req, res, next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20; // products per page
        const skip  = (page - 1) * limit;

        const [totalProducts, products] = await Promise.all([
            Product.countDocuments(),
            Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
        ]);

        const totalPages = Math.max(1, Math.ceil(totalProducts / limit));

        return res.render('admin/admin_product_management', {
            products,
            title: 'Product Management',
            showAddProductModal: req.flash('openAddProductModal').length > 0,
            pagination: { currentPage: page, totalPages, totalProducts, limit }
        });
    } catch (err) {
        return next(err);
    }
};

// ─── POST /admin/products/add ──────────────────────────────────────────────────
/**
 * Add a new product to the database.
 * Validates input and handles duplicate SKU errors.
 */
exports.addProduct = async (req, res, next) => {
    try {
        const productPayload = buildProductPayload(req.body);
        const newProduct = new Product({ ...productPayload, active: true });

        await newProduct.save();

        req.flash('success', `Product "${newProduct.name}" added successfully.`);
        return res.redirect('/admin/products');
    } catch (err) {
        logProductError('Create product', err, req);

        if (err.code === 11000) {
            req.flash('openAddProductModal', 'true');
            req.flash('error', `A product with SKU "${req.body?.sku}" already exists. SKU must be unique.`);
            return res.redirect('/admin/products');
        }
        if (err.name === 'ValidationError') {
            req.flash('openAddProductModal', 'true');
            req.flash(
                'error',
                Object.values(err.errors).map((error) => error.message).join(' ')
            );
            return res.redirect('/admin/products');
        }
        return next(err);
    }
};

// ─── GET /admin/products/:id/edit ──────────────────────────────────────────────
/**
 * Fetch a specific product and render the edit form.
 * Pre-fills form with existing product data.
 */
exports.getEditProductPage = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.isValidObjectId(id)) {
            req.flash('error', 'Invalid product ID.');
            return res.redirect('/admin/products');
        }

        const product = await Product.findById(id).lean();

        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }

        return res.render('admin/admin_edit_product', {
            product,
            title: `Edit Product: ${product.name}`
        });
    } catch (err) {
        return next(err);
    }
};

// ─── POST /admin/products/:id/edit ─────────────────────────────────────────────
/**
 * Update an existing product's information.
 * Validates input and ensures product exists.
 */
exports.updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const productPayload = buildProductPayload(req.body);

        // Validate ID format
        if (!mongoose.isValidObjectId(id)) {
            req.flash('error', 'Invalid product ID.');
            return res.redirect('/admin/products');
        }

        const product = await Product.findById(id);

        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }

        Object.assign(product, productPayload);

        await product.save();

        req.flash('success', `Product "${product.name}" updated successfully.`);
        return res.redirect('/admin/products');
    } catch (err) {
        logProductError('Update product', err, req);

        if (err.code === 11000) {
            req.flash('error', `A product with SKU "${req.body?.sku}" already exists. SKU must be unique.`);
            return res.redirect(`/admin/products/${req.params.id}/edit`);
        }
        if (err.name === 'ValidationError') {
            req.flash(
                'error',
                Object.values(err.errors).map((error) => error.message).join(' ')
            );
            return res.redirect(`/admin/products/${req.params.id}/edit`);
        }
        return next(err);
    }
};

// ─── POST /admin/products/:id/toggle ───────────────────────────────────────────
/**
 * Toggle a product's active status.
 * Used for activating/deactivating products without deleting them.
 */
exports.toggleProductStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.isValidObjectId(id)) {
            req.flash('error', 'Invalid product ID.');
            return res.redirect('/admin/products');
        }

        const product = await Product.findById(id);

        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }

        product.active = !product.active;
        await product.save();

        const statusText = product.active ? 'activated' : 'deactivated';
        req.flash('success', `Product "${product.name}" has been ${statusText}.`);
        return res.redirect('/admin/products');
    } catch (err) {
        return next(err);
    }
};

// ─── POST /admin/products/:id/delete ───────────────────────────────────────────
/**
 * Permanently delete a product from the database.
 * Includes safety check to prevent deletion if product is referenced in orders.
 */
exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.isValidObjectId(id)) {
            req.flash('error', 'Invalid product ID.');
            return res.redirect('/admin/products');
        }

        const product = await Product.findById(id);

        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }

        // Check if product is referenced in any orders
        const Order = require('../models/Order');
        const orderCount = await Order.countDocuments({
            'items.product': product._id
        });

        if (orderCount > 0) {
            req.flash('error', `Cannot delete product "${product.name}" because it has been ordered ${orderCount} time(s). Consider deactivating it instead.`);
            return res.redirect('/admin/products');
        }

        const productName = product.name;
        await Product.findByIdAndDelete(id);

        req.flash('success', `Product "${productName}" has been permanently deleted.`);
        return res.redirect('/admin/products');
    } catch (err) {
        return next(err);
    }
};
