// Simple in-memory token bucket (per IP) for /api/audit
// Not production hardened (no clustering support)

interface Bucket { tokens: number; lastRefill: number }

const buckets = new Map<string, Bucket>();
const CAP = 8; // max bursts
const REFILL_PER_SEC = 0.5; // 1 token every 2s (~30/min)

export function takeToken(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) { b = { tokens: CAP, lastRefill: now }; buckets.set(key, b); }
  // Refill
  const elapsed = (now - b.lastRefill) / 1000;
  if (elapsed > 0) {
    const refill = elapsed * REFILL_PER_SEC;
    if (refill > 0) {
      b.tokens = Math.min(CAP, b.tokens + refill);
      b.lastRefill = now;
    }
  }
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return { ok: true, remaining: Math.floor(b.tokens) };
  }
  return { ok: false, remaining: 0 };
}
