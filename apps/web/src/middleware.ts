import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Forward pathname so StorefrontShell (server component) can detect /admin without usePathname
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  const sessionToken = request.cookies.get('ttrc_session')?.value;
  const isTestBypass =
    request.cookies.get('ttrc_test_bypass')?.value === 'true' &&
    (process.env.E2E_TEST === 'true' || process.env.ALLOW_TEST_BYPASS === 'true');

  // Decode JWT payload without signature check in Edge Middleware for ultra-fast response
  let userPayload: { userId: string; email: string; role: string } | null = null;
  if (sessionToken) {
    try {
      const parts = sessionToken.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        userPayload = JSON.parse(payloadJson);
      }
    } catch {
      userPayload = null;
    }
  }

  // 1. Protect Customer Account & Checkout Routes
  if (!userPayload && !isTestBypass && (pathname.startsWith('/account') || pathname.startsWith('/checkout'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Protect Admin Routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !isTestBypass) {
    if (!userPayload) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    if (userPayload.role !== 'admin' && userPayload.role !== 'staff') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
