import { z } from 'zod';

// ---------- Primitive Helpers ----------
export const SeveritySchema = z.enum(['low', 'medium', 'high']);
export const PillarKeySchema = z.enum(['performance', 'accessibility', 'seo', 'security', 'ux']);
export const AuditModeSchema = z.enum(['fast', 'deep']).default('fast');

// ---------- Metrics Schema ----------
export const RawMetricsSchema = z.object({
  timing: z.object({ ttfbMs: z.number().nonnegative() }),
  size: z.object({
    totalBytes: z.number().nonnegative(),
    imagesBytes: z.number().nonnegative(),
    cssBytes: z.number().nonnegative(),
    jsBytes: z.number().nonnegative()
  }),
  counts: z.object({
    requests: z.number().int().nonnegative(),
    img: z.number().int().nonnegative(),
    script: z.number().int().nonnegative(),
    css: z.number().int().nonnegative()
  }),
  accessibility: z.object({
    altCoverage: z.number().min(0).max(1),
    h1Count: z.number().int().nonnegative(),
    outlineIssues: z.number().int().nonnegative(),
    landmarks: z.number().int().nonnegative(),
    hasLang: z.boolean()
  }),
  seo: z.object({
    titleChars: z.number().int().nonnegative(),
    metaDescriptionChars: z.number().int().nonnegative(),
    hasCanonical: z.boolean(),
    h1Exists: z.boolean()
  }),
  security: z.object({
    https: z.boolean(),
    headers: z.object({
      csp: z.boolean(),
      xfo: z.boolean(),
      referrer: z.boolean(),
      permissions: z.boolean()
    }),
    mixedContent: z.number().int().nonnegative()
  }),
  ux: z.object({
    hasViewport: z.boolean(),
    hasFavicon: z.boolean(),
    fontDisplayPercent: z.number().min(0).max(100),
    jsWeightKb: z.number().nonnegative()
  })
});

export const PillarScoresSchema = z.object({
  performance: z.number().min(0).max(100),
  accessibility: z.number().min(0).max(100),
  seo: z.number().min(0).max(100),
  security: z.number().min(0).max(100),
  ux: z.number().min(0).max(100)
});

export const IssueSchema = z.object({
  id: z.string().min(1),
  category: PillarKeySchema,
  severity: SeveritySchema,
  why: z.string().min(3),
  fix: z.string().min(3),
  impactScore: z.number().int().min(1).max(10),
  estScoreGain: z.number().int().min(0).max(20)
});

export const ReportSchema = z.object({
  id: z.string().min(6), // using nanoid or uuid later
  version: z.literal(1),
  url: z.string().url(),
  fetchedAt: z.string(),
  overall: z.number().min(0).max(100),
  scores: PillarScoresSchema,
  metrics: RawMetricsSchema,
  issues: z.array(IssueSchema),
  previousId: z.string().optional()
});

export const AuditRequestSchema = z.object({
  url: z.string().url(),
  mode: AuditModeSchema.optional()
});

export type Severity = z.infer<typeof SeveritySchema>;
export type AuditMode = z.infer<typeof AuditModeSchema>;
export type RawMetrics = z.infer<typeof RawMetricsSchema>;
export type PillarScores = z.infer<typeof PillarScoresSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type AuditRequest = z.infer<typeof AuditRequestSchema>;

// Utility: safe parse helpers
export function parseAuditRequest(data: unknown) {
  return AuditRequestSchema.safeParse(data);
}
export function parseReport(data: unknown) {
  return ReportSchema.safeParse(data);
}
