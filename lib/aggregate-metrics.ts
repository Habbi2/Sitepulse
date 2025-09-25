// Metrics aggregation (T06)
// Combines fetchHtml result headers & timing with parsed DOM metrics.
import { RawMetrics } from '../types/report';
import { FetchHtmlResult } from './fetch-html';

function headerPresent(headers: Record<string,string>, name: string) {
  return Object.prototype.hasOwnProperty.call(headers, name);
}

export interface AggregateOptions {
  // reserved for future (e.g., allowlist of security headers)
}

export function aggregateMetrics(parsed: RawMetrics, fetchRes: FetchHtmlResult, _opts: AggregateOptions = {}): RawMetrics {
  // Clone to avoid mutation side-effects
  const metrics: RawMetrics = JSON.parse(JSON.stringify(parsed));
  metrics.timing.ttfbMs = fetchRes.ttfbMs;

  // Security headers presence
  const h = fetchRes.headers;
  const csp = !!(h['content-security-policy']);
  const xfo = !!(h['x-frame-options']);
  const referrer = !!(h['referrer-policy']);
  const permissions = !!(h['permissions-policy']);
  metrics.security.headers = { csp, xfo, referrer, permissions } as any;

  // If content-length present and < current total, trust network size
  const cl = parseInt(h['content-length'] || '0', 10);
  if (cl && cl > 0 && cl < metrics.size.totalBytes) {
    metrics.size.totalBytes = cl; // network compressed size vs uncompressed HTML; keep simple for MVP
  }

  return metrics;
}
