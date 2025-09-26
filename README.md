<div align="center">

# SitePulse

Fast, explainable multi‑pillar website quality snapshots (Performance • Accessibility • SEO • Security • UX) in a single request.

![Score Gauge](./app/icon.svg)

</div>

## Table of Contents
1. Overview
2. Why Another Auditor?
3. Feature Matrix
4. Quick Start
5. Scoring Model
6. Architecture Flow
7. Data & Report Schema
8. API Reference
9. Testing & Coverage
10. Deployment Notes
11. Roadmap
12. Troubleshooting
13. Contributing
14. Credits
15. License

## 1. Overview
SitePulse produces a concise, weighted score profile across five pillars and surfaces only the issues that actually influenced the numbers—making every deduction explainable. All logic executes server‑side against the raw HTML (fast mode). No persistence beyond a short in‑memory TTL cache.

## 2. Why Another Auditor?
Traditional tools are either: (a) heavyweight & slow (headless browsers, multi‑pass), or (b) simplistic lists without context. SitePulse focuses on: instantaneous feedback (< ~1s typical), transparent scoring inputs, diff‑friendly output, and a minimal, dark, accessible UI with subtle heartbeat animations (disabled for reduced‑motion users).

## 3. Feature Matrix (MVP)
Core:
- URL normalization & safety guardrails (blocks local/private/invalid schemes)
- HTML fetch with TTFB capture, size & content‑type enforcement (2 MB cap)
- Structured metric extraction (headings, meta, links, alt %, font-display, security headers, canonical, robots, language, viewport, mixed content)
- Weighted pillar scoring + composite overall
- Rule engine with estimated remediation gain per issue
- Diff view (added / resolved / unchanged issues + per‑pillar deltas)
- Ephemeral cached reports (~10 min TTL)
- Token bucket rate limiting (in‑memory)
- Soft optimization tier (low severity signals so every score delta has a label)
- Vector brand icon `app/icon.svg`

UX / Visual:
- Heartbeat ambient theme (bg, gauge, glow, border, card, text breathing)
- Progressive issue reveal & severity accents
- Focus-visible + reduced-motion accessibility compliance

Integration / Ecosystem:
- Companion CSP generator (AutoCSP) for security hardening (separate package)

## 4. Quick Start
```bash
git clone <repo-url>
cd sitepulse
npm install
npm run dev
```
Visit: http://localhost:3000

Run an audit from the landing form or call the API directly:
```bash
curl -X POST http://localhost:3000/api/audit -H "Content-Type: application/json" -d '{"url":"https://example.com"}'
```

## 5. Scoring Model
Each pillar starts at 100 and deductions are applied per rule. Overall score is a weighted mean (defaults):
```
performance  : 0.22
accessibility: 0.20
seo          : 0.18
security     : 0.25
ux           : 0.15
```
Weights live alongside constants in `lib/compute-scores.ts` and can be tuned. Rules carry a max deduction; optimization (soft) issues cap at small values so they never dominate real defects. Security has a baseline floor uplift when HTTPS & core headers are present.

### Issue Object (simplified)
```ts
interface Issue {
  id: string;              // stable identifier
  pillar: 'performance'|'accessibility'|'seo'|'security'|'ux';
  severity: 'low'|'medium'|'high';
  message: string;         // human readable summary
  impact: number;          // deduction applied (or potential gain if resolved)
  hints?: string[];        // optional remediation suggestions
}
```

## 6. Architecture Flow
```text
Client → /api/audit
 1. normalize url         (lib/normalize.ts or inline logic)
 2. rate limit            (lib/rate-limit.ts)
 3. fetch HTML            (lib/fetch-html.ts)
 4. extract raw metrics   (lib/extract-metrics.ts)
 5. aggregate/normalize   (lib/aggregate-metrics.ts)
 6. compute scores        (lib/compute-scores.ts)
 7. derive issues         (lib/derive-issues.ts)
 8. diff (optional)       (lib/diff.ts)
 9. cache + respond       (in-memory store)
```
All stateless; swap cache + rate limit layers for Redis/KV to scale horizontally.

## 7. Data & Report Schema (Abbrev)
```ts
interface Report {
  id: string;
  url: string;
  pageTitle: string;
  fetchedAt: string;
  overall: number;
  scores: Record<'performance'|'accessibility'|'seo'|'security'|'ux', number>;
  issues: Issue[];
  previousId?: string;
  diff?: {
    scores: Record<string, { previous: number; current: number; delta: number }>;
    issues: { added: Issue[]; resolved: Issue[]; unchanged: Issue[] };
  }
}
```

## 8. API Reference
### POST /api/audit
Request:
```json
{ "url": "https://example.com", "previousId": "optional-report-id" }
```
Success:
```json
{ "id": "...", "overall": 78, "scores": { "performance": 64, "accessibility": 60, "seo": 70, "security": 80, "ux": 75 }, "issues": [ { "id": "ttl-short", "pillar": "seo", "severity": "low", "impact": 2, "message": "Title length could be improved" } ] }
```
Errors:
```json
{ "error": { "code": "TIMEOUT", "message": "Fetch exceeded limit", "hint": "Try a smaller page" } }
```

### GET /api/report/[id]
Response (404 if expired): cached `Report` JSON.

## 9. Testing & Coverage
Lightweight harness (no Jest/Vitest) for speed:
- `tests/*.test.ts` use Node `assert`
- `tests/run-all.ts` auto-discovers
- `npm test` runs via `tsx`

Coverage:
```bash
npm run coverage      # HTML + text + lcov in coverage/
npm run coverage:clean
```
Add a test:
```ts
import assert from 'node:assert';
import { computePillarDeltas } from '../lib/diff';
assert.deepStrictEqual(/* ... */);
```

## 10. Deployment Notes
1. Replace user agent token in `fetch-html.ts` if branding.
2. Single-instance cache & rate limiting; externalize for multi-region.
3. Tune weighting & baseline constants in `compute-scores.ts`.
4. CSP & security headers set in `middleware.ts` – adjust if adding external assets.
5. Mixed content detection is static (HTML only, no JS exec).
6. Memory pressure: set `NODE_OPTIONS=--max_old_space_size=512` as needed.
7. Replace `app/icon.svg` for custom branding.

## 11. Roadmap
- External resource weight HEAD probes
- Optional headless render phase
- Historical trend storage + auth
- Expanded security heuristics (HSTS, SRI, cookie flags)
- Smarter remediation grouping & hints
- Optional Lighthouse hybrid mode

## 12. Troubleshooting
| Symptom | Likely Cause | Suggested Fix |
|---------|--------------|---------------|
| Security score low | Missing headers | Add CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| NON_HTML error | Non-HTML response | Provide a standard HTML URL |
| TIMEOUT | Slow origin / blocked | Retry, verify via curl, reduce payload |
| HTTP_ERROR 404 | Page missing | Use a public, accessible URL |
| Mixed content flagged | HTTP assets on HTTPS page | Upgrade resource URLs |

## 13. Contributing
Contributions welcome – keep PRs focused and add/adjust a test when changing logic.

Guidelines:
- One concern per PR
- Prefer pure, deterministic functions in `lib/`
- Maintain or improve coverage when feasible

## 14. Credits
Created by the project author. Design collaboration & inspiration: [Habbi Web Design](https://habbiwebdesign.com) – minimal dark aesthetic & interaction refinements.

## 15. License
MIT – see `LICENSE`.

---
Questions or ideas? Open an issue or start a discussion. 🚀
