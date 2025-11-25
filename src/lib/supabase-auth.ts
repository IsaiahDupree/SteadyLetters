import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Sign up with email and password
export async function signUp(email: string, password: string) {
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
        } catch (err) {
            console.error('Failed to sync user:', err);
        }
    }
    
    return result;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
    const supabase = createClient();
    const result = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    
    // Sync user to Prisma after successful sign in
    if (result.data?.session && !result.error) {
        try {
            await fetch('/api/auth/sync-user', { method: 'POST' });
        } catch (err) {
            console.error('Failed to sync user:', err);
        }
    }
    
    return result;
}

// Sign out
export async function signOut() {
    const supabase = createClient();
    return await supabase.auth.signOut();
}

// Get current session
export async function getSession() {
    const supabase = createClient();
    return await supabase.auth.getSession();
}

// Get current user
export async function getCurrentUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
