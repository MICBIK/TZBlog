type Bucket = { count: number; resetAt: number }
const store = new Map<string, Bucket>()

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const b = store.get(key)
  if (!b || b.resetAt < now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }
  if (b.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: b.resetAt }
  }
  b.count++
  return { allowed: true, remaining: limit - b.count, resetAt: b.resetAt }
}
