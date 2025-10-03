import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;
    
    console.log('Middleware running for:', pathname);

    // Get token from cookies or headers
    const token = request.cookies.get('token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    console.log('Token found:', !!token);

    // Protected routes that require authentication
    if (pathname.startsWith('/admin') || pathname.startsWith('/doctor') || pathname.startsWith('/student')) {
        if (!token) {
            console.log('Redirecting to login from:', pathname);
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Allow everything else to pass through
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/doctor/:path*',
        '/student/:path*'
    ],
};