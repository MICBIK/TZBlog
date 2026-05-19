# tasks.md — media-upload

> 微循环结构：1 spec scenario = 1 微循环 (`.a [TEST-RED]` + `.b [IMPL-GREEN]`)。
> 阶段前缀 `[P1]`（后台 CMS 阶段）。
> UI 组件改造（§6）按 test-map.md 约定走 manual smoke 验收，不写 RTL 自动化测试 — 行为合同由 §4 §5 的 API/service 测试覆盖。

## 1. [P1] 准备工作

- [x] 1.1 加依赖 `file-type` (magic-number 嗅探) 与 `image-size` (读 width/height)：`pnpm add file-type image-size`
- [x] 1.2 改 `.gitignore` 排除 `public/uploads/*`，新增 `public/uploads/.gitkeep`
- [x] 1.3 `.env.example` 加 `STORAGE_DRIVER=local`、`LOCAL_UPLOAD_DIR=public/uploads`、`LOCAL_PUBLIC_URL_PREFIX=/uploads`
- [x] 1.4 admin 导航栏组件加"媒体"链接占位（路由暂时 404，§6.6 落地后自然解锁）

## 2. [P1] storage-driver

### 2.1 LocalDiskStorage.publicUrl

- [x] 2.1.a [TEST-RED] 写 `LocalDiskStorage.publicUrl joins prefix and key`，跑 `pnpm test src/lib/storage/local.test.ts` 粘 FAIL
- [x] 2.1.b [IMPL-GREEN] 实现 `LocalDiskStorage.publicUrl(key)` 拼字符串，跑测试粘 PASS

### 2.2 LocalDiskStorage.put 创建嵌套目录

- [x] 2.2.a [TEST-RED] 写 `put creates nested directories for dated keys`，粘 FAIL
- [x] 2.2.b [IMPL-GREEN] 实现 `LocalDiskStorage.put` 含 `mkdir -p` 与 `writeFile`，粘 PASS

### 2.3 LocalDiskStorage.put 返回完整 url

- [x] 2.3.a [TEST-RED] 写 `put returns full url with prefix`，粘 FAIL
- [x] 2.3.b [IMPL-GREEN] put 内部调 publicUrl 拼返回，粘 PASS

### 2.4 LocalDiskStorage.delete 幂等

- [x] 2.4.a [TEST-RED] 写 `delete on missing file is idempotent (no ENOENT)`，粘 FAIL
- [x] 2.4.b [IMPL-GREEN] delete 内 try/catch ENOENT 吞错，粘 PASS

### 2.5 S3Storage.publicUrl 处理 trailing slash

- [x] 2.5.a [TEST-RED] 写 `S3Storage.publicUrl normalises trailing slash`，粘 FAIL
- [x] 2.5.b [IMPL-GREEN] 实现 `S3Storage.publicUrl` 用 `replace(/\/$/, "")`，粘 PASS

### 2.6 S3Storage.put

- [x] 2.6.a [TEST-RED] 写 `put calls minio putObject with bucket / key / contentType` (mock minio Client)，粘 FAIL
- [x] 2.6.b [IMPL-GREEN] 实现 `S3Storage.put` 调 minio putObject，粘 PASS

### 2.7 S3Storage.delete 吞 NoSuchKey

- [x] 2.7.a [TEST-RED] 写 `delete swallows minio NoSuchKey`，粘 FAIL
- [x] 2.7.b [IMPL-GREEN] delete 内 try/catch NoSuchKey，粘 PASS

### 2.8 factory 默认 local

- [x] 2.8.a [TEST-RED] 写 `factory falls back to LocalDiskStorage when STORAGE_DRIVER unset`，粘 FAIL
- [x] 2.8.b [IMPL-GREEN] 重构 `src/lib/storage/index.ts` 暴露 storage 单例 + driver factory，粘 PASS
  注：测试文件实际为 `src/lib/storage/index.test.ts`（与 storage/index.ts 同目录）。

### 2.9 factory 显式 s3

- [x] 2.9.a [TEST-RED] 写 `factory returns S3Storage when STORAGE_DRIVER=s3 with full env`，粘 FAIL
- [x] 2.9.b [IMPL-GREEN] factory 读 env 切到 S3Storage 实例，粘 PASS

### 2.10 factory env 缺失 fail-fast

- [x] 2.10.a [TEST-RED] 写 `factory throws AppError listing missing env when s3 incomplete`，粘 FAIL
- [x] 2.10.b [IMPL-GREEN] factory env 缺失抛 `errors.missingEnv(missing)` → `AppError("MISSING_ENV", ..., 500)`，粘 PASS

## 3. [P1] media schemas (zod)

### 3.1 mediaFilterSchema 默认

- [x] 3.1.a [TEST-RED] 写 `mediaFilterSchema defaults page=1 pageSize=12`，粘 FAIL
- [x] 3.1.b [IMPL-GREEN] 新增 `src/lib/schemas/media.ts` 定义 mediaFilterSchema，粘 PASS

### 3.2 mediaFilterSchema pageSize 上限

- [x] 3.2.a [TEST-RED] 写 `mediaFilterSchema rejects pageSize > 100`，粘 FAIL
- [x] 3.2.b [IMPL-GREEN] 加 `.max(100)`，粘 PASS

### 3.3 validateUpload 接受真实 PNG

- [x] 3.3.a [TEST-RED] 写 `validateUpload accepts real png`（用 fixture buffer），粘 FAIL
- [x] 3.3.b [IMPL-GREEN] 实现 `validateUpload(file: File)` 读前 12 字节 + Content-Type 白名单校验，粘 PASS

### 3.4 validateUpload 拒改扩展名的 exe

- [x] 3.4.a [TEST-RED] 写 `validateUpload rejects exe with image/png content-type via magic number`，粘 FAIL
- [x] 3.4.b [IMPL-GREEN] 用手写 `sniffMime` magic-number 嗅探，与 content-type 任一不匹配则 fail，粘 PASS
  注：未用 `file-type` 包（对 8 字节 fixture 不友好），手写 sniff 覆盖 PNG/JPEG/WEBP/GIF。

### 3.5 validateUpload 拒 SVG

- [x] 3.5.a [TEST-RED] 写 `validateUpload rejects image/svg+xml`，粘 FAIL
- [x] 3.5.b [IMPL-GREEN] 白名单仅 png/jpeg/webp/gif，SVG 自然落进 fail 分支，粘 PASS

### 3.6 validateUpload 接受 4MB

- [x] 3.6.a [TEST-RED] 写 `validateUpload accepts 4MB file`，粘 FAIL
- [x] 3.6.b [IMPL-GREEN] size guard ≤ 5 * 1024 * 1024，粘 PASS

### 3.7 validateUpload 拒 6MB

- [x] 3.7.a [TEST-RED] 写 `validateUpload rejects 6MB file with PAYLOAD_TOO_LARGE`，粘 FAIL
- [x] 3.7.b [IMPL-GREEN] 超限抛 `errors.payloadTooLarge(...)` → `AppError("PAYLOAD_TOO_LARGE", ..., 413)`，粘 PASS

## 4. [P1] media service (integration)

> 测试集成 `tests/helpers/db.ts` 已有 `resetAll`，本组新增 helper 临时 upload dir setup/teardown。

### 4.1 createMedia 端到端

- [x] 4.1.a [TEST-RED] 写 `createMedia writes file then DB row`（真实 DB + tmp upload dir），粘 FAIL
- [x] 4.1.b [IMPL-GREEN] 新增 `src/lib/services/media.ts` 的 `createMedia(input, uploadedBy)`，粘 PASS

### 4.2 createMedia 拼 key

- [x] 4.2.a [TEST-RED] 写 `createMedia assembles key as yyyy/MM/<cuid>.<ext>`，粘 FAIL
- [x] 4.2.b [IMPL-GREEN] 实现 key 拼接 + ext 推断（基于 MIME），粘 PASS

### 4.3 createMedia 回滚物理文件

- [x] 4.3.a [TEST-RED] 写 `createMedia rolls back physical file when DB insert fails`（mock-prisma 强制 throw），粘 FAIL
- [x] 4.3.b [IMPL-GREEN] try/catch DB 写入失败时 storage.delete(key)，粘 PASS

### 4.4 listMedia 分页

- [x] 4.4.a [TEST-RED] 写 `listMedia returns paginated rows sorted by createdAt desc`，粘 FAIL
- [x] 4.4.b [IMPL-GREEN] 实现 listMedia(filter)，粘 PASS

### 4.5 deleteMedia 删 DB + storage

- [x] 4.5.a [TEST-RED] 写 `deleteMedia removes row and calls storage.delete`，粘 FAIL
- [x] 4.5.b [IMPL-GREEN] 实现 deleteMedia(id) 先删 DB 再 storage.delete，粘 PASS

### 4.6 deleteMedia NOT_FOUND

- [x] 4.6.a [TEST-RED] 写 `deleteMedia throws NOT_FOUND for missing id`，粘 FAIL
- [x] 4.6.b [IMPL-GREEN] 加 findUnique 前置检查，粘 PASS

### 4.7 deleteMedia 文件已失踪

- [x] 4.7.a [TEST-RED] 写 `deleteMedia succeeds when file missing on disk`，粘 FAIL
- [x] 4.7.b [IMPL-GREEN] storage.delete 内部已幂等（§2.4 §2.7），deleteMedia 不额外处理，粘 PASS

### 4.8 createMedia 读 width/height（image-size 集成）

- [x] 4.8.a [TEST-RED] 写 `createMedia stores width/height from real PNG` + `leaves null when buffer unreadable`，粘 FAIL
- [x] 4.8.b [IMPL-GREEN] service 调 `imageSize(buffer)` best-effort 读尺寸（失败 → null，不阻断上传），粘 PASS

### 4.9 deleteMedia 真错误透传（P0 silent-failure 修复）

- [x] 4.9.a [TEST-RED] 写 `propagates non-idempotent storage errors (e.g. EACCES)`，粘 FAIL
- [x] 4.9.b [IMPL-GREEN] 去除 deleteMedia 外层 `.catch(console.warn)` —— storage 内部已对 ENOENT/NoSuchKey 幂等，外层吞错违反 silent-failure 禁忌，粘 PASS

## 5. [P1] API routes

### 5.1 POST uploads 401 未登录

- [x] 5.1.a [TEST-RED] 写 `POST /api/admin/uploads returns 401 without session`，粘 FAIL
- [x] 5.1.b [IMPL-GREEN] 新增 `src/app/api/admin/uploads/route.ts`,handler 内 `auth()` 校验，粘 PASS

### 5.2 POST uploads 校验 file 字段

- [x] 5.2.a [TEST-RED] 写 `POST returns 400 VALIDATION when file field missing`，粘 FAIL
- [x] 5.2.b [IMPL-GREEN] 解析 formData 取 file，缺则抛 VALIDATION，粘 PASS

### 5.3 POST uploads 持久化 PNG

- [x] 5.3.a [TEST-RED] 写 `POST persists Media row for valid png`（用 fixture buffer），粘 FAIL
- [x] 5.3.b [IMPL-GREEN] 把 validateUpload + createMedia 串起来，粘 PASS

### 5.4 POST uploads 响应 shape

- [x] 5.4.a [TEST-PRE-COVERED] 行为已被 §5.3 实现自然覆盖（`ok(media)` 返回完整 Media）;补断言 `body.data.{id,url,filename,mimeType,size,width,height,createdAt}` 一次就过 PASS。无独立 RED 阶段。
- [x] 5.4.b 同上

### 5.5 POST uploads 错误响应 shape

- [x] 5.5.a [TEST-PRE-COVERED] 行为已被 `withErrorHandler` 自然覆盖;补断言 `body.error.{code,message}` 用 `vi.spyOn(createMedia)` 注入失败一次就过 PASS。无独立 RED 阶段。
- [x] 5.5.b 同上

### 5.6 GET media 默认分页

- [x] 5.6.a [TEST-RED] 写 `GET /api/admin/media returns first 12 with meta`，粘 FAIL
- [x] 5.6.b [IMPL-GREEN] 新增 `src/app/api/admin/media/route.ts` GET handler，粘 PASS

### 5.7 GET media 自定义分页

- [x] 5.7.a [TEST-PRE-COVERED] 行为已被 §5.6 实现自然覆盖（filter 直接透传到 listMedia）;补断言 `?page=2&pageSize=2` 一次就过 PASS。无独立 RED 阶段。
- [x] 5.7.b 同上

### 5.8 GET media pageSize 上限

- [x] 5.8.a [TEST-PRE-COVERED] 行为已被 §3.2 zod schema + `withErrorHandler` 自然覆盖;补断言 `?pageSize=200` → 400 VALIDATION_ERROR 一次就过 PASS。无独立 RED 阶段。
- [x] 5.8.b 同上

### 5.9 DELETE media 成功

- [x] 5.9.a [TEST-RED] 写 `DELETE /api/admin/media/[id] returns 200 with data.id`，粘 FAIL
- [x] 5.9.b [IMPL-GREEN] 新增 `src/app/api/admin/media/[id]/route.ts` DELETE handler，粘 PASS

### 5.10 DELETE media 404

- [x] 5.10.a [TEST-PRE-COVERED] 行为已被 §5.9 实现 + `deleteMedia` service 的 `errors.notFound` 自然覆盖;补断言 `?id=nonexistent` → 404 NOT_FOUND 一次就过 PASS。无独立 RED 阶段。
- [x] 5.10.b 同上

> §5 节奏注记：10 个 spec 中 5 个走真 RED → GREEN（§5.1/§5.2/§5.3/§5.6/§5.9），另 5 个（§5.4/§5.5/§5.7/§5.8/§5.10）是衍生覆盖（pre-covered），属务实派 TDD 妥协。Commit 历史里这些写作 `test(media): GREEN — ... (pre-covered)`，节奏审计时区分对待。

## 6. [P1] UI 改造（manual smoke 验收）

> 行为合同已由 §4 §5 测试覆盖；UI 组件本身走 manual smoke：每条任务完成后人工验证一次。commit message 用 `feat(media): <task>`，借助 §3 起就有的 `test(media):` 通过 husky hook。

- [ ] 6.1 实现 `components/admin/posts/CoverUploader.tsx`（拖拽 + 点击上传 + 预览 + 清除）→ smoke：新建文章页拖一张图，看 Post.cover 写入正确 url
- [ ] 6.2 改 `components/admin/posts/PostMetaSidebar.tsx`：cover Input → CoverUploader
- [ ] 6.3 实现 `components/editor/ImageUploadButton.tsx` → smoke：点击工具栏图标上传图，光标处插入 `![](url)`
- [ ] 6.4 改 `components/editor/MarkdownEditorWithPreview.tsx` 工具栏加 ImageUploadButton
- [ ] 6.5 实现 `components/admin/media/MediaCard.tsx`（hover 显示复制 URL / 删除两个图标按钮）
- [ ] 6.6 实现 `components/admin/media/MediaRowActions.tsx`（confirm dialog + sonner toast）
- [ ] 6.7 实现 `src/app/(admin)/admin/media/page.tsx`（卡片网格 + 分页 + 空状态）→ smoke：seed 15 条 → 翻页 → hover 图标 → 复制 / 删除
- [ ] 6.8 admin 导航栏"媒体"链接由占位升级为实际路由

## 7. [P1] 集成验收

- [ ] 7.1 跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`，全绿
- [ ] 7.2 manual smoke：上传 png/jpg/webp/gif 各一张；上传 svg / 6MB / exe-改 png 各应被拒；删除一张已被某 Post.cover 引用的图，看 Post 详情页破图（接受的副作用）
- [ ] 7.3 切 `STORAGE_DRIVER=s3` 跑一遍 docker:dev MinIO，验证 driver 切换无业务侧代码改动（验证 D1 决策）
- [ ] 7.4 更新 `memory-bank/activeContext.md` + `progress.md`：标记 P1-3 媒体上传完成
- [ ] 7.5 `/opsx:verify media-upload` 验证实现完整性
- [ ] 7.6 `/opsx:archive media-upload`
