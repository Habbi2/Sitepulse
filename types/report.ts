export interface RawMetrics {
  timing: { ttfbMs: number };
  size: { totalBytes: number; imagesBytes: number; cssBytes: number; jsBytes: number };
  counts: { requests: number; img: number; script: number; css: number };
  accessibility: { altCoverage: number; h1Count: number; outlineIssues: number; landmarks: number; hasLang: boolean };
  seo: { titleChars: number; metaDescriptionChars: number; hasCanonical: boolean; h1Exists: boolean };
  security: { https: boolean; headers: { csp: boolean; xfo: boolean; referrer: boolean; permissions: boolean }; mixedContent: number };
  ux: { hasViewport: boolean; hasFavicon: boolean; fontDisplayPercent: number; jsWeightKb: number };
  pageTitle?: string; // captured <title> text (trimmed)
}

export interface PillarScores {
  performance: number;
  accessibility: number;
  seo: number;
  security: number;
  ux: number;
}

export interface Issue {
  id: string;
  category: keyof PillarScores;
  severity: 'low' | 'medium' | 'high';
  why: string;
  fix: string;
  impactScore: number;
  estScoreGain: number;
}

export interface Report {
  id: string;
  version: number;
  url: string;
  pageTitle: string; // human readable page name (HTML <title> or hostname fallback)
  fetchedAt: string;
  overall: number;
  scores: PillarScores;
  metrics: RawMetrics;
  issues: Issue[];
  previousId?: string;
}
