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

/**
 * Truncate everything that touches Post (children + Post itself), keeping
 * Column, Tag, and User intact. CASCADE is set on the FKs but listing the
 * children explicitly avoids surprise dependents.
 */
export async function resetPosts(): Promise<void> {
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE "Comment", "PostLike", "PostView", "TagsOnPosts", "PostTranslation", "Post" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Truncate Tag + the join table. Keeps Post intact (Post has no FK to Tag,
 * only TagsOnPosts does, and it's truncated here too).
 */
export async function resetTags(): Promise<void> {
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE "TagsOnPosts", "Tag" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Wipe the whole content/identity surface used by post + tag + column tests.
 * Ordering listed explicitly — children before parents — even though CASCADE
 * would handle it. Keeps PageView (analytics) and SiteConfig untouched.
 */
export async function resetAll(): Promise<void> {
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE "Comment", "PostLike", "PostView", "TagsOnPosts", "PostTranslation", "Post", "Tag", "ColumnTranslation", "Column", "User" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Ensure a test author exists and return its id. Idempotent — repeated calls
 * with the same email upsert the same user.
 */
export async function ensureTestUser(
  email: string = "test-author@tzblog.local",
): Promise<string> {
  const u = await testDb.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, name: "Test Author", role: "ADMIN", password: "x" },
  })
  return u.id
}
