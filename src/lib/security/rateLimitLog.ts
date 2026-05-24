import { db } from "@/lib/db"

export async function insertRateLimitLogProbe(input: {
  scope: string
  key: string
}): Promise<number> {
  await db.rateLimitLog.deleteMany({
    where: { scope: input.scope, key: input.key },
  })
  await db.rateLimitLog.create({
    data: {
      scope: input.scope,
      key: input.key,
    },
  })
  return db.rateLimitLog.count({
    where: { scope: input.scope, key: input.key },
  })
}
