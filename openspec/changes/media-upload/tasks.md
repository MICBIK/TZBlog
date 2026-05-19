# tasks.md — media-upload

> 微循环结构：1 spec scenario = 1 微循环 (`.a [TEST-RED]` + `.b [IMPL-GREEN]`)。
> 阶段前缀 `[P1]`（后台 CMS 阶段）。
> UI 组件改造（§6）按 test-map.md 约定走 manual smoke 验收，不写 RTL 自动化测试 — 行为合同由 §4 §5 的 API/service 测试覆盖。

## 1. [P1] 准备工作

- [ ] 1.1 加依赖 `file-type` (magic-number 嗅探) 与 `image-size` (读 width/height)：`pnpm add file-type image-size`
- [ ] 1.2 改 `.gitignore` 排除 `public/uploads/*`，新增 `public/uploads/.gitkeep`
- [ ] 1.3 `.env.example` 加 `STORAGE_DRIVER=local`、`LOCAL_UPLOAD_DIR=public/uploads`、`LOCAL_PUBLIC_URL_PREFIX=/uploads`
- [ ] 1.4 admin 导航栏组件加"媒体"链接占位（路由暂时 404，§6.6 落地后自然解锁）

## 2. [P1] storage-driver

### 2.1 LocalDiskStorage.publicUrl

- [ ] 2.1.a [TEST-RED] 写 `LocalDiskStorage.publicUrl joins prefix and key`，跑 `pnpm test src/lib/storage/local.test.ts` 粘 FAIL
- [ ] 2.1.b [IMPL-GREEN] 实现 `LocalDiskStorage.publicUrl(key)` 拼字符串，跑测试粘 PASS

### 2.2 LocalDiskStorage.put 创建嵌套目录

- [ ] 2.2.a [TEST-RED] 写 `put creates nested directories for dated keys`，粘 FAIL
- [ ] 2.2.b [IMPL-GREEN] 实现 `LocalDiskStorage.put` 含 `mkdir -p` 与 `writeFile`，粘 PASS

### 2.3 LocalDiskStorage.put 返回完整 url

- [ ] 2.3.a [TEST-RED] 写 `put returns full url with prefix`，粘 FAIL
- [ ] 2.3.b [IMPL-GREEN] put 内部调 publicUrl 拼返回，粘 PASS

### 2.4 LocalDiskStorage.delete 幂等

- [ ] 2.4.a [TEST-RED] 写 `delete on missing file is idempotent (no ENOENT)`，粘 FAIL
- [ ] 2.4.b [IMPL-GREEN] delete 内 try/catch ENOENT 吞错，粘 PASS

### 2.5 S3Storage.publicUrl 处理 trailing slash

- [ ] 2.5.a [TEST-RED] 写 `S3Storage.publicUrl normalises trailing slash`，粘 FAIL
- [ ] 2.5.b [IMPL-GREEN] 实现 `S3Storage.publicUrl` 用 `replace(/\/$/, "")`，粘 PASS

### 2.6 S3Storage.put

- [ ] 2.6.a [TEST-RED] 写 `put calls minio putObject with bucket / key / contentType` (mock minio Client)，粘 FAIL
- [ ] 2.6.b [IMPL-GREEN] 实现 `S3Storage.put` 调 minio putObject，粘 PASS

### 2.7 S3Storage.delete 吞 NoSuchKey

- [ ] 2.7.a [TEST-RED] 写 `delete swallows minio NoSuchKey`，粘 FAIL
- [ ] 2.7.b [IMPL-GREEN] delete 内 try/catch NoSuchKey，粘 PASS

### 2.8 factory 默认 local

- [ ] 2.8.a [TEST-RED] 写 `factory falls back to LocalDiskStorage when STORAGE_DRIVER unset`，粘 FAIL
- [ ] 2.8.b [IMPL-GREEN] 重构 `src/lib/storage/index.ts` 暴露 storage 单例 + driver factory，粘 PASS

### 2.9 factory 显式 s3

- [ ] 2.9.a [TEST-RED] 写 `factory returns S3Storage when STORAGE_DRIVER=s3 with full env`，粘 FAIL
- [ ] 2.9.b [IMPL-GREEN] factory 读 env 切到 S3Storage 实例，粘 PASS

### 2.10 factory env 缺失 fail-fast

- [ ] 2.10.a [TEST-RED] 写 `factory throws AppError listing missing env when s3 incomplete`，粘 FAIL
- [ ] 2.10.b [IMPL-GREEN] factory env 缺失抛 AppError("MISSING_ENV", "缺少 S3_xxx"...)，粘 PASS

## 3. [P1] media schemas (zod)

### 3.1 mediaFilterSchema 默认

- [ ] 3.1.a [TEST-RED] 写 `mediaFilterSchema defaults page=1 pageSize=12`，粘 FAIL
- [ ] 3.1.b [IMPL-GREEN] 新增 `src/lib/schemas/media.ts` 定义 mediaFilterSchema，粘 PASS

### 3.2 mediaFilterSchema pageSize 上限

- [ ] 3.2.a [TEST-RED] 写 `mediaFilterSchema rejects pageSize > 100`，粘 FAIL
- [ ] 3.2.b [IMPL-GREEN] 加 `.max(100)`，粘 PASS

### 3.3 validateUpload 接受真实 PNG

- [ ] 3.3.a [TEST-RED] 写 `validateUpload accepts real png`（用 fixture buffer），粘 FAIL
- [ ] 3.3.b [IMPL-GREEN] 实现 `validateUpload(file: File)` 读前 12 字节 + Content-Type 白名单校验，粘 PASS

### 3.4 validateUpload 拒改扩展名的 exe

- [ ] 3.4.a [TEST-RED] 写 `validateUpload rejects exe with image/png content-type via magic number`，粘 FAIL
- [ ] 3.4.b [IMPL-GREEN] 用 `file-type` 包嗅探，magic-number 与 content-type 任一不匹配则 fail，粘 PASS

### 3.5 validateUpload 拒 SVG

- [ ] 3.5.a [TEST-RED] 写 `validateUpload rejects image/svg+xml`，粘 FAIL
- [ ] 3.5.b [IMPL-GREEN] 白名单仅 png/jpeg/webp/gif，SVG 自然落进 fail 分支，粘 PASS

### 3.6 validateUpload 接受 4MB

- [ ] 3.6.a [TEST-RED] 写 `validateUpload accepts 4MB file`，粘 FAIL
- [ ] 3.6.b [IMPL-GREEN] size guard ≤ 5 * 1024 * 1024，粘 PASS

### 3.7 validateUpload 拒 6MB

- [ ] 3.7.a [TEST-RED] 写 `validateUpload rejects 6MB file with PAYLOAD_TOO_LARGE`，粘 FAIL
- [ ] 3.7.b [IMPL-GREEN] 超限抛 `AppError("PAYLOAD_TOO_LARGE", "文件超过 5MB 上限")`，粘 PASS

## 4. [P1] media service (integration)

> 测试集成 `tests/helpers/db.ts` 已有 `resetAll`，本组新增 helper 临时 upload dir setup/teardown。

### 4.1 createMedia 端到端

- [ ] 4.1.a [TEST-RED] 写 `createMedia writes file then DB row`（真实 DB + tmp upload dir），粘 FAIL
- [ ] 4.1.b [IMPL-GREEN] 新增 `src/lib/services/media.ts` 的 `createMedia(input, uploadedBy)`，粘 PASS

### 4.2 createMedia 拼 key

- [ ] 4.2.a [TEST-RED] 写 `createMedia assembles key as yyyy/MM/<cuid>.<ext>`，粘 FAIL
- [ ] 4.2.b [IMPL-GREEN] 实现 key 拼接 + ext 推断（基于 MIME），粘 PASS

### 4.3 createMedia 回滚物理文件

- [ ] 4.3.a [TEST-RED] 写 `createMedia rolls back physical file when DB insert fails`（mock-prisma 强制 throw），粘 FAIL
- [ ] 4.3.b [IMPL-GREEN] try/catch DB 写入失败时 storage.delete(key)，粘 PASS

### 4.4 listMedia 分页

- [ ] 4.4.a [TEST-RED] 写 `listMedia returns paginated rows sorted by createdAt desc`，粘 FAIL
- [ ] 4.4.b [IMPL-GREEN] 实现 listMedia(filter)，粘 PASS

### 4.5 deleteMedia 删 DB + storage

- [ ] 4.5.a [TEST-RED] 写 `deleteMedia removes row and calls storage.delete`，粘 FAIL
- [ ] 4.5.b [IMPL-GREEN] 实现 deleteMedia(id) 先删 DB 再 storage.delete，粘 PASS

### 4.6 deleteMedia NOT_FOUND

- [ ] 4.6.a [TEST-RED] 写 `deleteMedia throws NOT_FOUND for missing id`，粘 FAIL
- [ ] 4.6.b [IMPL-GREEN] 加 findUnique 前置检查，粘 PASS

### 4.7 deleteMedia 文件已失踪

- [ ] 4.7.a [TEST-RED] 写 `deleteMedia succeeds when file missing on disk`，粘 FAIL
- [ ] 4.7.b [IMPL-GREEN] storage.delete 内部已幂等（§2.4 §2.7），deleteMedia 不额外处理，粘 PASS

## 5. [P1] API routes

### 5.1 POST uploads 401 未登录

- [ ] 5.1.a [TEST-RED] 写 `POST /api/admin/uploads returns 401 without session`，粘 FAIL
- [ ] 5.1.b [IMPL-GREEN] 新增 `src/app/api/admin/uploads/route.ts`，handler 内 `auth()` 校验，粘 PASS

### 5.2 POST uploads 校验 file 字段

- [ ] 5.2.a [TEST-RED] 写 `POST returns 400 VALIDATION when file field missing`，粘 FAIL
- [ ] 5.2.b [IMPL-GREEN] 解析 formData 取 file，缺则抛 VALIDATION，粘 PASS

### 5.3 POST uploads 持久化 PNG

- [ ] 5.3.a [TEST-RED] 写 `POST persists Media row for valid png`（用 fixture buffer），粘 FAIL
- [ ] 5.3.b [IMPL-GREEN] 把 validateUpload + createMedia 串起来，粘 PASS

### 5.4 POST uploads 响应 shape

- [ ] 5.4.a [TEST-RED] 写 `POST response contains data.{id,url,filename,mimeType,size,width,height,createdAt}`，粘 FAIL
- [ ] 5.4.b [IMPL-GREEN] 用 `ok(data)` 返回完整 Media，粘 PASS

### 5.5 POST uploads 错误响应 shape

- [ ] 5.5.a [TEST-RED] 写 `POST error response contains error.{code,message}`（注入一次失败），粘 FAIL
- [ ] 5.5.b [IMPL-GREEN] 包 `withErrorHandler`，粘 PASS

### 5.6 GET media 默认分页

- [ ] 5.6.a [TEST-RED] 写 `GET /api/admin/media returns first 12 with meta`，粘 FAIL
- [ ] 5.6.b [IMPL-GREEN] 新增 `src/app/api/admin/media/route.ts` GET handler，粘 PASS

### 5.7 GET media 自定义分页

- [ ] 5.7.a [TEST-RED] 写 `GET /api/admin/media respects ?page=&pageSize=`，粘 FAIL
- [ ] 5.7.b [IMPL-GREEN] 透传 filter 到 listMedia，粘 PASS

### 5.8 GET media pageSize 上限

- [ ] 5.8.a [TEST-RED] 写 `GET /api/admin/media?pageSize=200 returns 400 VALIDATION`，粘 FAIL
- [ ] 5.8.b [IMPL-GREEN] schema 已限制（§3.2），路由透传报错，粘 PASS

### 5.9 DELETE media 成功

- [ ] 5.9.a [TEST-RED] 写 `DELETE /api/admin/media/[id] returns 200 with data.id`，粘 FAIL
- [ ] 5.9.b [IMPL-GREEN] 新增 `src/app/api/admin/media/[id]/route.ts` DELETE handler，粘 PASS

### 5.10 DELETE media 404

- [ ] 5.10.a [TEST-RED] 写 `DELETE returns 404 NOT_FOUND for missing id`，粘 FAIL
- [ ] 5.10.b [IMPL-GREEN] errors.notFound 透传，粘 PASS

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
