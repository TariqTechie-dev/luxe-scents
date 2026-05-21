const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const PASSWORD_REQUIREMENTS = 'Password must be 12-128 characters and include uppercase, lowercase, number, and special character.';

// Logout rate limiter
const logoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // max 5 logout attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many logout attempts, please try again later.'
});

const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email.')
        .bail()
        .normalizeEmail(),
    body('password')
        .isString()
        .withMessage('Password is required.')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Password is required.')
];

const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 80 })
        .withMessage('Name must be between 2 and 80 characters.')
        .bail()
        .matches(/^[a-zA-Z\s'.-]+$/)
        .withMessage('Name contains invalid characters.')
        .escape(),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email.')
        .bail()
        .normalizeEmail(),
    body('password')
        .isString()
        .withMessage('Password is required.')
        .bail()
        .isLength({ min: 12, max: 128 })
        .withMessage(PASSWORD_REQUIREMENTS)
        .bail()
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])\S{12,128}$/)
        .withMessage(PASSWORD_REQUIREMENTS),
    body('confirmPassword')
        .isString()
        .withMessage('Please confirm your password.')
        .bail()
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match.')
];

router.get('/login', authController.getLoginPage);
router.post('/login', loginValidation, authController.postLogin);

router.get('/register', authController.getRegisterPage);
router.post('/register', registerValidation, authController.postRegister);

router.post('/logout', logoutLimiter, authController.postLogout);

module.exports = router;
