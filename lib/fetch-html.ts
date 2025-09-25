// Fast HTML fetch helper (T04)
// Responsibilities:
// - Fetch URL (GET) with timeout (default 6000ms)
// - Measure approximate TTFB (ms) (time until headers resolved)
// - Validate content-type begins with text/html
// - Enforce max HTML size (2MB) while streaming; truncate if exceeded
// - Return normalized headers object + html string + status info
// - Throw typed errors for timeout & non-HTML content

export const USER_AGENT = process.env.SITEPULSE_UA || 'SitePulseBot/0.1 (+https://sitepulse.app)';
const MAX_HTML_BYTES = 2_000_000; // 2 MB cap for MVP

export class FetchTimeoutError extends Error {
  constructor(public url: string, public timeoutMs: number) {
    super(`Fetch timed out after ${timeoutMs}ms for ${url}`);
    this.name = 'FetchTimeoutError';
  }
}

export class NonHtmlError extends Error {
  constructor(public url: string, public contentType?: string) {
    super(`Content-Type not HTML for ${url} (${contentType || 'unknown'})`);
    this.name = 'NonHtmlError';
  }
}

export class HttpStatusError extends Error {
  constructor(public url: string, public status: number) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpStatusError';
  }
}

export interface FetchHtmlResult {
  url: string;
  status: number;
  headers: Record<string, string>;
  ttfbMs: number;
  html: string;
  truncated: boolean;
}

export async function fetchHtml(targetUrl: string, timeoutMs = 6000): Promise<FetchHtmlResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT
      }
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') throw new FetchTimeoutError(targetUrl, timeoutMs);
    throw err;
  }
  const ttfbMs = Date.now() - start;
  clearTimeout(timeout);

  const status = response.status;
  if (status >= 400) {
    // We still might want body for some future heuristics, but for MVP treat as error.
    throw new HttpStatusError(targetUrl, status);
  }

  const headers: Record<string, string> = {};
  response.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  const contentType = headers['content-type'];
  if (!contentType || !contentType.toLowerCase().startsWith('text/html')) {
    throw new NonHtmlError(targetUrl, contentType);
  }

  // Stream & enforce max size
  let truncated = false;
  let bytesCollected = 0;
  const reader = (response.body as any)?.getReader ? (response.body as any).getReader() : null;
  let chunks: Uint8Array[] = [];
  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        bytesCollected += value.byteLength;
        if (bytesCollected > MAX_HTML_BYTES) {
          const allowed = MAX_HTML_BYTES - (bytesCollected - value.byteLength);
            if (allowed > 0) {
              chunks.push(value.subarray(0, allowed));
            }
          truncated = true;
          break;
        }
        chunks.push(value);
      }
    }
  } else {
    // Fallback for environments without getReader (Node polyfill). Use arrayBuffer but guard by content-length.
    const cl = parseInt(headers['content-length'] || '0', 10);
    if (cl && cl > MAX_HTML_BYTES) {
      truncated = true;
    }
    const buffer = await response.arrayBuffer();
    const buf = new Uint8Array(buffer);
    chunks = [truncated ? buf.subarray(0, MAX_HTML_BYTES) : buf];
  }

  // Decode as UTF-8 (assuming; could enhance via content-type charset detection)
  const total = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const html = decoder.decode(merged);

  return { url: targetUrl, status, headers, ttfbMs, html, truncated };
}

// Lightweight helper to safely attempt and return null instead of throwing (optional usage later)
export async function tryFetchHtml(url: string): Promise<FetchHtmlResult | null> {
  try {
    return await fetchHtml(url);
  } catch {
    return null;
  }
}
