const { Safepay } = require('@sfpy/node-sdk');

const isConfigured = () => Boolean(
    process.env.SAFEPAY_API_KEY &&
    process.env.SAFEPAY_V1_SECRET &&
    process.env.SAFEPAY_WEBHOOK_SECRET
);

let client = null;

const getClient = () => {
    if (!isConfigured()) return null;

    if (!client) {
        client = new Safepay({
            environment: process.env.SAFEPAY_ENV === 'production' ? 'production' : 'sandbox',
            apiKey: process.env.SAFEPAY_API_KEY,
            v1Secret: process.env.SAFEPAY_V1_SECRET,
            webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET
        });
    }

    return client;
};

const getBaseUrl = (req) => {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
    return `${req.protocol}://${req.get('host')}`;
};

module.exports = { getClient, isConfigured, getBaseUrl };
