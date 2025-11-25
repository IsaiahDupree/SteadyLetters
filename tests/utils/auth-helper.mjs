/**
 * Authentication helper for tests
 * Provides utilities to get auth tokens and make authenticated requests
 */

import { createClient } from '@supabase/supabase-js';

// Test credentials
export const TEST_USER = {
    email: 'isaiahdupree33@gmail.com',
    password: 'Frogger12',
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54421';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

/**
 * Get authenticated session for test user
 * @returns {Promise<{session, user, error}>}
 */
export async function getTestUserSession() {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password,
    });

    if (error) {
        console.error('Test user sign in error:', error);
        return { session: null, user: null, error };
    }

    return {
        session: data.session,
        user: data.user,
        error: null,
    };
}

/**
 * Get authorization headers for authenticated requests
 * @returns {Promise<Headers>}
 */
export async function getAuthHeaders() {
    const { session } = await getTestUserSession();

    if (!session) {
        throw new Error('Failed to get test user session');
    }

    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Make authenticated GET request
 */
export async function authenticatedGet(url) {
    const { session } = await getTestUserSession();

    if (!session) {
        throw new Error('Failed to get test user session');
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Cookie': `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`,
        },
        credentials: 'include',
    });

    return response;
}

/**
 * Make authenticated POST request
 */
export async function authenticatedPost(url, body) {
    const { session } = await getTestUserSession();

    if (!session) {
        throw new Error('Failed to get test user session');
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Cookie': `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`,
        },
        credentials: 'include',
        body: JSON.stringify(body),
    });

    return response;
}

/**
 * Make authenticated POST request with FormData
 */
export async function authenticatedFormPost(url, formData) {
    const { session } = await getTestUserSession();

    if (!session) {
        throw new Error('Failed to get test user session');
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Cookie': `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`,
            // Don't set Content-Type for FormData - browser sets it with boundary
        },
        credentials: 'include',
        body: formData,
    });

    return response;
}

/**
 * Sign out test user
 */
export async function signOutTestUser() {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await supabase.auth.signOut();
}
