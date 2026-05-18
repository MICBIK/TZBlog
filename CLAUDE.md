# CLAUDE.md — TZBlog

> 本文件是 Claude Code 的项目级指令。每次会话开始时自动加载。

## 项目概述

TZBlog 是一个自研的个人技术博客系统。单体 Next.js 15 应用，包含前台展示 + 后台 CMS + 自研 Analytics，部署在自有 VPS（Docker Compose + Caddy）。

## 技术栈

- **框架**：Next.js 15 (App Router / RSC / Server Actions)
- **语言**：TypeScript 5 (strict)
- **数据库**：PostgreSQL 16 + Prisma 5
- **UI**：shadcn/ui + Tailwind CSS v4（CSS 变量驱动主题）
- **编辑器**：Tiptap v2 + tiptap-markdown（WYSIWYG，存储格式为 Markdown）
- **MD 渲染**：remark + rehype + Shiki
- **认证**：Auth.js v5 (Credentials provider)
- **媒体**：MinIO (S3 协议，自部署)
- **部署**：Docker Compose + Caddy (自动 HTTPS) + VPS

## 开发命令

```bash
pnpm dev              # 启动开发服务器 (turbo)
pnpm build            # prisma generate && next build
pnpm lint             # next lint
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # tsx prisma/seed.ts
pnpm docker:dev       # 启动本地 Postgres + MinIO 容器
```

## 架构规则

### 路由组织

- `src/app/(site)/` — 前台公开页面，无认证
- `src/app/(admin)/` — 后台管理，middleware 守卫
- `src/app/api/` — REST API
- `src/middleware.ts` — 守 `/admin/*` 和 `/api/admin/*`

### 数据访问

- Server Component 直接 `await db.post.findMany(...)`，不包装无意义 service 层
- 只有跨多表业务流程才拆 `src/lib/services/*.ts`
- 不写 Repository 模式

### API 响应格式

```
成功：{ "data": <T>, "meta": {...} }
失败：{ "error": { "code": "...", "message": "...", "details": {...} } }
```

### 表单 & 校验

- zod schema 写一份，前后端共享（`src/lib/schemas/*.ts`）
- 前端 react-hook-form + @hookform/resolvers/zod
- 后端 API 入口必须 zod.parse(body)

### 主题变量

- 所有颜色必须用 CSS 变量：`color: hsl(var(--fg))`，**禁止**硬编码色值
- 变量定义在 `src/styles/globals.css` 的 `@theme` 块
- 命名：`--bg / --fg / --muted / --accent / --border / --ring` 等语义化

### i18n

- 内容字段抽到 `*Translation` 子表，按 `(parentId, locale)` 唯一
- 查询时 `where: { locale: currentLocale }`
- MVP 写死 "zh"，V3 从 URL 解析

### 计数器

- Post 内嵌 `viewCount / likeCount / commentCount`
- 写入时事务内 `count = count + 1`
- 详情表（PostView / PostLike / Comment）记录原始数据用于去重

### 反垃圾

- `visitorHash = sha256(ip + userAgent + dailySalt)`
- 浏览去重：同访客 + 同文章 + 同天 = 一次
- 点赞：同访客 + 同文章 24h 内一次
- 评论：同 visitorHash 5 分钟内最多 3 条

## 编码规范

- 组件文件 PascalCase：`PostCard.tsx`
- 普通文件 camelCase：`useDebounce.ts`
- 测试文件 `*.test.ts` 与被测文件同目录
- 不要 `try/catch + console.error + 返回空值` 吞错（silent failure 禁忌）
- 业务异常用 `AppError`（`src/lib/errors.ts`）

## Git 规范

- Conventional Commits 带 scope：`feat(<scope>):` / `fix(<scope>):` / `test(<scope>):` / `refactor(<scope>):` / `chore:` / `docs:`
- TDD 节奏（每个微循环两提交，scope 一致）：
  - `test(<scope>): <spec-id>` ← 此时测试 RED
  - `feat(<scope>): <spec-id>` ← 此时测试 GREEN
  - `refactor(<scope>): <desc>` ← 可选，不改测试
- 一个 OpenSpec change 一组 commit，不混 feature
- **husky commit-msg hook** 自动检查：未带 `[no-tdd]` 的 feat: 必须在前 5 个 commit 找到同 scope 的 test:，否则拒绝提交

<!-- WORKFLOW-START: scenario-0-explore v1.2.0 -->
## 场景 0：模糊度优先判断（任何输入先经过这里）

> 防止"模糊需求硬塞分析流程，AI 编造结论"。检测到模糊信号 → 主动提议进 explore，不直接进场景 1/2/3。

**触发词**：想做、考虑、我在想、有点想、可能、也许、怎么搞、从哪开始、还没想好、思路、新模块、从零、未来怎么、X 还是 Y、哪个好、对比一下、选哪个；模糊 Bug 词（奇怪/莫名/找不到规律/偶尔/有时候）仅在场景 2 两轮假设不收敛后升级。

**主动提议话术**：
```
这是个开放问题，建议先用 explore 发散：会读代码 / 画 ASCII 图 / 列方向 / 做 tradeoff，
不写应用代码，只创建/修改 OpenSpec artifacts。继续吗？
- [是] 进入 explore
- [否] 强行进场景 1
```

**explore 过程铁律**：
- 每轮回应开头打 `[EXPLORE]` 徽章
- 禁应用代码、禁 `pnpm add`、禁改源码、禁 Prisma migrate
- 允许：读任何文件、创建/修改 OpenSpec artifacts、画 ASCII 图

**收敛产出（强制三件套）**：用户出现"那就这么干"/"OK 就这样"或连续 2 轮无新信息时，输出：
```markdown
## What We Figured Out
**The problem**: <一句话>
**The approach**: <方向 + 关键决策>
**Open questions**: <未解决 / 需调研>
**Risks**: <已识别风险>
**Capture plan**: <即将写哪些 artifacts>

**Next**:
- [A] auto-capture → /opsx:new <feature>
- [C] capture 到 design.md / specs/ 不立 change
- [D] 不 capture 结束
```

> ⚠️ `/opsx:ff` 路径已废弃：会一次性生成所有 artifacts（含 tasks.md），跳过 test-map 强制环节。统一走 [A] /opsx:new。

**Auto-capture**：[A] 跑 `/opsx:new` 并写 proposal/design 草稿（不写 specs，留给场景 1 阶段补 GIVEN/WHEN/THEN）；[C] 写到已有 specs 或 memory-bank/activeContext.md；[D] 仅记录 explore 结束。
所有 auto-captured 文件末尾加水印 `<!-- explore 自动生成草稿 时间:<ISO> -->`
<!-- WORKFLOW-END: scenario-0-explore -->

<!-- WORKFLOW-START: analysis-handoff v1.2.0 -->
## 分析→执行 衔接规则（任何分析/排查任务先走这里）

> 防止"给完结论就停"或"分析完直接乱改"。分析任务结束必须主动衔接到下一步。

### 场景 1：需求分析任务（"分析一下"/"看看这个功能怎么做"/"评估"）

1. 输出固定四段：技术方案 + 影响范围（受影响 Prisma 模型 / 路由 / 组件）+ 风险点 + 工作量预估
2. 末尾必附衔接询问：
   ```
   ─────────────────────────────────────
   分析完成。如何继续？
   - [A] 进入 OpenSpec 提案流程（推荐）→ 我来运行 /opsx:new <feature-name>
   - [B] 跳过提案，直接进入调研 + TDD
   - [C] 仅分析，到此为止
   ─────────────────────────────────────
   ```

### 场景 2：Bug 排查任务（"有 bug"/"功能不对"/"报错"）

1. 定位根因（假设表 → 复现路径 → 二分到最小失败点）
2. 输出根因报告：根因（精确到文件:行号）+ 复现路径 + 影响面（涉及文件 / 是否涉及 Prisma schema / Server Action / middleware / 计数器逻辑）
3. 按影响面分流：
   - 轻量（单文件、纯样式、不动 schema / Action / middleware）：确认后直修 + code-audit
   - 深度（跨文件、Prisma schema、计数器一致性、auth、middleware）：走 TDD 微循环 → 最小修复 → 回归
4. 修复完成后：原路径红绿复验 → 更新 memory-bank/knownIssues.md + progress.md
5. **两轮假设不收敛** → 主动建议升级到场景 0 explore 建假设地图

### 场景 3：意图不明（"帮我看看"/"这块代码有问题吗"）

先反问分类（仅分析 / 分析+修 / 直接修）再行动，禁猜测式动手。

### 强制约束

- 双产出：分析结论 + 衔接询问，缺一即未完成
- 不跨越：没有用户明确选择前禁止从分析跳到代码修改
- 例外：用户原话含明确执行意图（"修复 X"/"实现 Y"/"重构 Z"）直接进对应流程
<!-- WORKFLOW-END: analysis-handoff -->

<!-- WORKFLOW-START: tdd-ironrules v1.2.0 -->
## TDD 执行铁律（违反即流程崩溃，停止重来）

1. **tasks.md 必须是「test→impl」微循环结构，1 spec = 1 微循环**：
   - `x.y.a [TEST-RED]` 写 <spec-id> 失败测试，跑 `pnpm test` 粘 FAIL 输出
   - `x.y.b [IMPL-GREEN]` 最小实现使测试通过，粘 PASS 输出
   - 不合格 → 重写 tasks，禁止跳过此步骤进入实现

2. **tasks.md 生成前必须已有 `openspec/changes/<feature>/test-map.md`**
   - 内容：每条 spec → 测试函数名 + 文件路径 + 层级（unit/integration/e2e）
   - 涉及 Server Action / API 的 spec 必须有 zod schema 校验测试条目

3. **每个 [IMPL-GREEN] 任务前**：必须先粘对应 [TEST-RED] 的真实 vitest 终端输出，
   含 `FAIL` / `FAILED` 关键字。声明式 RED 视为违规

4. **每个 [IMPL-GREEN] 任务后**：必须粘真实 PASS 输出

5. **RED 阶段环境不可用**（如 Postgres 没启）：必须补 `[RED-补证]` 任务挂起当前微循环，
   禁先实现回头补

6. **git commit 节奏**：每微循环两提交
   - `test(<scope>): <spec-id>`
   - `feat(<scope>): <spec-id>`
   - 未带 `[no-tdd]` 的 feat: 必须前 5 commit 内有同 scope test:，否则 husky commit-msg hook 拒绝

7. **NO-TDD 例外仅限**：
   - 纯样式（Tailwind class、CSS 变量调整、视觉细节）
   - 文档与 OpenSpec 元文件（*.md/README/proposal/spec/tasks/test-map）
   - commit message 必须显式加 `[no-tdd]` 标签
   - **重构 / 依赖增减 / shadcn add / Prisma migration 不在 NO-TDD 范围**

### TDD 阶段徽章（每条响应必带）

```
[TDD: RED 写测试中] / [TDD: RED 已 FAIL ✓] /
[TDD: GREEN 写实现中] / [TDD: GREEN 已 PASS ✓] /
[TDD: REFACTOR] / [TDD: NO-TDD 已加 [no-tdd]]
```
<!-- WORKFLOW-END: tdd-ironrules -->

## OpenSpec 开发流程

本项目使用 OpenSpec 管理功能变更：

1. `/opsx:new` — 创建新 change（生成 proposal.md）
2. `/opsx:continue` — 生成下一个 artifact（spec / test-map / tasks）
3. `/opsx:verify` — 验证实现完整性
4. `/opsx:archive` — 归档已完成的 change

> ⚠️ 禁用 `/opsx:apply` 和 `/opsx:ff`：前者会绕过守门员自动写代码，后者会一次性生成 tasks.md 跳过 test-map。

## 自定义命令

- `/project:update-context` — 更新 memory-bank 上下文
- `/project:new-feature` — 开始新功能完整流程（OpenSpec + ECC TDD）
- `/project:finish-feature` — 收尾当前功能（verify + archive + 更新进度）

## Memory Bank

项目上下文存储在 `memory-bank/` 目录：

- `projectBrief.md` — 项目定位、目标、约束
- `techContext.md` — 技术栈版本、环境变量、脚本
- `systemPatterns.md` — 架构规则、代码约定
- `activeContext.md` — 当前焦点、下一步
- `progress.md` — 进度跟踪
- `knownIssues.md` — 已知问题

每次会话结束前运行 `/project:update-context` 保持同步。
