# Active Context — TZBlog

> 当前正在做什么 / 下一步是什么。每次会话结束前应该是最新的。

## 当前焦点

**P1 后台 CMS 主干已完结（专栏 / 媒体 / 文章列表 / 文章编辑器），下一步：评论审核页 或 进入 P2 前台展示**

- 媒体上传 §1-§7 已完成（archive `2026-05-21-media-upload`）。
- 文章列表 + 筛选 + 编辑器：代码在 P0 阶段已落，**2026-05-21** 补齐 5 个外围测试文件（API route + 关键组件 jsdom），全量 22 files / 213 passed / 1 skipped。
- 全套自动验证（pnpm typecheck / lint / test）全绿。
- 后台主功能链路完整：列表 → 筛选（q/status/column/tag）→ 新建 → 上传封面 → 草稿 → 发布 → 编辑 → 归档 → 删除。

## 下一步计划

1. **C. 评论审核页**（P1 收尾）：pending/approved/spam/rejected 标签 + 批量操作。需先 seed 少量评论。
2. **D. P2 前台展示开门**：首页 Hero + 最近文章 + 文章详情（Shiki + TOC），顺便闭环 KI-002（`Post.cover` 前台未渲染）。
3. **E. RSS / sitemap / OG 图生成**（P2 中期）。

## 待办池 / 已知问题

- KI-001：登录表单 zodResolver 拒 `.local` TLD，见 `memory-bank/knownIssues.md`。
- KI-002：`Post.cover` 前台未渲染，P2 前台展示阶段处理。

## 关键决策（已锁定）

| 决策 | 选择 |
|---|---|
| 应用形态 | 单体 Next.js |
| 框架 | Next.js 16 (App Router) |
| DB / ORM | Postgres 16 + Prisma 7（driver adapter @prisma/adapter-pg）|
| UI | shadcn/ui + Tailwind v4 + CSS 变量 |
| 编辑器 | Tiptap WYSIWYG + Markdown 序列化 |
| 认证 | Auth.js v5 split-config（Edge-safe + Full）|
| 媒体 | local / MinIO S3 driver |
| 部署 | VPS + Docker Compose + Caddy |
| 分析 | 自研（无第三方）|
| 评论 | 匿名 + 后台审核 |
| i18n | schema 预留 *Translation 子表 |

## 注意事项 / 偏离记录

- **Prisma 7 driver adapter 模式**：schema.prisma 内不再写 datasource.url；运行期 `src/lib/db.ts` 用 `@prisma/adapter-pg`；migrate/introspect 走 `prisma.config.ts` 的 datasource.url（dotenv 主动加载）。
- **Next.js 16 中间件 deprecation**：构建会报 `middleware.ts` deprecated → 应改名 `proxy.ts`，但功能正常工作。
- **Tiptap markdown pipeline 简化**：`MarkdownEditorWithPreview` 客户端预览用了 mini-renderer（待 V2 接 marked + DOMPurify 完整化），完整 remark+shiki 已落到服务端 `MarkdownPreview`。
- **rehype-shiki 替换**：原计划的 `rehype-shiki@0.0.9` 与 shiki@4 不兼容，改成内联 transformer 调用 `createHighlighter` + `codeToHast`。

## 待用户决策（不阻塞 P1）

- VPS 实际购买（推荐 Hetzner CX22，部署阶段前定）
- 域名（部署前定）

## 阻塞项

无。
