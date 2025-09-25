# SitePulse

Fast multi‑pillar website quality snapshot (Performance • Accessibility • SEO • Security • UX).

## ✨ Features (MVP)
* URL normalization & safety checks (blocks local / private / non‑HTTP(S) schemes)
* Fast HTML fetch with TTFB timing, 2MB response size cap, typed error codes
* Structural + qualitative metric extraction (headings, meta tags, alt coverage, font-display, mixed content, security headers, UX signals)
* Pillar scoring + composite overall score (weighted)
* Rule‑based issue engine with estimated score gain per issue
* Diff view (added / resolved / unchanged issues + per‑pillar deltas)
* Shareable ephemeral reports (in‑memory cache ~10 minutes)
* Basic in‑memory rate limiting (token bucket) to curb abuse
* Heartbeat ambient theme (subtle background, gauge glow, bar and card pulses; auto-disabled for users with `prefers-reduced-motion: reduce`)
* Improved issue list UX (progressive reveal, severity accent borders, accessible focus states)

## 🧱 Tech Stack
* Next.js 14 App Router (TypeScript, ESM)
* React 18, Tailwind CSS
* `parse5` for HTML parsing
* Lightweight custom test harness (TypeScript + `tsx` + Node `assert`)
* (Planned) `zod` schema hardening for external inputs

## 🚀 Getting Started
```bash
npm install
npm run dev
```
Then open: http://localhost:3000

## 🧪 Testing (Lightweight Harness)
We intentionally removed heavier runners (Vitest/Jest) after environment instability and replaced them with a zero‑overhead approach.

How it works now:
* Each file in `tests/*.test.ts` uses Node's built‑in `assert`.
* `tests/run-all.ts` dynamically discovers and imports all `*.test.ts` files (no manual list maintenance).
* `npm test` executes the harness via `tsx`.

Coverage:
* Run `npm run coverage` (uses `c8`) to produce text + HTML + lcov reports (`coverage/` directory).
* Clean coverage output: `npm run coverage:clean`.

Add a new test:
```ts
// tests/new-feature.test.ts
import assert from 'node:assert';
import { computePillarDeltas } from '../lib/diff';

assert.deepStrictEqual(
  computePillarDeltas({ performance: 50, accessibility: 60, seo: 70, security: 80, ux: 90 },
                      { performance: 40, accessibility: 55, seo: 70, security: 70, ux: 95 }),
  {
    performance: { previous: 40, current: 50, delta: 10 },
    accessibility: { previous: 55, current: 60, delta: 5 },
    seo: { previous: 70, current: 70, delta: 0 },
    security: { previous: 70, current: 80, delta: 10 },
    ux: { previous: 95, current: 90, delta: -5 }
  }
);
```
No registration step required—just ensure the filename ends with `.test.ts`; the harness will pick it up automatically.

Why this approach:
* Near‑zero cold start & cognitive overhead
* No mocking layer required yet
* Easy to migrate later—tests are plain TypeScript modules

Possible future upgrade: switch to a fuller runner if we need watch mode, parallel isolation, or snapshot features; current approach keeps iteration instant.

## 🎨 Heartbeat Theme
Implemented via custom keyframes in `globals.css`:
* `hb-bg` – slow ambient background luminosity shift
* `hb-scale` – gentle scale pulse on the main gauge
* `hb-glow` – cyclical outward glow ring effect
* `hb-border` / `hb-card` – soft pulsing border + radial hover glow on issue cards
* `hb-text` – breathing opacity for numeric readouts

Accessibility: All animations are disabled automatically for `prefers-reduced-motion: reduce` to respect user preferences.

## 🧩 Architecture Overview
Flow for an audit request:
1. Normalize & validate URL (reject private / loopback / unsupported schemes)
2. Rate limit check (`lib/rate-limit.ts`)
3. Fetch HTML (`lib/fetch-html.ts`) with timing + size guard + content‑type sniff
4. Parse & extract raw metrics (`lib/extract-metrics.ts`)
5. Aggregate / normalize metrics (`lib/aggregate-metrics.ts`)
6. Compute pillar & overall scores with security baselines (`lib/compute-scores.ts`)
7. Derive issues (`lib/derive-issues.ts`)
8. Cache report (in‑memory TTL) & optionally diff against `previousId` (`lib/diff.ts`)
9. Return JSON payload to the client UI

All data is ephemeral; no persistence beyond the short cache TTL.

## 📡 API
### POST `/api/audit`
Request body:
```json
{ "url": "https://example.com", "previousId": "optional-report-id" }
```
Response:
```json
{ "id": "...", "overall": 78, "scores": { "performance": 64, ... }, "issues": [ ... ] }
```
Errors take the shape:
```json
{ "error": { "code": "TIMEOUT", "message": "Fetch exceeded limit", "hint": "Try a smaller page" } }
```

### GET `/api/report/[id]`
Returns a cached report if still within TTL; otherwise 404 error.

## 🧾 Report Object (abbrev)
```ts
interface Report {
  id: string;
  url: string;
  pageTitle: string; // extracted <title> text or hostname fallback
  fetchedAt: string; // ISO timestamp
  overall: number;   // 0–100 weighted composite
  scores: {
    performance: number;
    accessibility: number;
    seo: number;
    security: number;
    ux: number;
  };
  issues: Issue[];
  previousId?: string; // if diff requested
  diff?: {
    scores: Record<string, { previous: number; current: number; delta: number }>;
    issues: {
      added: Issue[];
      resolved: Issue[];
      unchanged: Issue[];
    }
  };
}
```

## ⚙️ Deployment Notes
1. Replace placeholder reporting domain / user agent string in `fetch-html.ts` if customizing.
2. In‑memory cache + rate limiting are single instance only—use Redis / KV for multi‑region or scale.
3. Security scoring baseline: HTTPS yields a floor value; tweak constants in `compute-scores.ts`.
4. Mixed content detection is static (server HTML only); client‑injected resources won’t be seen.
5. Baseline security headers (CSP, Permissions-Policy, Referrer-Policy, X-Frame-Options) are set in `middleware.ts`. Adjust CSP directives if you add external scripts/images/fonts.
6. If memory pressure occurs on serverless, optionally set: `NODE_OPTIONS=--max_old_space_size=512`.

## 🔮 Future Enhancements
* External resource weight probing (HEAD requests)
* Headless render phase for SPA / late DOM metrics
* Persistent storage + auth (historical trend lines)
* Expanded security heuristics (HSTS, SRI, cookie flags)
* Smarter issue grouping / remediation hints
* Optional Lighthouse integration (hybrid scoring)

## 🛠 Troubleshooting
| Symptom | Likely Cause | Suggested Fix |
|---------|--------------|---------------|
| Security score surprisingly low | Missing common security headers | Add CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| `NON_HTML` error | Target responded with non-HTML (PDF/image/binary) | Use a standard HTML page URL |
| `TIMEOUT` | Slow origin or blocked by anti-bot | Retry; verify manual curl speed; reduce payload |
| `HTTP_ERROR 404` | Page missing / requires auth | Provide a publicly accessible URL |
| Mixed content flagged | HTTP resources embedded on HTTPS page | Upgrade resource URLs to HTTPS |

## 🤝 Contributing
Lightweight for now—feel free to open an issue or PR. Keep tests minimal and direct.

Guidelines:
* One concern per PR
* Add / adjust a `.test.ts` file when logic changes
* Prefer pure functions inside `lib/` for easier testing

## 📄 License
MIT License – see `LICENSE` file for full text.

---
Questions or ideas? Open an issue or start a discussion. 🚀
