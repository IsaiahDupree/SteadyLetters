/**
 * Vercel Serverless Function Entry Point
 * This file is used when deploying the backend to Vercel as serverless functions
 */

// Import from compiled dist - Vercel runs JavaScript, not TypeScript
// The build process compiles src/ to dist/ first
const { default: app } = require('../dist/index');

// Export the Express app as a serverless function
// Vercel will use this as the handler for all routes
module.exports = app;

