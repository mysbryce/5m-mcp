type Bucket = { tokens: number; lastRefill: number };

export class TokenBucket {
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly refillPerMs: number;

  constructor(perMinute: number) {
    this.capacity = Math.max(1, perMinute);
    this.refillPerMs = this.capacity / 60_000;
  }

  consume(key: string, cost = 1): { ok: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    } else {
      const elapsed = now - bucket.lastRefill;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillPerMs);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
    }
    const deficit = cost - bucket.tokens;
    return { ok: false, remaining: 0, retryAfterMs: Math.ceil(deficit / this.refillPerMs) };
  }
}
