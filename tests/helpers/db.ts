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

export const testDb = new Proxy(prisma, {
  get(target, property, receiver) {
    switch (property) {
      case "column":
        return legacyColumnDelegate
      case "columnTranslation":
        return legacyColumnTranslationDelegate
      case "comment":
        return legacyCommentDelegate
      case "post":
        return legacyPostDelegate
      case "postTranslation":
        return legacyPostTranslationDelegate
      case "tag":
        return legacyTagDelegate
      case "tagsOnPosts":
        return legacyTagsOnPostsDelegate
      case "postView":
        return legacyPostViewDelegate
      case "postLike":
        return legacyPostLikeDelegate
      default:
        return Reflect.get(target, property, receiver)
    }
  },
}) as unknown as Omit<PrismaClient, "comment" | "tag"> & LegacyTestDb

const legacyColumnDelegate = mapDelegate(prisma.channel, {
  input: mapColumnInput,
  output: mapColumnOutput,
})

const legacyColumnTranslationDelegate = mapDelegate(prisma.channelTranslation, {
  input: mapColumnTranslationInput,
})

const legacyCommentDelegate = mapDelegate(prisma.comment, {
  input: mapCommentInput,
})

const legacyPostDelegate = mapDelegate(prisma.entry, {
  input: mapPostInput,
  output: mapPostOutput,
})

const legacyPostTranslationDelegate = mapDelegate(prisma.entryTranslation, {
  input: mapPostTranslationInput,
  output: mapPostTranslationOutput,
})

const legacyTagDelegate = mapDelegate(prisma.tag, {
  input: mapTagInput,
  output: mapTagOutput,
})

const legacyTagsOnPostsDelegate = mapDelegate(prisma.tagsOnEntries, {
  input: mapTagsOnPostsInput,
  output: mapTagsOnPostsOutput,
})

const legacyPostViewDelegate = mapDelegate(prisma.entryView, {
  input: mapPostViewInput,
  output: mapPostViewOutput,
})

const legacyPostLikeDelegate = mapDelegate(prisma.entryLike, {
  input: mapPostLikeInput,
  output: mapPostLikeOutput,
})

function mapDelegate(
  delegate: object,
  mapper: {
    input?: (input: unknown) => Promise<unknown>
    output?: (output: unknown) => Promise<unknown> | unknown
  },
): LegacyDelegate {
  const rawDelegate = delegate as Record<PropertyKey, unknown>
  return new Proxy(rawDelegate, {
    get(target, property) {
      const value = target[property]
      if (typeof value !== "function") return value

      return async (input?: unknown) => {
        const mappedInput = mapper.input ? await mapper.input(input) : input
        const output = await (value as (input?: unknown) => Promise<unknown>).call(
          target,
          mappedInput,
        )
        return mapper.output ? await mapOutput(output, mapper.output) : output
      }
    },
  }) as LegacyDelegate
}

async function mapOutput(
  output: unknown,
  mapper: (output: unknown) => Promise<unknown> | unknown,
): Promise<unknown> {
  return Array.isArray(output)
    ? Promise.all(output.map((item) => mapper(item)))
    : mapper(output)
}

async function mapPostInput(input: unknown): Promise<unknown> {
  const mapped = cloneInput(input)
  await mapValueAtKey(mapped, "where", mapPostWhere)
  await mapValueAtKey(mapped, "data", mapPostData)
  await mapValueAtKey(mapped, "include", mapPostInclude)
  await mapValueAtKey(mapped, "select", mapPostSelect)
  return mapped
}

async function mapPostData(data: unknown): Promise<unknown> {
  if (Array.isArray(data)) return Promise.all(data.map(mapPostData))
  if (!isRecord(data)) return data

  const mapped: Record<string, unknown> = { ...data }
  const translations = extractNestedCreate(mapped.translations)
  const firstTranslation = translations[0]

  mapped.kind ??= "ARTICLE"
  mapped.channelId = await resolveLegacyColumnId(mapped.columnId)
  mapped.body =
    typeof mapped.body === "string"
      ? mapped.body
      : typeof firstTranslation?.content === "string"
        ? firstTranslation.content
        : ""
  mapped.metadata = {
    ...(isRecord(mapped.metadata) ? mapped.metadata : {}),
    cover: typeof mapped.cover === "string" ? mapped.cover : null,
  }
  delete mapped.columnId
  delete mapped.cover

  if (isRecord(mapped.translations)) {
    mapped.translations = {
      ...mapped.translations,
      create: await mapPostTranslationData(
        mapped.translations.create,
      ),
    }
  }

  return mapped
}

async function mapPostWhere(where: unknown): Promise<unknown> {
  if (!isRecord(where)) return where
  const mapped = mapKeys(where, {
    columnId: "channelId",
  })
  if (isRecord(mapped.AND)) mapped.AND = await mapPostWhere(mapped.AND)
  if (isRecord(mapped.OR)) mapped.OR = await mapPostWhere(mapped.OR)
  if (isRecord(mapped.NOT)) mapped.NOT = await mapPostWhere(mapped.NOT)
  if (Array.isArray(mapped.AND)) mapped.AND = await Promise.all(mapped.AND.map(mapPostWhere))
  if (Array.isArray(mapped.OR)) mapped.OR = await Promise.all(mapped.OR.map(mapPostWhere))
  if (Array.isArray(mapped.NOT)) mapped.NOT = await Promise.all(mapped.NOT.map(mapPostWhere))
  return mapped
}

async function mapPostInclude(include: unknown): Promise<unknown> {
  if (!isRecord(include)) return include
  const mapped = mapKeys(include, {
    column: "channel",
    tags: "tags",
    comments: "comments",
  })
  if (isRecord(mapped.channel)) {
    await mapValueAtKey(mapped.channel, "include", mapColumnInclude)
    await mapValueAtKey(mapped.channel, "select", mapColumnSelect)
  }
  return mapped
}

async function mapPostSelect(select: unknown): Promise<unknown> {
  if (!isRecord(select)) return select
  const mapped = mapKeys(select, {
    column: "channel",
  })
  if (mapped.cover !== undefined) {
    delete mapped.cover
    mapped.metadata = true
  }
  if (mapped.columnId !== undefined) {
    delete mapped.columnId
    mapped.channelId = true
  }
  return mapped
}

async function mapPostOutput(output: unknown): Promise<unknown> {
  if (!isRecord(output)) return output
  if (!("id" in output)) return output
  const row: Record<string, unknown> = {
    ...output,
    columnId: output.channelId ?? null,
    column: await mapColumnOutput(output.channel),
    cover: readCover(output.metadata),
  }
  if (Array.isArray(output.translations)) {
    row.translations = await Promise.all(output.translations.map((translation) =>
      mapPostTranslationOutput({
        ...(isRecord(translation) ? translation : {}),
        content: output.body,
      }),
    ))
  }
  if (Array.isArray(output.tags)) {
    row.tags = await Promise.all(output.tags.map(mapTagsOnPostsOutput))
  }
  if (Array.isArray(output.views)) {
    row.views = output.views.map(mapPostViewOutput)
  }
  if (Array.isArray(output.likes)) {
    row.likes = output.likes.map(mapPostLikeOutput)
  }
  return row
}

async function mapColumnInput(input: unknown): Promise<unknown> {
  const mapped = cloneInput(input)
  await mapValueAtKey(mapped, "where", mapColumnWhere)
  await mapValueAtKey(mapped, "data", mapColumnData)
  await mapValueAtKey(mapped, "include", mapColumnInclude)
  await mapValueAtKey(mapped, "select", mapColumnSelect)
  return mapped
}

async function mapColumnData(data: unknown): Promise<unknown> {
  if (Array.isArray(data)) return Promise.all(data.map(mapColumnData))
  if (!isRecord(data)) return data
  const mapped: Record<string, unknown> = {
    kind: "ARTICLES",
    layout: "CHRONICLE",
    ...data,
  }
  delete mapped.cover
  return mapped
}

async function mapColumnWhere(where: unknown): Promise<unknown> {
  return where
}

async function mapColumnInclude(include: unknown): Promise<unknown> {
  if (!isRecord(include)) return include
  return mapKeys(include, {
    posts: "entries",
  })
}

async function mapColumnSelect(select: unknown): Promise<unknown> {
  if (!isRecord(select)) return select
  const mapped = mapKeys(select, {
    posts: "entries",
  })
  if (mapped.cover !== undefined) delete mapped.cover
  return mapped
}

async function mapColumnOutput(output: unknown): Promise<unknown> {
  if (!isRecord(output)) return output
  const row: Record<string, unknown> = {
    ...output,
    cover: readColumnCover(output),
  }
  if (Array.isArray(output.entries)) {
    row.posts = await Promise.all(output.entries.map(mapPostOutput))
  }
  return row
}

async function mapColumnTranslationInput(input: unknown): Promise<unknown> {
  const mapped = cloneInput(input)
  await mapValueAtKey(mapped, "where", (where) =>
    mapObjectDeep(where, { columnId: "channelId", columnId_locale: "channelId_locale" }),
  )
  await mapValueAtKey(mapped, "data", (data) =>
    mapObjectDeep(data, { columnId: "channelId" }),
  )
  return mapped
}

async function mapPostTranslationInput(input: unknown): Promise<unknown> {
  const mapped = cloneInput(input)
  await mapValueAtKey(mapped, "where", (where) =>
    mapObjectDeep(where, { postId: "entryId", postId_locale: "entryId_locale" }),
  )
  await mapValueAtKey(mapped, "data", mapPostTranslationData)
  return mapped
}

async function mapPostTranslationData(data: unknown): Promise<unknown> {
  if (Array.isArray(data)) return Promise.all(data.map(mapPostTranslationData))
  if (!isRecord(data)) return data
  const mapped = mapKeys(data, { postId: "entryId" })
  delete mapped.content
  return mapped
}

async function mapPostTranslationOutput(output: unknown): Promise<unknown> {
  if (!isRecord(output)) return output
  const body =
    typeof output.content === "string"
      ? output.content
      : typeof output.entryId === "string"
        ? ((await prisma.entry.findUnique({
            where: { id: output.entryId },
            select: { body: true },
          }))?.body ?? null)
        : null
  return {
    ...output,
    postId: output.entryId,
    content: body,
  }
}

async function mapTagInput(input: unknown): Promise<unknown> {
  const mapped = cloneInput(input)
  await mapValueAtKey(mapped, "where", (where) =>
    mapObjectDeep(where, { posts: "entries", post: "entry", postId: "entryId" }),
  )
  await mapValueAtKey(mapped, "include", (include) =>
    mapObjectDeep(include, { posts: "entries", post: "entry", postId: "entryId" }),
  )
  await mapValueAtKey(mapped, "select", (select) =>
    mapObjectDeep(select, { posts: "entries", post: "entry", postId: "entryId" }),
  )
  return mapped
}

async function mapTagOutput(output: unknown): Promise<unknown> {
  if (!isRecord(output)) return output
  const row: Record<string, unknown> = { ...output }
  if (Array.isArray(output.entries)) {
    row.posts = await Promise.all(output.entries.map(mapTagsOnPostsOutput))
  }
  return row
}

async function mapTagsOnPostsInput(input: unknown): Promise<unknown> {
  const mapped = cloneInput(input)
  await mapValueAtKey(mapped, "where", (where) =>
    mapObjectDeep(where, { postId: "entryId", post: "entry" }),
  )
  await mapValueAtKey(mapped, "data", (data) =>
    mapObjectDeep(data, { postId: "entryId", post: "entry" }),
  )
  await mapValueAtKey(mapped, "include", (include) =>
    mapObjectDeep(include, { post: "entry" }),
  )
  await mapValueAtKey(mapped, "select", (select) =>
    mapObjectDeep(select, { postId: "entryId", post: "entry" }),
  )
  return mapped
}

async function mapTagsOnPostsOutput(output: unknown): Promise<unknown> {
  if (!isRecord(output)) return output
  return {
    ...output,
    postId: output.entryId,
    post: await mapPostOutput(output.entry),
  }
}

async function mapPostViewInput(input: unknown): Promise<unknown> {
  const mapped = cloneInput(input)
  await mapValueAtKey(mapped, "where", (where) =>
    mapObjectDeep(where, { postId: "entryId", post: "entry" }),
  )
  await mapValueAtKey(mapped, "data", (data) =>
    mapObjectDeep(data, { postId: "entryId", post: "entry" }),
  )
  return mapped
}

function mapPostViewOutput(output: unknown): unknown {
  if (!isRecord(output)) return output
  return { ...output, postId: output.entryId }
}

async function mapPostLikeInput(input: unknown): Promise<unknown> {
  const mapped = cloneInput(input)
  await mapValueAtKey(mapped, "where", (where) =>
    mapObjectDeep(where, { postId: "entryId", post: "entry" }),
  )
  await mapValueAtKey(mapped, "data", (data) =>
    mapObjectDeep(data, { postId: "entryId", post: "entry" }),
  )
  return mapped
}

function mapPostLikeOutput(output: unknown): unknown {
  if (!isRecord(output)) return output
  return { ...output, postId: output.entryId }
}

async function mapCommentInput(input: unknown): Promise<unknown> {
  const mapped = cloneInput(input)
  await mapValueAtKey(mapped, "where", (where) =>
    mapObjectDeep(where, { postId: "entryId", post: "entry" }),
  )
  await mapValueAtKey(mapped, "data", (data) =>
    mapObjectDeep(data, { postId: "entryId", post: "entry" }),
  )
  await mapValueAtKey(mapped, "include", (include) =>
    mapObjectDeep(include, { post: "entry" }),
  )
  await mapValueAtKey(mapped, "select", (select) =>
    mapObjectDeep(select, { postId: "entryId", post: "entry" }),
  )
  return mapped
}

async function resolveLegacyColumnId(columnId: unknown): Promise<string> {
  if (typeof columnId === "string") return columnId
  const existing = await prisma.channel.findUnique({
    where: { slug: "articles" },
    select: { id: true },
  })
  if (existing) return existing.id

  try {
    const created = await prisma.channel.upsert({
      where: { slug: "articles" },
      update: {},
      create: {
        slug: "articles",
        order: 0,
        enabled: true,
        kind: "ARTICLES",
        layout: "CHRONICLE",
      },
      select: { id: true },
    })
    await ensureLegacyArticleChannelTranslation(created.id)
    return created.id
  } catch (error) {
    if (!isUniqueConstraint(error)) throw error
    const raced = await prisma.channel.findUnique({
      where: { slug: "articles" },
      select: { id: true },
    })
    if (!raced) throw error
    await ensureLegacyArticleChannelTranslation(raced.id)
    return raced.id
  }
}

async function ensureLegacyArticleChannelTranslation(channelId: string): Promise<void> {
  try {
    await prisma.channelTranslation.upsert({
      where: { channelId_locale: { channelId, locale: "zh" } },
      update: {},
      create: {
        channelId,
        locale: "zh",
        name: "文章",
        description: "长文与思考",
      },
    })
  } catch (error) {
    if (!isUniqueConstraint(error)) throw error
    await prisma.channelTranslation.update({
      where: { channelId_locale: { channelId, locale: "zh" } },
      data: {},
    })
  }
}

function extractNestedCreate(value: unknown): Array<Record<string, unknown>> {
  if (!isRecord(value)) return []
  const create = value.create
  if (Array.isArray(create)) return create.filter(isRecord)
  return isRecord(create) ? [create] : []
}

function cloneInput(input: unknown): unknown {
  return cloneValue(input)
}

function cloneValue(value: unknown): unknown {
  if (value instanceof Date) return value
  if (Array.isArray(value)) return value.map(cloneValue)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, cloneValue(entryValue)]),
  )
}

async function mapValueAtKey(
  container: unknown,
  key: string,
  mapper: (value: unknown) => Promise<unknown> | unknown,
): Promise<void> {
  if (!isRecord(container) || !(key in container)) return
  container[key] = await mapper(container[key])
}

function mapObjectDeep(
  value: unknown,
  replacements: Record<string, string>,
): unknown {
  if (Array.isArray(value)) return value.map((item) => mapObjectDeep(item, replacements))
  if (!isRecord(value)) return value
  const mapped: Record<string, unknown> = {}
  for (const [key, entryValue] of Object.entries(value)) {
    mapped[replacements[key] ?? key] = mapObjectDeep(entryValue, replacements)
  }
  return mapped
}

function mapKeys(
  value: Record<string, unknown>,
  replacements: Record<string, string>,
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, entryValue] of Object.entries(value)) {
    mapped[replacements[key] ?? key] = entryValue
  }
  return mapped
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  )
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  )
}

function readCover(metadata: unknown): string | null {
  if (!isRecord(metadata)) return null
  return typeof metadata.cover === "string" ? metadata.cover : null
}

function readColumnCover(channel: Record<string, unknown>): string | null {
  const slug = typeof channel.slug === "string" ? channel.slug : "garden"
  const covers: Record<string, string> = {
    articles: "/showcase/cover-garden.png",
    stream: "/showcase/cover-engineering.png",
    guestbook: "/showcase/cover-writing.png",
  }
  return covers[slug] ?? "/showcase/cover-garden.png"
}

/**
 * Truncate Channel + ChannelTranslation between tests.
 * RESTART IDENTITY keeps autoincrements pristine (cuid ids aren't sequence-
 * backed but it's harmless).
 */
export async function resetColumns(): Promise<void> {
  await runResetSql(
    `TRUNCATE TABLE "Comment", "EntryLike", "EntryView", "TagsOnEntries", "EntryTranslation", "Entry", "SeriesTranslation", "Series", "ChannelTranslation", "Channel" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Truncate auxiliary tables a few cases need (User + Entry for the
 * countPostsInColumn test). Independent helper so the slim majority of
 * tests don't pay the cost.
 */
export async function resetPostsAndUsers(): Promise<void> {
  await runResetSql(
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
  await runResetSql(
    `TRUNCATE TABLE "Comment", "EntryLike", "EntryView", "TagsOnEntries", "EntryTranslation", "Entry", "SeriesTranslation", "Series" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Truncate Tag + the join table. Keeps Entry intact.
 */
export async function resetTags(): Promise<void> {
  await runResetSql(
    `TRUNCATE TABLE "TagsOnEntries", "Tag" RESTART IDENTITY CASCADE`,
  )
}

/**
 * Wipe the whole content/identity surface used by entry + tag + channel tests.
 * Ordering listed explicitly — children before parents — even though CASCADE
 * would handle it. Keeps PageView (analytics) and SiteConfig untouched.
 */
export async function resetAll(): Promise<void> {
  await runResetSql(
    `TRUNCATE TABLE "Comment", "EntryLike", "EntryView", "TagsOnEntries", "EntryTranslation", "Entry", "SeriesTranslation", "Series", "Tag", "ChannelTranslation", "Channel", "User" RESTART IDENTITY CASCADE`,
  )
}

async function runResetSql(sql: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(834612345)")
    await tx.$executeRawUnsafe(sql)
  })
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
