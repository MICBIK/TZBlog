import { db } from "@/lib/db"

export interface CascadeProbeCounts {
  channel: number
  entries: number
  entryTranslations: number
  entryViews: number
  entryLikes: number
  comments: number
}

export async function probeChannelCascadeDelete(
  slug: string,
): Promise<CascadeProbeCounts> {
  const author = await db.user.upsert({
    where: { email: `${slug}@tzblog.local` },
    update: { role: "ADMIN" },
    create: {
      email: `${slug}@tzblog.local`,
      name: "Migration Probe",
      role: "ADMIN",
      password: "x",
    },
  })

  const channel = await db.channel.create({
    data: {
      slug,
      order: 900,
      enabled: true,
      kind: "CUSTOM",
      layout: "FEED",
      translations: {
        create: {
          locale: "zh",
          name: "Cascade Probe",
        },
      },
    },
  })

  const entry = await db.entry.create({
    data: {
      slug: `${slug}-entry`,
      channelId: channel.id,
      authorId: author.id,
      kind: "NOTE",
      status: "PUBLISHED",
      publishedAt: new Date(),
      body: "cascade probe",
      translations: {
        create: {
          locale: "zh",
          title: "Cascade Probe Entry",
        },
      },
      views: {
        create: {
          visitorHash: `${slug}-visitor`,
          dayKey: "2026-05-25",
        },
      },
      likes: {
        create: {
          visitorHash: `${slug}-visitor`,
        },
      },
      comments: {
        create: {
          authorName: "Probe Visitor",
          authorEmail: "probe@example.com",
          content: "cascade comment",
          status: "APPROVED",
          visitorHash: `${slug}-commenter`,
          ipAddress: "127.0.0.1",
          userAgent: "migration-probe",
        },
      },
    },
  })

  await db.channel.delete({ where: { id: channel.id } })

  const [
    channelCount,
    entryCount,
    entryTranslationCount,
    entryViewCount,
    entryLikeCount,
    commentCount,
  ] = await Promise.all([
    db.channel.count({ where: { id: channel.id } }),
    db.entry.count({ where: { id: entry.id } }),
    db.entryTranslation.count({ where: { entryId: entry.id } }),
    db.entryView.count({ where: { entryId: entry.id } }),
    db.entryLike.count({ where: { entryId: entry.id } }),
    db.comment.count({ where: { entryId: entry.id } }),
  ])

  return {
    channel: channelCount,
    entries: entryCount,
    entryTranslations: entryTranslationCount,
    entryViews: entryViewCount,
    entryLikes: entryLikeCount,
    comments: commentCount,
  }
}
