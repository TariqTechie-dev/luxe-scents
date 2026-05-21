const Product = require('../models/Product');
const { calculateTotals, ensureCart } = require('../utils/cartUtils');

// ─── Utility Functions ────────────────────────────────────────────────────────

function wantsJson(req) {
    const acceptHeader = req.get('accept') || '';
    return req.xhr
        || req.get('x-requested-with') === 'XMLHttpRequest'
        || req.accepts(['json', 'html']) === 'json'
        || acceptHeader.includes('application/json');
}

function serializeCart(cart, productId = null) {
    const matchedItem = productId
        ? cart.items.find((item) => item.productId.toString() === productId.toString())
        : null;

    return {
        totalQty: cart.totalQty || 0,
        totalPrice: Number(cart.totalPrice || 0),
        lineItem: matchedItem
            ? {
                productId: matchedItem.productId.toString(),
                quantity: matchedItem.quantity,
                price: Number(matchedItem.price),
                lineTotal: Number((matchedItem.quantity * matchedItem.price).toFixed(2))
            }
            : null
    };
}

function sendCartJson(res, { status = 200, success, message, cart, productId = null, ...extra }) {
    res.vary('Accept');

    return res.status(status).json({
        success,
        message,
        cart: serializeCart(cart, productId),
        ...extra
    });
}

function redirectToCheckoutOrCart(req, res) {
    const isLoggedIn = req.session?.userId;
    return res.redirect(isLoggedIn ? '/checkout' : '/cart');
}

// ─── POST /cart/add - Add Item to Cart ─────────────────────────────────────────
/**
 * Add product to session-based cart
 * - Validates product exists and is in stock
 * - Handles both JSON and form submission
 * - Redirects authenticated users to checkout, guests to cart review
 */
exports.addItemToCart = async (req, res, next) => {
    const productId = req.body.productId;
    const requestedQuantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
    const prefersJson = wantsJson(req);

    if (!productId) {
        if (prefersJson) {
            return sendCartJson(res, {
                status: 400,
                success: false,
                message: 'Invalid product.',
                cart: ensureCart(req.session)
            });
        }

        req.flash('error', 'Invalid product.');
        return res.redirect('/shop');
    }

    try {
        const product = await Product.findById(productId).lean();

        if (!product) {
            if (prefersJson) {
                return sendCartJson(res, {
                    status: 404,
                    success: false,
                    message: 'Product not found.',
                    cart: ensureCart(req.session)
                });
            }

            req.flash('error', 'Product not found.');
            return res.redirect('/shop');
        }

        if (!product.active) {
            if (prefersJson) {
                return sendCartJson(res, {
                    status: 410,
                    success: false,
                    message: 'This product is no longer available.',
                    cart: ensureCart(req.session)
                });
            }

            req.flash('error', 'This product is no longer available.');
            return res.redirect('/shop');
        }

        const stockLevel = Number(product.stock);
        const availableStock = Number.isFinite(stockLevel) ? stockLevel : 0;

        if (availableStock <= 0) {
            const message = 'This item is currently out of stock.';

            if (prefersJson) {
                return sendCartJson(res, {
                    status: 409,
                    success: false,
                    message,
                    cart: ensureCart(req.session)
                });
            }

            req.flash('error', message);
            return res.redirect(`/product/${productId}`);
        }

        if (requestedQuantity > availableStock) {
            const message = `Only ${availableStock} item(s) available in stock.`;

            if (prefersJson) {
                return sendCartJson(res, {
                    status: 409,
                    success: false,
                    message,
                    cart: ensureCart(req.session)
                });
            }

            req.flash('error', message);
            return res.redirect(`/product/${productId}`);
        }

        const cart = ensureCart(req.session);
        const existingItemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId.toString()
        );

        if (existingItemIndex > -1) {
            const currentQty = Math.max(0, parseInt(cart.items[existingItemIndex].quantity, 10) || 0);
            const newQty = currentQty + requestedQuantity;

            if (newQty > availableStock) {
                const message = `Cannot add more - only ${availableStock} item(s) available in total.`;

                if (prefersJson) {
                    return sendCartJson(res, {
                        status: 409,
                        success: false,
                        message,
                        cart
                    });
                }

                req.flash('error', message);
                return res.redirect(`/product/${productId}`);
            }

            cart.items[existingItemIndex].quantity = newQty;
            cart.items[existingItemIndex].price = product.price;
            cart.items[existingItemIndex].name = product.name;
            cart.items[existingItemIndex].imageUrl = product.imageUrl || '';
            cart.items[existingItemIndex].category = product.category;
        } else {
            cart.items.push({
                productId: product._id.toString(),
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl || '',
                quantity: requestedQuantity,
                category: product.category
            });
        }

        const totals = calculateTotals(cart.items);
        cart.totalQty = totals.totalQty;
        cart.totalPrice = Number(totals.totalPrice.toFixed(2));

        if (prefersJson) {
            return sendCartJson(res, {
                success: true,
                message: `${product.name} added to cart.`,
                cart,
                productId
            });
        }

        req.flash('success', `${product.name} (${requestedQuantity}) added to cart!`);
        return redirectToCheckoutOrCart(req, res);
    } catch (err) {
        return next(err);
    }
};

// ─── POST /cart/update - Update Item Quantity ──────────────────────────────────
/**
 * Update quantity of cart item (increase/decrease)
 * - Validates product availability
 * - Removes item if quantity reaches 0
 * - Updates product price if changed since add
 */
exports.updateItemQuantity = async (req, res, next) => {
    try {
        const { productId, action } = req.body;
        const cart = ensureCart(req.session);
        const prefersJson = wantsJson(req);

        if (!productId) {
            if (prefersJson) {
                return sendCartJson(res, {
                    status: 400,
                    success: false,
                    message: 'Invalid product.',
                    cart
                });
            }

            return res.redirect('/cart');
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId.toString()
        );

        if (itemIndex === -1) {
            if (prefersJson) {
                return sendCartJson(res, {
                    status: 404,
                    success: false,
                    message: 'That item is no longer in your cart.',
                    cart
                });
            }

            req.flash('error', 'That item is no longer in your cart.');
            return res.redirect('/cart');
        }

        const cartItem = cart.items[itemIndex];
        const product = await Product.findById(productId).lean();

        if (!product || !product.active) {
            const removedName = cartItem.name;
            cart.items.splice(itemIndex, 1);

            const totals = calculateTotals(cart.items);
            cart.totalQty = totals.totalQty;
            cart.totalPrice = Number(totals.totalPrice.toFixed(2));

            if (prefersJson) {
                return sendCartJson(res, {
                    status: 410,
                    success: false,
                    message: `"${removedName}" is no longer available and was removed from your cart.`,
                    cart,
                    removedProductId: productId
                });
            }

            req.flash('error', `"${removedName}" is no longer available and was removed from your cart.`);
            return res.redirect('/cart');
        }

        if (action === 'increase') {
            if (cartItem.quantity >= product.stock) {
                if (prefersJson) {
                    return sendCartJson(res, {
                        status: 409,
                        success: false,
                        message: `Only ${product.stock} item(s) of "${product.name}" are available.`,
                        cart,
                        productId
                    });
                }

                req.flash('error', `Only ${product.stock} item(s) of "${product.name}" are available.`);
                return res.redirect('/cart');
            }

            cartItem.quantity += 1;
        } else if (action === 'decrease') {
            cartItem.quantity -= 1;

            if (cartItem.quantity <= 0) {
                cart.items.splice(itemIndex, 1);

                if (!prefersJson) {
                    req.flash('success', `"${product.name}" removed from your bag.`);
                }
            }
        } else if (prefersJson) {
            return sendCartJson(res, {
                status: 400,
                success: false,
                message: 'Invalid cart action.',
                cart,
                productId
            });
        }

        const updatedItem = cart.items.find(
            (item) => item.productId.toString() === productId.toString()
        );

        if (updatedItem) {
            updatedItem.price = product.price;
            updatedItem.name = product.name;
            updatedItem.imageUrl = product.imageUrl || '';
            updatedItem.category = product.category;
        }

        const totals = calculateTotals(cart.items);
        cart.totalQty = totals.totalQty;
        cart.totalPrice = Number(totals.totalPrice.toFixed(2));

        if (prefersJson) {
            const itemStillExists = cart.items.some(
                (item) => item.productId.toString() === productId.toString()
            );

            return sendCartJson(res, {
                success: true,
                message: itemStillExists ? 'Cart updated.' : `"${product.name}" removed from your bag.`,
                cart,
                productId: itemStillExists ? productId : null,
                removedProductId: itemStillExists ? null : productId
            });
        }

        return res.redirect('/cart');
    } catch (err) {
        return next(err);
    }
};

// ─── POST /cart/remove - Remove Item from Cart ─────────────────────────────────
/**
 * Remove product from cart completely
 * - Supports both route params and request body
 * - Handles JSON and form submissions
 */
exports.removeItemFromCart = (req, res, next) => {
    try {
        const productId = req.params.id || req.body.productId;
        const cart = ensureCart(req.session);
        const prefersJson = wantsJson(req);

        if (!productId) {
            if (prefersJson) {
                return sendCartJson(res, {
                    status: 400,
                    success: false,
                    message: 'Invalid product.',
                    cart
                });
            }

            req.flash('error', 'Invalid product.');
            return res.redirect('/cart');
        }

        const initialCount = cart.items.length;
        const removedItem = cart.items.find(item => item.productId.toString() === productId.toString());
        
        cart.items = cart.items.filter(
            (item) => item.productId.toString() !== productId.toString()
        );
        const itemWasRemoved = cart.items.length < initialCount;

        const totals = calculateTotals(cart.items);
        cart.totalQty = totals.totalQty;
        cart.totalPrice = Number(totals.totalPrice.toFixed(2));

        if (prefersJson) {
            return sendCartJson(res, {
                success: true,
                message: itemWasRemoved ? 'Item removed from your bag.' : 'Cart updated.',
                cart,
                removedProductId: itemWasRemoved ? productId : null
            });
        }

        if (itemWasRemoved) {
            req.flash('success', `"${removedItem?.name || 'Item'}" removed from your bag.`);
        }

        return res.redirect('/cart');
    } catch (err) {
        return next(err);
    }
};
