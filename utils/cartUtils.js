/**
 * Cart Utility Functions
 */

const EMPTY_CART = Object.freeze({
    items: [],
    totalQty: 0,
    totalPrice: 0
});

/**
 * Returns a fresh empty cart object.
 * @returns {{ items: Array, totalQty: number, totalPrice: number }}
 */
exports.createEmptyCart = () => ({
    items: [],
    totalQty: 0,
    totalPrice: 0
});

/**
 * Ensures a valid cart object exists on the session.
 * Repairs malformed cart data defensively.
 * @param {import('express-session').Session & { cart?: any }} session
 * @returns {{ items: Array, totalQty: number, totalPrice: number }}
 */
exports.ensureCart = (session) => {
    if (!session || typeof session !== 'object') {
        return exports.createEmptyCart();
    }

    const items = Array.isArray(session.cart && session.cart.items) ? session.cart.items : [];
    session.cart = {
        items,
        totalQty: Number.isFinite(session.cart && session.cart.totalQty) ? session.cart.totalQty : 0,
        totalPrice: Number.isFinite(session.cart && session.cart.totalPrice) ? session.cart.totalPrice : 0
    };

    return exports.normalizeCart(session.cart);
};

/**
 * Recalculates totalQty and totalPrice from the cart items array.
 * Returns a new totals object — does NOT mutate the cart.
 * @param {Array} items - Cart items array
 * @returns {{ totalQty: number, totalPrice: number }}
 */
exports.calculateTotals = (items = []) => {
    return items.reduce(
        (acc, item) => {
            const quantity = Math.max(0, parseInt(item.quantity, 10) || 0);
            const price = Number(item.price) || 0;

            acc.totalQty += quantity;
            acc.totalPrice += price * quantity;
            return acc;
        },
        { totalQty: 0, totalPrice: 0 }
    );
};

/**
 * Normalizes cart items and totals, removing invalid entries.
 * Mutates and returns the provided cart object.
 * @param {{ items?: Array, totalQty?: number, totalPrice?: number }} cart
 * @returns {{ items: Array, totalQty: number, totalPrice: number }}
 */
exports.normalizeCart = (cart) => {
    if (!cart || typeof cart !== 'object') {
        return exports.createEmptyCart();
    }

    const items = Array.isArray(cart.items) ? cart.items : [];
    cart.items = items
        .map((item) => {
            const productId = item && item.productId ? item.productId.toString() : '';
            const name = item && typeof item.name === 'string' ? item.name : '';
            const category = item && typeof item.category === 'string' ? item.category : '';
            const imageUrl = item && typeof item.imageUrl === 'string' ? item.imageUrl : '';
            const price = Number(item && item.price);
            const quantity = parseInt(item && item.quantity, 10);

            if (!productId || !name || !Number.isFinite(price) || price < 0 || !Number.isFinite(quantity) || quantity < 1) {
                return null;
            }

            return {
                productId,
                name,
                price,
                imageUrl,
                quantity,
                category
            };
        })
        .filter(Boolean);

    const totals = exports.calculateTotals(cart.items);
    cart.totalQty = totals.totalQty;
    cart.totalPrice = Number(totals.totalPrice.toFixed(2));

    return cart;
};

/**
 * Clears the session cart.
 * @param {import('express-session').Session & { cart?: any }} session
 * @returns {{ items: Array, totalQty: number, totalPrice: number }}
 */
exports.clearCart = (session) => {
    if (!session || typeof session !== 'object') {
        return exports.createEmptyCart();
    }

    session.cart = exports.createEmptyCart();
    return session.cart;
};

exports.EMPTY_CART = EMPTY_CART;