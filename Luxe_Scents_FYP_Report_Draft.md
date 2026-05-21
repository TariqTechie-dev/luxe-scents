# Luxe Scents Final Year Project Report Draft

Formatting instructions for Word:

- Font: Times New Roman, 12 pt for body text.
- Use built-in Heading 1 for chapter titles, Heading 2 for main sections, and Heading 3 for subsections.
- Insert captions through References > Insert Caption so that chapter-based numbering is generated automatically.
- Update Table of Contents, List of Figures, and List of Tables by pressing Ctrl + A, then F9 in Microsoft Word.
- Hard binding note from the provided template: binding color should be green and title fonts on binding should be golden.

---

# Preliminary Pages

## Title Page

Luxe Scents: A Full-Stack JavaScript Based Premium Perfume E-Commerce Platform

[Student Name: Tariq Hussain]

[Student ID]

Bachelor of Science in Computer Science

Session [20XX-XX]

Department of Computer Science

Govt. Postgraduate College Dargai

Affiliated with University of Malakand

Khyber Pakhtunkhwa, Pakistan

## Submission Page

Luxe Scents: A Full-Stack JavaScript Based Premium Perfume E-Commerce Platform

This project report is submitted in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science to the Department of Computer Science, Govt. Postgraduate College Dargai, affiliated with University of Malakand.

Submitted by: [Tariq Hussain]

Supervisor: [Supervisor Name]

Chairman Department of Computer Science: [Chairman Name]

Submission Date: [May 2026]

## Certificate of Approval

It is certified that we have studied this project report submitted by [Tariq Hussain] in detail. We conclude that this report is of sufficient standard to warrant its acceptance by the Department of Computer Science for the award of the degree of BS in Computer Science.

Supervisor

Signature:

Name:

Designation:

External Examiner

Signature:

Name:

Designation:

Institute:

Chairman Department of Computer Science

Signature:

Name:

## Dedication

Dedicated to my dear parents and family, whose support, patience, and encouragement made this work possible.

## Acknowledgements

All praise is due to Allah Almighty, who granted me the ability, strength, and determination to complete this final year project. I am deeply thankful to my supervisor, [Supervisor Name], for guidance, technical feedback, and academic support during the development and documentation of this project. I am also thankful to the Department of Computer Science, Govt. Postgraduate College Dargai, affiliated with University of Malakand, for providing an academic environment that encouraged practical learning and project-based development.

I also express my gratitude to my parents, family members, classmates, and friends for their continuous encouragement throughout the project. Their support helped me complete both the software implementation and the report writing phases of Luxe Scents.

## List of Abbreviations and Acronyms

| Abbreviation | Description |
| --- | --- |
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| CSRF | Cross-Site Request Forgery |
| DB | Database |
| EJS | Embedded JavaScript Templates |
| ERD | Entity Relationship Diagram |
| MVC | Model View Controller |
| NoSQL | Not Only SQL |
| RBAC | Role-Based Access Control |
| UI | User Interface |
| UX | User Experience |

## List of Figures

Figure 1.1: Luxe Scents Home Page

Figure 2.1: System Context Diagram

Figure 3.1: Entity Relationship Diagram

Figure 3.2: Use Case Diagram

Figure 4.1: Product Detail and Review Interface

Figure 4.2: User Dashboard and Pending Order Cancellation

Figure 4.3: Admin Product Management Dashboard

Figure 4.4: Admin Analytics Dashboard

## List of Tables

Table 2.1: Functional Requirements

Table 2.2: Non-Functional Requirements

Table 3.1: Database Collections

Table 5.1: Test Cases

---

# Chapter 1: Introduction

## 1.1 Introduction

Luxe Scents is a premium perfume e-commerce platform developed as a final year project for BS Computer Science. The system provides a digital store where fragrance buyers can browse perfumes, view scent notes, manage a shopping cart, place orders, maintain wishlists, and write product reviews. The administrative side of the system allows product management, order management, customer monitoring, and sales analytics.

The analyzed source code shows a full-stack JavaScript web application built with Node.js, Express.js, MongoDB, Mongoose, EJS templates, Tailwind CSS, and client-side JavaScript. The project follows a MERN-aligned architecture in the sense that it uses MongoDB, Express.js, and Node.js as its main backend stack. However, the current implementation uses EJS templates instead of a React single-page frontend. Therefore, this report describes the implemented system objectively as a MongoDB, Express.js, Node.js, EJS, and Tailwind based full-stack web application.

[Insert Screenshot of Luxe Scents Home Page]

## 1.2 Background

Online shopping has become an important part of modern retail. However, perfume purchasing is different from ordinary product buying because customers cannot physically smell a fragrance before making a decision. A buyer usually needs reliable information about fragrance category, price, availability, scent notes, customer reviews, and overall product quality. Without a structured digital platform, customers may face difficulty comparing perfumes, tracking orders, and trusting product information.

Luxe Scents addresses this problem by presenting perfumes with organized product details such as top notes, heart notes, base notes, category, stock status, average rating, and reviews. The system also includes customer account features, order history, wishlist management, and an admin dashboard for operational control.

## 1.3 Problem Statement

Traditional perfume buying depends heavily on physical store visits and salesperson guidance. In an online environment, fragrance buyers often face the following problems:

- Lack of structured perfume information such as scent notes, category, and review history.
- Difficulty maintaining a personal list of desired perfumes.
- Limited confidence in product quality without customer feedback.
- Lack of convenient order tracking and cancellation options.
- Manual and inefficient product and order management for store administrators.

The problem addressed by this project is to design and implement a secure, usable, and database-driven web platform that supports perfume discovery, online ordering, review sharing, and administrative management.

## 1.4 Proposed Solution

The proposed solution is Luxe Scents, a premium perfume e-commerce platform that supports both customer and administrator workflows. Customers can register, log in, browse the perfume collection, search products, view detailed fragrance profiles, add products to cart, save products to wishlist, place orders, cancel pending orders, and submit product reviews. Administrators can create, update, deactivate, and delete products, manage orders and payment status, view customers, export customer data, and review analytics.

The solution uses MongoDB as the database, Express.js as the web framework, Mongoose as the object data modeling layer, EJS templates for server-side rendering, Tailwind CSS for responsive styling, and JavaScript for interactive browser features.

## 1.5 Objectives

The major objectives of Luxe Scents are:

- To provide a professional online perfume store interface for fragrance buyers.
- To allow customers to browse, search, and inspect perfume details before purchase.
- To implement secure user registration, login, logout, and session handling.
- To support cart, checkout, wishlist, order history, and order cancellation workflows.
- To allow authenticated users to add reviews and delete only their own reviews.
- To provide administrators with product, order, customer, and analytics management.
- To maintain data integrity through schema validation, ownership checks, and role-based access.
- To apply security measures including password hashing, CSRF protection, rate limiting, and secure session cookies.

## 1.6 Scope of the Project

The scope of Luxe Scents includes the following customer-facing modules:

- User registration and login.
- Product listing, product search, and product detail pages.
- Fragrance notes display using top notes, heart notes, and base notes.
- Session-based shopping cart.
- Secure checkout and order creation.
- Customer dashboard and order history.
- Pending order cancellation by the order owner.
- Wishlist add and remove functionality.
- Product review submission, listing, pagination, and author-only deletion.

The administrative scope includes:

- Product listing with pagination.
- Product creation, editing, activation/deactivation, and deletion.
- Protection against deleting products already referenced in orders.
- Order listing, searching, filtering, and status management.
- Payment status management.
- Customer directory, customer details, segmentation, and CSV export.
- Analytics for total orders, revenue, pending orders, and top-selling products.

The project does not currently include real payment gateway integration, courier shipment tracking, email notifications, product image upload storage, or a React-based single-page application frontend. These features are identified as future enhancements.

## 1.7 Project Methodology

The project was developed using an iterative methodology. First, the major entities such as users, products, orders, and reviews were identified. After that, database models were created using Mongoose. The backend was divided into routes, controllers, models, middleware, and utility files to follow the MVC pattern. EJS views were then created for customer pages, checkout pages, admin pages, and error pages. Finally, interactive features such as password toggling, cart updates, review submission, and review deletion were added using client-side JavaScript.

## 1.8 Organization of the Report

Chapter 1 introduces the project, its background, problem statement, objectives, and scope. Chapter 2 presents analysis, including requirement analysis and feasibility. Chapter 3 explains the logical design, database schema, ERD description, and use case description. Chapter 4 presents the physical design, UI/UX design, architecture, and implementation details. Chapter 5 describes testing and test cases. Chapter 6 concludes the report and presents future work.

---

# Chapter 2: Analysis

## 2.1 Introduction

The analysis phase identifies what the system must do and what quality attributes it must satisfy. Luxe Scents has two major user groups: customers and administrators. Customers require a smooth shopping experience, while administrators require reliable operational control over products, orders, customers, and analytics.

## 2.2 Existing System Analysis

In a manual perfume store, the customer physically visits the store, asks about available perfumes, compares prices, and purchases directly. This approach limits customer reach and does not provide an organized digital record of wishlists, reviews, order history, or customer behavior. Administrators also need to update stock and manage orders manually.

An unstructured online approach may show products but still fail to provide secure checkout, authentication, review ownership, product validation, and order status control. Luxe Scents improves this situation by implementing a structured database-backed system with security controls and role-based access.

## 2.3 Stakeholders

The primary stakeholders are:

- Customers: users who browse products, add items to cart or wishlist, place orders, and submit reviews.
- Administrators: authorized users who manage products, orders, customers, and analytics.
- Project Supervisor: academic evaluator who reviews the technical and documentation quality.
- Department: academic body that evaluates the project as a final year requirement.

## 2.4 Functional Requirements

Table 2.1: Functional Requirements

| ID | Requirement | Description | Code Evidence |
| --- | --- | --- | --- |
| FR-01 | User registration | The system shall allow new customers to create accounts with name, email, password, and confirm password. | authRoutes.js, authController.js, User.js |
| FR-02 | User login | The system shall authenticate users using email and password. | authController.js |
| FR-03 | Logout | The system shall destroy the user session and clear authentication cookies. | authController.js |
| FR-04 | Product browsing | The system shall display active products with pagination. | viewRoutes.js |
| FR-05 | Product search | The system shall allow users to search products by name or description. | viewRoutes.js |
| FR-06 | Product detail | The system shall show product price, category, notes, stock, rating, and related products. | product_details_view.ejs |
| FR-07 | Shopping cart | The system shall allow add, update, and remove operations on cart items. | cartRoutes.js, cartController.js |
| FR-08 | Checkout | The system shall create an order from cart items after validating shipping data and stock. | checkoutRoutes.js, checkoutController.js |
| FR-09 | Order history | The system shall display a logged-in customer's orders. | orderRoutes.js, orderController.js |
| FR-10 | Order detail | The system shall allow a customer to view only his own order details. | orderController.js |
| FR-11 | Order cancellation | The system shall allow cancellation only for pending orders owned by the logged-in user. | orderController.js |
| FR-12 | Wishlist | The system shall allow authenticated customers to add and remove wishlist products. | wishlistRoutes.js |
| FR-13 | Product reviews | The system shall allow authenticated users to submit one review per product. | reviewRoutes.js, reviewController.js, Review.js |
| FR-14 | Review deletion | The system shall allow only the review author to delete a review. | reviewController.js |
| FR-15 | Admin product management | The system shall allow admins to add, edit, activate/deactivate, and delete products. | adminRoutes.js, adminProductController.js |
| FR-16 | Admin order management | The system shall allow admins to view, search, filter, and update order status and payment status. | adminOrderController.js |
| FR-17 | Admin customer management | The system shall allow admins to view customers, customer details, segments, and CSV export. | adminCustomerController.js |
| FR-18 | Admin analytics | The system shall show total orders, revenue, pending orders, and top products. | adminAnalyticsController.js |
| FR-19 | Error handling | The system shall render 403, 404, and 500 error pages. | server.js, views/errors |
| FR-20 | Health check | The system shall provide a protected health endpoint using a header token. | server.js |

## 2.5 Non-Functional Requirements

Table 2.2: Non-Functional Requirements

| ID | Requirement | Implementation in Luxe Scents |
| --- | --- | --- |
| NFR-01 | Security | Passwords are hashed using bcryptjs. Sessions use httpOnly cookies. CSRF protection is applied using csrf-csrf. Helmet and rate limiting are configured. |
| NFR-02 | Authentication | Protected routes use isAuthenticated middleware. |
| NFR-03 | Authorization | Admin routes use isAdmin middleware and customer resources are filtered by session user ID. |
| NFR-04 | Data integrity | Mongoose schemas enforce required fields, enum values, unique email, unique SKU, and one review per user per product. |
| NFR-05 | Performance | Product, user, order, and review indexes are defined. Pagination is used in shop, admin products, admin orders, and reviews. |
| NFR-06 | Reliability | Checkout deducts stock with conditional updates and rolls back deducted stock if order creation fails. |
| NFR-07 | Usability | Tailwind CSS and EJS views provide responsive layouts, dashboards, flash messages, and form feedback. |
| NFR-08 | Maintainability | The project is organized into models, controllers, routes, middleware, utilities, views, and public assets. |
| NFR-09 | Scalability | MongoDB aggregation and indexes support growing product, order, and review data. |
| NFR-10 | Privacy | Password fields are excluded by default from user queries using select: false. |

## 2.6 Hardware and Software Requirements

Software requirements:

- Operating System: Windows, Linux, or macOS.
- Runtime: Node.js.
- Database: MongoDB.
- Web Framework: Express.js.
- Object Data Modeling: Mongoose.
- Template Engine: EJS.
- Styling: Tailwind CSS and custom CSS.
- Client-side Scripting: JavaScript.
- Supporting libraries: bcryptjs, express-session, connect-mongo, csrf-csrf, helmet, express-rate-limit, connect-flash, compression, Chart.js, winston.

Minimum hardware requirements:

- Processor: Dual-core processor or higher.
- RAM: 4 GB minimum, 8 GB recommended.
- Storage: 1 GB free storage for source code, dependencies, and logs.
- Network: Required for database connection and CDN-hosted frontend assets during development.

## 2.7 Feasibility Analysis

Technical feasibility: The project is technically feasible because it uses widely adopted web technologies such as Node.js, Express.js, MongoDB, and Mongoose. The modular MVC structure makes the system understandable and extensible.

Operational feasibility: The platform supports practical workflows for customers and administrators. Customers can perform shopping activities, while administrators can manage products, orders, customers, and analytics through dedicated dashboards.

Economic feasibility: The project can be developed and deployed with open-source technologies. MongoDB, Node.js, Express.js, EJS, and Tailwind CSS reduce licensing cost.

Schedule feasibility: The project scope is suitable for a final year project because it includes core e-commerce features without requiring complex external integrations such as payment gateways, courier APIs, or warehouse systems.

---

# Chapter 3: Logical Design

## 3.1 Introduction

Logical design defines how the system is structured at the data and functional level. Luxe Scents uses MongoDB collections represented through Mongoose models. The major logical entities are User, Product, Order, and Review. These entities support customer accounts, perfume catalog data, checkout records, and product feedback.

## 3.2 Database Collections

Table 3.1: Database Collections

| Collection | Purpose |
| --- | --- |
| users | Stores customer and admin accounts, credentials, roles, addresses, and wishlist references. |
| products | Stores perfume data including SKU, price, stock, category, notes, image URL, active status, and rating statistics. |
| orders | Stores customer orders, embedded order items, total amount, order status, payment status, and shipping address. |
| reviews | Stores product reviews with product reference, user reference, rating, comment, and creation date. |

## 3.3 User Schema

The User model represents both customers and administrators. Important fields include name, email, password, role, phone, address, and wishlist. The role field supports two values: customer and admin. Passwords are not selected by default and are hashed before saving. The email field is unique, normalized to lowercase, and validated using an email pattern.

Key fields:

- name: required customer/admin name.
- email: unique account identifier.
- password: hashed password stored securely.
- role: customer or admin.
- phone: optional contact number.
- address: nested address fields such as street, city, state, zip, and country.
- wishlist: array of Product ObjectId references.

Logical relationship:

- One user can place many orders.
- One user can write many reviews.
- One user can save many products in the wishlist.

## 3.4 Product Schema

The Product model represents perfumes available in the store. Important fields include name, SKU, description, top notes, heart notes, base notes, price, stock, category, image URL, active status, average rating, and review count. The SKU is unique and normalized to uppercase. The category field uses predefined values such as Floral, Woody, Citrus, Amber, Aquatic, Gourmand, and Other.

Key fields:

- name: product name.
- sku: unique product code.
- description: perfume description.
- topNotes: opening fragrance notes.
- heartNotes: middle fragrance notes.
- baseNotes: lasting fragrance notes.
- price: product price.
- stock: available inventory quantity.
- category: perfume family/category.
- imageUrl: product image URL.
- active: determines whether the product appears in customer listings.
- averageRating: calculated average of product reviews.
- reviewCount: number of product reviews.

Logical relationship:

- One product can appear in many order items.
- One product can have many reviews.
- One product can be saved in many user wishlists.

## 3.5 Order Schema

The Order model represents a completed checkout transaction. Each order belongs to one user and contains one or more embedded order items. Each order item stores a product reference, product name, quantity, and price at the time of order. The model also stores total amount, status, payment status, and shipping address.

Key fields:

- user: reference to the user who placed the order.
- items: embedded list of purchased products.
- totalAmount: calculated total of all order items.
- status: Pending, Processing, Shipped, Delivered, or Cancelled.
- paymentStatus: Pending, Paid, or Refunded.
- shippingAddress: embedded address used for delivery.

Logical relationship:

- One user can place many orders.
- One order contains many order items.
- Each order item references one product.

The order schema recalculates totalAmount before validation to maintain financial consistency.

## 3.6 Review Schema

The Review model represents customer feedback about a product. It stores product reference, user reference, rating, comment, and created date. A unique compound index on product and user ensures that a customer can submit only one review for a specific product.

Key fields:

- product: reference to reviewed product.
- user: reference to review author.
- rating: numeric value from 1 to 5.
- comment: required review text.
- createdAt: date of review creation.

Logical relationship:

- One product can have many reviews.
- One user can write many reviews.
- One user can write only one review per product.

## 3.7 ERD Description

[Insert Entity Relationship Diagram]

Figure 3.1 should show the following entities and relationships:

- User entity with attributes userId, name, email, password, role, phone, address, wishlist, createdAt, and updatedAt.
- Product entity with attributes productId, name, sku, description, notes, price, stock, category, imageUrl, active, averageRating, reviewCount, createdAt, and updatedAt.
- Order entity with attributes orderId, userId, items, totalAmount, status, paymentStatus, shippingAddress, createdAt, and updatedAt.
- Review entity with attributes reviewId, productId, userId, rating, comment, and createdAt.

Cardinality:

- User 1 to many Order: one customer can place multiple orders.
- Order 1 to many OrderItem: one order contains one or more items.
- Product 1 to many OrderItem: one product can appear in many order items.
- User 1 to many Review: one user can write multiple reviews.
- Product 1 to many Review: one product can receive multiple reviews.
- User many to many Product through wishlist: many users can save many products.
- User and Product have a constrained relationship through Review: one user can review one product only once.

## 3.8 Use Case Diagram Description

[Insert Use Case Diagram]

Figure 3.2 should contain three actors: Guest, Customer, and Admin.

Guest use cases:

- Browse home page.
- View product collection.
- Search products.
- View product details.
- Register account.
- Login.

Customer use cases:

- Add product to cart.
- Update cart quantity.
- Remove cart item.
- Add product to wishlist.
- Remove product from wishlist.
- Checkout.
- View dashboard.
- View order history.
- View order detail.
- Cancel pending order.
- Submit product review.
- View reviews.
- Delete own review.
- Logout.

Admin use cases:

- Login.
- Manage products.
- Add product.
- Edit product.
- Activate or deactivate product.
- Delete product when it is not referenced in orders.
- Manage orders.
- Update order status.
- Update payment status.
- View customers.
- Export customer CSV.
- View analytics dashboard.
- Logout.

System-level use cases:

- Validate user input.
- Verify authentication and authorization.
- Protect forms using CSRF tokens.
- Hash passwords.
- Recalculate product review statistics.
- Update stock during checkout.

---

# Chapter 4: Physical Design

## 4.1 Introduction

Physical design explains how the logical design is implemented using actual technologies, folders, files, routes, controllers, views, and database operations. Luxe Scents is implemented as an Express.js web application using MongoDB and Mongoose. EJS templates generate the user interface, and static JavaScript files provide interactive behavior.

## 4.2 System Architecture

[Insert System Architecture Diagram]

The physical architecture contains the following layers:

- Client layer: Web browser rendering EJS-generated HTML, Tailwind CSS styling, and JavaScript interactions.
- Routing layer: Express route files such as authRoutes.js, viewRoutes.js, cartRoutes.js, checkoutRoutes.js, orderRoutes.js, reviewRoutes.js, wishlistRoutes.js, and adminRoutes.js.
- Controller layer: Controller files that implement business logic for authentication, cart, checkout, orders, reviews, products, customers, and analytics.
- Model layer: Mongoose models for User, Product, Order, and Review.
- Database layer: MongoDB stores application data and session data.
- Middleware layer: Authentication, admin authorization, CSRF protection, validation, session handling, and error handling.

## 4.3 Project Folder Structure

The project is organized as follows:

- config: database configuration.
- controllers: business logic for application modules.
- middlewares: authentication and role-based authorization middleware.
- models: Mongoose schemas for users, products, orders, and reviews.
- routes: Express route definitions.
- utils: reusable utilities such as cart calculations and async wrapping.
- views: EJS pages, partials, admin pages, user pages, checkout pages, and error pages.
- public: static CSS, JavaScript, images, and favicon.
- server.js: main application entry point.
- seed.js: development seed data script.

## 4.4 UI/UX Design

The interface follows a premium fragrance store style. The visual design uses a dark luxury theme with gold accent colors, product imagery, rounded panels, clear navigation, and responsive dashboards. The customer side focuses on perfume discovery and purchase flow, while the admin side focuses on data scanning, status control, and operational actions.

Major user interface screens:

- Home page with featured perfumes.
- Shop page with product listing and pagination.
- Product detail page with scent notes, price, stock, cart actions, wishlist, and reviews.
- Cart page for reviewing selected products.
- Checkout page for shipping information and final order submission.
- User dashboard showing account overview and recent orders.
- Order history and order detail pages.
- Wishlist page.
- Admin product management page.
- Admin order management page.
- Admin analytics dashboard.
- Admin customer directory.

[Insert Screenshot of Product Listing Page]

[Insert Screenshot of Product Detail and Review Section]

[Insert Screenshot of Cart Page]

[Insert Screenshot of Checkout Page]

[Insert Screenshot of User Dashboard]

[Insert Screenshot of Admin Dashboard]

## 4.5 Authentication and Session Implementation

Authentication is implemented through login and registration routes. User passwords are validated and hashed in the User model using bcryptjs. The login controller retrieves the user by email and selects the password field only when required for comparison. After successful login, the session is regenerated to reduce session fixation risk. The session stores userId, role, userName, and userEmail.

Sessions are managed by express-session and stored in MongoDB using connect-mongo. Cookies are configured with httpOnly and sameSite settings. The application also clears authentication and CSRF cookies during logout.

## 4.6 Password Toggling Implementation

Password visibility toggling is implemented in the public JavaScript file public/js/Eye Icon.js. The login page calls togglePassword(), while the registration page calls toggleField(inputId, iconId) for both password and confirm password fields.

The implementation changes the input type from password to text when the user clicks the visibility icon. When clicked again, the type changes back to password. The Material Symbols icon text changes between visibility and visibility_off. This feature improves usability because users can verify typed passwords while still keeping the default hidden password behavior.

[Insert Screenshot of Login Password Hidden State]

[Insert Screenshot of Login Password Visible State]

## 4.7 Cart and Checkout Implementation

The cart is session-based. The cart utility functions create, normalize, calculate, and clear cart data. The cart controller validates product availability before adding products. It also supports JSON responses for dynamic updates and form-based redirects for normal submissions.

During checkout, the checkout controller validates the shipping form and ensures that the cart is not empty. For each cart item, the system performs a conditional stock update using product ID, active status, and available stock. If stock is insufficient, the checkout process stops and redirects the user with an error message. If stock has already been deducted for earlier items and a later item fails, the system rolls back deducted stock. After successful order creation, the cart is cleared and the order success page is displayed.

## 4.8 Order Cancellation Implementation

Order cancellation is implemented through the POST /orders/:id/cancel route. The route is protected by isAuthenticated middleware. The user dashboard shows the Cancel button only when order.status is Pending. This improves the interface by hiding invalid actions from the customer.

The controller performs server-side validation to ensure correctness even if a user manually sends a request. It validates the order ID, finds the order by both _id and req.session.userId, checks that status is Pending, and then updates the order status to Cancelled. If the order does not belong to the user or is no longer pending, the system displays an error message.

This design prevents customers from cancelling orders that are already Processing, Shipped, Delivered, or Cancelled. It also prevents one customer from cancelling another customer's order.

[Insert Screenshot of Pending Order Cancel Button]

[Insert Screenshot of Cancelled Order Status]

## 4.9 Review System and User-Specific Deletion

The review system allows authenticated users to submit a rating and comment for a product. The Review model includes a unique compound index on product and user, which prevents duplicate reviews from the same user for the same product. The controller validates product ID, rating range, comment length, product existence, and duplicate review status.

Review deletion is user-specific. When reviews are fetched, each review includes a canDelete value. This value is true only when the logged-in user's ID matches the review author's ID. The user interface displays the Delete button only when canDelete is true.

The server also enforces ownership. The deleteReview controller uses findOneAndDelete with both _id and user. Therefore, even if a user sends a manual request for another user's review ID, deletion fails with a 403 response. After a review is added or deleted, product averageRating and reviewCount are recalculated using MongoDB aggregation.

[Insert Screenshot of Review List Showing Own Review Delete Button]

[Insert Screenshot of Review List Without Delete Button for Other Users]

## 4.10 Admin Module Implementation

The admin routes use both isAuthenticated and isAdmin middleware. This means only logged-in users with role admin can access admin dashboards.

Admin product management supports product listing, add product, edit product, activate/deactivate product, and delete product. Deletion includes a safety check that prevents deleting a product already referenced in orders. In such cases, the administrator is advised to deactivate the product instead.

Admin order management supports order listing with pagination, searching by order ID or customer name, filtering by status, updating order status, updating payment status, and viewing full order details.

Admin customer management supports customer search, segmentation, sorting, customer detail pages, order summaries, and CSV export. The analytics module uses MongoDB aggregation to calculate total orders, revenue, pending orders, and top-selling products.

[Insert Screenshot of Admin Product Management]

[Insert Screenshot of Admin Order Management]

[Insert Screenshot of Admin Customer Directory]

[Insert Screenshot of Admin Analytics Dashboard]

## 4.11 Security Implementation

The security design includes:

- bcryptjs password hashing.
- Strong password validation in registration and the User model.
- Session regeneration after successful login.
- MongoDB-backed session storage.
- httpOnly cookies.
- sameSite cookie setting.
- CSRF protection using double-submit cookie strategy.
- Helmet security headers.
- Global and authentication-specific rate limiting.
- Express-validator based input validation.
- Role-based admin authorization.
- Ownership checks for orders and reviews.
- Safe redirect validation to avoid unsafe redirects.
- Global error handling and winston file logging.

---

# Chapter 5: Testing

## 5.1 Introduction

Testing verifies whether Luxe Scents satisfies its functional and non-functional requirements. The test cases below are based on the implemented routes, controllers, models, middleware, and views. The main testing focus areas are authentication, authorization, product browsing, cart, checkout, order cancellation, review ownership, wishlist, admin actions, and security controls.

## 5.2 Testing Strategy

The following testing methods are recommended:

- Unit testing for utility functions such as cart calculation and validation helpers.
- Integration testing for routes and controllers using test users and test products.
- System testing for complete workflows such as registration to checkout.
- Security testing for CSRF protection, admin authorization, and ownership checks.
- Usability testing for password toggling, responsive pages, flash messages, and dashboards.

## 5.3 Test Cases

Table 5.1: Test Cases

| TC ID | Module | Test Scenario | Test Steps | Expected Result | Status |
| --- | --- | --- | --- | --- | --- |
| TC-01 | Authentication | Register with valid data | Open /register, enter valid name, email, strong password, and matching confirm password. | Account is created and user is redirected to login with success message. | [Pass/Fail] |
| TC-02 | Authentication | Register with weak password | Enter a password that does not satisfy complexity requirements. | Registration fails and password requirement message is displayed. | [Pass/Fail] |
| TC-03 | Authentication | Register duplicate email | Register using an email already stored in users collection. | System displays duplicate account error. | [Pass/Fail] |
| TC-04 | Authentication | Login with valid credentials | Open /login and enter correct email and password. | Session is created and user is redirected to dashboard or admin page based on role. | [Pass/Fail] |
| TC-05 | Authentication | Login with wrong password | Enter valid email with incorrect password. | Login fails with invalid email or password message. | [Pass/Fail] |
| TC-06 | Authentication | Logout | Submit logout form. | Session is destroyed and user is redirected to login. | [Pass/Fail] |
| TC-07 | Authorization | Access dashboard without login | Open /dashboard without active session. | User is redirected to /login. | [Pass/Fail] |
| TC-08 | Authorization | Customer accesses admin route | Login as customer and open /admin/products. | System returns 403 Access Denied page. | [Pass/Fail] |
| TC-09 | Product Listing | View shop page | Open /shop. | Active products are displayed with pagination. | [Pass/Fail] |
| TC-10 | Product Search | Search product by keyword | Open /search?q=rose. | Matching active products are displayed. | [Pass/Fail] |
| TC-11 | Product Detail | Open active product detail | Open /product/:id for active product. | Product details, notes, rating, cart action, wishlist action, and review section are displayed. | [Pass/Fail] |
| TC-12 | Product Detail | Open inactive or invalid product | Open /product/:id for unavailable product. | 404 page is displayed. | [Pass/Fail] |
| TC-13 | Cart | Add available product to cart | Submit /cart/add with active product ID and valid quantity. | Product is added and cart totals are updated. | [Pass/Fail] |
| TC-14 | Cart | Add out-of-stock product | Submit /cart/add for product with stock 0. | System rejects request with out-of-stock message. | [Pass/Fail] |
| TC-15 | Cart | Increase quantity beyond stock | Attempt to increase cart quantity above available stock. | System rejects update and shows stock limit message. | [Pass/Fail] |
| TC-16 | Cart | Remove cart item | Submit /cart/remove. | Product is removed and cart totals are recalculated. | [Pass/Fail] |
| TC-17 | Checkout | Access checkout without login | Open /checkout without session. | User is redirected to login. | [Pass/Fail] |
| TC-18 | Checkout | Checkout with empty cart | Login and open /checkout with empty cart. | User is redirected to cart with empty cart message. | [Pass/Fail] |
| TC-19 | Checkout | Valid checkout | Add product to cart, enter valid shipping address, submit checkout. | Order is created with Pending status, stock is reduced, cart is cleared, and success page appears. | [Pass/Fail] |
| TC-20 | Checkout | Checkout stock conflict | Add product with insufficient stock and submit checkout. | Order is not created and user receives stock conflict message. | [Pass/Fail] |
| TC-21 | Orders | View own order history | Login and open /orders. | Only logged-in user's orders are displayed. | [Pass/Fail] |
| TC-22 | Orders | View another user's order | Try to open another user's order ID. | System redirects with order not found message. | [Pass/Fail] |
| TC-23 | Orders | Cancel pending own order | Submit /orders/:id/cancel for own Pending order. | Order status changes to Cancelled. | [Pass/Fail] |
| TC-24 | Orders | Cancel non-pending order | Submit cancel request for Processing or Shipped order. | System rejects cancellation with only pending orders can be cancelled message. | [Pass/Fail] |
| TC-25 | Orders | Cancel another user's order | Submit cancel request for order owned by another user. | System rejects request and does not modify the order. | [Pass/Fail] |
| TC-26 | Reviews | Submit valid review | Login and submit rating 1-5 with comment length at least 10. | Review is created and product rating statistics are recalculated. | [Pass/Fail] |
| TC-27 | Reviews | Submit duplicate review | Same user submits second review for same product. | System returns duplicate review conflict. | [Pass/Fail] |
| TC-28 | Reviews | Submit invalid rating | Submit rating outside 1-5. | System returns validation error. | [Pass/Fail] |
| TC-29 | Reviews | Submit short comment | Submit comment shorter than 10 characters. | System returns comment length error. | [Pass/Fail] |
| TC-30 | Reviews | Delete own review | Login as review author and click Delete. | Review is deleted and rating statistics are updated. | [Pass/Fail] |
| TC-31 | Reviews | Unauthorized user cannot delete reviews | Send DELETE /reviews/:reviewId without login. | Request is blocked by authentication and redirected to login. | [Pass/Fail] |
| TC-32 | Reviews | Non-owner cannot delete review | Login as different user and send DELETE /reviews/:reviewId. | System returns 403 and review remains stored. | [Pass/Fail] |
| TC-33 | Wishlist | Add product to wishlist | Login and submit /wishlist/add with active product ID. | Product is added to user's wishlist. | [Pass/Fail] |
| TC-34 | Wishlist | Add duplicate wishlist item | Add same product again. | System displays already in wishlist message. | [Pass/Fail] |
| TC-35 | Wishlist | Remove wishlist item | Submit /wishlist/remove. | Product is removed from wishlist. | [Pass/Fail] |
| TC-36 | Admin Products | Add valid product | Admin submits product form with valid fields. | Product is created and listed. | [Pass/Fail] |
| TC-37 | Admin Products | Add duplicate SKU | Admin submits product with existing SKU. | System displays SKU unique error. | [Pass/Fail] |
| TC-38 | Admin Products | Toggle product status | Admin submits /admin/products/:id/toggle. | Product active status is changed. | [Pass/Fail] |
| TC-39 | Admin Products | Delete product referenced in order | Admin attempts to delete ordered product. | System blocks deletion and recommends deactivation. | [Pass/Fail] |
| TC-40 | Admin Orders | Update order status | Admin changes order status to Shipped. | Order status is updated. | [Pass/Fail] |
| TC-41 | Admin Orders | Update payment status | Admin changes payment status to Paid. | Payment status is updated. | [Pass/Fail] |
| TC-42 | Admin Customers | Export customer CSV | Admin opens /admin/customers?export=csv. | CSV file is generated. | [Pass/Fail] |
| TC-43 | Security | Missing CSRF token | Submit protected POST request without CSRF token. | System returns 403 invalid form submission. | [Pass/Fail] |
| TC-44 | Security | Rate limit login attempts | Send repeated login requests beyond limit. | System blocks further attempts temporarily. | [Pass/Fail] |
| TC-45 | Health Check | Health endpoint with wrong token | Open /health without valid x-health-token. | System returns 403 forbidden. | [Pass/Fail] |

## 5.4 Sample Test Evidence Placeholders

[Insert Screenshot of Successful Registration]

[Insert Screenshot of Failed Weak Password Registration]

[Insert Screenshot of Successful Checkout]

[Insert Screenshot of Pending Order Cancellation]

[Insert Screenshot of Non-Owner Review Delete Failure]

[Insert Screenshot of Admin Product Validation Error]

[Insert Screenshot of CSRF Error Page]

## 5.5 Testing Summary

The testing plan focuses on validating both normal and abnormal workflows. Normal workflows include registration, login, browsing, cart management, checkout, review submission, wishlist management, and admin management. Abnormal workflows include unauthorized admin access, deleting another user's review, cancelling a non-pending order, submitting invalid data, and missing CSRF tokens. These test cases ensure that Luxe Scents is functionally correct, secure, and reliable for both customers and administrators.

---

# Chapter 6: Conclusions

## 6.1 Conclusion

Luxe Scents is a premium perfume e-commerce platform developed to support online fragrance discovery, customer ordering, product reviews, wishlist management, and administrative operations. The project successfully implements a database-driven web application using Node.js, Express.js, MongoDB, Mongoose, EJS templates, Tailwind CSS, and client-side JavaScript.

The system solves important problems for fragrance buyers by presenting structured perfume information, scent notes, availability, ratings, reviews, and order management features. Customers can browse the perfume collection, add products to cart, save wishlist items, checkout securely, view order history, cancel pending orders, and manage their own reviews. Administrators can manage products, orders, customers, and analytics from protected dashboards.

The project also demonstrates important software engineering concepts such as MVC organization, schema validation, role-based access control, session handling, CSRF protection, password hashing, rate limiting, MongoDB aggregation, and ownership-based authorization.

## 6.2 Achievements

The major achievements of the project are:

- A functional online perfume store with customer and admin modules.
- Secure authentication with password hashing and session handling.
- Product catalog with categories, fragrance notes, stock, and ratings.
- Session-based cart and secure checkout workflow.
- Order history and pending order cancellation.
- Wishlist management for authenticated users.
- Review submission with one review per user per product.
- User-specific review deletion with server-side ownership enforcement.
- Admin product, order, customer, and analytics dashboards.
- CSRF protection, Helmet security headers, rate limiting, validation, and error handling.

## 6.3 Limitations

The current version has the following limitations:

- The frontend is implemented with EJS templates rather than React.js.
- Real online payment gateway integration is not implemented.
- Shipment tracking with courier APIs is not included.
- Product image upload and cloud storage are not implemented.
- Email notifications for registration, order confirmation, and shipment updates are not implemented.
- Automated test files are not currently included in the source code.
- The analytics charts include some static chart data and can be further connected to live backend aggregation results.

## 6.4 Future Work

Future improvements may include:

- Add secure payment gateway integration.
- Add courier shipment tracking and delivery status updates.
- Add email and SMS notifications.
- Add product image upload using cloud storage.
- Add a React.js frontend to make the project a complete MERN implementation.
- Add automated unit, integration, and end-to-end tests.
- Add recommendation features based on fragrance categories, notes, reviews, and order history.
- Add advanced filtering by price range, category, rating, and stock availability.
- Add audit logs for admin actions.
- Add inventory reports and low-stock alerts.

## 6.5 Final Remarks

Luxe Scents demonstrates how modern web technologies can be used to build a secure and practical e-commerce solution for a specialized product domain. The project is suitable as a final year project because it includes real-world modules such as authentication, product management, cart, checkout, orders, reviews, authorization, and admin analytics. With additional enhancements such as payment integration, automated testing, and a React frontend, the project can be extended into a more complete production-ready perfume e-commerce platform.

---

# References

Use IEEE numbered format in the final Word document. Suggested references:

[1] Node.js Documentation.

[2] Express.js Documentation.

[3] MongoDB Documentation.

[4] Mongoose Documentation.

[5] EJS Documentation.

[6] Tailwind CSS Documentation.

[7] OWASP Web Security Testing Guide.

[8] bcrypt Password Hashing Documentation.

[9] Chart.js Documentation.

[10] Helmet.js Documentation.

