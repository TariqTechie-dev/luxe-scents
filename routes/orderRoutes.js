const express = require('express');
const router  = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const orderController = require('../controllers/orderController');

// ─── Routes ───────────────────────────────────────────────────────────────────
// GET /orders       →  list all user orders
router.get('/',    isAuthenticated, orderController.getOrderHistory);

// POST /orders/:id/cancel -> cancel a pending user order
router.post('/:id/cancel', isAuthenticated, orderController.cancelOrder);

// GET /orders/:id   →  single order detail
router.get('/:id', isAuthenticated, orderController.getOrderDetail);

module.exports = router;
