"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticatedUser = getAuthenticatedUser;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Get authenticated user from Express request
 * Returns null if not authenticated
 * This is a helper function for routes that need optional auth
 */
async function getAuthenticatedUser(req) {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Missing Supabase environment variables in getAuthenticatedUser');
        return null;
    }
    const supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    // Check if user is already attached to request (from middleware)
    if (req.user) {
        return req.user;
    }
    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
            return user;
        }
    }
    // Try to get from cookies
    const cookies = req.cookies || {};
    const accessToken = cookies['sb-access-token'] || cookies['sb-auth-token'];
    if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (user && !error) {
            return user;
        }
    }
    return null;
}
