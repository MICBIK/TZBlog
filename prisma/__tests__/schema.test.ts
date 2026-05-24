import { describe, expect, it } from "vitest"

import { testDb } from "../../tests/helpers/db"

describe("Channel/Entry Prisma schema", () => {
  it("generatesPrismaClientWithNewTypes", () => {
    const delegates = testDb as unknown as Record<string, unknown>

    expect(delegates.channel).toBeDefined()
    expect(delegates.entry).toBeDefined()
    expect(delegates.series).toBeDefined()
    expect(delegates.rateLimitLog).toBeDefined()
  })
})
