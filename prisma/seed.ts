/**
 * TZBlog 初始化 seed
 * - upsert 一个 ADMIN role 的 User（凭 ADMIN_EMAIL/ADMIN_PASSWORD 环境变量）
 * - upsert SiteConfig singleton（id = "singleton"）
 * - upsert 一组本地展示内容，便于前台与 CMS 做完整 smoke
 *
 * 运行：pnpm db:seed
 */
import type {
  ChannelKind,
  ChannelLayout,
  EntryKind,
  EntryStatus,
  Prisma,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const publishedAtBase = new Date("2026-05-24T08:00:00.000Z");

interface ShowcaseChannel {
  slug: string;
  order: number;
  enabled: boolean;
  kind: ChannelKind;
  layout: ChannelLayout;
  icon: string;
  accentColor?: string;
  name: string;
  description: string;
  tagline: string;
}

interface ShowcaseEntry {
  slug: string;
  channelSlug: string;
  kind: EntryKind;
  status: EntryStatus;
  publishedAt: Date;
  title: string;
  excerpt: string;
  body: string;
  metadata: Prisma.InputJsonValue;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

const showcaseChannels: ShowcaseChannel[] = [
  {
    slug: "articles",
    order: 0,
    enabled: true,
    kind: "ARTICLES",
    layout: "CHRONICLE",
    icon: "BookOpen",
    accentColor: "var(--accent)",
    name: "文章",
    description: "长文、工程复盘与系统性思考。",
    tagline: "在快的时代写慢一些的字",
  },
  {
    slug: "stream",
    order: 1,
    enabled: true,
    kind: "STREAM",
    layout: "GREP",
    icon: "Terminal",
    accentColor: "var(--term-phosphor)",
    name: "日志流",
    description: "链接、笔记、引语、笑话与短评。",
    tagline: "grep my mind",
  },
  {
    slug: "guestbook",
    order: 99,
    enabled: false,
    kind: "GUESTBOOK",
    layout: "FEED",
    icon: "MessageCircle",
    name: "留言板",
    description: "私密留言和 threaded replies 的入口。",
    tagline: "leave a trace",
  },
];

const showcaseEntries: ShowcaseEntry[] = [
  {
    slug: "why-i-rewrote-my-blog",
    channelSlug: "articles",
    kind: "ARTICLE",
    status: "PUBLISHED",
    title: "为什么我重做了自己的博客",
    excerpt: "从 4 板块到 Channel/Entry 元模型的重构记录",
    metadata: { cover: "/showcase/cover-garden.png", readingMinutes: 8, toc: true },
    tags: ["design", "nextjs", "writing"],
    viewCount: 128,
    likeCount: 12,
    commentCount: 1,
    publishedAt: addDays(publishedAtBase, -2),
    body: `# 为什么我重做了自己的博客

一个个人技术博客真正难的地方，不是把文章列表渲染出来，而是让读者在第一页就知道这个系统为什么存在。

> [!NOTE]
> 首页应该像一个不断更新的工作台，而不是一次性写完的宣传页。

## 信息架构

我把首页拆成三条线：身份、内容流和上下文。身份回答"我是谁"，内容流承载文章，右侧上下文放 GitHub 与站点统计。

| 区域 | 作用 |
| --- | --- |
| Identity rail | 稳定的作者与项目定位 |
| Content stream | 最新文章、专栏和原则 |
| Context rail | GitHub、统计与运行状态 |

## 细节

![](/showcase/article-garden.png)

\`\`\`ts
const layout = ["identity", "content", "context"] as const;
const density = layout.includes("content") ? "readable" : "empty";
\`\`\`

这套结构的目标是让后续每篇文章都自然落进系统，而不是每次发文都重新设计一个入口。
`,
  },
  {
    slug: "notion-like-markdown-workflow",
    channelSlug: "articles",
    kind: "ARTICLE",
    status: "PUBLISHED",
    title: "Notion-like 交互和 Markdown 存储可以同时存在吗",
    excerpt:
      "编辑器可以更像 Notion，但后端仍然只保存 Markdown 字符串，这是当前版本的核心边界。",
    metadata: { cover: "/showcase/cover-editor.png", readingMinutes: 10, toc: true },
    tags: ["markdown", "editor", "notion"],
    viewCount: 96,
    likeCount: 18,
    commentCount: 1,
    publishedAt: addDays(publishedAtBase, -1),
    body: `# Notion-like 交互和 Markdown 存储可以同时存在吗

我愿意放弃"编辑区永远显示 Markdown 原文"这个硬约束，但不愿意把数据存成某个编辑器私有的 JSON。

## 当前边界

- 输入体验可以有 slash command。
- 选中文本后可以出现 bubble formatting。
- 媒体插入必须保存安全 URL。
- 发布态仍然走同一个 \`renderMarkdown\` 管道。

![](/showcase/article-editor.png)

\`\`\`ts
interface EditorContract {
  storage: "markdown";
  preview: "renderMarkdown";
  privateSchema: false;
}
\`\`\`

> [!TIP]
> 真正值得保留的是内容迁移能力，而不是某个编辑器运行时。
`,
  },
  {
    slug: "self-hosted-nextjs-observability",
    channelSlug: "articles",
    kind: "REVIEW",
    status: "PUBLISHED",
    title: "自部署 Next.js 博客需要哪些最小可观测性",
    excerpt:
      "从访问上报、RSS、sitemap 到后台统计，用自研链路替代第三方分析工具的 MVP 版本。",
    metadata: {
      itemType: "system",
      itemTitle: "TZBlog observability stack",
      rating: 5,
      cover: "/showcase/cover-observability.png",
      readingMinutes: 9,
      toc: true,
    },
    tags: ["nextjs", "analytics", "self-hosting"],
    viewCount: 203,
    likeCount: 27,
    commentCount: 0,
    publishedAt: publishedAtBase,
    body: `# 自部署 Next.js 博客需要哪些最小可观测性

一个单人博客不需要从第一天开始就接入复杂的数据平台，但至少要知道今天有没有人访问、看了什么、哪些页面断了。

## MVP 指标

1. 全局 PageView。
2. 文章浏览去重。
3. 点赞与评论计数。
4. RSS / sitemap / OG 图持续可用。

> [!WARNING]
> 如果展示内容只依赖本地上传目录，干净环境的 smoke 会看到破图，所以 seed 必须引用仓库内可追踪资产。

### 交付前检查

| 指标 | 交付标准 |
| --- | --- |
| 首页 | 有精选文章、专栏和统计模块 |
| 详情页 | 有 TOC、代码块、图片和评论区 |
| 索引页 | 文章、专栏、标签都能互相跳转 |

![](/showcase/article-observability.png)

\`\`\`ts
const signal = {
  pageView: true,
  postView: "daily-deduped",
  comments: "reviewed",
};
\`\`\`

这些数据不追求复杂，但必须足够稳定，能支撑上线后的每一次判断。
`,
  },
  {
    slug: "note-2026-05-23",
    channelSlug: "stream",
    kind: "NOTE",
    status: "PUBLISHED",
    title: "关于解决一类问题",
    excerpt: "一条关于工程抽象边界的短笔记。",
    metadata: { mood: "focused" },
    tags: ["writing"],
    viewCount: 44,
    likeCount: 6,
    commentCount: 0,
    publishedAt: addDays(publishedAtBase, -3),
    body: `今天读到一段："好的工程师只解决一个问题，伟大的工程师解决一类问题。"

我更愿意把时间花在后者上：让下一次类似问题不再出现，而不是把同一块补丁贴十遍。`,
  },
  {
    slug: "link-postgres-locks",
    channelSlug: "stream",
    kind: "LINK",
    status: "PUBLISHED",
    title: "Reading Postgres Locks",
    excerpt: "一篇适合作为 Postgres lock 入门索引的外部文章。",
    metadata: {
      sourceUrl: "https://www.tbray.org/ongoing/When/202x/2026/05/15/Postgres-Locks",
      sourceTitle: "Reading Postgres Locks",
      sourceAuthor: "Tim Bray",
      domain: "tbray.org",
    },
    tags: ["postgres", "systems"],
    viewCount: 61,
    likeCount: 9,
    commentCount: 0,
    publishedAt: addDays(publishedAtBase, -4),
    body: "Tim Bray 写的 Postgres lock 导读很适合补齐事务隔离与锁等待的直觉。",
  },
  {
    slug: "joke-bom-prod",
    channelSlug: "stream",
    kind: "JOKE",
    status: "PUBLISHED",
    title: "一个 BOM 引发的血案",
    excerpt: "生产环境最怕看起来不像代码变更的代码变更。",
    metadata: { category: "tech" },
    tags: ["systems"],
    viewCount: 73,
    likeCount: 14,
    commentCount: 0,
    publishedAt: addDays(publishedAtBase, -5),
    body: `> 同事：你昨天上的什么？
> 我：一行 UTF-8 BOM。
> 同事：。
> （此后 prod 挂了 4 小时）`,
  },
  {
    slug: "quote-didion",
    channelSlug: "stream",
    kind: "QUOTE",
    status: "PUBLISHED",
    title: "Joan Didion 的开篇",
    excerpt: "一句关于叙事和生存的引语。",
    metadata: {
      author: "Joan Didion",
      source: "The White Album",
      language: "en",
    },
    tags: ["reading"],
    viewCount: 52,
    likeCount: 8,
    commentCount: 0,
    publishedAt: addDays(publishedAtBase, -6),
    body: "\"We tell ourselves stories in order to live.\"",
  },
  {
    slug: "hot-take-2026-05-22",
    channelSlug: "stream",
    kind: "HOT_TAKE",
    status: "PUBLISHED",
    title: "关于 demo 驱动发布",
    excerpt: "一次关于 AI 产品发布节奏的短评。",
    metadata: {
      sourcePlatform: "weibo",
      sourceUrl: "https://weibo.com/example",
      sourceSnippet: "某 AI 公司发布通用模型 5.0",
      capturedAt: "2026-05-22T10:00:00.000Z",
    },
    tags: ["ai", "tooling"],
    viewCount: 89,
    likeCount: 11,
    commentCount: 0,
    publishedAt: addDays(publishedAtBase, -2),
    body: "demo 里的成功案例如果都被人工挑选过，那它最多证明发布会准备得不错，不证明产品已经稳定。",
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment to seed the admin user."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      // 不覆盖现有密码，避免 reset 误伤
      role: "ADMIN",
    },
    create: {
      email,
      name: "Admin",
      role: "ADMIN",
      password: passwordHash,
    },
  });

  await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: {
      metadata: {
        title: "TZBlog",
        description: "个人技术博客",
      },
    },
    create: {
      id: "singleton",
      themeName: "default",
      themeVars: {},
      metadata: {
        title: "TZBlog",
        description: "个人技术博客",
      },
    },
  });

  await seedShowcaseContent(admin.id);

  console.log(`✅ Seeded admin user: ${admin.email}`);
}

async function seedShowcaseContent(authorId: string) {
  const channelsBySlug = new Map<string, { id: string }>();

  for (const item of showcaseChannels) {
    const channel = await prisma.channel.upsert({
      where: { slug: item.slug },
      update: {
        order: item.order,
        enabled: item.enabled,
        kind: item.kind,
        layout: item.layout,
        icon: item.icon,
        accentColor: item.accentColor ?? null,
      },
      create: {
        slug: item.slug,
        order: item.order,
        enabled: item.enabled,
        kind: item.kind,
        layout: item.layout,
        icon: item.icon,
        accentColor: item.accentColor,
        translations: {
          create: {
            locale: "zh",
            name: item.name,
            description: item.description,
            tagline: item.tagline,
          },
        },
      },
      select: { id: true, slug: true },
    });

    await prisma.channelTranslation.upsert({
      where: { channelId_locale: { channelId: channel.id, locale: "zh" } },
      create: {
        channelId: channel.id,
        locale: "zh",
        name: item.name,
        description: item.description,
        tagline: item.tagline,
      },
      update: {
        name: item.name,
        description: item.description,
        tagline: item.tagline,
      },
    });

    channelsBySlug.set(channel.slug, { id: channel.id });
  }

  for (const item of showcaseEntries) {
    const channel = channelsBySlug.get(item.channelSlug);
    if (!channel) throw new Error(`Missing showcase channel: ${item.channelSlug}`);

    const tagRows: Array<{ id: string }> = [];
    for (const slug of item.tags) {
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: { name: tagName(slug) },
        create: { slug, name: tagName(slug) },
      });
      tagRows.push(tag);
    }

    const entry = await prisma.entry.upsert({
      where: { slug: item.slug },
      update: {
        kind: item.kind,
        status: item.status,
        publishedAt: item.publishedAt,
        authorId,
        channelId: channel.id,
        body: item.body,
        metadata: item.metadata,
        viewCount: item.viewCount,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
      },
      create: {
        slug: item.slug,
        kind: item.kind,
        status: item.status,
        publishedAt: item.publishedAt,
        authorId,
        channelId: channel.id,
        body: item.body,
        metadata: item.metadata,
        viewCount: item.viewCount,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
      },
      select: { id: true },
    });

    await prisma.entryTranslation.upsert({
      where: { entryId_locale: { entryId: entry.id, locale: "zh" } },
      create: {
        entryId: entry.id,
        locale: "zh",
        title: item.title,
        excerpt: item.excerpt,
      },
      update: {
        title: item.title,
        excerpt: item.excerpt,
      },
    });

    await prisma.tagsOnEntries.deleteMany({ where: { entryId: entry.id } });
    await prisma.tagsOnEntries.createMany({
      data: tagRows.map((tag) => ({ entryId: entry.id, tagId: tag.id })),
      skipDuplicates: true,
    });
  }

  await seedShowcaseComments();
}

async function seedShowcaseComments() {
  const commentSeeds = [
    {
      entrySlug: "why-i-rewrote-my-blog",
      authorName: "读者 A",
      authorEmail: "reader-a@example.com",
      content: "这个首页结构比传统 hero 更适合长期写作，尤其是 identity rail 的处理。",
      visitorHash: "showcase-reader-a",
    },
    {
      entrySlug: "notion-like-markdown-workflow",
      authorName: "读者 B",
      authorEmail: "reader-b@example.com",
      content: "Markdown 存储边界很清晰，后续接入第三方 editor 时也更容易回滚。",
      visitorHash: "showcase-reader-b",
    },
  ];

  for (const item of commentSeeds) {
    const entry = await prisma.entry.findUnique({
      where: { slug: item.entrySlug },
      select: { id: true },
    });
    if (!entry) continue;

    await prisma.comment.deleteMany({
      where: { entryId: entry.id, visitorHash: item.visitorHash },
    });
    await prisma.comment.create({
      data: {
        entryId: entry.id,
        authorName: item.authorName,
        authorEmail: item.authorEmail,
        content: item.content,
        status: "APPROVED",
        visitorHash: item.visitorHash,
        ipAddress: "127.0.0.1",
        userAgent: "TZBlog showcase seed",
        reviewedBy: "seed",
        reviewedAt: new Date("2026-05-24T08:30:00.000Z"),
      },
    });
  }
}

function tagName(slug: string): string {
  const names: Record<string, string> = {
    analytics: "Analytics",
    ai: "AI",
    design: "Design",
    editor: "Editor",
    markdown: "Markdown",
    nextjs: "Next.js",
    notion: "Notion",
    postgres: "Postgres",
    reading: "Reading",
    "self-hosting": "Self-hosting",
    systems: "Systems",
    tooling: "Tooling",
    writing: "Writing",
  };

  return names[slug] ?? slug;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
