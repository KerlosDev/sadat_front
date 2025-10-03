import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login'];

    // Check if the current route is public
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Get token from cookies or headers
    const token = request.cookies.get('token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    // If no token and trying to access protected route, redirect to login
    if (!token && (pathname.startsWith('/admin') || pathname.startsWith('/doctor') || pathname.startsWith('/student'))) {
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