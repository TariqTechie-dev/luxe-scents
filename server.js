const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars FIRST before anything else
dotenv.config();

const DB_URL = process.env.DB_URL || process.env.MONGO_URI;

// Crash early if critical env vars are missing
if (!process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET is not defined in .env');
  process.exit(1);
}
if (!DB_URL) {
  console.error('FATAL ERROR: DB_URL or MONGO_URI is not defined in .env');
  process.exit(1);
}

// Connect to database
connectDB(DB_URL);

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Security Headers (Helmet) ───────────────────────────────────────────────
const helmet = require('helmet');
const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' })
  ]
});

app.use(helmet({
  contentSecurityPolicy: false // Disable for now to allow CDN Tailwind/Fonts
}));

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
// const morgan = require('morgan');
// app.use(morgan(IS_PROD ? 'combined' : 'dev'));

// ─── Compression ─────────────────────────────────────────────────────────────
const compression = require('compression');
app.use(compression());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const rateLimit = require('express-rate-limit');
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again after 15 minutes.'
});
app.use(globalLimiter);

// ─── View Engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Global App Locals (available in every EJS template) ─────────────────────
app.locals.siteName = 'Luxe Scents';

// ─── Static Files with Cache Headers ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: IS_PROD ? '7d' : 0,
  immutable: IS_PROD, // Tells browser: don't re-validate, file hasn't changed
  etag: true
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── Session ──────────────────────────────────────────────────────────────────
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: DB_URL, touchAfter: 60 }),
  cookie: {
    maxAge: 180 * 60 * 1000, // 3 hours
    httpOnly: true,           // Not accessible via JS — prevents XSS cookie theft
    secure: process.env.SESSION_COOKIE_SECURE === 'true', // Explicit env var control
    sameSite: 'lax'           // CSRF protection
  },
  name: 'sid'                   // Don't use default 'connect.sid' name
}));

// ─── Flash Messages ───────────────────────────────────────────────────────────
const flash = require('connect-flash');
app.use(flash());

// ─── CSRF Protection (csrf-csrf — double-submit cookie) ──────────────────────
const cookieParser = require('cookie-parser');
const { doubleCsrf } = require('csrf-csrf');

const csrfSecret = process.env.CSRF_SECRET || process.env.SESSION_SECRET;
app.use(cookieParser(csrfSecret));

const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => csrfSecret,
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/'
  },
  size: 64,
  getTokenFromRequest: (req) => req.body?._csrf || req.headers['x-csrf-token']
});
app.use(doubleCsrfProtection);

// ─── Global Template Variables ────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.csrfToken = generateToken(req, res);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/authRoutes');
const viewRoutes     = require('./routes/viewRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const cartRoutes     = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes   = require('./routes/reviewRoutes');

// Apply stricter rate limiting to auth endpoints
app.use('/login', authLimiter);
app.use('/register', authLimiter);

app.use('/', authRoutes);
app.use('/', viewRoutes);
app.use('/', reviewRoutes);
app.use('/', checkoutRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/cart', cartRoutes);
app.use('/wishlist', wishlistRoutes);

// ─── Health Check (protected) ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const healthToken = process.env.HEALTH_TOKEN || 'change-me';
app.get('/health', (req, res) => {
  // Require a secret token in the X-Health-Token header
  const token = req.headers['x-health-token'];
  if (token !== healthToken) {
    return res.status(403).json({ status: 'forbidden', message: 'Invalid health check token' });
  }
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('errors/404', { title: '404 — Not Found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Handle CSRF token errors
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('errors/403', {
      title: '403 — Forbidden',
      message: 'Invalid form submission. Please refresh the page and try again.'
    });
  }

  // Log error details to file (avoid leaking stack traces in production)
  if (!IS_PROD) {
    console.error(`[${new Date().toISOString()}] ERROR:`, err.stack || err.message);
  }
  logger.error('Unhandled error', { message: err.message, stack: err.stack, timestamp: new Date().toISOString() });

  const statusCode = err.statusCode || 500;
  const message = IS_PROD ? 'Something went wrong. Please try again later.' : err.message;

  res.status(statusCode).render('errors/500', { title: 'Server Error', message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
