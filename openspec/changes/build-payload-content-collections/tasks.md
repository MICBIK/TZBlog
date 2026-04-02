## 1. 前置检查

- [ ] 1.1 确认 PostgreSQL 已启动（`docker compose up -d` 或本地 PG 实例）
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

- [ ] 3.1 启动 Payload CMS：`cd apps/cms && pnpm dev`，确认无启动错误
- [ ] 3.2 访问 `http://localhost:3000/admin`，首次访问创建管理员账号
- [ ] 3.3 确认后台侧边栏出现：Posts / Projects / Docs / Notes
- [ ] 3.4 确认 PostgreSQL 中已创建对应表（可用 `psql` 或 TablePlus 查看）

## 4. 数据与 API 验证

- [ ] 4.1 在 Payload Admin 创建 1 条 Post 测试数据并发布
- [ ] 4.2 验证 API：`GET http://localhost:3000/api/posts?where[_status][equals]=published` 返回正确数据
- [ ] 4.3 在 Payload Admin 创建 1 条 Post 草稿（不发布）
- [ ] 4.4 验证草稿不出现在上述 API 响应中
- [ ] 4.5 对 Projects / Docs / Notes 重复 4.1~4.4

## 5. 收尾

- [x] 5.1 已完成静态代码与文档对账，当前实现与 access / drafts 设计一致
- [ ] 5.2 在允许的环境中运行 `cd apps/cms && pnpm lint` 或 `tsc --noEmit`，确认无类型错误
- [x] 5.3 更新本 tasks.md 勾选完成项
- [ ] 5.4 提交 atomic commit：`feat(cms): add posts, projects, docs, notes collections to Payload CMS`
