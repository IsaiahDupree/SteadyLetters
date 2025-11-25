import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (for use in client components)
export function createClientSupabaseClient() {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    });
}

// Server-side Supabase client (for use in server components/actions)
export function createServerSupabaseClient() {
    const cookieStore = cookies();
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInCookie: true,
            storage: {
                getItem: (key: string) => {
                    return cookieStore.get(key)?.value ?? null;
                },
                setItem: (key: string, value: string) => {
                    cookieStore.set(key, value);
                },
                removeItem: (key: string) => {
                    cookieStore.delete(key);
                },
            },
        },
    });
}

