import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import letterRouter from './routes/generate/letter';
import transcribeRouter from './routes/transcribe';
import ordersRouter from './routes/orders';
import billingUsageRouter from './routes/billing/usage';
import stripeCheckoutRouter from './routes/stripe/checkout';
import stripePortalRouter from './routes/stripe/portal';
import stripeWebhookRouter from './routes/stripe/webhook';
import analyzeImageRouter from './routes/analyze-image';
import generateImagesRouter from './routes/generate/images';
import generateCardImageRouter from './routes/generate/card-image';
import extractAddressRouter from './routes/extract-address';
import syncUserRouter from './routes/auth/sync-user';
import handwritingStylesRouter from './routes/handwriting-styles';
import thanksIoProductsRouter from './routes/thanks-io/products';
import thanksIoStylesRouter from './routes/thanks-io/styles';
import thanksIoSendRouter from './routes/thanks-io/send';

// Load environment variables
dotenv.config();

// Ensure critical environment variables are set
if (!process.env.DATABASE_URL && process.env.VERCEL) {
    console.error('ERROR: DATABASE_URL is not set in Vercel environment variables');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(cookieParser());

// Stripe webhook needs raw body, so we handle it separately
// For all other routes, use JSON parser
app.use((req, res, next) => {
    if (req.path === '/api/stripe/webhook') {
        // Skip JSON parsing for webhook - it uses express.raw() in the route
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/generate/letter', letterRouter);
app.use('/api/generate/images', generateImagesRouter);
app.use('/api/generate/card-image', generateCardImageRouter);
app.use('/api/transcribe', transcribeRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/billing/usage', billingUsageRouter);
app.use('/api/stripe/checkout', stripeCheckoutRouter);
app.use('/api/stripe/portal', stripePortalRouter);
app.use('/api/stripe', stripeWebhookRouter); // Webhook route handles /api/stripe/webhook
app.use('/api/analyze-image', analyzeImageRouter);
app.use('/api/extract-address', extractAddressRouter);
app.use('/api/auth/sync-user', syncUserRouter);
app.use('/api/handwriting-styles', handwritingStylesRouter);
app.use('/api/thanks-io/products', thanksIoProductsRouter);
app.use('/api/thanks-io/styles', thanksIoStylesRouter);
app.use('/api/thanks-io/send', thanksIoSendRouter);

// Start Server (only in non-serverless environments)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
    });
}

export default app;
