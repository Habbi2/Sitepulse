// URL normalization & validation (T03)
// - Ensures protocol (http/https) present
// - Strips fragment, preserves search
// - Lowercases host
// - Rejects non-http(s) schemes & local-network private addresses for MVP safety

export interface NormalizedUrlResult {
  ok: boolean;
  url?: string;
  error?: string;
}

const PRIVATE_HOST_REGEX = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i;

export function normalizeUrl(input: string): NormalizedUrlResult {
  if (!input || !input.trim()) return { ok: false, error: 'Empty URL' };
  let work = input.trim();
  if (!/^https?:\/\//i.test(work)) {
    work = 'https://' + work; // prefer https default
  }
  try {
    const u = new URL(work);
    if (!/^https?:$/i.test(u.protocol)) {
      return { ok: false, error: 'Only http/https allowed' };
    }
    const hostLower = u.hostname.toLowerCase();
    if (PRIVATE_HOST_REGEX.test(hostLower)) {
      return { ok: false, error: 'Local/private hosts not allowed for public audit' };
    }
    // Basic private IP rejection (simple heuristics)
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostLower)) {
      return { ok: false, error: 'Private network IP not allowed' };
    }
    u.hash = '';
    // Remove default ports
    if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) {
      u.port = '';
    }
    // Lowercase host
    const normalized = `${u.protocol}//${hostLower}${u.port ? ':' + u.port : ''}${u.pathname || '/'}${u.search}`;
    return { ok: true, url: normalized };
  } catch (e: any) {
    return { ok: false, error: 'Invalid URL' };
  }
}
