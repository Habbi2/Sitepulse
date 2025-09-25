// Issue derivation rules (T09)
import { RawMetrics, PillarScores, Issue } from '../types/report';

interface DeriveParams {
  metrics: RawMetrics;
  scores: PillarScores;
}

interface RuleContext extends DeriveParams {}

interface Rule {
  id: string;
  test(ctx: RuleContext): boolean;
  build(ctx: RuleContext): Issue;
}

function impact(severity: Issue['severity']): number {
  return severity === 'high' ? 9 : severity === 'medium' ? 6 : 3;
}

// Helper to estimate potential gain: difference to a target pillar cap.
function estimateGain(current: number, target: number, max = 15) {
  return Math.min(Math.max(Math.round(target - current), 0), max);
}

const rules: Rule[] = [
  // -------------------- SEO Optimization (non-fatal) --------------------
  {
    id: 'title-suboptimal-length',
    test: ({ metrics }) => metrics.seo.titleChars > 0 && (metrics.seo.titleChars < 30 || metrics.seo.titleChars > 70) && metrics.seo.titleChars !== 0,
    build: ({ metrics, scores }) => ({
      id: 'title-suboptimal-length',
      category: 'seo',
      severity: 'low',
      why: `Title length ${metrics.seo.titleChars} chars is outside the broadly optimal 30–70 range (ideal 55–65).`,
      fix: 'Refine <title> to a concise descriptive phrase (55–65 chars sweet spot).',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.seo, Math.min(100, scores.seo + 4))
    })
  },
  {
    id: 'meta-description-short',
    test: ({ metrics }) => metrics.seo.metaDescriptionChars > 0 && metrics.seo.metaDescriptionChars < 100,
    build: ({ metrics, scores }) => ({
      id: 'meta-description-short',
      category: 'seo',
      severity: 'low',
      why: `Meta description only ${metrics.seo.metaDescriptionChars} chars; may under-inform snippets (aim 120–160).`,
      fix: 'Expand meta description to 120–160 characters with compelling summary + keyword context.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.seo, Math.min(100, scores.seo + 3))
    })
  },
  {
    id: 'meta-description-long',
    test: ({ metrics }) => metrics.seo.metaDescriptionChars > 180 && metrics.seo.metaDescriptionChars < 300,
    build: ({ metrics, scores }) => ({
      id: 'meta-description-long',
      category: 'seo',
      severity: 'low',
      why: `Meta description ${metrics.seo.metaDescriptionChars} chars; may be truncated in SERP.`,
      fix: 'Trim description toward 160 chars while preserving key intent / call to action.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.seo, Math.min(100, scores.seo + 2))
    })
  },
  // -------------------- Performance Optimization --------------------
  {
    id: 'moderate-ttfb',
    test: ({ metrics }) => metrics.timing.ttfbMs > 600 && metrics.timing.ttfbMs <= 1200,
    build: ({ metrics, scores }) => ({
      id: 'moderate-ttfb',
      category: 'performance',
      severity: 'low',
      why: `TTFB ${metrics.timing.ttfbMs}ms could be improved (ideal <200ms; warning >600ms).`,
      fix: 'Introduce edge caching / preload critical data / reduce server cold start.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.performance, Math.min(100, scores.performance + 5))
    })
  },
  {
    id: 'moderate-page-weight',
    test: ({ metrics }) => metrics.size.totalBytes > 600_000 && metrics.size.totalBytes <= 2_000_000,
    build: ({ metrics, scores }) => ({
      id: 'moderate-page-weight',
      category: 'performance',
      severity: 'low',
      why: `Page weight ${(metrics.size.totalBytes/1024).toFixed(0)}KB could be slimmer (budget ≈300KB critical HTML+above fold).`,
      fix: 'Remove unused scripts/styles, leverage code splitting & compression, defer non-critical assets.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.performance, Math.min(100, scores.performance + 6))
    })
  },
  {
    id: 'moderate-request-count',
    test: ({ metrics }) => metrics.counts.requests > 40 && metrics.counts.requests <= 80,
    build: ({ metrics, scores }) => ({
      id: 'moderate-request-count',
      category: 'performance',
      severity: 'low',
      why: `${metrics.counts.requests} requests; consider bundling or lazy loading to reduce overhead.`,
      fix: 'Bundle / consolidate assets, inline tiny critical CSS, defer analytics until idle.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.performance, Math.min(100, scores.performance + 4))
    })
  },
  // -------------------- Accessibility Optimization --------------------
  {
    id: 'partial-alt-coverage',
    test: ({ metrics }) => metrics.accessibility.altCoverage >= 0.6 && metrics.accessibility.altCoverage < 0.9,
    build: ({ metrics, scores }) => ({
      id: 'partial-alt-coverage',
      category: 'accessibility',
      severity: 'low',
      why: `${(metrics.accessibility.altCoverage*100).toFixed(0)}% of images have alt text; aim for 100% (decoratives empty).`,
      fix: 'Provide alt for informative images; use alt="" for decorative ones.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.accessibility, Math.min(100, scores.accessibility + 4))
    })
  },
  // -------------------- UX Optimization --------------------
  {
    id: 'high-js-weight',
    test: ({ metrics }) => metrics.ux.jsWeightKb > 300 && metrics.ux.jsWeightKb <= 900,
    build: ({ metrics, scores }) => ({
      id: 'high-js-weight',
      category: 'ux',
      severity: 'low',
      why: `JS payload ${(metrics.ux.jsWeightKb).toFixed(0)}KB; can affect interactivity & memory on low-end devices.`,
      fix: 'Remove unused libs, enable tree-shaking, defer non-critical scripts, prefer server components.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.ux, Math.min(100, scores.ux + 5))
    })
  },
  {
    id: 'no-font-display',
    test: ({ metrics }) => metrics.ux.fontDisplayPercent === 0 && metrics.ux.jsWeightKb < 15_000, // avoid false zero when no fonts
    build: ({ scores }) => ({
      id: 'no-font-display',
      category: 'ux',
      severity: 'low',
      why: 'No @font-face uses font-display; may cause FOIT (invisible text).',
      fix: 'Add font-display: swap (or optional) to custom font declarations / Google Fonts URLs.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.ux, Math.min(100, scores.ux + 4))
    })
  },
  // -------------------- Existing Core Rules --------------------
  {
    id: 'missing-title',
    test: ({ metrics }) => metrics.seo.titleChars === 0,
    build: ({ scores }) => ({
      id: 'missing-title',
      category: 'seo',
      severity: 'high',
      why: 'Document has no <title>; search engines and users rely on it for context.',
      fix: 'Add a concise, descriptive <title> (55–65 characters ideal).',
      impactScore: impact('high'),
      estScoreGain: estimateGain(scores.seo, Math.max(70, scores.seo + 25))
    })
  },
  {
    id: 'missing-meta-description',
    test: ({ metrics }) => metrics.seo.metaDescriptionChars === 0,
    build: ({ scores }) => ({
      id: 'missing-meta-description',
      category: 'seo',
      severity: 'high',
      why: 'No meta description found; reduces click-through rate and snippet quality.',
      fix: 'Add <meta name="description" content="..." /> (120–160 chars).',
      impactScore: impact('high'),
      estScoreGain: estimateGain(scores.seo, Math.max(75, scores.seo + 20))
    })
  },
  {
    id: 'duplicate-h1',
    test: ({ metrics }) => metrics.accessibility.h1Count > 1,
    build: ({ metrics, scores }) => ({
      id: 'duplicate-h1',
      category: 'accessibility',
      severity: 'medium',
      why: `Found ${metrics.accessibility.h1Count} <h1> elements; multiple H1s can confuse assistive tech.`,
      fix: 'Use a single <h1> for page topic; downgrade others to <h2>/<h3>.',
      impactScore: impact('medium'),
      estScoreGain: estimateGain(scores.accessibility, scores.accessibility + 8)
    })
  },
  {
    id: 'no-h1',
    test: ({ metrics }) => metrics.accessibility.h1Count === 0,
    build: ({ scores }) => ({
      id: 'no-h1',
      category: 'accessibility',
      severity: 'medium',
      why: 'No <h1> heading; screen readers rely on a primary heading for orientation.',
      fix: 'Add a single <h1> summarizing the page purpose.',
      impactScore: impact('medium'),
      estScoreGain: estimateGain(scores.accessibility, scores.accessibility + 12)
    })
  },
  {
    id: 'low-alt-coverage',
    test: ({ metrics }) => metrics.accessibility.altCoverage < 0.6,
    build: ({ metrics, scores }) => ({
      id: 'low-alt-coverage',
      category: 'accessibility',
      severity: metrics.accessibility.altCoverage < 0.3 ? 'high' : 'medium',
      why: `Only ${(metrics.accessibility.altCoverage * 100).toFixed(0)}% of images have alt text.`,
      fix: 'Add descriptive alt text to informative images; mark decorative images with empty alt="".',
      impactScore: impact(metrics.accessibility.altCoverage < 0.3 ? 'high' : 'medium'),
      estScoreGain: estimateGain(scores.accessibility, scores.accessibility + 15)
    })
  },
  {
    id: 'outline-issues',
    test: ({ metrics }) => metrics.accessibility.outlineIssues > 2,
    build: ({ metrics, scores }) => ({
      id: 'outline-issues',
      category: 'accessibility',
      severity: 'low',
      why: `${metrics.accessibility.outlineIssues} heading outline irregularities (skipped levels or extra H1).`,
      fix: 'Ensure heading levels increase by one without skipping (e.g., h2 after h1).',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.accessibility, scores.accessibility + 5)
    })
  },
  {
    id: 'missing-lang',
    test: ({ metrics }) => !metrics.accessibility.hasLang,
    build: ({ scores }) => ({
      id: 'missing-lang',
      category: 'accessibility',
      severity: 'medium',
      why: '<html> lang attribute missing; assistive tech cannot determine language.',
      fix: 'Add <html lang="en"> (or appropriate language code).',
      impactScore: impact('medium'),
      estScoreGain: estimateGain(scores.accessibility, scores.accessibility + 6)
    })
  },
  {
    id: 'large-page-weight',
    test: ({ metrics }) => metrics.size.totalBytes > 2_000_000,
    build: ({ metrics, scores }) => ({
      id: 'large-page-weight',
      category: 'performance',
      severity: metrics.size.totalBytes > 4_000_000 ? 'high' : 'medium',
      why: `HTML size ${(metrics.size.totalBytes / 1024).toFixed(0)}KB exceeds recommended budget (≤300KB ideal).`,
      fix: 'Defer non-critical scripts, compress assets, remove unused markup.',
      impactScore: impact(metrics.size.totalBytes > 4_000_000 ? 'high' : 'medium'),
      estScoreGain: estimateGain(scores.performance, scores.performance + 18)
    })
  },
  {
    id: 'slow-ttfb',
    test: ({ metrics }) => metrics.timing.ttfbMs > 1200,
    build: ({ metrics, scores }) => ({
      id: 'slow-ttfb',
      category: 'performance',
      severity: metrics.timing.ttfbMs > 2000 ? 'high' : 'medium',
      why: `TTFB ${metrics.timing.ttfbMs}ms is high; indicates server/network latency.`,
      fix: 'Enable caching/CDN, optimize server rendering, reduce cold start overhead.',
      impactScore: impact(metrics.timing.ttfbMs > 2000 ? 'high' : 'medium'),
      estScoreGain: estimateGain(scores.performance, scores.performance + 12)
    })
  },
  {
    id: 'many-requests',
    test: ({ metrics }) => metrics.counts.requests > 80,
    build: ({ metrics, scores }) => ({
      id: 'many-requests',
      category: 'performance',
      severity: 'low',
      why: `${metrics.counts.requests} requests; high connection overhead can delay rendering.`,
      fix: 'Combine files, leverage HTTP/2 multiplexing, code-split only essentials.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.performance, scores.performance + 6)
    })
  },
  {
    id: 'missing-viewport',
    test: ({ metrics }) => !metrics.ux.hasViewport,
    build: ({ scores }) => ({
      id: 'missing-viewport',
      category: 'ux',
      severity: 'high',
      why: 'Responsive viewport meta missing; mobile layout may be broken.',
      fix: 'Add <meta name="viewport" content="width=device-width,initial-scale=1" />.',
      impactScore: impact('high'),
      estScoreGain: estimateGain(scores.ux, scores.ux + 20)
    })
  },
  {
    id: 'no-favicon',
    test: ({ metrics }) => !metrics.ux.hasFavicon,
    build: ({ scores }) => ({
      id: 'no-favicon',
      category: 'ux',
      severity: 'low',
      why: 'No favicon detected; reduces recognizability in tabs/history.',
      fix: 'Add <link rel="icon" href="/favicon.ico" sizes="any">.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.ux, scores.ux + 4)
    })
  },
  {
    id: 'low-font-display-adoption',
    test: ({ metrics }) => metrics.ux.fontDisplayPercent < 40 && metrics.ux.fontDisplayPercent > 0,
    build: ({ metrics, scores }) => ({
      id: 'low-font-display-adoption',
      category: 'ux',
      severity: 'low',
      why: `Only ${metrics.ux.fontDisplayPercent.toFixed(0)}% of font-face rules provide font-display for faster text render.`,
      fix: 'Add font-display: swap (or optional) to @font-face or use &display=swap on Google Fonts URLs.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.ux, scores.ux + 5)
    })
  },
  {
    id: 'mixed-content',
    test: ({ metrics }) => metrics.security.mixedContent > 0,
    build: ({ metrics, scores }) => ({
      id: 'mixed-content',
      category: 'security',
      severity: 'medium',
      why: `${metrics.security.mixedContent} insecure http:// sub-resources loaded on an HTTPS page.`,
      fix: 'Serve resources over HTTPS or remove them to avoid security warnings.',
      impactScore: impact('medium'),
      estScoreGain: estimateGain(scores.security, scores.security + 10)
    })
  },
  {
    id: 'missing-csp',
    test: ({ metrics }) => !metrics.security.headers.csp,
    build: ({ scores }) => ({
      id: 'missing-csp',
      category: 'security',
      severity: 'medium',
      why: 'No Content-Security-Policy header; increases XSS risk.',
      fix: 'Add a CSP header (start with default-src \u0027self\u0027; object-src \u0027none\u0027; frame-ancestors \u0027none\u0027).',
      impactScore: impact('medium'),
      estScoreGain: estimateGain(scores.security, scores.security + 8)
    })
  },
  {
    id: 'missing-referrer-policy',
    test: ({ metrics }) => !metrics.security.headers.referrer,
    build: ({ scores }) => ({
      id: 'missing-referrer-policy',
      category: 'security',
      severity: 'low',
      why: 'No Referrer-Policy header; may leak full URLs to third parties.',
      fix: 'Add Referrer-Policy: strict-origin-when-cross-origin.',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.security, scores.security + 4)
    })
  },
  {
    id: 'missing-xfo',
    test: ({ metrics }) => !metrics.security.headers.xfo,
    build: ({ scores }) => ({
      id: 'missing-xfo',
      category: 'security',
      severity: 'low',
      why: 'No X-Frame-Options header; clickjacking protection absent.',
      fix: 'Add X-Frame-Options: DENY (or use frame-ancestors in CSP).',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.security, scores.security + 3)
    })
  },
  {
    id: 'missing-permissions-policy',
    test: ({ metrics }) => !metrics.security.headers.permissions,
    build: ({ scores }) => ({
      id: 'missing-permissions-policy',
      category: 'security',
      severity: 'low',
      why: 'No Permissions-Policy header; cannot restrict powerful APIs usage.',
      fix: 'Add Permissions-Policy header limiting features (e.g., geolocation=()).',
      impactScore: impact('low'),
      estScoreGain: estimateGain(scores.security, scores.security + 3)
    })
  }
];

export function deriveIssues(params: DeriveParams): Issue[] {
  const ctx: RuleContext = { ...params };
  const issues: Issue[] = [];
  for (const rule of rules) {
    if (rule.test(ctx)) issues.push(rule.build(ctx));
  }
  // Sort by impactScore desc then estimated gain desc
  issues.sort((a, b) => b.impactScore - a.impactScore || b.estScoreGain - a.estScoreGain);
  return issues;
}
