## Why

文章编辑器现在依赖手填 URL 引用图片（封面 `cover` 字段 + 正文 Markdown 中的 `![](url)`），意味着作者必须先到外部图床上传再粘贴回来，作者体验差且会把博客与第三方图床强绑定。要么作者懒于配图、要么图床挂掉文章就破图。P1 后台 CMS 的最后一块拼图就是把上传管线收回到自己的应用里 — 既补齐 MVP CMS 闭环，又为 P3 部署（VPS 自托管 + Caddy）打下"存储完全可控"的基础。

`prisma/schema.prisma` 中已有 `Media` 表（P0 scaffolded），`src/lib/storage.ts` 当前直连 MinIO；本 change 把这层翻成"一个接口、两种 driver（本地磁盘 / S3）"的形态，MVP 用本地 driver 落 `public/uploads/` 即时可用，P3 部署时切到 S3 driver 接 MinIO 容器，零业务侧改动。

## What Changes

- **新增 IStorage 接口 + 两个 driver**
  - `LocalDiskStorage`：写到 `public/uploads/<yyyy>/<MM>/<key>`，URL 形如 `/uploads/2026/05/<hash>.png`
  - `S3Storage`：保留现有 MinIO 实现，封装到 driver 内
  - 通过 `STORAGE_DRIVER=local|s3` env 切换；默认 `local`
- **新增 POST `/api/admin/uploads`**：multipart/form-data 上传单文件
  - 服务端校验：MIME 在白名单 `image/png|jpeg|webp|gif`、size ≤ 5MB、做 magic-number 嗅探防伪造扩展名
  - 写盘 → 落 `Media` 表 → 返回 `{ id, url, width?, height?, filename, size }`
  - 鉴权：middleware-level guard + in-handler `auth()` 双层（与现有 admin API 一致）
- **新增 `/admin/media` 媒体库页**
  - shadcn Table + 卡片网格切换；按 `createdAt desc` 排序；分页 12/页
  - 行操作：复制 URL、删除（confirm dialog + 硬删 Media 行 + 删本地文件）
  - 暂不做：批量选择 / 检索 / 文件夹 / 缩略图懒生成
- **新增 GET `/api/admin/media` / DELETE `/api/admin/media/[id]`**：媒体库后端
- **改造 `PostEditor` 封面字段**：把当前的 URL 文本框换成 `CoverUploader` 组件（拖拽 + 点击上传 + 预览缩略 + 清除）；保留底层值仍然是 URL 字符串（向后兼容现有 Post.cover 数据）
- **改造 `MarkdownEditorWithPreview` 工具栏**：加"插入图片"按钮，点击触发上传并在光标位置插入 `![filename](url)`；保留粘贴 URL 的原始手填能力作为 fallback
- **重构 `src/lib/storage.ts`**：从"直连 MinIO 的工具函数集合"改为"导出 storage 单例 + IStorage 类型"
  - **BREAKING（仅内部）**：`uploadObject(key, buffer, contentType)` → `storage.put({ key, body, contentType, contentLength })`；P0 仅这个文件 + 几个测试 import 它，业务代码尚未调用，影响面已经 grep 过
- **新增 env vars**：`STORAGE_DRIVER` (默认 `local`)、`LOCAL_UPLOAD_DIR` (默认 `public/uploads`)、`LOCAL_PUBLIC_URL_PREFIX` (默认 `/uploads`)；MinIO 相关的 `S3_*` 保持现状，仅在 `STORAGE_DRIVER=s3` 时被读取

### Non-goals（防范围蔓延）

- 图片裁剪 / 旋转 / EXIF 元数据清理
- 自动生成多尺寸缩略图、WebP/AVIF 转码
- CDN / 边缘缓存配置
- 文件夹 / 标签 / 全局检索
- 批量上传 / 拖拽多文件
- 视频或音频文件
- 媒体复用统计（哪些 Post 引用了哪些 Media）
- 客户端图片压缩
- 防盗链 / Referer 校验

## Capabilities

### New Capabilities

- `storage-driver`：IStorage 接口契约 + LocalDiskStorage / S3Storage 两个实现；env 驱动的 driver 选择；put / delete / publicUrl 三个核心方法的语义
- `media-upload`：POST `/api/admin/uploads` 的请求合同、校验规则（MIME 白名单 / 大小 / magic-number）、错误码、Media 行写入语义
- `media-library`：GET / DELETE `/api/admin/media[/id]` 的列表分页、删除联动（DB 行 + 物理文件）、`/admin/media` 页面布局与交互

### Modified Capabilities

- 无（不动现有 Column / Post / Tag 任何 schema 或 API；Post.cover 仍是 string URL）

## Impact

### Prisma 模型
- `Media`：**无 schema 变更**（已有字段足够）。仅讨论是否补 `uploadedBy → User` 的 `@relation` —— 建议保留裸 string 不补，因为单作者博客删 User 实际上不会发生，且 onDelete 行为没必要现在锁死

### 路由
- 新增：`/admin/media`、`POST /api/admin/uploads`、`GET /api/admin/media`、`DELETE /api/admin/media/[id]`
- 修改：无（`/admin/posts/new`、`/admin/posts/[id]/edit` 走的是 PostEditor 内部改造）

### 组件
- 新增：`components/admin/media/MediaTable.tsx`、`MediaCard.tsx`、`MediaRowActions.tsx`、`components/admin/posts/CoverUploader.tsx`、`components/editor/ImageUploadButton.tsx`
- 修改：`components/admin/posts/PostEditor.tsx`（cover 字段）、`components/admin/posts/PostMetaSidebar.tsx`（替换封面 Input）、`components/editor/MarkdownEditorWithPreview.tsx`（工具栏 +1 按钮）

### lib
- 重构：`src/lib/storage.ts`（接口 + driver factory）
- 新增：`src/lib/storage/local.ts`、`src/lib/storage/s3.ts`、`src/lib/services/media.ts`、`src/lib/schemas/media.ts`

### 配置 / 部署
- `.env.example` / `docker/docker-compose.dev.yml` 加 `STORAGE_DRIVER`、`LOCAL_UPLOAD_DIR`
- `public/uploads/` 加 `.gitkeep`，`.gitignore` 排除 `public/uploads/*`（避免上传内容被提交）
- P3 部署文档需要在 Docker 镜像里把 `/app/public/uploads` 挂成 volume（提前在 design.md 标注）

### 参考设计（UI 风格）
- 媒体库列表：参考 Apple Photos for Web 的稀疏网格 / 大量留白 / hover 才出操作图标
- CoverUploader：参考 OpenAI 平台后台的"拖拽虚线框 + 点击替换"双态，单色边框、不要 shadow
- ImageUploadButton：参考 Notion 编辑器工具栏的简洁 icon-only 按钮，hover 显气泡说明
