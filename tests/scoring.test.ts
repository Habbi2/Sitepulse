import assert from 'node:assert/strict';
import { computeScores } from '../lib/compute-scores';

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

const { scores, overall } = computeScores(base());
assert.ok(scores.performance > 40, 'performance > 40');
assert.ok(overall > 40, 'overall > 40');

// Security baseline test
{
  const m = base();
  m.security.headers = { csp: false, xfo: false, referrer: false, permissions: false };
  const { scores: s2 } = computeScores(m);
  assert.ok(s2.security >= 40, 'HTTPS baseline >= 40');
}

// Mixed content cap test
{
  const m = base();
  m.security.mixedContent = 3; // penalty + cap
  const { scores: s3 } = computeScores(m);
  assert.ok(s3.security <= 70, 'mixed content cap at 70');
}

console.log('scoring.test.ts passed');
