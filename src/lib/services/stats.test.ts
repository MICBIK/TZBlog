import { describe, it, expect, beforeEach, afterAll } from "vitest"
import "dotenv/config"

import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"

type StatsModule = {
  getSiteStats: () => Promise<{
    views: number
    viewsInLast7Days: number
    posts: number
    comments: number
    lastShippedAt: Date | null
  }>
}

let authorId: string

beforeEach(async () => {
  await resetAll()
  await testDb.pageView.deleteMany()
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
    await Promise.all([
      seedPageView("recent-public-1", "/", daysAgo(1)),
      seedPageView("recent-public-2", "/posts/first", daysAgo(2)),
      seedPageView("old-public", "/posts/old", daysAgo(8)),
      seedPageView("recent-admin", "/admin", daysAgo(1)),
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
      viewsInLast7Days: 2,
      posts: 3,
      comments: 2,
      lastShippedAt: new Date("2026-05-21T00:00:00Z"),
    })
  })

  it("returns last-shipped date when posts exist", async () => {
    const modulePath = "./stats"
    const { getSiteStats } = (await import(modulePath)) as StatsModule

    await seedPublishedPost("older", 7, new Date("2026-05-10T00:00:00Z"))
    await seedPublishedPost("newer", 5, new Date("2026-05-22T00:00:00Z"))
    await seedPageView("recent-public", "/posts/newer", daysAgo(1))
    await seedPageView("old-public", "/posts/older", daysAgo(8))

    await expect(getSiteStats()).resolves.toMatchObject({
      viewsInLast7Days: 1,
      lastShippedAt: new Date("2026-05-22T00:00:00Z"),
    })
  })
})

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS)
}

async function seedPublishedPost(
  slug: string,
  viewCount: number,
  publishedAt = new Date("2026-05-21T00:00:00Z"),
) {
  return testDb.post.create({
    data: {
      slug,
      status: "PUBLISHED",
      publishedAt,
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

async function seedPageView(
  visitorHash: string,
  path: string,
  createdAt: Date,
) {
  await testDb.pageView.create({
    data: {
      path,
      visitorHash,
      createdAt,
      userAgent: "vitest",
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
