# Proposal — github-data-card

> Stage: Pre-deploy P2 cleanup
> Created: 2026-05-22
> Path: `.claude/sdd/github-data-card/`
> Tier: T2 / 0.5 day implementation
> 视觉方向：Editorial（继承 hero-editorial 基线）

## Why

Homepage 缺一个 GitHub 数据展示卡片来体现 "ha1den is an active developer"：
- 最近活动（commits / repo）
- 公开个人简介 + avatar
- top stars

数据从 GitHub Public API 拉，匿名 60 req/h，加 ISR 1h 缓存绕 limit。

不修这层，homepage 缺少"this person ships code regularly"的信号。

## What

3 layer：

### Capability: schema
- 新建 `src/lib/schemas/github.ts`
- zod schemas 对应 GitHub API 返回（保护我们不被 API 变更崩）
- `githubUserSchema` (`/users/{u}` 响应)
- `githubRepoSchema` (`/users/{u}/repos`)
- `githubEventSchema` (`/users/{u}/events/public`)

### Capability: service
- 新建 `src/lib/services/github.ts`
- `getGithubData(): Promise<GithubData | { status: "unavailable", reason: string }>` 函数
- 内部依次 fetch user / repos / events，全部用 `{ next: { revalidate: 3600 } }`
- 任一 fetch 4xx / 5xx / zod parse fail → 返回 `{ status: "unavailable", reason }`
- missing `GITHUB_USERNAME` env → 直接返回 unavailable
- 用 `errors.upstream` / `errors.missingEnv` for internal logging（不向上抛）

### Capability: component
- 新建 `src/components/site/GithubCard.tsx`（async RSC）
- 渲染 success state（avatar + handle + recent commits 7d + top 3 repos）或 fallback state（"GitHub unavailable"）
- Editorial 风（hairline label / rule line / 数据用 --text-h2 highlight）

### Capability: integration
- 在 `src/app/(site)/page.tsx` 加 `<GithubCard />`（在 Tech Stack 后或 Recent Posts 前）

### 不在范围
- GitHub PAT 模式（R1 决策：anonymous + ISR）
- 私人仓数据 / 私人 commit 历史
- live polling / WebSocket
- 装 octokit SDK
- 改 layout / 其他 section

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | Anonymous (60 req/h) vs PAT (5000 req/h) | **Anonymous + ISR 1h** | 零配置；1h 缓存 + ISR 远超 60 req/h 需求 |
| R2 | Component handles error vs error.tsx boundary | **Component fallback** | RSC 出错若让 boundary 接，整页 broken；本卡片不该影响其他 section |
| R3 | 数据展示：图表（贡献热图）vs 简数字 | **简数字** | MVP 简洁；图表需新依赖；后续 V2 可加 |
| R4 | 缓存 1h vs 24h | **1h** | 平衡新鲜度 + rate limit；ISR 自动 |
| R5 | Schema fail behavior | **Treat as unavailable**（不抛）| GitHub API 变更是 known risk，不影响 homepage 可用性 |
| R6 | `GITHUB_USERNAME` missing 时 | **Render fallback** + console.warn | env 已是 optional，应优雅退化 |
| R7 | events vs commits API | **events API**（`/users/{u}/events/public`） | events 含 PushEvent，能算 commits 数；commits API 需 per-repo 调用 |
| R8 | repos sort | **stars desc, per_page=3** | top 3 starred 最有价值；不是 recent commits（那 events 已覆盖）|

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| schema | `specs/schema/spec.md` | SPEC-GC-S-1..5 |
| service | `specs/service/spec.md` | SPEC-GC-V-1..6 |
| component | `specs/component/spec.md` | SPEC-GC-C-1..4 |
| integration | `specs/integration/spec.md` | SPEC-GC-I-1 |

## Impact

- 新增：
  - `src/lib/schemas/github.ts` + `.test.ts`
  - `src/lib/services/github.ts` + `.test.ts`
  - `src/components/site/GithubCard.tsx` + `.test.tsx`
- 修改：
  - `src/app/(site)/page.tsx` (import + render)
- 依赖：无新装
- env：用现有 `GITHUB_USERNAME`（已 optional in env.ts:16）

## Out of scope

- GitHub PAT 模式
- 贡献热力图 / 时间线视觉
- 私人仓
- octokit SDK
- 多用户支持

## Workflow

1. SDD 8 件套
2. **§A schema**: 5 spec → 一个 TDD pair（test → impl）
3. **§B service**: 6 spec → 一个 TDD pair
4. **§C component**: 4 spec → 一个 TDD pair
5. **§D integration**: 1 spec → 一个 TDD pair（page.tsx 接入）
6. 质量门 + completion-report

## Risks

| 风险 | 缓解 |
|------|------|
| GitHub API 变更 schema | zod parse + fallback 路径；console.warn 在 service 层 |
| Anonymous rate limit (60 req/h) 超 | ISR 1h cache + 单 user 仅 3 endpoints = 3 calls/cache miss；一天最多 24 × 3 = 72 calls，超 limit 但 cache hit 拦截 |
| ha1den 未设 GITHUB_USERNAME | Render fallback；不阻塞 |
| Cold cache 首次 request 慢 | 接受；3 个 fetch parallel 应 < 1s |
| 同一域 GitHub avatar 阻塞 LCP | 用 `<img>` + loading="lazy"（GithubCard 不在 above-fold） |
| API 返回不可预期数据 | zod parse 严格 + fallback |
