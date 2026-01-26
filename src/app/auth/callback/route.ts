import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getOrCreatePersonFromUser, linkIdentity } from '@/lib/identity.js';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = request.cookies;

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // Cookie setting handled by response
                    },
                    remove(name: string, options: CookieOptions) {
                        // Cookie removal handled by response
                    },
                },
            }
        );

        const { data } = await supabase.auth.exchangeCodeForSession(code);

        // Create or link Person record for identity stitching
        if (data.user) {
            try {
                await getOrCreatePersonFromUser(
                    data.user.id,
                    data.user.email || '',
                    data.user.user_metadata?.first_name,
                    data.user.user_metadata?.last_name
                );
            } catch (error) {
                console.error('Failed to create Person record on auth:', error);
                // Continue anyway - this is not critical for auth flow
            }
        }
    }

    // Redirect to dashboard after auth
    return NextResponse.redirect(new URL('/dashboard', request.url));
}
