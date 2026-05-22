import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const activeDocs = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "docs/development.md",
  "docs/architecture.md",
  "memory-bank/projectBrief.md",
  "memory-bank/techContext.md",
  "memory-bank/systemPatterns.md",
  "memory-bank/activeContext.md",
];

async function readProjectFile(path: string): Promise<string> {
  return readFile(join(process.cwd(), path), "utf-8");
}

describe("README sanity", () => {
  it("does not contain create-next-app boilerplate", async () => {
    const content = await readProjectFile("README.md");

    expect(content).not.toContain("bootstrapped with [`create-next-app`]");
    expect(content).not.toContain(
      "You can start editing the page by modifying `app/page.tsx`",
    );
    expect(content).not.toContain("Deploy on Vercel");
  });

  it("contains project identity markers", async () => {
    const content = await readProjectFile("README.md");

    expect(content).toContain("TZBlog");
    expect(content).toMatch(/MinIO|S3/);
    expect(content).toMatch(/Docker Compose|VPS|Caddy/);
  });
});

describe("prelaunch docs sanity", () => {
  it("docsDoNotContainStaleCurrentStackMarkers", async () => {
    const staleMarkers = [
      "Next.js 15",
      "Prisma 5",
      "Tiptap v2",
      "Tiptap WYSIWYG",
      "src/middleware.ts",
      "middleware 守卫",
      "OpenSpec change",
    ];

    const docs = await Promise.all(
      activeDocs.map(async (path) => ({
        path,
        content: await readProjectFile(path),
      })),
    );

    for (const { path, content } of docs) {
      for (const marker of staleMarkers) {
        expect(content, `${path} still contains ${marker}`).not.toContain(
          marker,
        );
      }
    }
  });

  it("progressReflectsResolvedDebtsAndCurrentBacklog", async () => {
    const content = await readProjectFile("memory-bank/progress.md");

    expect(content).toContain("[x] 首页 Hero + 技术栈 + 最近文章 + GitHub 数据");
    expect(content).toContain("[x] 文章列表 + 专栏聚合页 + 标签页");
    expect(content).toContain("[x] 自研 Analytics 后台仪表盘");
    expect(content).toContain("[x] README + 部署文档");
    expect(content).not.toContain("PostsTable.tsx:71");
    expect(content).not.toContain("ColumnsTable.tsx:122");
    expect(content).not.toContain("window.confirm");
    expect(content).toContain("prelaunch-readiness");
  });

  it("roadmapContainsExplicitV2V3BacklogBoundaries", async () => {
    const projectBrief = await readProjectFile("memory-bank/projectBrief.md");
    const progress = await readProjectFile("memory-bank/progress.md");
    const combined = `${projectBrief}\n${progress}`;

    expect(combined).toContain("V2 backlog");
    expect(combined).toContain("V3 backlog");
    expect(combined).toContain("独立 SDD");
    expect(combined).toContain("不属于本轮 prelaunch-readiness");
    expect(combined).not.toContain("V2 / V3 路线");
  });
});
