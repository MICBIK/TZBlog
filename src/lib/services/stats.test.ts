import { describe, it, expect, beforeEach, afterAll } from "vitest"
import "dotenv/config"

import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"

type StatsModule = {
  getSiteStats: () => Promise<{ views: number; posts: number; comments: number }>
}

let authorId: string

beforeEach(async () => {
  await resetAll()
  authorId = await ensureTestUser()
})

afterAll(async () => {
  await disconnectTestDb()
})

describe("getSiteStats", () => {
  it("sums views, counts published posts and approved comments", async () => {
    const modulePath = "./stats"
    const { getSiteStats } = (await import(modulePath)) as StatsModule

    const posts = await Promise.all([
      seedPublishedPost("first", 10),
      seedPublishedPost("second", 20),
      seedPublishedPost("third", 30),
    ])
    await testDb.comment.createMany({
      data: [
        comment(posts[0].id, "APPROVED", "approved-1"),
        comment(posts[1].id, "APPROVED", "approved-2"),
        comment(posts[2].id, "PENDING", "pending-1"),
      ],
    })

    await expect(getSiteStats()).resolves.toEqual({
      views: 60,
      posts: 3,
      comments: 2,
    })
  })
})

async function seedPublishedPost(slug: string, viewCount: number) {
  return testDb.post.create({
    data: {
      slug,
      status: "PUBLISHED",
      publishedAt: new Date("2026-05-21T00:00:00Z"),
      authorId,
      viewCount,
      translations: {
        create: {
          locale: "zh",
          title: slug,
          content: `${slug} content`,
        },
      },
    },
  })
}

function comment(
  postId: string,
  status: "APPROVED" | "PENDING",
  visitorHash: string,
) {
  return {
    postId,
    status,
    visitorHash,
    authorName: "Reader",
    authorEmail: `${visitorHash}@example.com`,
    content: "comment",
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
  }
}
