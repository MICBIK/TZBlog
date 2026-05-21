# Active Context — TZBlog

> 当前正在做什么 / 下一步是什么。每次会话结束前应该是最新的。

## 当前焦点

**P1 媒体上传已完结，下一步：文章列表 + 筛选 / 文章编辑器页**

- 媒体上传 §1-§7 已完成：Storage 抽象（local / s3 driver）、upload schema、media service、API routes、CoverUploader、ImageUploadButton、媒体库列表、MediaUploadDropzone、全局 Toaster、分页 12/页。
- 测试现状：Vitest node + jsdom projects；全量 170 passed / 1 skipped（171）。
- §7 v2 smoke：B-H、L、M 真实浏览器验证通过，截图与 Network 输出在 `/tmp/media-smoke-v2-results.json`。
- 7.3 `STORAGE_DRIVER=s3` 切换按用户要求跳过，后续由用户手动验。

## 下一步计划

1. 文章列表 + 筛选（专栏 / 状态 / 标签）
2. 文章编辑器页（接入 MarkdownEditorWithPreview + 元数据侧栏）

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
