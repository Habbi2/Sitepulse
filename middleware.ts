import { NextRequest, NextResponse } from 'next/server';

// Block obviously invalid / local hosts early (defense in depth; normalizeUrl also handles many cases)
const blocked = [/^https?:\/\/localhost/i, /^https?:\/\/127\.0\.0\.1/i, /^https?:\/\/0\.0\.0\.0/i, /^https?:\/\/10\./, /^https?:\/\/192\.168\./, /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\./];

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/audit') {
    // Attempt to inspect body via clone only if JSON; otherwise rely on downstream check
    const urlParam = req.nextUrl.searchParams.get('url');
    if (urlParam && isBlocked(urlParam)) {
      return json(400, { error: { code: 'BLOCKED_HOST', message: 'Local/private network targets not allowed.' } });
    }
  }
  return NextResponse.next();
}

function isBlocked(u: string) {
  return blocked.some(r => r.test(u));
}

function json(status: number, data: any) {
  return new NextResponse(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

export const config = {
  matcher: ['/api/:path*']
};
