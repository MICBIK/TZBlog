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

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

type LegacyDelegate = {
  [method: string]: (input?: any) => Promise<any>
  create(input: any): Promise<any>
  createMany(input: any): Promise<any>
  findMany(input?: any): Promise<any[]>
  findFirst(input?: any): Promise<any | null>
  findUnique(input: any): Promise<any | null>
  count(input?: any): Promise<number>
  update(input: any): Promise<any>
  deleteMany(input?: any): Promise<any>
  upsert(input: any): Promise<any>
}

type LegacyTestDb = {
  column: LegacyDelegate
  columnTranslation: LegacyDelegate
  comment: LegacyDelegate
  post: LegacyDelegate
  postTranslation: LegacyDelegate
  tag: LegacyDelegate
  tagsOnPosts: LegacyDelegate
  postView: LegacyDelegate
  postLike: LegacyDelegate
}

export const testDb = prisma as unknown as Omit<
  PrismaClient,
  "comment" | "tag"
> &
  LegacyTestDb

/**
 * Truncate Channel + ChannelTranslation between tests.
 * RESTART IDENTITY keeps autoincrements pristine (cuid ids aren't sequence-
 * backed but it's harmless).
 */
export async function resetColumns(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Comment", "EntryLike", "EntryView", "TagsOnEntries", "EntryTranslation", "Entry", "SeriesTranslation", "Series", "ChannelTranslation", "Channel" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Truncate auxiliary tables a few cases need (User + Entry for the
 * countPostsInColumn test). Independent helper so the slim majority of
 * tests don't pay the cost.
 */
export async function resetPostsAndUsers(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Comment", "EntryLike", "EntryView", "TagsOnEntries", "EntryTranslation", "Entry", "SeriesTranslation", "Series", "ChannelTranslation", "Channel", "User" RESTART IDENTITY CASCADE`,
  )
}

export async function disconnectTestDb(): Promise<void> {
  await prisma.$disconnect()
}

/**
 * Truncate everything that touches Entry (children + Entry itself), keeping
 * Channel, Tag, and User intact. CASCADE is set on the FKs but listing the
 * children explicitly avoids surprise dependents.
 */
export async function resetPosts(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Comment", "EntryLike", "EntryView", "TagsOnEntries", "EntryTranslation", "Entry", "SeriesTranslation", "Series" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Truncate Tag + the join table. Keeps Entry intact.
 */
export async function resetTags(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "TagsOnEntries", "Tag" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Wipe the whole content/identity surface used by entry + tag + channel tests.
 * Ordering listed explicitly — children before parents — even though CASCADE
 * would handle it. Keeps PageView (analytics) and SiteConfig untouched.
 */
export async function resetAll(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Comment", "EntryLike", "EntryView", "TagsOnEntries", "EntryTranslation", "Entry", "SeriesTranslation", "Series", "Tag", "ChannelTranslation", "Channel", "User" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Ensure a test author exists and return its id. Idempotent — repeated calls
 * with the same email upsert the same user.
 */
export async function ensureTestUser(
  email: string = "test-author@tzblog.local",
): Promise<string> {
  const u = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, name: "Test Author", role: "ADMIN", password: "x" },
  })
  return u.id
}
