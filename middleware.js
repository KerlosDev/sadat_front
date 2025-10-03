import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Skip middleware for static files and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') // Files with extensions
    ) {
        return NextResponse.next();
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login'];

    // Always allow access to public routes
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Get token from cookies or headers
    const token = request.cookies.get('token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    // Protected routes - require authentication
    const isProtectedRoute = pathname.startsWith('/admin') || 
                           pathname.startsWith('/doctor') || 
                           pathname.startsWith('/student');

    // If trying to access protected route without token, redirect to login
    if (isProtectedRoute && !token) {
        const loginUrl = new URL('/', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};