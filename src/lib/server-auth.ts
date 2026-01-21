import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

/**
 * Get the currently authenticated user in a server action or route handler.
 *
 * @throws {Error} If no user is authenticated
 * @returns {Promise<User>} The authenticated Supabase user
 */
export async function getCurrentUser(): Promise<User> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set(name, value, options);
                },
                remove(name: string, options: any) {
                    cookieStore.delete(name);
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized. Please sign in.');
    }

    return user;
}

/**
 * Get the currently authenticated user, or return null if not authenticated.
 *
 * @returns {Promise<User | null>} The authenticated Supabase user or null
 */
export async function getCurrentUserOrNull(): Promise<User | null> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set(name, value, options);
                },
                remove(name: string, options: any) {
                    cookieStore.delete(name);
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
