# media-upload Specification

## Purpose
TBD - created by archiving change media-upload. Update Purpose after archive.
## Requirements
### Requirement: POST /api/admin/uploads 鉴权

`/api/admin/uploads` SHALL 仅对登录 admin 开放。`src/proxy.ts` 守 `/api/admin/*`，handler 内部 MUST 二次 `auth()` 取 session 以拿到 `session.user.id` 用作 `Media.uploadedBy`。

#### Scenario: 未登录请求被拒
- **WHEN** 未携带有效 session cookie 的请求 POST `/api/admin/uploads`
- **THEN** 响应 401，body 为 `{ error: { code: "UNAUTHORIZED", message: ... } }`

#### Scenario: 登录请求带出 uploadedBy
- **WHEN** admin session 用户 POST 一张合法图片
- **THEN** 创建的 `Media` 行 `uploadedBy` 字段等于 `session.user.id`

### Requirement: 请求形态

请求 SHALL 是 `multipart/form-data`，包含且仅包含一个字段 `file`，类型为 `File`。其他字段被忽略。

#### Scenario: 缺少 file 字段
- **WHEN** 请求体不含 `file` 或字段不是 File 类型
- **THEN** 响应 400，错误 code 为 `VALIDATION`，message 提示 "file 字段必填"

#### Scenario: 多文件请求只处理首个
- **WHEN** 表单中带了多个 file 字段
- **THEN** 服务端只读取 `formData.get("file")` 拿到的第一个，其余忽略（不报错）

### Requirement: MIME 白名单 + magic-number 双重校验

服务端 SHALL 同时校验：
1. `File.type`（Content-Type）必须在白名单 `["image/png", "image/jpeg", "image/webp", "image/gif"]`
2. 文件二进制前 12 字节的 magic number 匹配同一种类型

两个校验任一失败 SHALL 返回 400 `VALIDATION`。

#### Scenario: 合法 PNG 通过
- **WHEN** 上传一张真实 PNG 文件，Content-Type=image/png
- **THEN** 校验通过，进入下一步

#### Scenario: 改扩展名的 .exe 被拒
- **WHEN** 上传一个把 `.exe` 重命名为 `.png` 的文件（Content-Type 可能伪造为 image/png）
- **THEN** magic-number 嗅探 fail，响应 400 `VALIDATION`，message 含 "文件类型与扩展名不符"

#### Scenario: SVG 被显式拒绝
- **WHEN** 上传 SVG 文件（Content-Type=image/svg+xml）
- **THEN** 响应 400 `VALIDATION`，因为 SVG 不在白名单（防止内嵌 script 的 XSS 风险）

### Requirement: 文件大小上限

文件大小 SHALL 不超过 5MB（5 * 1024 * 1024 字节）。

#### Scenario: 4MB 文件通过
- **WHEN** 上传 4MB 的合法 png
- **THEN** 校验通过

#### Scenario: 6MB 文件被拒
- **WHEN** 上传 6MB 的合法 png
- **THEN** 响应 413 `PAYLOAD_TOO_LARGE`（HTTP 标准状态码），message 含 "文件超过 5MB 上限"

### Requirement: 持久化语义

成功上传 SHALL 做四件事，顺序固定：
1. 生成 cuid → 拼 key `${yyyy}/${MM}/${cuid}.${ext}`
2. 调用 `image-size` 同步读取 width/height（失败则 width=height=null）
3. 调用 `storage.put` 写盘
4. 调用 `db.media.create` 落库；如果第 4 步失败，必须 `storage.delete(key)` 回滚物理文件

#### Scenario: 端到端成功
- **WHEN** 一次合法上传完整走完四步
- **THEN** 文件物理存在 + Media 行存在 + 响应 200 `{ data: { id, key, url, filename, mimeType, size, width, height } }`

#### Scenario: 写库失败时物理文件被回滚
- **WHEN** `db.media.create` 因 unique constraint 失败（key 已存在，理论不可能但需要防御）
- **THEN** 已落盘的文件被 `storage.delete(key)` 清理
- **AND** 响应 5xx 或 409 不留孤儿文件

### Requirement: 响应格式

成功响应 SHALL 遵循项目约定 `{ data: <Media>, meta? }`，失败 SHALL 遵循 `{ error: { code, message, details? } }`。

#### Scenario: 成功响应 shape
- **WHEN** 一次上传成功
- **THEN** 响应 200 JSON 含 `data.id` (cuid) / `data.url` (string) / `data.filename` / `data.mimeType` / `data.size` / `data.width` (number | null) / `data.height` (number | null) / `data.createdAt` (ISO string)

#### Scenario: 失败响应 shape
- **WHEN** 任意校验失败
- **THEN** 响应非 2xx，JSON 含 `error.code` (VALIDATION / PAYLOAD_TOO_LARGE / UNAUTHORIZED / INTERNAL) 与 `error.message`（人类可读，中文）
