"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const health_1 = __importDefault(require("./routes/health"));
const letter_1 = __importDefault(require("./routes/generate/letter"));
const transcribe_1 = __importDefault(require("./routes/transcribe"));
const orders_1 = __importDefault(require("./routes/orders"));
const usage_1 = __importDefault(require("./routes/billing/usage"));
const checkout_1 = __importDefault(require("./routes/stripe/checkout"));
const portal_1 = __importDefault(require("./routes/stripe/portal"));
const webhook_1 = __importDefault(require("./routes/stripe/webhook"));
const analyze_image_1 = __importDefault(require("./routes/analyze-image"));
const images_1 = __importDefault(require("./routes/generate/images"));
const card_image_1 = __importDefault(require("./routes/generate/card-image"));
const extract_address_1 = __importDefault(require("./routes/extract-address"));
const sync_user_1 = __importDefault(require("./routes/auth/sync-user"));
const handwriting_styles_1 = __importDefault(require("./routes/handwriting-styles"));
const products_1 = __importDefault(require("./routes/thanks-io/products"));
const styles_1 = __importDefault(require("./routes/thanks-io/styles"));
const send_1 = __importDefault(require("./routes/thanks-io/send"));
// Load environment variables
try {
    dotenv_1.default.config();
}
catch (error) {
    console.warn('Could not load .env file, assuming production environment variables are set.');
}
// Ensure critical environment variables are set
if (!process.env.DATABASE_URL && process.env.VERCEL) {
    console.error('ERROR: DATABASE_URL is not set in Vercel environment variables');
    // Don't throw here - let Prisma handle it with better error message
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
// Stripe webhook needs raw body, so we handle it separately
// For all other routes, use JSON parser
app.use((req, res, next) => {
    if (req.path === '/api/stripe/webhook') {
        // Skip JSON parsing for webhook - it uses express.raw() in the route
        next();
    }
    else {
        express_1.default.json()(req, res, next);
    }
});
// Routes
app.use('/api/health', health_1.default);
app.use('/api/generate/letter', letter_1.default);
app.use('/api/generate/images', images_1.default);
app.use('/api/generate/card-image', card_image_1.default);
app.use('/api/transcribe', transcribe_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/billing/usage', usage_1.default);
app.use('/api/stripe/checkout', checkout_1.default);
app.use('/api/stripe/portal', portal_1.default);
app.use('/api/stripe', webhook_1.default); // Webhook route handles /api/stripe/webhook
app.use('/api/analyze-image', analyze_image_1.default);
app.use('/api/extract-address', extract_address_1.default);
app.use('/api/auth/sync-user', sync_user_1.default);
app.use('/api/handwriting-styles', handwriting_styles_1.default);
app.use('/api/thanks-io/products', products_1.default);
app.use('/api/thanks-io/styles', styles_1.default);
app.use('/api/thanks-io/send', send_1.default);
// Start Server (only in non-serverless environments)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
    });
}
exports.default = app;
