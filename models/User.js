const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{12,128}$/;
const PASSWORD_REQUIREMENTS = 'Password must be 12-128 characters and include uppercase, lowercase, number, and special character.';

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

const normalizeEmail = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    return value.trim().toLowerCase();
};

const isStoredPasswordHash = (value) => {
    return typeof value === 'string' && BCRYPT_HASH_REGEX.test(value);
};

const isStrongPlaintextPassword = (value) => {
    return typeof value === 'string' && PASSWORD_COMPLEXITY_REGEX.test(value);
};

const hashPassword = async (value) => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(value, salt);
};

const extractPasswordUpdate = (update) => {
    if (!update || typeof update !== 'object') {
        return null;
    }

    if (Object.prototype.hasOwnProperty.call(update, 'password')) {
        return { container: update, key: 'password' };
    }

    if (update.$set && Object.prototype.hasOwnProperty.call(update.$set, 'password')) {
        return { container: update.$set, key: 'password' };
    }

    return null;
};

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        set: normalizeWhitespace,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [80, 'Name cannot exceed 80 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        set: normalizeEmail,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        select: false,
        required: [true, 'Password is required'],
        minlength: [12, 'Password must be at least 12 characters'],
        maxlength: [128, 'Password cannot exceed 128 characters'],
        validate: {
            validator: (value) => isStoredPasswordHash(value) || isStrongPlaintextPassword(value),
            message: PASSWORD_REQUIREMENTS
        }
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    phone: {
        type: String,
        trim: true,
        set: trimToUndefined,
        maxlength: [30, 'Phone number cannot exceed 30 characters']
    },
    address: {
        street: {
            type: String,
            trim: true,
            set: trimToUndefined,
            maxlength: [120, 'Street cannot exceed 120 characters']
        },
        city: {
            type: String,
            trim: true,
            set: trimToUndefined,
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
            trim: true,
            set: trimToUndefined,
            maxlength: [20, 'ZIP code cannot exceed 20 characters']
        },
        country: {
            type: String,
            trim: true,
            set: trimToUndefined,
            maxlength: [80, 'Country cannot exceed 80 characters']
        }
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    if (typeof this.password !== 'string') {
        throw new Error('Password must be a string.');
    }

    this.password = this.password.trim();

    if (!this.password) {
        throw new Error('Password must be a non-empty string.');
    }

    if (isStoredPasswordHash(this.password)) {
        return;
    }

    try {
        this.password = await hashPassword(this.password);
    } catch (error) {
        throw new Error('Failed to hash password before saving user.');
    }
});

async function hashPasswordInUpdate() {
    const update = this.getUpdate();
    const passwordUpdate = extractPasswordUpdate(update);

    if (!passwordUpdate) {
        return;
    }

    const rawPassword = passwordUpdate.container[passwordUpdate.key];

    if (typeof rawPassword !== 'string') {
        throw new Error('Password must be a string.');
    }

    const trimmedPassword = rawPassword.trim();
    if (!trimmedPassword) {
        throw new Error('Password must be a non-empty string.');
    }

    if (isStoredPasswordHash(trimmedPassword)) {
        passwordUpdate.container[passwordUpdate.key] = trimmedPassword;
        return;
    }

    if (!isStrongPlaintextPassword(trimmedPassword)) {
        throw new Error(PASSWORD_REQUIREMENTS);
    }

    passwordUpdate.container[passwordUpdate.key] = await hashPassword(trimmedPassword);
    this.setUpdate(update);
    this.setOptions({ runValidators: true, context: 'query' });
}

userSchema.pre('findOneAndUpdate', hashPasswordInUpdate);
userSchema.pre('updateOne', hashPasswordInUpdate);
userSchema.pre('updateMany', hashPasswordInUpdate);
userSchema.pre('update', hashPasswordInUpdate);

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (typeof candidatePassword !== 'string' || !candidatePassword) {
        return false;
    }

    if (!isStoredPasswordHash(this.password)) {
        return false;
    }

    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// ─── Indexes ──────────────────────────────────────────────────────────────────
// email already indexed via unique:true above
userSchema.index({ role: 1 });              // Fast filtering by role (admin/customer)
userSchema.index({ createdAt: -1 });        // Fast sorting in admin user listings

module.exports = mongoose.model('User', userSchema);
