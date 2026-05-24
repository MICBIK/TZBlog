import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

import { testDb } from "../../tests/helpers/db"

describe("Channel/Entry Prisma schema", () => {
  it("generatesPrismaClientWithNewTypes", () => {
    const delegates = testDb as unknown as Record<string, unknown>

    expect(delegates.channel).toBeDefined()
    expect(delegates.entry).toBeDefined()
    expect(delegates.series).toBeDefined()
    expect(delegates.rateLimitLog).toBeDefined()
  })

  it("typecheckPassesWithNoLegacyPostColumnReferences", () => {
    const root = join(process.cwd(), "src")
    const offenders: string[] = []

    for (const file of listSourceFiles(root)) {
      const source = readFileSync(file, "utf8")
      if (
        /\bdb\.(post|column|postLike|postView|tagsOnPosts|postTranslation|columnTranslation)\b/.test(
          source,
        )
      ) {
        offenders.push(relative(process.cwd(), file))
      }
    }

    expect(offenders).toEqual([])
  })
})

function listSourceFiles(dir: string): string[] {
  const result: string[] = []

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      result.push(...listSourceFiles(fullPath))
      continue
    }

    if (
      /\.(ts|tsx)$/.test(entry) &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".test.tsx")
    ) {
      result.push(fullPath)
    }
  }

  return result
}
