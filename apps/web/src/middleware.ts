import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Forward pathname so StorefrontShell (server component) can detect /admin without usePathname
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  const sessionToken = request.cookies.get('ttrc_session')?.value;
  const isProd = process.env.NODE_ENV === 'production';
  const isTestBypass =
    !isProd &&
    request.cookies.get('ttrc_test_bypass')?.value === 'true' &&
    (process.env.E2E_TEST === 'true' || process.env.ALLOW_TEST_BYPASS === 'true');

  // Verify JWT signature using native Web Crypto (Edge-compatible)
  let userPayload: { userId: string; email: string; role: string } | null = null;
  if (sessionToken) {
    try {
      const parts = sessionToken.split('.');
      if (parts.length === 3) {
        const [headerB64, payloadB64, signatureB64] = parts;
        const secret = process.env.JWT_SECRET || 'ttrc_store_jwt_secret_2026_key_secure_auth';
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          enc.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['verify']
        );
        const data = enc.encode(`${headerB64}.${payloadB64}`);
        const binarySig = Uint8Array.from(
          atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
          (c) => c.charCodeAt(0)
        );
        const isValid = await crypto.subtle.verify('HMAC', key, binarySig, data);
        if (isValid) {
          const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
          const parsed = JSON.parse(payloadJson);
          if (!parsed.exp || Date.now() < parsed.exp * 1000) {
            userPayload = parsed;
          }
        }
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
