# TZBlog AI 接手指令

> 适用于接手实现 Payload CMS 内容模型与 Astro 数据链路的 AI 协作者
> 当前日期：2026-03-30

---

## 你的任务

按顺序完成以下两个 OpenSpec change：

1. **`build-payload-content-collections`** — 在 Payload CMS 中建立 posts/projects/docs/notes 四个内容 collection
2. **`connect-astro-to-payload-api`** — 将 Astro 前台数据来源从硬编码静态数据切换为 Payload REST API

**必须先完成第一个，再开始第二个。**

---

## 接手前必读文件（按顺序）

1. `README.md`
2. `docs/PROJECT_INDEX.md`
3. `openspec/project.md`
4. `docs/TZBlog OpenSpec 变更管理规范.md`
5. `docs/TZBlog 项目开发流程规范.md`
6. `docs/TZBlog CMS数据链路实现方案.md` ← **实现细节和完整代码都在这里**
7. `openspec/changes/build-payload-content-collections/proposal.md`
8. `openspec/changes/build-payload-content-collections/design.md`
9. `openspec/changes/build-payload-content-collections/tasks.md`

---

## 执行规则

### 必须遵守

- 所有改动必须在对应 OpenSpec change 范围内，不得超出
- 实现过程中同步勾选 `tasks.md` 中的任务
- 每完成一个 change，执行验证后提交原子 commit，再归档
- 提交信息使用 Conventional Commits 格式，带 scope

### 验证命令

```bash
# 验证 OpenSpec 工件
npx -y @fission-ai/openspec@1.2.0 validate build-payload-content-collections --type change --strict
npx -y @fission-ai/openspec@1.2.0 validate connect-astro-to-payload-api --type change --strict

# 前台类型检查
cd apps/web && pnpm run astro check

# 前台构建（需要 Payload CMS 运行中）
cd apps/web && pnpm run astro build
```

### 归档命令

```bash
# 第一个 change 完成后
npx -y @fission-ai/openspec@1.2.0 archive build-payload-content-collections -y

# 第二个 change 完成后
npx -y @fission-ai/openspec@1.2.0 archive connect-astro-to-payload-api -y
```

### 提交格式

```
feat(cms): add posts, projects, docs, notes collections to Payload CMS
feat(web): connect Astro frontend to Payload CMS REST API
```

---

## 技术栈说明

| 层 | 技术 | 端口 | 目录 |
|----|------|------|------|
| 前台 | Astro | 4321 | `apps/web` |
| 后台 | Payload CMS + Next.js | 3000 | `apps/cms` |
| 数据库 | PostgreSQL | 5432 | `infra/` |
| 包管理 | pnpm workspace + turbo | — | 根目录 |

### 启动顺序

```bash
# 1. 启动 PostgreSQL
docker compose -f infra/docker-compose.yml up -d

# 2. 启动 Payload CMS
cd apps/cms && pnpm dev

# 3. 启动 Astro（另开终端）
cd apps/web && pnpm dev
```

### 首次启动 Payload

1. 访问 `http://localhost:3000/admin`
2. 创建管理员账号
3. 确认 `apps/cms/.env` 中 `PAYLOAD_SECRET` 已替换为真实随机字符串：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

## 锁定路线（不得修改）

- 前台：Astro（不得换框架）
- 后台：Payload CMS（不得自研 CMS）
- 数据库：PostgreSQL
- 搜索：Pagefind（本次 change 不涉及，不得提前实现）
- 统计：Umami（本次 change 不涉及，不得提前实现）

---

## 本次 change 边界

### 在范围内

- `apps/cms/src/collections/` 下新建四个 collection 文件
- `apps/cms/src/payload.config.ts` 注册新 collection
- `apps/web/src/lib/payload.ts` 新建 API 请求层
- `apps/web/src/pages/` 下的列表页和详情页数据来源替换
- `apps/web/.env` 添加 `PAYLOAD_API_URL`

### 不在范围内（不得触碰）

- 前台页面的 HTML 结构、组件、CSS
- `SiteLayout.astro`（土星 3D 背景）
- `SiteHeader.astro` / `SiteFooter.astro`
- Pagefind 接入
- Umami 接入
- `apps/cms` 的 Users / Media collection
- infra 配置

---

## 如果遇到问题

### Payload 启动失败
- 检查 PostgreSQL 是否运行：`docker ps`
- 检查 `DATABASE_URL` 是否正确
- 检查 `PAYLOAD_SECRET` 是否已设置

### CORS 错误（Astro 请求 Payload）
在 `apps/cms/src/payload.config.ts` 添加：
```ts
cors: ['http://localhost:4321'],
csr f: ['http://localhost:4321'],
```

### astro build 失败提示 API unavailable
- 确认 Payload CMS 正在运行（`http://localhost:3000` 可访问）
- 确认 `.env` 中 `PAYLOAD_API_URL` 已正确设置

### array 字段数据格式不对
- Payload array 字段返回 `[{ id: '...', <fieldName>: value }]`，需要用 `flattenArray` 展平
- 见 `docs/TZBlog CMS数据链路实现方案.md` 第八章 8.2 节
