const mongoose = require('mongoose');

const connectDB = async (dbUrl = process.env.DB_URL || process.env.MONGO_URI) => {
    if (!dbUrl) {
        console.error('[DB] Connection failed: DB_URL or MONGO_URI is not defined.');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(dbUrl, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });

        console.log(`[DB] MongoDB Connected: ${conn.connection.host} | DB: ${conn.connection.name}`);

        // Log connection events
        mongoose.connection.on('error', (err) => {
            console.error(`[DB] MongoDB connection error: ${err.message}`);
        });
        mongoose.connection.on('disconnected', () => {
            console.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
        });
        mongoose.connection.on('reconnected', () => {
            console.log('[DB] MongoDB reconnected successfully.');
        });

    } catch (error) {
        console.error(`[DB] Connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
