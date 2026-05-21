const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

dotenv.config();

const DB_URL = process.env.DB_URL || process.env.MONGO_URI;

const assertCanSeed = () => {
    if (process.env.NODE_ENV === 'production') {
        console.error('Refusing to run seed.js in production. Set NODE_ENV to development or test before seeding.');
        process.exit(1);
    }

    if (!DB_URL) {
        console.error('DB_URL or MONGO_URI is required before running seed.js.');
        process.exit(1);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URL);
        console.log('MongoDB Connected for Seeding');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const seedData = async () => {
    assertCanSeed();
    await connectDB();

    try {
        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});
        console.log('Data Cleared');

        // Create Users — use create() so pre-save password hashing hooks fire
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@luxparfum.com',
            password: 'password123',
            role: 'admin',
            phone: '123-456-7890',
            address: {
                street: '123 Admin St',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                country: 'USA'
            }
        });
        const customerUser = await User.create({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            role: 'customer',
            phone: '987-654-3210',
            address: {
                street: '456 User Lane',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90001',
                country: 'USA'
            }
        });
        const users = [adminUser, customerUser];
        console.log('Users Seeded');

        // Create Products 
        const products = await Product.insertMany([
            {
                name: 'Midnight Rose',
                sku: 'MR-2024-001',
                description: 'A mysterious and enchanting floral fragrance.',
                price: 145.00,
                stock: 125,
                category: 'Floral',
                imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWtXC_GZaX_Uz5-EiiaR11MWTyM50SfarRNV3jX0jN2oEU5rkgBGJbCmTioI492zeb9zSGzlEdjYJ1LsrjF83e8lORqIFelkux2qGRbxzyrawLPqtwF8OxKlMBZGlmFT_r67R06t7VEd19rfFpPGyh0bopSuKoEQVU04N041-ErVPeuUGOCnO0ltNsDfvgosd6_VeAJlKxI9MMnMnXYv0eD5WnjDiCL2j3f6xhjME50OTXDo_ttKZFjfJqx0INlo8RG4xFkNPiThdt',
                active: true
            },
            {
                name: 'Oud Wood Intense',
                sku: 'OW-2024-055',
                description: 'A deep and smoky wood fragrance.',
                price: 210.00,
                stock: 14,
                category: 'Woody',
                imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA3FUt_vzm3el8-ezdjhtHeKqwbNoX95UnWRBViAfPdXGa0Nm1otlAqkNZ7skgAB_MnLHvKjzdMbPVkDoTryj9198kj8vabIWPxkxZKc-1nVMGcnO-j23MT8IrYYfbl6DZUebjPU4-WKkb0eVc2bI1Mxd0FkcjauRcXG5iog2OV6wLWN3XdJ1IalaKsd_w-Jxl0oESSHoy4ACeQ8Kxivg3lGxzyxXrIUx6-0aKPd0GF05ol8vVaKcYCppE56iYe1JKy8R-6an9TRPW',
                active: true
            },
            {
                name: 'Citrus Splash',
                sku: 'CS-2024-112',
                description: 'A refreshing burst of citrus energy.',
                price: 95.00,
                stock: 42,
                category: 'Citrus',
                imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQBJAZs718rgsa4E5rSjeAyjlYpauhI9HxdyEj4IctkA89jVDMkRYwOrkZuicJnnOiWbFCrrA8oPnDFO-lfPV-hv58vUIL855GKrQqnGO7rXSumRTO6ePWjHj9mUXnRaBSDZKoO1KELYvgVJg4wiTp5BzTxZOSddGUMtZrwLOYmpI10pIXAxc78REziWQASgnO2wqWqyugPOS1DrOmzgcz6SQBe00B8FJVVpX-RAjgi1io4SuRWKmb2p1Z3LEpDOy8TqM33RIkasRK',
                active: true
            },
            {
                name: 'Golden Amber',
                sku: 'GA-2023-998',
                description: 'A warm and inviting oriental scent.',
                price: 180.00,
                stock: 0,
                category: 'Amber',
                imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqzlcOkBG2hk0cEglrsGaOUAPHcoucI1eqEJazrNeZH0J1W0FQP2a0H3VhsKGeRcXqqri437wrrDC3q12lKxC5oNQmD5gSmW29zy0KCwyeBBs4U6MalksUd9-tGTXs_HmAzBChWfqMJpEAAYxOEZ-zGNzzShYRFhbjt7vjZpn1hpy9s3pNclmp0ZSjF7jgH4ngPSqSeI7sIBkAce7UpS0zF5llam9z7J3iNmgTn97_OtaOBwXQykdR2I1tTfbn7uk-7_zKTW1BBzs6',
                active: true
            },
            {
                name: 'Velvet Orchid',
                sku: 'VO-2024-331',
                description: 'A luxurious and sensual floral fragrance.',
                price: 165.00,
                stock: 85,
                category: 'Floral',
                imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwLYyhqtUj2Xu_x6gAA_PALnmAo3lrHN7lzKi5mgw2_h4MAyz-C3vxpzaKeYlEeQjrwBUoZHsWk-qraKjhqhl5bcQf6YsT_JTbuZ0Smvmkw6S5eC7qIm-4Ds1oIfaj3RdXQRDZ4nLt_9kSMY8_EMiz_ea8eD81aTJTmehUwXsFgLUjuISpo7OCxsHf0lbrJ9JgFpQQkEtpqDGS6OwF8s41OFUz7TwBkIEBUJe4QjRxfSALRLvzBZuyXEPtXbC4uvusKNV28xxk_mCW',
                active: true
            }
        ]);
        console.log('Products Seeded');

        // Create a Sample Order
        await Order.create({
            user: users[1]._id,
            items: [
                {
                    product: products[0]._id,
                    name: products[0].name,
                    quantity: 1,
                    price: products[0].price
                }
            ],
            totalAmount: products[0].price,
            status: 'Processing',
            paymentStatus: 'Paid',
            shippingAddress: users[1].address
        });
        console.log('Orders Seeded');

        console.log('Database Seeded Successfully');
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();

