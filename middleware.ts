import { NextRequest, NextResponse } from 'next/server';

// Block obviously invalid / local hosts early (defense in depth; normalizeUrl also handles many cases)
const blocked = [/^https?:\/\/localhost/i, /^https?:\/\/127\.0\.0\.1/i, /^https?:\/\/0\.0\.0\.0/i, /^https?:\/\/10\./, /^https?:\/\/192\.168\./, /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\./];

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/audit') {
    const urlParam = req.nextUrl.searchParams.get('url');
    if (urlParam && isBlocked(urlParam)) {
      return json(400, { error: { code: 'BLOCKED_HOST', message: 'Local/private network targets not allowed.' } });
    }
  }
  const res = NextResponse.next();
  // Baseline CSP (adjust as needed if adding external resources)
  // Using report-only for first pass would be possible; here we enforce.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // 'unsafe-inline' needed only if inline scripts exist; can remove if none
    "style-src 'self' 'unsafe-inline'", // Tailwind injects styles; remove unsafe-inline if extracted
    "img-src 'self' data:" ,
    "font-src 'self' data:",
    "connect-src 'self'", // adjust if calling external APIs
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Permissions-Policy', 'geolocation=()');
  return res;
}

function isBlocked(u: string) {
  return blocked.some(r => r.test(u));
}

function json(status: number, data: any) {
  return new NextResponse(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

// Apply to all routes (API + pages) for consistent security headers
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
