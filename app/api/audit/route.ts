import { NextRequest } from 'next/server';
import { runAuditFast } from '../../../lib/run-audit-fast';
import { reportCache } from '../../../lib/cache';
import { takeToken } from '../../../lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const url = body?.url;
  if (!url || typeof url !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const previousId = typeof body.previousId === 'string' ? body.previousId : undefined;

  // Basic rate limiting using IP (falls back to anonymous key)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anon';
  const rl = takeToken(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: { code: 'RATE_LIMIT', message: 'Too many audits, slow down.', hint: 'Limit ~30 audits per minute per IP.' } }), { status: 429, headers: { 'content-type': 'application/json' } });
  }
  const result = await runAuditFast(url, { previousId });
  if (result.error) {
    const status = result.error.code === 'INVALID_URL' || result.error.code === 'NON_HTML' ? 400 : (result.error.code === 'HTTP_ERROR' ? 502 : 504);
    return new Response(JSON.stringify({ error: result.error }), { status, headers: { 'content-type': 'application/json' } });
  }
  const report = result.report!;
  reportCache.set(report.id, report);
  return new Response(JSON.stringify(report), { status: 200, headers: { 'content-type': 'application/json' } });
}
