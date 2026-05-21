const mongoose = require('mongoose');
const SKU_REGEX = /^[A-Z0-9_-]+$/;
const PRODUCT_CATEGORIES = ['Floral', 'Woody', 'Citrus', 'Amber', 'Aquatic', 'Gourmand', 'Other'];

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

const normalizeStringList = (value) => {
    const rawItems = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(',')
            : [];

    return rawItems
        .map((item) => normalizeWhitespace(item))
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
};

const normalizeSku = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    return value.trim().toUpperCase();
};

const isValidHttpUrl = (value) => {
    if (!value) {
        return true;
    }

    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (error) {
        return false;
    }
};

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        set: normalizeWhitespace,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [120, 'Name cannot exceed 120 characters']
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        uppercase: true,
        trim: true,
        set: normalizeSku,
        maxlength: [50, 'SKU cannot exceed 50 characters'],
        match: [SKU_REGEX, 'SKU may only contain letters, numbers, hyphens, and underscores.']
    },
    description: {
        type: String,
        trim: true,
        set: trimToUndefined,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    topNotes: {
        type: [String],
        set: normalizeStringList,
        default: []
    },
    heartNotes: {
        type: [String],
        set: normalizeStringList,
        default: []
    },
    baseNotes: {
        type: [String],
        set: normalizeStringList,
        default: []
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Stock cannot be negative'],
        validate: {
            validator: Number.isInteger,
            message: 'Stock must be a whole number.'
        }
    },
    category: {
        type: String,
        enum: PRODUCT_CATEGORIES,
        default: 'Other'
    },
    imageUrl: {
        type: String,
        set: trimToUndefined,
        validate: {
            validator: isValidHttpUrl,
            message: 'imageUrl must be a valid URL starting with http:// or https://'
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    averageRating: {
        type: Number,
        default: 0,
        min: [0, 'Average rating cannot be negative'],
        max: [5, 'Average rating cannot exceed 5']
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: [0, 'Review count cannot be negative'],
        validate: {
            validator: Number.isInteger,
            message: 'Review count must be a whole number.'
        }
    }
}, { timestamps: true });

// Indexes for frequently queried fields
productSchema.index({ active: 1, createdAt: -1 });
productSchema.index({ category: 1, active: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
