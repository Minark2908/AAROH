import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('aaroh_token')?.value;
  const rawRole = request.cookies.get('aaroh_role')?.value;
  const role = rawRole?.toLowerCase().trim();
  const { pathname } = request.nextUrl;
  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  if (
    normalizedPath.startsWith("/api") || 
    normalizedPath.startsWith("/auth") || 
    normalizedPath.startsWith("/dashboard-api") ||
    normalizedPath.startsWith("/_next") ||
    normalizedPath.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Validate token: prevent strings like "null", "undefined" or empty from being treated as authenticated
  const isAuthenticated = !!(token && token !== "undefined" && token !== "null" && token.trim().length > 0);

  // Debug logging for development (visible in terminal)
  const debugInfo = {
    path: normalizedPath,
    hasToken: !!token,
    tokenValue: token ? `${token.substring(0, 20)}...` : "none",
    role: role,
    isAuthenticated: isAuthenticated,
  };
  console.log(`[Middleware] Request:`, debugInfo);

  const isAuthRoute = ["/login", "/admin/login", "/register", "/signup"].includes(normalizedPath);
  const isProtectedDashboard = normalizedPath.startsWith('/dashboard');
  const isProtectedAdmin = normalizedPath.startsWith('/admin') && normalizedPath !== "/admin/login";

  if (isAuthRoute && isAuthenticated) {
    const target = role === 'admin' ? '/admin' : '/dashboard';
    console.log(`[Middleware] Authenticated user on auth route. Redirecting to ${target}`);
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isProtectedDashboard && !isAuthenticated) {
    console.log(`[Middleware] Unauthenticated access to dashboard. Redirecting to /login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isProtectedAdmin) {
    if (!isAuthenticated) {
      console.log(`[Middleware] Unauthenticated access to admin. Redirecting to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role && role !== 'admin') {
      console.log(`[Middleware] Non-admin access to admin area. Redirecting to /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/admin/login',
    '/register',
    '/signup',
  ],
};
