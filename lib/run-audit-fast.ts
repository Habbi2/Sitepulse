import { normalizeUrl } from './normalize';
import { fetchHtml, FetchTimeoutError, NonHtmlError, HttpStatusError } from './fetch-html';
import { extractMetrics } from './extract-metrics';
import { aggregateMetrics } from './aggregate-metrics';
import { computeScores } from './compute-scores';
import { deriveIssues } from './derive-issues';
import { Report } from '../types/report';
import { randomUUID } from 'crypto';

export interface RunAuditOptions { previousId?: string }

export interface AuditResult { report?: Report; error?: { code: string; message: string; hint?: string }; }

export async function runAuditFast(rawUrl: string, opts: RunAuditOptions = {}): Promise<AuditResult> {
  const norm = normalizeUrl(rawUrl);
  if (!norm.ok || !norm.url) {
    return { error: { code: 'INVALID_URL', message: norm.error || 'Invalid URL', hint: 'Ensure the URL includes a valid protocol (https://) and is publicly reachable.' } };
  }
  const url = norm.url;
  let fetchRes;
  try {
    fetchRes = await fetchHtml(url);
  } catch (e: any) {
    if (e instanceof FetchTimeoutError) return { error: { code: 'TIMEOUT', message: 'Request timed out fetching the page.', hint: 'Try again or check server responsiveness / CDN caching.' } };
    if (e instanceof NonHtmlError) return { error: { code: 'NON_HTML', message: 'URL did not return HTML content.', hint: 'Provide a direct page URL (not a file like PDF or image).' } };
    if (e instanceof HttpStatusError) return { error: { code: 'HTTP_ERROR', message: `Upstream returned status ${e.status}.`, hint: e.status >= 500 ? 'Server error at the target site.' : 'Client error – the page may not exist or requires auth.' } };
    return { error: { code: 'FETCH_ERROR', message: 'Network error fetching URL.', hint: 'Verify DNS, HTTPS certificate, and that the site is accessible from the public internet.' } };
  }
  const parsed = extractMetrics(fetchRes.html, url);
  const metrics = aggregateMetrics(parsed, fetchRes);
  const { scores, overall } = computeScores(metrics);
  const issues = deriveIssues({ metrics, scores });
  const pageTitle = parsed.pageTitle && parsed.pageTitle.length > 0
    ? parsed.pageTitle
    : new URL(url).hostname.replace(/^www\./, '');
  const report: Report = {
    id: randomUUID(),
    version: 1,
    url,
    pageTitle,
    fetchedAt: new Date().toISOString(),
    overall,
    scores: scores as any,
    metrics: metrics as any,
    issues,
    previousId: opts.previousId
  };
  return { report };
}
