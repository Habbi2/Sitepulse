// Simple in-memory TTL cache (T11 placeholder used by T10 route)
interface Entry<T> { value: T; expires: number }

export class MemoryCache<T> {
  private store = new Map<string, Entry<T>>();
  constructor(private ttlMs: number, private max = 300) {}
  get(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expires) { this.store.delete(key); return undefined; }
    return e.value;
  }
  set(key: string, value: T) {
    if (this.store.size >= this.max) {
      // naive eviction: delete oldest
      const first = this.store.keys().next().value;
      if (first) this.store.delete(first);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

export const reportCache = new MemoryCache<any>(10 * 60 * 1000, 400); // 10m TTL
