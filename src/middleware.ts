import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Skip middleware for API routes - they should not be processed by middleware
    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Protected routes - require authentication
    const protectedRoutes = ['/dashboard', '/generate', '/billing', '/orders', '/recipients', '/templates', '/send', '/settings'];
    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !session) {
        // Redirect to login with return URL
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect logged-in users away from auth pages
    const authPages = ['/login', '/signup'];
    const isAuthPage = authPages.some(page => request.nextUrl.pathname === page);

    if (isAuthPage && session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Only match page routes, not API routes or static assets
         * This prevents middleware from running on /api/* routes entirely
         * Combined with early return check for defense-in-depth
         */
        '/',
        '/login',
        '/signup',
        '/dashboard/:path*',
        '/generate/:path*',
        '/billing/:path*',
        '/orders/:path*',
        '/recipients/:path*',
        '/templates/:path*',
        '/send/:path*',
        '/settings/:path*',
        '/privacy',
        '/terms',
    ],
};
