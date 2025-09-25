import { NextRequest } from 'next/server';
import { reportCache } from '../../../../lib/cache';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const report = reportCache.get(id);
  if (!report) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify(report), { status: 200, headers: { 'content-type': 'application/json' } });
}
