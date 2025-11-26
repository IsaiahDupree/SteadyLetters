import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Next.js 16+ uses proxy.ts instead of middleware.ts
export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // CRITICAL: Skip ALL API routes before any other logic
    // This prevents proxy from interfering with API route handlers
    if (path.startsWith('/api/')) {
        return NextResponse.next();
    }

    // CRITICAL: Skip static files
    if (
        path.startsWith('/_next/') ||
        path.startsWith('/static/') ||
        path.match(/\.(ico|png|jpg|jpeg|svg|webp|gif)$/)
    ) {
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

    const { data: { user } } = await supabase.auth.getUser();

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/signup', '/pricing', '/privacy', '/terms'];
    const isPublicRoute = publicRoutes.includes(path);

    // Redirect logic for authentication (pages only, not API)
    if (!user && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && (path === '/login' || path === '/signup')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - /api/* (API routes - excluded via early return)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - site.webmanifest (manifest file)
         * - logo.png and other image files
         */
        '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
