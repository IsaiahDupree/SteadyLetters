/**
 * Vercel Serverless Function Entry Point
 * This file is used when deploying the backend to Vercel as serverless functions
 * 
 * Note: This imports from dist/ because Vercel runs the compiled JavaScript
 */

import app from '../dist/index';

// Export the Express app as a serverless function
// Vercel will use this as the handler for all routes
export default app;

