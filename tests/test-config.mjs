/**
 * Test Configuration
 * Centralizes test URLs and configuration for frontend/backend split
 */

// Backend URL - now runs on port 3001
export const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Frontend URL - runs on port 3000
export const FRONTEND_URL = process.env.FRONTEND_URL || process.env.LOCAL_URL || 'http://localhost:3000';

// Production URL (for production testing)
export const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';

// Determine which environment we're testing
export const TEST_ENV = process.env.TEST_ENV || 'local';

// Get the appropriate API base URL based on environment
export function getApiBaseUrl() {
    if (TEST_ENV === 'production') {
        // In production, API might be on same domain or different
        // For now, assume same domain
        return PRODUCTION_URL;
    }
    // Local development - use backend URL
    return BACKEND_URL;
}

// Get the appropriate frontend URL
export function getFrontendUrl() {
    if (TEST_ENV === 'production') {
        return PRODUCTION_URL;
    }
    return FRONTEND_URL;
}

// Helper to build API endpoint URLs
export function apiUrl(endpoint) {
    const base = getApiBaseUrl();
    // Remove leading slash if present, add if not
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${cleanEndpoint}`;
}

// Helper to build frontend URLs
export function frontendUrl(path) {
    const base = getFrontendUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
}

