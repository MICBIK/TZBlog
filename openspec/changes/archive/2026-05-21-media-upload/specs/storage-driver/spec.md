## ADDED Requirements

### Requirement: IStorage 接口契约

业务代码 SHALL 通过 `IStorage` 接口操作媒体文件，禁止直接 `import { Client } from "minio"` 或 `import fs from "fs/promises"`。`IStorage` MUST 暴露至少三个方法：`put` / `delete` / `publicUrl`。

#### Scenario: 业务层调用 put 写入文件
- **WHEN** 任意 service 层代码需要保存一个文件
- **THEN** 必须通过从 `@/lib/storage` 导出的 `storage` 单例调用 `storage.put({ key, body, contentType })`
- **AND** 调用方不知道也不应该依赖底层是本地磁盘还是 S3

#### Scenario: put 返回完整 url
- **WHEN** `storage.put({ key: "2026/05/abc.png", body, contentType: "image/png" })` 成功
- **THEN** 返回值 `{ url }` 中的 url 是可在浏览器直接打开的完整路径
- **AND** url 由当前 driver 决定（local 走 `LOCAL_PUBLIC_URL_PREFIX`，s3 走 `S3_PUBLIC_URL`），业务层不拼 url

#### Scenario: publicUrl 同步给出 url
- **WHEN** 已知 key 但不需要写入（如 admin/media 列表渲染）
- **THEN** `storage.publicUrl(key)` 同步返回字符串 url，不发起任何 I/O

### Requirement: driver 选择由环境变量驱动

应用 SHALL 在启动时根据 `STORAGE_DRIVER` 环境变量决定 driver 实例。合法值：`local` / `s3`。未设置或未知值 MUST fall back 到 `local`。

#### Scenario: 默认使用本地 driver
- **WHEN** 应用启动且 `STORAGE_DRIVER` 未设置
- **THEN** `storage` 单例的具体实现是 `LocalDiskStorage`

#### Scenario: 显式选择 s3 driver
- **WHEN** `STORAGE_DRIVER=s3` 且 `S3_ENDPOINT` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_BUCKET` / `S3_PUBLIC_URL` 全部已设置
- **THEN** `storage` 单例的具体实现是 `S3Storage`，且首次使用前调用 `ensureBucket()` 创建桶（若不存在）

#### Scenario: s3 driver env 缺失时 fail-fast
- **WHEN** `STORAGE_DRIVER=s3` 但任一必需 env 缺失
- **THEN** 应用启动时（即首次 import `@/lib/storage` 时）抛出 `AppError`，错误消息列出缺失的 env 名称

### Requirement: LocalDiskStorage 行为

LocalDiskStorage SHALL 把文件写到 `${LOCAL_UPLOAD_DIR}/${key}`，并通过 `${LOCAL_PUBLIC_URL_PREFIX}/${key}` 返回可访问 url。默认 `LOCAL_UPLOAD_DIR=public/uploads`、`LOCAL_PUBLIC_URL_PREFIX=/uploads`。

#### Scenario: 写入按 key 中的日期路径分桶
- **WHEN** 调用 `put({ key: "2026/05/clm5xxx.png", body, contentType: "image/png" })`
- **THEN** 文件落到 `${LOCAL_UPLOAD_DIR}/2026/05/clm5xxx.png`
- **AND** 必要的中间目录被自动创建（`mkdir -p`）

#### Scenario: 删除不存在的文件不抛错
- **WHEN** 调用 `delete("2026/05/never-existed.png")`
- **THEN** 操作幂等地完成（ENOENT 被吞掉），不抛 `AppError`

#### Scenario: publicUrl 同步拼字符串
- **WHEN** 调用 `publicUrl("2026/05/clm5xxx.png")`
- **THEN** 返回 `/uploads/2026/05/clm5xxx.png`（默认配置下）

### Requirement: S3Storage 行为

S3Storage SHALL 用 MinIO SDK 把文件 putObject 到 bucket 根下的相对 key，通过 `${S3_PUBLIC_URL}/${key}` 返回 url。bucket 名称由 `S3_BUCKET` env 决定。

#### Scenario: 写入到 bucket 根
- **WHEN** 调用 `put({ key: "2026/05/clm5xxx.png", body, contentType: "image/png" })`
- **THEN** 在 bucket 中创建对象，路径为 `2026/05/clm5xxx.png`，Content-Type header 设为 `image/png`

#### Scenario: 删除不存在的对象不抛错
- **WHEN** 调用 `delete("2026/05/missing.png")`
- **THEN** 操作幂等完成（MinIO removeObject 不抛 NoSuchKey）

#### Scenario: publicUrl 处理 trailing slash
- **WHEN** `S3_PUBLIC_URL=https://cdn.tzblog.dev/` 或 `https://cdn.tzblog.dev`（带或不带末尾斜杠）
- **THEN** `publicUrl("2026/05/clm5xxx.png")` 始终返回 `https://cdn.tzblog.dev/2026/05/clm5xxx.png`

### Requirement: key 生成由调用方负责

`IStorage` SHALL 不为业务层生成 key。key 完全由调用方（典型场景：`media.ts` service 层）按业务规则拼装后传入。这让 driver 保持无状态、可单测。

#### Scenario: 媒体 service 拼接 key
- **WHEN** 上传请求到达 `media.ts` 的 `createMedia` 服务
- **THEN** 服务按 `${yyyy}/${MM}/${cuid}.${ext}` 拼出 key，然后传给 `storage.put`
- **AND** 同一个 key 既写入 `Media.key` 字段、也用作 `storage.delete` 的参数
