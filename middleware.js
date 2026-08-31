import { NextResponse } from 'next/server';

export const config = {
  // Match all routes except static assets, images, and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|logo.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

export function middleware(request) {
  const response = NextResponse.next();

  // --- Security headers ---
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '0'); // Modern browsers; CSP is the real defense
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );

  // Content-Security-Policy — intentionally permissive on styles/scripts
  // because Next.js inline scripts + Google OAuth need flexibility.
  // Incrementally tighten as you audit third-party scripts.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.recurly.com https://www.googletagmanager.com https://www.googleadservices.com https://pagead2.googlesyndication.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
    "frame-src 'self' https://accounts.google.com https://razorpay.com https://*.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // --- Block common attack paths ---
  const pathname = request.nextUrl.pathname;

  // Block dotfiles and common exploit paths
  if (
    pathname.startsWith('/.') ||
    pathname.includes('/.env') ||
    pathname.includes('/wp-') ||
    pathname.includes('/xmlrpc') ||
    pathname.includes('/phpmyadmin') ||
    pathname.includes('/wp-admin') ||
    pathname.includes('/.git')
  ) {
    return new NextResponse(null, { status: 404 });
  }

  return response;
}
