import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

/**
 * Test-side Prisma client. Points at the same DATABASE_URL the app uses
 * (dev DB on port 5433 in our docker-compose), so truncating here genuinely
 * resets the rows the service-layer client (`@/lib/db`) reads through.
 */
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set for tests")
}

export const testDb = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

/**
 * Truncate Column + ColumnTranslation between tests.
 * CASCADE so any FK referencing Column (e.g. Post.columnId) is cleaned too.
 * RESTART IDENTITY keeps autoincrements pristine (cuid ids aren't sequence-
 * backed but it's harmless).
 */
export async function resetColumns(): Promise<void> {
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE "ColumnTranslation", "Column" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Truncate auxiliary tables a few cases need (User + Post for the
 * countPostsInColumn test). Independent helper so the slim majority of
 * tests don't pay the cost.
 */
export async function resetPostsAndUsers(): Promise<void> {
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE "TagsOnPosts", "PostView", "PostLike", "Comment", "PostTranslation", "Post", "User" RESTART IDENTITY CASCADE`,
  )
}

export async function disconnectTestDb(): Promise<void> {
  await testDb.$disconnect()
}
