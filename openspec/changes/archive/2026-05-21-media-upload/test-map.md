# test-map.md — media-upload

> 把每条 spec scenario 映射到测试函数 + 文件路径 + 层级。
> 这是 ECC TDD 流程的强制环节（CLAUDE.md §6）：tasks.md 生成前 MUST 已有此文件。

## 测试层级约定

- **unit**：纯函数 / schema 校验 / driver 单测（mock fs / mock minio）。不打 DB、不打文件系统真路径
- **integration**：service / API route + 真实 Postgres + 临时 upload dir（每个测试 setup tmpdir）
- **e2e**：浏览器全链路 — **MVP 不写**，靠 manual smoke 验收

## 文件清单

| 测试文件 | 层级 | 覆盖范围 |
|---|---|---|
| `src/lib/storage/local.test.ts` | unit | LocalDiskStorage 的 put / delete / publicUrl（用临时目录） |
| `src/lib/storage/s3.test.ts` | unit | S3Storage 的 put / delete / publicUrl（mock minio Client） |
| `src/lib/storage/index.test.ts` | unit | driver factory（env 切换 + fail-fast） |
| `src/lib/schemas/media.test.ts` | unit | zod schema：mediaFilterSchema、uploadValidationSchema |
| `src/lib/services/media.test.ts` | integration | createMedia / listMedia / deleteMedia 全流程（真实 DB + temp upload dir） |
| `src/app/api/admin/uploads/route.test.ts` | integration | POST 端到端：multipart 解析 + 校验 + 持久化 + 回滚 |
| `src/app/api/admin/media/route.test.ts` | integration | GET 分页 |
| `src/app/api/admin/media/[id]/route.test.ts` | integration | DELETE 联动 |

> 注：UI 组件（CoverUploader / ImageUploadButton / MediaTable / MediaCard）不写自动化测试 — 走 manual smoke 验收；shadcn 基础组件本身已被上游测试覆盖。

## 映射表

### Capability: storage-driver

#### Requirement: IStorage 接口契约
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 业务层调用 put 写入文件 | （契约级，通过 LocalDiskStorage / S3Storage 单测共同满足） | — | — |
| put 返回完整 url | `LocalDiskStorage.put returns full url with prefix` | `src/lib/storage/local.test.ts` | unit |
|  | `S3Storage.put returns full url joined from S3_PUBLIC_URL` | `src/lib/storage/s3.test.ts` | unit |
| publicUrl 同步给出 url | `LocalDiskStorage.publicUrl is sync and pure` | `src/lib/storage/local.test.ts` | unit |
|  | `S3Storage.publicUrl handles trailing slash` | `src/lib/storage/s3.test.ts` | unit |

#### Requirement: driver 选择由环境变量驱动
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 默认使用本地 driver | `factory falls back to LocalDiskStorage when STORAGE_DRIVER unset` | `src/lib/storage/index.test.ts` | unit |
| 显式选择 s3 driver | `factory returns S3Storage when STORAGE_DRIVER=s3 with full env` | `src/lib/storage/index.test.ts` | unit |
| s3 driver env 缺失时 fail-fast | `factory throws AppError listing missing env when s3 incomplete` | `src/lib/storage/index.test.ts` | unit |

#### Requirement: LocalDiskStorage 行为
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 写入按 key 中的日期路径分桶 | `put creates nested directories for dated keys` | `src/lib/storage/local.test.ts` | unit |
| 删除不存在的文件不抛错 | `delete on missing file is idempotent (no ENOENT)` | `src/lib/storage/local.test.ts` | unit |
| publicUrl 同步拼字符串 | `publicUrl joins prefix and key` | `src/lib/storage/local.test.ts` | unit |

#### Requirement: S3Storage 行为
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 写入到 bucket 根 | `put calls minio putObject with bucket / key / contentType` | `src/lib/storage/s3.test.ts` | unit (mock minio) |
| 删除不存在的对象不抛错 | `delete swallows minio NoSuchKey` | `src/lib/storage/s3.test.ts` | unit (mock minio) |
| publicUrl 处理 trailing slash | `publicUrl normalises S3_PUBLIC_URL trailing slash` | `src/lib/storage/s3.test.ts` | unit |

#### Requirement: key 生成由调用方负责
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 媒体 service 拼接 key | `createMedia assembles key as yyyy/MM/<cuid>.<ext>` | `src/lib/services/media.test.ts` | integration |

### Capability: media-upload

#### Requirement: POST /api/admin/uploads 鉴权
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 未登录请求被拒 | `POST /api/admin/uploads returns 401 without session` | `src/app/api/admin/uploads/route.test.ts` | integration |
| 登录请求带出 uploadedBy | `POST /api/admin/uploads sets Media.uploadedBy from session` | `src/app/api/admin/uploads/route.test.ts` | integration |

#### Requirement: 请求形态
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 缺少 file 字段 | `POST returns 400 VALIDATION when file field missing` | `src/app/api/admin/uploads/route.test.ts` | integration |
| 多文件请求只处理首个 | `POST processes only first file when multiple` | `src/app/api/admin/uploads/route.test.ts` | integration |

#### Requirement: MIME 白名单 + magic-number 双重校验
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 合法 PNG 通过 | `validateUpload accepts real png` | `src/lib/schemas/media.test.ts` | unit |
|  | `POST persists Media row for valid png` | `src/app/api/admin/uploads/route.test.ts` | integration |
| 改扩展名的 .exe 被拒 | `validateUpload rejects exe with image/png content-type via magic number` | `src/lib/schemas/media.test.ts` | unit |
| SVG 被显式拒绝 | `validateUpload rejects image/svg+xml` | `src/lib/schemas/media.test.ts` | unit |

#### Requirement: 文件大小上限
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 4MB 文件通过 | `validateUpload accepts 4MB file` | `src/lib/schemas/media.test.ts` | unit |
| 6MB 文件被拒 | `validateUpload rejects 6MB file with PAYLOAD_TOO_LARGE` | `src/lib/schemas/media.test.ts` | unit |

#### Requirement: 持久化语义
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 端到端成功 | `createMedia writes file then DB row` | `src/lib/services/media.test.ts` | integration |
|  | `POST /api/admin/uploads returns full Media in data` | `src/app/api/admin/uploads/route.test.ts` | integration |
| 写库失败时物理文件被回滚 | `createMedia rolls back physical file when DB insert fails` | `src/lib/services/media.test.ts` | integration (用 mock-prisma 强制 throw) |

#### Requirement: 响应格式
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 成功响应 shape | `POST response contains data.{id,url,filename,mimeType,size,width,height,createdAt}` | `src/app/api/admin/uploads/route.test.ts` | integration |
| 失败响应 shape | `POST error response contains error.{code,message}` | `src/app/api/admin/uploads/route.test.ts` | integration |

### Capability: media-library

#### Requirement: /admin/media 列表页
> 页面级渲染走 manual smoke，不写自动化测试。下游 service 级 `listMedia` 被覆盖即可。

| Scenario | 覆盖方式 |
|---|---|
| 空状态 | manual smoke：清空 DB → 访问 /admin/media → 看空状态文案 |
| 有数据时网格渲染 | manual smoke：seed 5 条 → 看网格 + hover 图标 |
| 分页 | manual smoke：seed 15 条 → 翻页 |

#### Requirement: GET /api/admin/media
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 默认分页 | `GET /api/admin/media returns first 12 with meta` | `src/app/api/admin/media/route.test.ts` | integration |
| 自定义分页 | `GET /api/admin/media respects ?page=&pageSize=` | `src/app/api/admin/media/route.test.ts` | integration |
| pageSize 上限 | `mediaFilterSchema rejects pageSize > 100` | `src/lib/schemas/media.test.ts` | unit |
|  | `GET /api/admin/media?pageSize=200 returns 400 VALIDATION` | `src/app/api/admin/media/route.test.ts` | integration |

#### Requirement: DELETE /api/admin/media/[id]
| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 成功删除 | `deleteMedia removes row and calls storage.delete` | `src/lib/services/media.test.ts` | integration |
|  | `DELETE /api/admin/media/[id] returns 200 with data.id` | `src/app/api/admin/media/[id]/route.test.ts` | integration |
| 删除不存在的 id | `deleteMedia throws NOT_FOUND` | `src/lib/services/media.test.ts` | integration |
|  | `DELETE returns 404 NOT_FOUND` | `src/app/api/admin/media/[id]/route.test.ts` | integration |
| 物理文件已不存在时仍能完成删除 | `deleteMedia succeeds when file missing on disk` | `src/lib/services/media.test.ts` | integration |
| 删除时不检查媒体是否被引用 | （MVP 不做引用检查 — 无测试，仅 design.md 文档化） | — | — |

#### Requirement: MediaTable / MediaCard 复用约束
> 静态约束，通过 ESLint rule 或 manual code review 保证；不写自动化测试。

#### Requirement: 复制 URL 操作
> 客户端 clipboard 行为，不写自动化测试 — manual smoke：点击按钮 → 粘贴到记事本看是否拿到 url。

## Zod schema 测试条目（强制要求）

凡涉及 API 入口的 schema 必须有专门的校验测试：

| Schema | 测试条目 | 文件 |
|---|---|---|
| `mediaFilterSchema` | 默认值 / pageSize 上限 / 非整数被拒 / page=0 被拒 | `src/lib/schemas/media.test.ts` |
| `uploadValidationSchema`（或 `validateUpload` 函数） | MIME 白名单 / size 上限 / magic-number 嗅探（PNG/JPG/WEBP/GIF/SVG-rejected/EXE-rejected） | `src/lib/schemas/media.test.ts` |

## RED 阶段环境依赖

| 测试 | 依赖 | 启动命令 |
|---|---|---|
| unit (`storage/*` / `schemas/*`) | 无 | `pnpm test src/lib/storage src/lib/schemas` |
| integration (`services/media.test.ts`) | 真实 Postgres + tmp upload dir | `pnpm docker:dev` + `pnpm db:migrate` + `pnpm test` |
| integration (`api/admin/uploads/route.test.ts` 等) | 同上 + Auth.js mock | 同上 |

若任一 RED 测试因环境不可用无法跑（如 Postgres 未启），按 CLAUDE.md §6 必须先补 `[RED-补证]` 任务挂起当前微循环。

## §7 验收补充测试

| Spec-ID | Test Layer | Test File | Test Function | Notes |
|---------|-----------|-----------|---------------|-------|
| — | unit/component | `src/components/admin/media/MediaUploadDropzone.test.tsx` | `MediaUploadDropzone render / keyboard trigger / single file success / single file failure / multiple file upload / partial failures` | §7 验收新增组件，无对应 spec scenario |
