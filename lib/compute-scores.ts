// Scoring functions (T08)
// Convert raw metrics into pillar scores and overall composite.
import { RawMetrics, PillarScores } from '../types/report';

export interface ScoreDetail {
  scores: PillarScores;
  overall: number;
  caps: { [k in keyof PillarScores]?: string };
}

// Helper: clamp linear mapping
function linear(value: number, min: number, max: number) {
  if (value <= min) return 100;
  if (value >= max) return 0;
  const ratio = (value - min) / (max - min);
  return Math.max(0, Math.min(100, 100 - ratio * 100));
}

function bandIdeal(value: number, idealMin: number, idealMax: number, hardMin: number, hardMax: number) {
  if (value >= idealMin && value <= idealMax) return 100;
  if (value <= hardMin || value >= hardMax) return 20; // penalty zone
  // Interpolate toward edges
  if (value < idealMin) {
    const span = idealMin - hardMin;
    return 20 + ((value - hardMin) / span) * (100 - 20);
  } else {
    const span = hardMax - idealMax;
    return 20 + ((hardMax - value) / span) * (100 - 20);
  }
}

export function computeScores(metrics: RawMetrics): ScoreDetail {
  const caps: ScoreDetail['caps'] = {};

  // Performance
  const ttfbScore = linear(metrics.timing.ttfbMs, 200, 1500); // 200ms ideal, 1500ms worst
  const totalKb = metrics.size.totalBytes / 1024;
  const weightScore = linear(totalKb, 300, 3000); // 300KB ideal, 3MB worst
  const requestScore = linear(metrics.counts.requests, 15, 120); // 15 ideal, 120 worst
  // Combine simple average (could weight differently later)
  const performance = weightedAvg([
    [ttfbScore, 0.4],
    [weightScore, 0.4],
    [requestScore, 0.2]
  ]);

  // Accessibility
  const altScore = metrics.accessibility.altCoverage * 100;
  const outlinePenalty = Math.min(metrics.accessibility.outlineIssues * 8, 60); // each issue -8 until -60
  let accessibility = altScore - outlinePenalty;
  if (!metrics.accessibility.hasLang) accessibility -= 10;
  if (metrics.accessibility.h1Count === 0) accessibility -= 20;
  accessibility = clamp0to100(accessibility);

  // SEO
  const titleScore = bandIdeal(metrics.seo.titleChars, 55, 65, 10, 90);
  const descScore = metrics.seo.metaDescriptionChars === 0 ? 25 : bandIdeal(metrics.seo.metaDescriptionChars, 120, 160, 30, 250);
  let seo = weightedAvg([
    [titleScore, 0.4],
    [descScore, 0.4],
    [metrics.seo.hasCanonical ? 100 : 40, 0.1],
    [metrics.seo.h1Exists ? 100 : 30, 0.1]
  ]);
  if (metrics.seo.titleChars === 0) {
    seo = Math.min(seo, 40); caps.seo = 'Missing title caps SEO';
  }
  if (metrics.seo.metaDescriptionChars === 0) {
    seo = Math.min(seo, 55); caps.seo = (caps.seo ? caps.seo + '; ' : '') + 'Missing meta description';
  }

  // Security
  const headerPresence = [
    metrics.security.headers.csp,
    metrics.security.headers.xfo,
    metrics.security.headers.referrer,
    metrics.security.headers.permissions
  ];
  const headerCount = headerPresence.filter(Boolean).length;
  let headerScore = (headerCount / 4) * 100;
  // Provide a baseline security credit for HTTPS even if no advanced headers exist.
  if (headerCount === 0 && metrics.security.https) {
    headerScore = 40; // baseline for using HTTPS (no mixed content, no advanced headers)
  }
  const mixedPenalty = Math.min(metrics.security.mixedContent * 5, 40); // each mixed resource -5 up to -40
  let security = headerScore - mixedPenalty;
  if (!metrics.security.https) {
    security = Math.min(security, 30); caps.security = 'Non-HTTPS URL';
  }
  // Additional penalty: if HTTPS but mixed content present, cap at 70 to reflect degraded security.
  if (metrics.security.https && metrics.security.mixedContent > 0) {
    security = Math.min(security, 70);
  }
  security = clamp0to100(security);

  // UX
  let ux = weightedAvg([
    [metrics.ux.hasViewport ? 100 : 30, 0.3],
    [metrics.ux.hasFavicon ? 100 : 60, 0.1],
    [metrics.ux.fontDisplayPercent, 0.3],
    [linear(metrics.ux.jsWeightKb, 150, 1500), 0.3]
  ]);
  ux = clamp0to100(ux);

  const scores: PillarScores = {
    performance: round1(performance),
    accessibility: round1(accessibility),
    seo: round1(seo),
    security: round1(security),
    ux: round1(ux)
  };

  const overall = round1(weightedAvg([
    [scores.performance, 0.30],
    [scores.accessibility, 0.20],
    [scores.seo, 0.20],
    [scores.security, 0.15],
    [scores.ux, 0.15]
  ]));

  return { scores, overall, caps };
}

function weightedAvg(entries: [number, number][]) {
  let sumW = 0, sum = 0;
  for (const [v, w] of entries) { sum += v * w; sumW += w; }
  return sumW ? sum / sumW : 0;
}
function clamp0to100(v: number) { return Math.max(0, Math.min(100, v)); }
function round1(v: number) { return Math.round(v * 10) / 10; }
