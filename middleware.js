import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Get token from cookies (this is the primary method for SSR)
    const token = request.cookies.get('token')?.value;

    // If no token found for protected routes, redirect to login
    if (!token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // If token exists, allow access
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/doctor/:path*',
        '/student/:path*'
    ],
};