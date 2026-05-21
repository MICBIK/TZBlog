## Context

`Media` 表已在 P0 阶段落地（cuid id / key 唯一 / url / filename / mimeType / size / width? / height? / uploadedBy / createdAt），字段直接对应一次 upload 的元数据，不需要 schema 变更。

`src/lib/storage.ts` 当前直接 `new Client(...)` 实例化 MinIO 客户端、暴露 `uploadObject(key, buffer, contentType)` 工具函数。这层在 P3 部署时是 OK 的，但 MVP 阶段开发者本机不一定能稳定起 MinIO 容器（端口冲突 / docker 占用），把作者拒在编辑器外。本 change 的核心张力是：**MVP 要"开箱即用"，部署后要"完全自托管"，同时业务代码不能为切换 driver 来回改写**。

业务侧的三个调用点（PostEditor 封面 / Markdown 编辑器内插图 / 媒体库 CRUD）只关心"给我一段二进制和 MIME，还我一个 URL"，不关心字节落到哪儿。

## Goals / Non-Goals

**Goals:**
- 业务代码只依赖 `IStorage` 接口，不直接 import `minio` 或 `fs/promises`
- 通过环境变量 `STORAGE_DRIVER=local|s3` 切换 driver，无需重新部署应用代码（仅重启）
- 本地 driver 写到 `public/uploads/<yyyy>/<MM>/`，URL 通过 Next.js 静态资源服务直接命中，零额外路由
- 上传请求经过 multipart 解析 → MIME 嗅探 → size guard → 落盘 → DB 写入，整条链路在 service 层完成事务一致性（失败回滚物理文件）
- 删除是硬删：DB 行删除 + 物理文件删除两步必须事务化，单边失败要补救
- `Media` 表 unique key 用 driver-agnostic 的 cuid + 扩展名拼接（不暴露 yyyy/MM 给上层），driver 内部决定如何映射成物理路径

**Non-Goals:**
- 图片处理（裁剪 / EXIF / 压缩 / 缩略图）— 留给 V2 的 sharp 集成
- 跨 driver 数据迁移工具 — P3 部署时如果有历史数据再写一次性脚本
- 防盗链 / 签名 URL — 本地 driver 走静态资源公开访问；S3 driver 也用 public bucket
- 上传进度条 / 断点续传 — MVP 单文件 < 5MB，一次性 POST 足够
- 文件去重（按 hash） — 让一份图重复占空间换简单

## Decisions

### D1: IStorage 接口形态

**选择：** 三方法接口
```ts
interface IStorage {
  put(input: { key: string; body: Buffer; contentType: string }): Promise<{ url: string }>
  delete(key: string): Promise<void>
  publicUrl(key: string): string  // 同步，纯字符串拼接
}
```

**理由：** `put` 返回 url 而不是让调用方拼 — 让 driver 独占 url 生成权（本地走 `LOCAL_PUBLIC_URL_PREFIX`，S3 走 `S3_PUBLIC_URL`），业务侧拿到 url 即可写库。`publicUrl(key)` 同步是为了在已知 key 时（比如 admin/media 列表）不必再走 driver 即可渲染。

**Alternatives 考虑：** 加 `get(key) → ReadableStream` — 不需要，业务侧从来不从 storage 反读（数据库存 url 就够了）；加 `exists(key)` — 不需要，写盘 race 用文件系统层的 `wx` flag 处理。

### D2: key 生成策略

**选择：** key = `<cuid>.<ext>`，driver 内部映射到 `<yyyy>/<MM>/<key>`

**理由：** cuid 在 Prisma 里已默认用于 Media.id，复用 + 扩展名让 URL 自带 MIME 提示。yyyy/MM 分桶是 driver 的实现细节（避免单目录 inode 上限），上层 DB 存的 key 不含日期；driver 在 put 时按 `createdAt.getFullYear()` 计算路径，但写库的 key 字段保留不带日期前缀的纯 `<cuid>.<ext>`。

**等等 — 这有问题：** 如果 key 不含日期，driver 删除时怎么找到物理文件？两个方案：
- (a) DB key 字段存完整路径 `2026/05/<cuid>.<ext>`，URL = `<prefix>/<key>`，driver 直接用 key 找文件 → 选这个
- (b) driver 根据 createdAt 重算日期 → 时区/夏令时坑

**修正：** 用 (a)。`Media.key` 存包含日期前缀的完整相对路径，`Media.id` 仍然是 cuid。所以：
- key = `2026/05/clm5xxx.png`
- url = `/uploads/2026/05/clm5xxx.png`（local driver）
- url = `https://cdn.tzblog.dev/2026/05/clm5xxx.png`（s3 driver）

### D3: MIME 校验：双重校验（content-type header + magic number 嗅探）

**选择：** multer-style multipart 解析后读取前 12 字节，与白名单对照
- PNG: `89 50 4E 47 0D 0A 1A 0A`
- JPEG: `FF D8 FF`
- WEBP: `RIFF....WEBP` (offset 0-3 + 8-11)
- GIF: `GIF87a` / `GIF89a`

**理由：** 仅信任 `Content-Type` header 容易被改扩展名绕过；纯靠扩展名（filename suffix）更弱。Magic-number 嗅探拒掉 `.png` 实际是 .exe 的攻击向量。`file-type` npm 包提供成熟实现，~30KB 体积可接受。

**Alternatives 考虑：** SVG — 显式拒绝。SVG 可以内嵌 `<script>` 触发 XSS，不在 MVP 范围内；如果将来需要 SVG，必须走 DOMPurify 或 sanitize-svg。

### D4: 删除联动事务化

**选择：** 业务上的硬删按"先 DB 删行 → 再物理文件删"的顺序，物理文件删除失败仅 log warning 不抛错

**理由：** 反向（先删文件 → 再删 DB）的失败语义更糟：文件没了但 DB 仍引用 → 前端破图。当前方向最坏情况是孤立文件（DB 已无引用），可以接受 — 一个写个 `pnpm script:gc-uploads` 命令在 V2 加，扫 `public/uploads` 与 DB 取差集清理。

**Alternatives 考虑：** 用 Prisma transaction 包两步 — 物理 FS 操作不在 PG 事务里，假事务实际无效；不如显式接受最终一致性。

### D5: 上传 API 的传输形态

**选择：** `multipart/form-data` + `formData()` (Web API)，单文件单字段 `file`

**理由：** Next.js 15 App Router 的 Route Handler 原生支持 `request.formData()`，零额外依赖；FormData 也是浏览器原生 API，前端 fetch 不需要 lib。`File` 类型携带 `.name / .type / .size` 元信息，无需手动解析 header。

**Alternatives 考虑：** Base64 JSON — 体积膨胀 ~33% + 不能流式 + 浏览器内存压力；presigned URL 直传 S3 — MVP 不上 S3，且 local driver 无 presign 概念，徒增复杂度。

### D6: 文件命名冲突

**选择：** 信任 cuid（碰撞概率 ~2^-100），不做 retry-on-conflict

**理由：** Node fs 的 `wx` flag 在并发写同一路径时会抛 EEXIST，但 cuid 碰撞实际不会发生。如果出现，意味着 cuid 库 broken，应该 fail-fast 而不是重试掩盖问题。

### D7: PostEditor cover 字段兼容

**选择：** Post.cover 仍然是 `string | null`（URL），CoverUploader 组件内部把上传 → 写库 → 取 URL → 回填到表单字段，对 service 层无变更

**理由：** 不引入 `coverMediaId → Media` 外键关系。理由：
- 单作者博客可以多次复用同一张图作为不同 Post 的封面 → 关系本来就不是 1:1
- 历史 Post 的 cover URL 可能来自外部图床 → 外键约束会拒掉 import
- "媒体被引用是否能删除"这个语义靠"前端确认 + 后端无约束"足够，不需要外键

**未来：** 如果做媒体复用统计，加 `MediaUsage` 关联表，不动 Post.cover。

**审计补丁（2026-05-19，§6.9）：** D7 原先漏算了一个细节 — `createPostSchema.cover` 和 `createColumnSchema.cover` 都用了 `z.string().url()`，而 Zod 的 `.url()` 严格要求带 scheme 的绝对 URL，会拒掉 local-driver 写出来的 `/uploads/2026/05/<hex>.png` 相对路径。结果 §6 落地后浏览器 smoke 在保存文章时被 400 拦下，CoverUploader 的回填链路名义存在、实际断裂。修复：抽 `coverFieldSchema = z.string().refine(v => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"))`，接受 三类合法值（空字符串清除 / 绝对 http(s) URL / `/`-rooted 路径）；同步改 column.ts 防止未来 column CoverUploader 改造时踩坑。这是对原 Non-Goals "不动 Post/Column schema" 的一处合理偏离 — bug 修复，而非设计变更。详见 tasks.md §6.9。

### D8: 图片宽高获取

**选择：** server-side 用 `image-size` 包（同步 / 零依赖 / ~30KB），只读取头部字节解析 width/height

**理由：** `sharp` 体积大（~10MB native），仅为读 dimension 不值；浏览器侧 `Image()` 异步加载完整图后才能拿到 dimension，前端拿到再回传 API 多一次 round-trip 不划算。

## Risks / Trade-offs

- **[本地 driver 在多节点部署下不可用]** → 接受。MVP 是单 VPS Docker 部署，多节点是 V2 之后才考虑的；若真有此需求，切到 S3 driver 即可，业务代码零改动
- **[`public/uploads/` 被打进 Next 构建产物]** → 通过 `.gitignore` 排除 + Docker volume mount 在 `/app/public/uploads`；P3 部署文档明确写
- **[Magic-number 嗅探无法拦截"合法 png 内嵌 polyglot 攻击"]** → 接受。Image polyglot（如 GIFAR）需要 CSP + 严格的浏览器渲染上下文来缓解，不靠服务端嗅探解决；我们的图只会出现在 `<img src>` 中，浏览器按 image 类型解析，polyglot 不会被当代码执行
- **[孤立物理文件累积]** → 接受。MVP 上线后写一个 `scripts/gc-uploads.ts` 跑一次性扫描；上线初期单作者删除频率极低，预期不会成为问题
- **[Tiptap 编辑器粘贴大图时阻塞 UI]** → 上传按钮显示 loading 态 + disabled，错误用 sonner toast；不做客户端压缩
- **[切换 driver 后已有 url 失效]** → 接受。本地 → S3 的 url 前缀不同，必须配套迁移脚本；MVP 不提供，部署前最好就锁定 driver
- **[`Media.uploadedBy` 仍是裸 string]** → 接受。单作者博客删 User 是非业务场景，硬补 @relation 反而限制未来灵活性（比如 import 历史数据时 uploadedBy 可能是"legacy"标记）

## Migration Plan

1. 重构 `src/lib/storage.ts` → IStorage 接口 + driver factory（保留 minio 实现到 `storage/s3.ts`，新增 `storage/local.ts`）
2. 加新 env 到 `.env.example` 和 `docker/docker-compose.dev.yml`
3. `public/uploads/.gitkeep` + 改 `.gitignore`
4. 新建 `src/lib/services/media.ts` + `src/lib/schemas/media.ts`
5. 新建 4 个 API 路由（uploads POST、media GET、media/[id] DELETE 等）
6. 新建 `/admin/media` 页 + 3 个组件（MediaTable / MediaCard / MediaRowActions）
7. 改 PostEditor 的 cover Input → CoverUploader 组件
8. 改 MarkdownEditorWithPreview 工具栏加上传按钮

**回滚策略：** 本 change 不动现有 schema / 不删任何文件（仅重构 storage.ts，旧 `uploadObject` 函数没被业务调用）；如果 P1 测试发现严重问题，可以单 commit revert 而不留 schema 残骸。

## Open Questions

- (无强制阻塞) 是否需要在 admin 导航栏加"媒体"入口？建议在 layout 改一行 Link 即可，归在 tasks 阶段处理
- (推迟) `Media.uploadedBy → User` relation 是否补 — 推迟到 V2 做媒体复用统计时一并加
