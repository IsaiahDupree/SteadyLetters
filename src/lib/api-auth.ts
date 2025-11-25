import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Get authenticated user from API request
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(request?: NextRequest) {
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

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
        console.error('Auth error in getAuthenticatedUser:', error);
        return null;
    }
    
    if (!user) {
        return null;
    }

    return user;
}

