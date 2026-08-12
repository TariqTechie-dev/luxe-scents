# Luxe Scents – Online Perfume Store

Luxe Scents is a full-stack web-based perfume e-commerce platform built with Node.js, Express.js, MongoDB, Mongoose, and EJS. The platform allows customers to browse perfumes, manage their cart and wishlist, place orders, and submit product reviews. It also provides an admin dashboard for managing products, orders, customers, and analytics.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- EJS (Templating Engine)
- Tailwind CSS
- HTML
- CSS
- JavaScript

## Main Features

### Customer Features

- User registration and login
- Secure password hashing
- Browse and search perfumes
- Product details and perfume notes
- Shopping cart management
- Wishlist management
- Checkout and order placement
- Order history and order cancellation
- Product reviews and ratings

### Admin Features

- Admin authentication and authorization
- Product management
- Product activation/deactivation
- Order management
- Customer management
- Customer CSV export
- Sales and order analytics

## Security

The application includes several security mechanisms:

- Password hashing with bcryptjs
- Session management with express-session
- MongoDB-backed session storage with connect-mongo
- CSRF protection
- Helmet security headers
- Rate limiting
- Input validation
- Role-based authorization
- Ownership checks for orders and reviews

## Project Structure

```text
/
├── config/
│   └── Database configuration
├── controllers/
│   └── Application business logic
├── middleware/
│   └── Authentication, authorization, validation, and security middleware
├── models/
│   └── Mongoose models
├── routes/
│   └── Express route definitions
├── utils/
│   └── Reusable utility functions
├── views/
│   └── EJS templates and page views
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── server.js
└── seed.js