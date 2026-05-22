# Pre-Deploy SDDs — INDEX

> Created: 2026-05-22
> Status: 全 10 个 SDD 完成，待 ha1den 决定 dispatch 给外部 AI
> 总文件数：85（80 SDD + 5 master framework）

## 一句话

TZBlog 上线前的所有任务已全部 SDD 化。把 `handoff-pre-deploy/` + 各 feature 的 `handoff.md` 喂给外部 AI 就能开工。

## Master Framework（先读）

位置：`.claude/sdd/handoff-pre-deploy/`

| 文件 | 用途 |
|------|------|
| `master.md` | 项目背景 / 技术栈 / TDD 节奏 / 10 任务总览 |
| `execution-plan.md` | batch 依赖关系 + 推荐执行顺序 |
| `handoff-guide.md` | 接手 AI 的工作约定 |
| `design-system.md` | Editorial 视觉基线（typography / palette / motion） |
| `known-findings.md` | 第一轮研究产出（重要陷阱与已确认事实） |

## 10 个 SDD

按推荐执行顺序排：

### Batch 0 — 内务（先做，无依赖）

| # | SDD | 路径 | 文件 | 估时 | NO-TDD? |
|---|-----|------|------|------|---------|
| 1 | **docs-sync** | `.claude/sdd/docs-sync/` | 7 | 0.5d | 部分（仅 *.md） |
| 2 | **confirm-dialog-replication** | `.claude/sdd/confirm-dialog-replication/` | 7 | 0.5d | 否 |

### Batch 1 — Homepage Editorial 改造（hero → tech-stack → github）

| # | SDD | 路径 | 文件 | 估时 | 依赖 |
|---|-----|------|------|------|------|
| 3 | **hero-editorial** | `.claude/sdd/hero-editorial/` | 8 | 1d | 无 |
| 4 | **tech-stack-section** | `.claude/sdd/tech-stack-section/` | 7 | 0.5d | hero-editorial（用 tokens） |
| 5 | **github-data-card** | `.claude/sdd/github-data-card/` | 9 | 0.5d | hero-editorial |

### Batch 2 — 内容页 + 数据

| # | SDD | 路径 | 文件 | 估时 | 依赖 |
|---|-----|------|------|------|------|
| 6 | **about-page** | `.claude/sdd/about-page/` | 8 | 0.5d | hero-editorial |
| 7 | **tags-pages** | `.claude/sdd/tags-pages/` | 9 | 0.5d | hero-editorial |
| 8 | **analytics-dashboard** | `.claude/sdd/analytics-dashboard/` | 8 | 1d | 无（独立 admin） |

### Batch 3 — 文档 + 上线准备

| # | SDD | 路径 | 文件 | 估时 | 依赖 |
|---|-----|------|------|------|------|
| 9 | **readme-and-docs** | `.claude/sdd/readme-and-docs/` | 7 | 0.5d | 无 |
| 10 | **lighthouse-prep** | `.claude/sdd/lighthouse-prep/` | 10 | 1d | **所有前 9 个完成** |

总估时：~6.5 工日

## 每个 SDD 的标准结构

```
.claude/sdd/<feature>/
├── proposal.md         ← Why / What / Decisions / Risks
├── specs/<cap>/spec.md ← GIVEN/WHEN/THEN 用例（spec-id 唯一）
├── test-map.md         ← spec-id → 测试函数映射
├── tasks.md            ← TDD 微循环（test/impl 配对）
├── design-notes.md     ← 视觉/技术 hint + 可粘代码骨架
└── handoff.md          ← 给接手 AI 的 30 秒概览 + 阅读顺序
```

## 给外部 AI 的提示词模板

```
你即将执行 TZBlog 项目的 <SDD-NAME> SDD。

工作目录：/path/to/TZBlog

请按以下步骤：

1. 先读 .claude/sdd/handoff-pre-deploy/ 下全部 5 个文件
2. 再读 .claude/sdd/<SDD-NAME>/handoff.md 开始
3. 然后按 handoff 指定顺序读其他 artifacts
4. 严格按 tasks.md 微循环执行：每个 spec 一组 test/impl commit
5. 不破坏现有功能，不安装未在 SDD 中说明的依赖
6. 完成后产出 .claude/sdd/<SDD-NAME>/completion-report.md

如有阻塞：在 completion-report 中明确说明，不强行绕过。

约束（必须遵守）：
- 不用 `--no-verify`
- 不改 .husky/commit-msg
- 安装新依赖后做好记录
- 任何 SQL raw 用 Prisma.sql tagged template
- 颜色必须用 CSS 变量
- TDD 严格：RED commit + GREEN commit 配对
- commit scope 按 SDD tasks.md 指定
```

## 完成后由 claude 做什么

1. 对每个 SDD 跑 audit：
   - `git log` 复核 commits 节奏
   - 跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
   - 检查 spec-id 覆盖率
   - smoke test 关键路径
2. 发现 bug → fix
3. 全部 10 个 SDD 通过 → 归档到 `.claude/sdd/archive/2026-MM-DD-<name>/`
4. 进入 P3 部署流程：
   - `/project:finish-feature` 收尾
   - docker compose build + push
   - VPS 上 deploy
   - smoke test online
5. 上线 1 周后由 claude 协助：
   - CSP Report-Only → enforce
   - jest-axe deferred 项补齐
   - lighthouse-baseline backlog 项处理
   - og-default.png / icon.svg / about placeholder 替换

## ⚠️ ha1den 上线前 ACTION ITEMS

各 SDD handoff 里的"上线前提醒"汇总：

| 来源 | 必做 |
|------|------|
| github-data-card | `.env.production` 设 `GITHUB_USERNAME` |
| about-page | 编辑 `src/lib/content/about.ts` 替换所有 "Placeholder:" |
| lighthouse-prep | `.env.production` 设 `NEXT_PUBLIC_SITE_URL` |
| lighthouse-prep | 准备真 `public/og-default.png` (1200×630) |
| lighthouse-prep | 准备真 `src/app/icon.svg`（256×256 logo） |
| lighthouse-prep | 上线 1 周后切 CSP Report-Only → enforce |
| readme-and-docs | 上线后补真 `docs/assets/screenshot-home.png` |
| readme-and-docs | 确认 MIT license OK（或换其他） |

## 总览数字

- SDDs：10
- Specs：~110 个 spec-id（GIVEN/WHEN/THEN 用例）
- 预估 commits：~85（含 test/feat pair + docs）
- 预估测试数：~120
- 文件总数：85 markdown
- 估时：6.5 工日（外部 AI 平行可压缩）

## 收工

10 个 SDD 已全部写完，可以喂给外部 AI 开干。我等你回信，外部 AI 完成后我接 audit + bug 修复 + 上线。

收工，ha1den。
