/**
 * Vercel Serverless Function Entry Point
 * This file is used when deploying the backend to Vercel as serverless functions
 * 
 * Vercel compiles this TypeScript file and imports from source
 */

import app from '../src/index';

// Export the Express app as a serverless function
// Vercel will use this as the handler for all routes
export default app;

