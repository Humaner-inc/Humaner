type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type TtlMapOptions = {
  /** Drop oldest entries when size exceeds this (insertion-order eviction). */
  maxSize?: number;
};

/** Small in-process TTL cache (per Node worker). Not shared across serverless instances. */
export class TtlMap<T> {
  private readonly map = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number | undefined;

  constructor(
    private readonly ttlMs: number,
    options?: TtlMapOptions
  ) {
    this.maxSize =
      options?.maxSize && options.maxSize > 0 ? options.maxSize : undefined;
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh insertion order for approximate LRU behavior.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    this.evictOverflow();
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) {
        this.map.delete(key);
      }
    }
  }

  private evictOverflow(): void {
    if (!this.maxSize) {
      return;
    }
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      this.map.delete(oldest);
    }
  }
}
