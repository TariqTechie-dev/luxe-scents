const mongoose = require('mongoose');

const normalizeWhitespace = (value) => {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
};

const trimToUndefined = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
};

const roundCurrency = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : value;
};

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Ordered product reference is required']
    },
    name: {
        type: String,
        required: [true, 'Ordered product name is required'],
        trim: true,
        set: normalizeWhitespace,
        minlength: [2, 'Ordered product name must be at least 2 characters'],
        maxlength: [160, 'Ordered product name cannot exceed 160 characters']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        validate: {
            validator: Number.isInteger,
            message: 'Quantity must be a whole number.'
        }
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        set: roundCurrency
    }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: [true, 'Street is required'],
        trim: true,
        set: normalizeWhitespace,
        maxlength: [120, 'Street cannot exceed 120 characters']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        set: normalizeWhitespace,
        maxlength: [80, 'City cannot exceed 80 characters']
    },
    state: {
        type: String,
        trim: true,
        set: trimToUndefined,
        maxlength: [80, 'State cannot exceed 80 characters']
    },
    zip: {
        type: String,
        required: [true, 'ZIP or postal code is required'],
        trim: true,
        set: normalizeWhitespace,
        maxlength: [20, 'ZIP or postal code cannot exceed 20 characters']
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        set: normalizeWhitespace,
        maxlength: [80, 'Country cannot exceed 80 characters']
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Order must belong to a user']
    },
    items: {
        type: [orderItemSchema],
        validate: {
            validator: (items) => Array.isArray(items) && items.length > 0,
            message: 'An order must contain at least one item.'
        }
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total cannot be negative'],
        set: roundCurrency
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Refunded'],
        default: 'Pending'
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: [true, 'Shipping address is required']
    }
}, { timestamps: true });

orderSchema.pre('validate', function () {
    if (!Array.isArray(this.items) || !this.items.length) {
        return;
    }

    const computedTotal = this.items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        const price = Number(item.price);

        if (!Number.isFinite(quantity) || !Number.isFinite(price)) {
            return sum;
        }

        return sum + (quantity * price);
    }, 0);

    this.totalAmount = roundCurrency(computedTotal);
});

// Indexes for order queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
