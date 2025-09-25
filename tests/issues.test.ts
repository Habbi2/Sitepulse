import assert from 'node:assert/strict';
import { computeScores } from '../lib/compute-scores';
import { deriveIssues } from '../lib/derive-issues';

function base() {
  return {
    timing: { ttfbMs: 400 },
    size: { totalBytes: 420_000, imagesBytes: 0, cssBytes: 0, jsBytes: 50_000 },
    counts: { requests: 40, img: 10, script: 6, css: 2 },
    accessibility: { altCoverage: 0.9, h1Count: 1, outlineIssues: 0, landmarks: 3, hasLang: true },
    seo: { titleChars: 60, metaDescriptionChars: 140, hasCanonical: true, h1Exists: true },
    security: { https: true, headers: { csp: true, xfo: false, referrer: false, permissions: false }, mixedContent: 0 },
    ux: { hasViewport: true, hasFavicon: true, fontDisplayPercent: 80, jsWeightKb: 50 }
  } as any;
}

// Missing title detection
{
  const m = base();
  m.seo.titleChars = 0;
  const { scores } = computeScores(m);
  const issues = deriveIssues({ metrics: m, scores });
  assert.ok(issues.some(i => i.id === 'missing-title'), 'missing-title issue present');
}

// Few issues on mostly good baseline
{
  const m = base();
  const { scores } = computeScores(m);
  const issues = deriveIssues({ metrics: m, scores });
  assert.ok(issues.length <= 3, 'baseline few issues');
}

console.log('issues.test.ts passed');
