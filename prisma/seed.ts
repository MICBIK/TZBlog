/**
 * TZBlog 初始化 seed
 * - upsert 一个 ADMIN role 的 User（凭 ADMIN_EMAIL/ADMIN_PASSWORD 环境变量）
 * - upsert SiteConfig singleton（id = "singleton"）
 * - upsert 一组本地展示内容，便于前台与 CMS 做完整 smoke
 *
 * 运行：pnpm db:seed
 */
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

const showcaseColumns = [
  {
    slug: "engineering-notes",
    cover: "/uploads/audit-cover-1.png",
    order: 0,
    name: "工程札记",
    description: "记录从需求、架构、测试到部署的完整工程取舍。",
  },
  {
    slug: "writing-system",
    cover: "/uploads/audit-cover-2.png",
    order: 1,
    name: "写作系统",
    description: "围绕 Markdown、编辑器体验和个人知识发布系统的长期实验。",
  },
];

const showcasePosts = [
  {
    slug: "designing-a-technical-garden",
    columnSlug: "engineering-notes",
    cover: "/uploads/audit-cover-3.png",
    title: "把技术博客设计成可以长期生长的花园",
    excerpt:
      "一次围绕首页、文章索引和阅读页的信息架构重组：减少模板感，保留工程密度。",
    tags: ["design", "nextjs", "writing"],
    viewCount: 128,
    likeCount: 12,
    commentCount: 1,
    publishedAt: addDays(publishedAtBase, -2),
    content: `# 把技术博客设计成可以长期生长的花园

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

![](/uploads/audit-image-1.png)

\`\`\`ts
const layout = ["identity", "content", "context"] as const;
const density = layout.includes("content") ? "readable" : "empty";
\`\`\`

这套结构的目标是让后续每篇文章都自然落进系统，而不是每次发文都重新设计一个入口。
`,
  },
  {
    slug: "notion-like-markdown-workflow",
    columnSlug: "writing-system",
    cover: "/uploads/audit-cover-4.png",
    title: "Notion-like 交互和 Markdown 存储可以同时存在吗",
    excerpt:
      "编辑器可以更像 Notion，但后端仍然只保存 Markdown 字符串，这是当前版本的核心边界。",
    tags: ["markdown", "editor", "notion"],
    viewCount: 96,
    likeCount: 18,
    commentCount: 1,
    publishedAt: addDays(publishedAtBase, -1),
    content: `# Notion-like 交互和 Markdown 存储可以同时存在吗

我愿意放弃"编辑区永远显示 Markdown 原文"这个硬约束，但不愿意把数据存成某个编辑器私有的 JSON。

## 当前边界

- 输入体验可以有 slash command。
- 选中文本后可以出现 bubble formatting。
- 媒体插入必须保存安全 URL。
- 发布态仍然走同一个 \`renderMarkdown\` 管道。

![](/uploads/audit-image-2.png)

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
    columnSlug: "engineering-notes",
    cover: "/uploads/audit-cover-5.png",
    title: "自部署 Next.js 博客需要哪些最小可观测性",
    excerpt:
      "从访问上报、RSS、sitemap 到后台统计，用自研链路替代第三方分析工具的 MVP 版本。",
    tags: ["nextjs", "analytics", "self-hosting"],
    viewCount: 203,
    likeCount: 27,
    commentCount: 0,
    publishedAt: publishedAtBase,
    content: `# 自部署 Next.js 博客需要哪些最小可观测性

一个单人博客不需要从第一天开始就接入复杂的数据平台，但至少要知道今天有没有人访问、看了什么、哪些页面断了。

## MVP 指标

1. 全局 PageView。
2. 文章浏览去重。
3. 点赞与评论计数。
4. RSS / sitemap / OG 图持续可用。

![](/uploads/audit-image-3.png)

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
  const columnsBySlug = new Map<string, { id: string }>();

  for (const item of showcaseColumns) {
    const column = await prisma.column.upsert({
      where: { slug: item.slug },
      update: {
        cover: item.cover,
        order: item.order,
      },
      create: {
        slug: item.slug,
        cover: item.cover,
        order: item.order,
        translations: {
          create: {
            locale: "zh",
            name: item.name,
            description: item.description,
          },
        },
      },
      select: { id: true, slug: true },
    });

    await prisma.columnTranslation.upsert({
      where: { columnId_locale: { columnId: column.id, locale: "zh" } },
      create: {
        columnId: column.id,
        locale: "zh",
        name: item.name,
        description: item.description,
      },
      update: {
        name: item.name,
        description: item.description,
      },
    });

    columnsBySlug.set(column.slug, { id: column.id });
  }

  for (const item of showcasePosts) {
    const column = columnsBySlug.get(item.columnSlug);
    if (!column) throw new Error(`Missing showcase column: ${item.columnSlug}`);

    const tagRows: Array<{ id: string }> = [];
    for (const slug of item.tags) {
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: { name: tagName(slug) },
        create: { slug, name: tagName(slug) },
      });
      tagRows.push(tag);
    }

    const post = await prisma.post.upsert({
      where: { slug: item.slug },
      update: {
        cover: item.cover,
        status: "PUBLISHED",
        publishedAt: item.publishedAt,
        authorId,
        columnId: column.id,
        viewCount: item.viewCount,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
      },
      create: {
        slug: item.slug,
        cover: item.cover,
        status: "PUBLISHED",
        publishedAt: item.publishedAt,
        authorId,
        columnId: column.id,
        viewCount: item.viewCount,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
      },
      select: { id: true },
    });

    await prisma.postTranslation.upsert({
      where: { postId_locale: { postId: post.id, locale: "zh" } },
      create: {
        postId: post.id,
        locale: "zh",
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
      },
      update: {
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
      },
    });

    await prisma.tagsOnPosts.deleteMany({ where: { postId: post.id } });
    await prisma.tagsOnPosts.createMany({
      data: tagRows.map((tag) => ({ postId: post.id, tagId: tag.id })),
      skipDuplicates: true,
    });
  }

  await seedShowcaseComments();
}

async function seedShowcaseComments() {
  const commentSeeds = [
    {
      postSlug: "designing-a-technical-garden",
      authorName: "读者 A",
      authorEmail: "reader-a@example.com",
      content: "这个首页结构比传统 hero 更适合长期写作，尤其是 identity rail 的处理。",
      visitorHash: "showcase-reader-a",
    },
    {
      postSlug: "notion-like-markdown-workflow",
      authorName: "读者 B",
      authorEmail: "reader-b@example.com",
      content: "Markdown 存储边界很清晰，后续接入第三方 editor 时也更容易回滚。",
      visitorHash: "showcase-reader-b",
    },
  ];

  for (const item of commentSeeds) {
    const post = await prisma.post.findUnique({
      where: { slug: item.postSlug },
      select: { id: true },
    });
    if (!post) continue;

    await prisma.comment.deleteMany({
      where: { postId: post.id, visitorHash: item.visitorHash },
    });
    await prisma.comment.create({
      data: {
        postId: post.id,
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
    design: "Design",
    editor: "Editor",
    markdown: "Markdown",
    nextjs: "Next.js",
    notion: "Notion",
    "self-hosting": "Self-hosting",
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
