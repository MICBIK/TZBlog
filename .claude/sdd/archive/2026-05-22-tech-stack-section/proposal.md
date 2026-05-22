# Proposal — tech-stack-section

> Stage: Pre-deploy P2 cleanup
> Created: 2026-05-22
> Path: `.claude/sdd/tech-stack-section/`
> Tier: T2 / 0.5 day implementation
> 视觉方向：Editorial / 杂志风（继承 hero-editorial 基线）

## Why

当前 `src/app/(site)/page.tsx:46-61` 的 Tech Stack section 是终端模拟（`$ whoami` + bullet list），6 个硬编码字符串。问题：

- 视觉与 hero-editorial（Editorial 风）不协调
- 信息密度低（仅 tech name，无 context）
- 缺少分类，全堆一列
- 不可读 / 不有趣

不修这层，homepage 在 hero 完美但 scroll 到 Tech Stack 就破功。

## What

1 个主 capability + 1 个集成 capability：

### Capability: component
- 新建 `src/components/site/TechStack.tsx` （RSC）
- 类目化 5 组（Frontend / Content & Editor / Backend & Data / Infra / Tooling）
- 每组：
  - Hairline label（uppercase tracking-wide）
  - Rule line separator
  - 2-col grid（lg+）of items
  - 每个 item：name + 简短 note（Editorial dateline 风）
- 不引入新 token（复用 hero-editorial 阶段定的 --text-* / --font-serif 等）

### Capability: integration
- 在 `src/app/(site)/page.tsx` 把 line 46-61 的旧 Tech Stack section 删除
- 在该位置 import + 渲染 `<TechStack />`
- 删除 line 9-16 的 `techStack` const（数据搬入 TechStack 组件内）

### 不在范围
- 改 hero / Recent Posts / Site Stats / GitHub card / Footer
- 引入新依赖
- 改 globals.css token

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | 数据 inline in TechStack.tsx vs 提到 src/lib/tech-stack.ts | **inline** | 小列表（5 类 × 3-5 item ≈ 20 行）；YAGNI；不需复用 |
| R2 | 每 item 含 note vs 仅 name | **含 note**（1 行 Editorial 简评） | 信息密度 + Editorial 风；如 "Next.js 15 — App Router + RSC" 比裸 "Next.js 15" 有意思 |
| R3 | 5 类目分组 vs 单 flat list | **5 类** | 信息组织；Editorial 风的 section + label 自然适合 |
| R4 | Hairline label 颜色 | `--muted-fg` + `text-[var(--text-label)]` + uppercase tracking-wide | 与 hero-editorial aside 风格一致 |
| R5 | item 渲染：grid vs ul | **grid**（`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`） | 信息扫读更快；Editorial 杂志栏目感 |
| R6 | 移动单列 vs 双列 | 单列（默认）→ sm:双列 → lg:三列 | 渐进密度，符合 fluid 响应 |
| R7 | item 是否带 link？（如 link 到该 tech 官网） | **不带 link**（MVP） | hero / Recent Posts 才该有 link 价值；tech 名字本身已说明；避免 link 噪音 |
| R8 | section heading 文案 | `Tech Stack` 改为 `Stack` 或 `Built With` | **保留 "Tech Stack"** 与导航/SEO 一致；Editorial 上方加 hairline `WHAT POWERS THIS` |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| component | `specs/component/spec.md` | SPEC-TS-C-1..5 |
| integration | `specs/integration/spec.md` | SPEC-TS-I-1..2 |

## Impact

- 修改：
  - `src/app/(site)/page.tsx`（删 line 9-16 techStack const；删 line 46-61 旧 section；加 import + `<TechStack />`）
- 新增：
  - `src/components/site/TechStack.tsx`
  - `src/components/site/TechStack.test.tsx`
- 依赖：无新装
- DB / schema 不动

## Out of scope

- 单独 tech 详情页 / 链接到 tech 官网（推 V2）
- "now using" 时间标记 / 历史变更（YAGNI；用 git log 看即可）
- icon / logo（YAGNI；纯 typography 与 Editorial 一致）

## Workflow

1. SDD 7 件套
2. **§A component**: 1 TDD pair（test → impl, 一次性写完所有 5 spec）
3. **§B integration**: 1 TDD pair（page.tsx 删旧加新）
4. 质量门
5. completion-report

## Risks

| 风险 | 缓解 |
|------|------|
| 数据列表过时（如未来加新依赖） | 注释中标注 "manual sync from package.json / CLAUDE.md tech stack section"；不强求自动 |
| jsdom 测试覆盖不到响应式 | 测 className 含 `sm:grid-cols-2` `lg:grid-cols-3` 即可；视觉验证人眼 |
| 与 hero-editorial 视觉脱节 | design-notes ASCII mockup 明确视觉协调；用同套 token |
