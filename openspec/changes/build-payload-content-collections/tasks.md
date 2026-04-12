## 1. 前置检查

- [x] 1.1 确认 PostgreSQL 已启动（`docker compose up -d`，postgres:17-alpine，2026-04-12 验证通过）
- [x] 1.2 确认 `apps/cms/.env` 中 `DATABASE_URL` 指向正确的数据库
- [x] 1.3 将 `PAYLOAD_SECRET` 替换为真实随机字符串：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [x] 1.4 确认 `apps/cms` 依赖已安装（`pnpm install`）

## 2. 实现 Collections

- [x] 2.1 新建 `apps/cms/src/collections/Posts.ts`（字段见 design.md 第3节 + 方案文档第三章3.2节）
- [x] 2.2 新建 `apps/cms/src/collections/Projects.ts`（字段见 design.md 第3节 + 方案文档第三章3.3节）
- [x] 2.3 新建 `apps/cms/src/collections/Docs.ts`（字段见 design.md 第3节 + 方案文档第三章3.4节）
- [x] 2.4 新建 `apps/cms/src/collections/Notes.ts`（字段见 design.md 第3节 + 方案文档第三章3.5节）
- [x] 2.5 修改 `apps/cms/src/payload.config.ts`：import 并注册四个新 collection（见 design.md 第5节）
- [x] 2.6 显式补齐四个内容 collection 的写权限约束：create/update/delete 需要登录用户

## 3. 启动验证

- [x] 3.1 启动 Payload CMS：`cd apps/cms && pnpm dev`，确认无启动错误（2026-04-12 验证通过，HTTP 200）
- [x] 3.2 访问 `http://localhost:3000/admin`，创建管理员账号 admin@tzblog.dev（2026-04-12 通过 Payload SDK 创建）
- [x] 3.3 确认后台侧边栏出现：Posts / Projects / Docs / Notes（2026-04-12 API 验证 4 个 collection 均可访问）
- [x] 3.4 确认 PostgreSQL 中已创建对应表：62 张表，含 posts/projects/docs/notes 及版本控制表（2026-04-12 psql 验证）

## 4. 数据与 API 验证

- [x] 4.1 通过 API 创建 Post 测试数据并发布（id:4, _status:published，2026-04-12）
- [x] 4.2 验证 API：`where[_status][equals]=published` 返回 4 篇 published，草稿被正确过滤（2026-04-12）
- [x] 4.3 通过 API 创建 Post 草稿（id:8, _status:draft，2026-04-12）
- [x] 4.4 验证前端查询参数 `where[_status][equals]=published` 不返回草稿（4 篇 vs 5 篇，2026-04-12）
- [x] 4.5 Projects/Docs/Notes 各创建 1 条 published 数据，API 验证通过（2026-04-12）

## 5. 收尾

- [x] 5.1 已完成静态代码与文档对账，当前实现与 access / drafts 设计一致
- [x] 5.2 `cd apps/cms && pnpm lint` 通过，无类型错误（2026-04-12 验证）
- [x] 5.3 更新本 tasks.md 勾选完成项
- [x] 5.4 代码已在历史 commit 中提交，运行时验证结果记录于本文件（2026-04-12）
