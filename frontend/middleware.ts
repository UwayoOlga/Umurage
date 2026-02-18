import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('auth_token')?.value;
    const userRole = request.cookies.get('user_role')?.value;

    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isDashboard = pathname.startsWith('/dashboard');
    const isAdminPage = pathname.startsWith('/dashboard/admin');

    // Redirect authenticated users away from auth pages
    if (isAuthPage && token) {
        const dest = userRole === 'admin' ? '/dashboard/admin' : '/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
    }

    // Protect dashboard routes
    if (isDashboard && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Protect admin routes
    if (isAdminPage && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register'],
};
