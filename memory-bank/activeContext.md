# Active Context — TZBlog

> 当前正在做什么 / 下一步是什么。每次会话结束前应该是最新的。

## 当前焦点

**P1 - 媒体上传 §1-§6 已完成（2026-05-19）**：
- Storage 抽象：`src/lib/storage/{types,local,s3,index}.ts` — IStorage 接口 + LocalDiskStorage / S3Storage 双 driver + env-driven factory（默认 local，s3 缺 env 抛 `errors.missingEnv` AppError）
- Schemas：`src/lib/schemas/media.ts` — `mediaFilterSchema`（page/pageSize 默认 1/12，上限 100）+ `validateUpload`（手写 sniffMime + 5MB 限制 + 4 格式白名单）
- Service：`src/lib/services/media.ts` — createMedia（key 拼 `yyyy/MM/<hex>.<ext>`、image-size best-effort 读尺寸、DB 失败回滚物理文件）/ listMedia 分页 / deleteMedia（NOT_FOUND + 真错误透传）
- API routes：`src/app/api/admin/uploads/route.ts`（POST 上传）+ `media/route.ts`（GET 分页列表）+ `media/[id]/route.ts`（DELETE）。统一走 `requireAdminSession` + `withErrorHandler` + `ok(data, meta)`
- UI 组件：`components/admin/posts/CoverUploader.tsx`（拖拽 + 点击 + 预览 + 清除，已替换 PostMetaSidebar 的 cover Input）/ `components/editor/ImageUploadButton.tsx`（Tiptap 工具栏，替换原 `window.prompt`）/ `components/admin/media/{MediaCard,MediaRowActions}.tsx` + `app/(admin)/admin/media/page.tsx`（卡片网格 + 分页 + Dialog 二次确认）
- Client helper：`src/lib/media-client.ts` — `uploadMediaFile(file)` + `deleteMediaById(id)`，统一错误透传给 toast
- Tests：163/164 ✓（+4 from §6.9 cover schema 修复）
- 提案：`openspec/changes/media-upload/` 含 proposal/design/specs/test-map/tasks，§6.9 已补审计后修复条目

**已修复的代码债（§6 审计期间）**：
- `src/lib/schemas/post.ts:44` + `column.ts:37`：`cover: z.string().url()` 拒绝 `/uploads/...` 相对路径 → 抽 `coverFieldSchema` 用 refine 接受 空字符串 / 绝对 URL / `/`-rooted 路径。修复后浏览器 smoke 通过保存文章流程

**审计期间记录、未修复的范围外问题**：
- 登录表单 zodResolver `z.string().email()` 拒 `.local` TLD（用户已通过 seed `admin@example.com` 绕过）→ 已落 `memory-bank/knownIssues.md` KI-001，不在 P1-3 媒体上传范围

**§5 审计期遗留修复**：
- §4 deleteMedia 外层 silent catch → 真错误透传（保留 storage 内部 ENOENT/NoSuchKey 幂等）
- §2 storage factory 裸 `Error + code` → `errors.missingEnv()` AppError 统一形态
- §4 createMedia 接 image-size 写入 width/height（best-effort，失败留 null）

## 下一步计划

**P1 媒体上传 §7 集成验收**：
- 7.1 `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 全绿（前三项已绿，pending build）
- 7.2 manual smoke：png/jpg/webp/gif 各上传一张；svg / 6MB / exe-改 png 各被拒；删一张被 Post.cover 引用的图看破图
- 7.3 切 `STORAGE_DRIVER=s3` 验 driver 切换零业务侧改动（验证 D1 决策）
- 7.4-7.6 标记 P1-3 完成 + `/opsx:verify media-upload` + `/opsx:archive media-upload`

## 关键决策（已锁定）

| 决策 | 选择 |
|---|---|
| 应用形态 | 单体 Next.js |
| 框架 | Next.js 16 (App Router) |
| DB / ORM | Postgres 16 + Prisma 7（driver adapter @prisma/adapter-pg）|
| UI | shadcn/ui + Tailwind v4 + CSS 变量 |
| 编辑器 | Tiptap WYSIWYG + Markdown 序列化 |
| 认证 | Auth.js v5 split-config（Edge-safe + Full）|
| 媒体 | MinIO |
| 部署 | VPS + Docker Compose + Caddy |
| 分析 | 自研（无第三方）|
| 评论 | 匿名 + 后台审核 |
| i18n | schema 预留 *Translation 子表 |

## 注意事项 / 偏离记录

- **Prisma 7 driver adapter 模式**：schema.prisma 内不再写 datasource.url；运行期 `src/lib/db.ts` 用 `@prisma/adapter-pg`；migrate/introspect 走 `prisma.config.ts` 的 datasource.url（dotenv 主动加载）
- **Next.js 16 中间件 deprecation**：构建会报 `middleware.ts` deprecated → 应改名 `proxy.ts`，但功能正常工作。计划在 P1 早期处理
- **Tiptap markdown pipeline 简化**：`MarkdownEditorWithPreview` 客户端预览用了 mini-renderer（待 V2 接 marked + DOMPurify 完整化），完整 remark+shiki 已落到服务端 `MarkdownPreview`
- **rehype-shiki 替换**：原计划的 `rehype-shiki@0.0.9` 与 shiki@4 不兼容，改成内联 transformer 调用 `createHighlighter` + `codeToHast`

## 待用户决策（不阻塞 P1）

- VPS 实际购买（推荐 Hetzner CX22，部署阶段前定）
- 域名（部署前定）

## 阻塞项

无。

