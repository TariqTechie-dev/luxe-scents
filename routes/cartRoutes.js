const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// ─── GET /cart - View Shopping Cart ────────────────────────────────────────────
/**
 * Display shopping cart page with session cart items
 * Accessible to both authenticated and guest users
 */
router.get('/', (req, res) => {
    const cart = req.session?.cart || { items: [], totalQty: 0, totalPrice: 0 };
    const hasItems = Array.isArray(cart.items) && cart.items.length > 0;
    const isLoggedIn = req.session?.userId;

    res.render('pages/cart', {
        cart,
        title: 'Shopping Cart | Luxe Scents',
        hasItems,
        isLoggedIn
    });
});

// ─── POST /cart/add - Add Item to Cart ────────────────────────────────────────
/**
 * Add product to session-based cart
 * Redirects authenticated users to checkout, guests to cart review
 */
router.post('/add', cartController.addItemToCart);

// ─── POST /cart/update - Update Item Quantity ─────────────────────────────────
/**
 * Update cart item quantity (increase/decrease)
 * Removes item if quantity <= 0
 */
router.post('/update', cartController.updateItemQuantity);

// ─── POST /cart/remove - Remove Item from Cart ────────────────────────────────
/**
 * Remove item from cart completely
 * Supports multiple route patterns for flexibility
 */
router.post('/remove', cartController.removeItemFromCart);
router.post('/remove/:id', cartController.removeItemFromCart);
router.delete('/remove/:id', cartController.removeItemFromCart);

module.exports = router;
