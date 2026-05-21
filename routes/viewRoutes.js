const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const wrapAsync = require('../utils/WrapAsync');

const SHOP_PAGE_SIZE = 12;
const HOME_FEATURED_LIMIT = 4;

async function getBestSellerProducts(limit = HOME_FEATURED_LIMIT) {
    const bestSellers = await Order.aggregate([
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product',
                totalQuantity: { $sum: '$items.quantity' }
            }
        },
        { $sort: { totalQuantity: -1, _id: 1 } },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        { $match: { 'product.active': true } },
        {
            $project: {
                _id: '$product._id',
                name: '$product.name',
                description: '$product.description',
                price: '$product.price',
                stock: '$product.stock',
                category: '$product.category',
                imageUrl: '$product.imageUrl',
                active: '$product.active',
                averageRating: '$product.averageRating',
                reviewCount: '$product.reviewCount',
                createdAt: '$product.createdAt',
                totalQuantity: 1
            }
        },
        { $limit: limit }
    ]);

    if (bestSellers.length >= limit) {
        return bestSellers;
    }

    const selectedIds = bestSellers
        .map((product) => product._id)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const fallbackProducts = await Product.find({
        active: true,
        _id: { $nin: selectedIds }
    })
        .sort({ createdAt: -1 })
        .limit(limit - bestSellers.length)
        .lean();

    return [...bestSellers, ...fallbackProducts];
}

function buildShopViewModel({
    products,
    title,
    currentPage,
    totalPages,
    total,
    searchQuery = '',
    breadcrumbCurrent,
    heading,
    description
}) {
    return {
        products,
        title,
        currentPage,
        totalPages,
        total,
        searchQuery,
        breadcrumbCurrent,
        heading,
        description,
        isSearchResults: Boolean(searchQuery)
    };
}

// GET / - Home Page
router.get('/', wrapAsync(async (req, res) => {
    const featuredProducts = await getBestSellerProducts(HOME_FEATURED_LIMIT);

    res.render('pages/home', {
        title: 'Home',
        featuredProducts
    });
}));

// GET /shop - Perfume Collection Listing (with pagination)
router.get('/shop', wrapAsync(async (req, res) => {
    const requestedPage = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const total = await Product.countDocuments({ active: true });
    const totalPages = Math.max(1, Math.ceil(total / SHOP_PAGE_SIZE));
    const currentPage = Math.min(requestedPage, totalPages);
    const skip = (currentPage - 1) * SHOP_PAGE_SIZE;

    const products = await Product.find({ active: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(SHOP_PAGE_SIZE)
        .lean();

    res.render('pages/perfume_collection_listing', buildShopViewModel({
        products,
        title: 'Luxe Scents - Signature Collection',
        currentPage,
        totalPages,
        total,
        breadcrumbCurrent: 'Signature Collection',
        heading: 'The Signature Collection',
        description: 'Explore our curated selection of premium fragrances, crafted to evoke emotion and memory.'
    }));
}));

// GET /policies - Customer Care Policies
router.get('/policies', (req, res) => {
    res.render('pages/policies', {
        title: 'Customer Care Policies | Luxe Scents'
    });
});

// GET /product/:id - Product Detail Page
router.get('/product/:id', wrapAsync(async (req, res) => {
    const product = await Product.findOne({
        _id: req.params.id,
        active: true
    }).lean();

    if (!product) {
        return res.status(404).render('errors/404', {
            title: '404 - Product Not Found'
        });
    }

    const relatedProducts = await Product.find({
        _id: { $ne: product._id },
        category: product.category,
        active: true
    }).lean().limit(4);

    res.render('pages/product_details_view', {
        product,
        relatedProducts,
        userId: req.session.userId || null,
        title: `${product.name} | Luxe Scents`
    });
}));

// GET /search - Product Search
router.get('/search', wrapAsync(async (req, res) => {
    const q = req.query.q ? req.query.q.trim() : '';
    let products = [];

    if (q) {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        products = await Product.find({
            active: true,
            $or: [
                { name: { $regex: escaped, $options: 'i' } },
                { description: { $regex: escaped, $options: 'i' } }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(24)
            .lean();
    }

    res.render('pages/perfume_collection_listing', buildShopViewModel({
        products,
        title: q ? `Search: "${q}" | Luxe Scents` : 'Search | Luxe Scents',
        currentPage: 1,
        totalPages: 1,
        total: products.length,
        searchQuery: q,
        breadcrumbCurrent: q ? `Search Results for "${q}"` : 'Search Results',
        heading: q ? 'Search Results' : 'Browse The Collection',
        description: q
            ? `Showing fragrance matches for "${q}".`
            : 'Browse our signature collection to discover your next fragrance.'
    }));
}));

// GET /dashboard - User Account Dashboard (protected)
router.get('/dashboard', isAuthenticated, wrapAsync(async (req, res) => {
    const recentOrders = await Order.find({
        user: req.session.userId,
        status: { $ne: 'Cancelled' }
    })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    const orderCount = await Order.countDocuments({ user: req.session.userId });
    const activeOrders = await Order.countDocuments({
        user: req.session.userId,
        status: { $in: ['Pending', 'Processing', 'Shipped'] }
    });

    res.render('user/user_account_dashboard', {
        title: 'My Account | Luxe Scents',
        userName: req.session.userName || 'User',
        userEmail: req.session.userEmail || '',
        userRole: req.session.role || 'customer',
        recentOrders,
        orderCount,
        activeOrders
    });
}));

// GET /order-success - Order Confirmation (protected)
router.get('/order-success', isAuthenticated, wrapAsync(async (req, res) => {
    const lastOrderId = req.session.lastOrderId;

    let order = null;
    if (lastOrderId) {
        order = await Order.findOne({
            _id: lastOrderId,
            user: req.session.userId
        }).lean();
        delete req.session.lastOrderId;
    }

    res.render('checkout/order_confirmation_success', {
        title: 'Order Confirmed! | Luxe Scents',
        order,
        userName: req.session.userName || 'Valued Customer'
    });
}));

module.exports = router;
