"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
exports.signUp = signUp;
exports.signIn = signIn;
exports.signOut = signOut;
exports.getSession = getSession;
exports.getCurrentUser = getCurrentUser;
const supabase_js_1 = require("@supabase/supabase-js");
function createClient() {
    return (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
// Sign up with email and password
async function signUp(email, password) {
    const supabase = createClient();
    const result = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_URL || 'https://www.steadyletters.com'}/auth/callback`,
        },
    });
    // Sync user to Prisma after successful sign up
    if (result.data?.user && !result.error) {
        try {
            await fetch('/api/auth/sync-user', { method: 'POST' });
        }
        catch (err) {
            console.error('Failed to sync user:', err);
        }
    }
    return result;
}
// Sign in with email and password
async function signIn(email, password) {
    const supabase = createClient();
    const result = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    // Sync user to Prisma after successful sign in
    if (result.data?.session && !result.error) {
        try {
            await fetch('/api/auth/sync-user', { method: 'POST' });
        }
        catch (err) {
            console.error('Failed to sync user:', err);
        }
    }
    return result;
}
// Sign out
async function signOut() {
    const supabase = createClient();
    return await supabase.auth.signOut();
}
// Get current session
async function getSession() {
    const supabase = createClient();
    return await supabase.auth.getSession();
}
// Get current user
async function getCurrentUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
