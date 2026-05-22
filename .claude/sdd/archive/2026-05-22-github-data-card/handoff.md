# Handoff — github-data-card

> 你（接收 AI）正在执行 TZBlog 的 github-data-card SDD。预计 0.5 天。

## 30 秒概览

Homepage 新增 GitHub 数据卡（avatar / commits last 7d / top 3 repos）。匿名 Public API + ISR 1h 缓存绕 60 req/h 限制。任何 API 失败优雅 fallback，不阻塞页面。

3 layer：schema (zod) + service (fetch + parse) + component (RSC Editorial styled)。

## 阅读顺序

1. master.md / handoff-guide.md / design-system.md / known-findings.md（GITHUB_USERNAME 已在 env）
2. `.claude/sdd/github-data-card/proposal.md`
3. `.claude/sdd/github-data-card/specs/*/spec.md`（schema → service → component → integration）
4. `.claude/sdd/github-data-card/test-map.md`
5. `.claude/sdd/github-data-card/design-notes.md` — **含 service 完整骨架 + component 完整骨架 + ASCII mockup**
6. `.claude/sdd/github-data-card/tasks.md`

## 依赖

- env.ts `GITHUB_USERNAME` 已是 optional（已就位）
- AppError helpers (`src/lib/errors.ts`) 可用，但本任务**仅在 service 内 console.warn 不抛 AppError**（component 自己处理 fallback）
- hero-editorial 完成（Editorial token 可用）

## 执行总览

```
§A schema   (TEST-RED → IMPL-GREEN, scope github-schema)
§B service  (TEST-RED → IMPL-GREEN, scope github-service)
§C component (TEST-RED → IMPL-GREEN, scope github-card)
§D integration (TEST-RED → IMPL-GREEN, scope site-home)
```

8 commits。

## 关键约束

- **不装 octokit / 任何 GitHub SDK** — native fetch only
- **Anonymous（不要 PAT）** — 用 ISR 1h cache 抵消 rate limit
- **Fallback in component** — service 返回 discriminated union，component 根据 status switch
- **不向上抛错** — service 用 console.warn 不 throw

## Editorial 风

- hairline label "GITHUB · DEVELOPMENT"
- 大数字（commits last 7d）用 `--text-h2`
- serif body / mono label
- avatar 用 `<img>` + alt + width/height + loading="lazy"

## ha1den 上线前提醒

在 completion-report 高亮：
> ⚠️ Pre-launch: set `GITHUB_USERNAME=<your-handle>` in `.env.production` or Docker secrets. First page visit warms the 1h ISR cache.

## 禁止事项

| 禁止 | 为什么 |
|------|-------|
| 装 octokit / @octokit/* | 用 native fetch |
| 用 GitHub PAT / Authorization header | R1 anonymous |
| service 抛错 | R2 fallback |
| component 用 try/catch 包 await | service 已 not-throw，无需 try |
| 在 hero 上方插 card | 不在 above-fold (LCP impact) |
| 改 env.ts | GITHUB_USERNAME 已 optional |
| `--no-verify` | 违反 |

## 完成后输出

`.claude/sdd/github-data-card/completion-report.md` 含 commits + test counts + cache cold-start time observation + ha1den env reminder

## TL;DR

```
读 SDD → §A schema RED+GREEN → §B service RED+GREEN →
§C component RED+GREEN → §D integration RED+GREEN →
全套质量门 → completion-report → 停。
```

收工。
