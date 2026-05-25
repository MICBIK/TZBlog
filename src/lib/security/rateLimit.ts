import { db } from "@/lib/db";

interface RateLimitCheckParams {
  scope: string;
  key: string;
  windowSeconds: number;
  maxCount: number;
}

export async function checkRateLimit({
  scope,
  key,
  windowSeconds,
  maxCount,
}: RateLimitCheckParams): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000);
  const count = await db.rateLimitLog.count({
    where: { scope, key, createdAt: { gte: since } },
  });
  return count >= maxCount;
}

interface RecordParams {
  scope: string;
  key: string;
}

export async function recordRateLimit({ scope, key }: RecordParams): Promise<void> {
  await db.rateLimitLog.create({ data: { scope, key } });
}

export async function cleanupOldRateLimitLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
  const result = await db.rateLimitLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}
