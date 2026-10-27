import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for route handlers and server actions.
 *
 * Centralizing the cookie bridge keeps server-side auth calls consistent and
 * prevents routes from importing the browser-only Supabase client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // A read-only server context cannot persist refreshed cookies.
            // Route handlers still receive the authenticated request cookies.
          }
        },
      },
    }
  );
}

export { createClient as createServerClient };
