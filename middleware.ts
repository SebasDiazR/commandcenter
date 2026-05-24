import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // If already authenticated, redirect away from /login
    if (pathname.startsWith('/login')) {
      const token = request.cookies.get('hks-auth')?.value;
      if (token === 'authenticated') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // Check auth cookie
  const token = request.cookies.get('hks-auth')?.value;
  if (token !== 'authenticated') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and Next internals.
     */
    '/((?!_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)',
  ],
};
