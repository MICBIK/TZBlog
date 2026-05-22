# Handoff — hero-editorial

> 你（接收 AI）正在执行 TZBlog 的 hero-editorial SDD。这是定 Editorial 视觉基线的关键任务，预计 1-2 天。

## 30 秒概览

当前 homepage hero 是 centered template tier，违反 anti-template policy。重做为 Editorial（杂志）风：

- Font pair: Source Serif 4 (serif h1) + Inter (sans body)，via `next/font/google`
- 不对称 grid `lg:grid-cols-[7fr_5fr]`
- 4+ Editorial signature elements: hairline label / dateline / rule line / numbered marginalia
- CSS-only reveal motion + prefers-reduced-motion 处理

本任务定的 `@theme` token 是后续 tech-stack-section / github-data-card / about-page 视觉一致性的基线。

## 阅读顺序（必读，按顺序）

1. `.claude/sdd/handoff-pre-deploy/master.md` — 项目背景 + 技术栈
2. `.claude/sdd/handoff-pre-deploy/handoff-guide.md` — 工作流约束
3. `.claude/sdd/handoff-pre-deploy/design-system.md` — **Editorial 视觉基线**（critical）
4. `.claude/sdd/handoff-pre-deploy/known-findings.md` — hero-editorial 段（globals.css 路径 / 字体 chain 等关键事实）
5. `.claude/sdd/hero-editorial/proposal.md` — Why / What / Decisions (R1-R8)
6. `.claude/sdd/hero-editorial/specs/typography-system/spec.md`
7. `.claude/sdd/hero-editorial/specs/hero-component/spec.md`
8. `.claude/sdd/hero-editorial/specs/motion-a11y/spec.md`
9. `.claude/sdd/hero-editorial/test-map.md`
10. `.claude/sdd/hero-editorial/design-notes.md` — **ASCII mockup + 完整 @theme 块 + 骨架 tsx** (critical)
11. `.claude/sdd/hero-editorial/tasks.md` — 你的执行清单

## Reference 必读

- `src/app/layout.tsx`（现有 Geist 字体配置 — 你要保留）
- `src/app/globals.css`（现有 :root 块 — 你扩展不覆盖）
- `src/app/(site)/page.tsx:22-46`（要替换的旧 hero）
- `src/app/(site)/page.test.tsx`（RSC 测试模板）

## 执行总览

```
§0 准备（读 11 个 context 文件 + inspect 现状）

§A typography-system
   A.1.a [TEST-RED]  globals.test.ts + layout.test.tsx → FAIL
                     commit: test(site-home): SPEC-HE-T-1..3 ...
   A.1.b [IMPL-GREEN] layout.tsx fonts + globals.css @theme + reveal CSS → PASS
                     commit: feat(site-home): SPEC-HE-T-1..3 ...

§B hero-component
   B.1.a [TEST-RED]  HeroEditorial.test.tsx (6 tests) → FAIL
                     commit: test(site-home): SPEC-HE-H-1..6 ...
   B.1.b [IMPL-GREEN] HeroEditorial.tsx 骨架 → PASS
                     commit: feat(site-home): SPEC-HE-H-1..6 ...

§C motion-a11y（多数在 §A/§B 已含；按需补）

§D 集成 page.tsx
   D.1.a [TEST-RED]
   D.1.b [IMPL-GREEN]
                     commits: test/feat(site-home): SPEC-HE-D-1 wire HeroEditorial

§E 验收（test / typecheck / lint / build / manual smoke）

§F 不归档
```

## 实施关键点

### A 阶段：typography-system

- `layout.tsx` import 加 Source_Serif_4 + Inter，**保留** Geist
- className chain on `<html>` 或 `<body>` 加新 variable
- globals.css 在 `@import "tailwindcss";` 后、`:root {` 前加 `@theme {` 块（design-notes 提供完整内容）
- 改 `:root --font-sans` 把 Inter 加最前（保留 Geist + CJK fallback）
- 文件末尾加 `@keyframes editorial-reveal` + `[data-reveal]` 规则 + `@media (prefers-reduced-motion: reduce)`

### B 阶段：HeroEditorial 组件

- 文件 `src/components/site/HeroEditorial.tsx`，**RSC**（无 "use client"）
- 骨架完整拷贝 design-notes 的 tsx 示例
- ASCII mockup（design-notes）必读
- 6 个签名元素全部实现（H-1 to H-6）

### C 阶段：motion-a11y

- 大部分动画 CSS 在 §A globals.css 已加
- 本阶段确认 HeroEditorial.tsx 中所有 reveal children 都有 `data-reveal` + `--reveal-delay` style
- 补 test 覆盖（如果 §B 测试未覆盖到 reveal attribute）

### D 阶段：集成

- 改 `src/app/(site)/page.tsx`：删 22-46 行旧 hero，替换为 `<HeroEditorial />`
- 保留其他 section（Tech Stack / Recent Posts / Site Stats）— 待后续 SDD 处理
- 新增 import: `import { HeroEditorial } from "@/components/site/HeroEditorial"`
- 测试 `src/app/(site)/page.test.tsx` 加 regression 测试：HeroEditorial 渲染 + Recent Posts/Stats 不破

### Commit message 格式

```
test(site-home): SPEC-HE-T-1..3 typography system tokens and font loading

Adds:
- src/app/globals.test.ts — node tests verifying @theme block + tokens + reveal CSS
- src/app/layout.test.tsx (or grep variant) — verifies next/font imports
RED at this commit: globals.css has no @theme block + layout.tsx no Source_Serif_4/Inter import.
```

```
feat(site-home): SPEC-HE-T-1..3 Editorial typography system

- Load Source Serif 4 + Inter via next/font/google (Latin subset, display swap)
- Add @theme block to globals.css with clamp-based text/space/tracking/leading/motion tokens
- Remap --font-sans to prefer Inter while preserving Geist + CJK fallback
- Add @keyframes editorial-reveal + [data-reveal] CSS for reveal motion
- Add prefers-reduced-motion media query disabling reveal

Tests: <new+passed> (was <baseline>, +<n> net).
```

## 禁止事项

| 禁止 | 为什么 |
|------|-------|
| 装 Framer Motion / GSAP | CSS-only locked (R2) |
| 抽 `<IssueLabel>` / `<Dateline>` / `<RuleLine>` primitives | YAGNI (R3) |
| 改 admin 路径字体（如硬绑 Geist） | 不在范围；如实测发现回归，记 design-notes follow-up |
| 改 schema / API / service | 范围外 |
| 删除 Geist 字体（layout.tsx） | 保留作 fallback (R6) |
| 改 globals.css 现有 :root token（除 --font-sans） | 不破坏现有 theme |
| 用硬编码颜色（#fff / bg-red-500） | CLAUDE.md 主题变量规则 |
| 在 hero 用 `<img>` 而不 explicit dimensions | CLS 风险 |
| 改 .husky/commit-msg 绕过 hook | 违规 |
| 跑 `/project:finish-feature` | 审计 AI 做 |
| `--no-verify` | 违反 |

## Manual smoke checklist (E.3 阶段)

dev server 跑起来 (`pnpm dev`)，访问 http://localhost:3000：

- [ ] Hero h1 是 Source Serif 4（serif 字体）— 视觉确认
- [ ] Hero h1 字号在桌面 lg+ 上**足够大**（接近 6-9rem）
- [ ] Aside 显示 hairline label + dateline + rule line + marginalia
- [ ] CTA 按钮显示 `Read Blog →` / `About →`
- [ ] Mobile (chrome devtools 切 iPhone) — 堆叠不破版
- [ ] Tablet (768px) — 过渡平滑
- [ ] DevTools Rendering panel → emulate prefers-reduced-motion: reduce → 刷新 → 动画消失，内容仍可见
- [ ] 暗色模式切换（DevTools 或系统）— hero 可读
- [ ] Recent Posts 区块仍渲染 3 篇文章
- [ ] Site Stats 仍渲染数字

## 完成后输出

写 `.claude/sdd/hero-editorial/completion-report.md`：

```markdown
# Completion Report — hero-editorial

## Commits
- <hash> test(site-home): SPEC-HE-T-1..3 ...
- <hash> feat(site-home): SPEC-HE-T-1..3 ...
- <hash> test(site-home): SPEC-HE-H-1..6 ...
- <hash> feat(site-home): SPEC-HE-H-1..6 ...
- <hash> test(site-home): SPEC-HE-D-1 ...
- <hash> feat(site-home): SPEC-HE-D-1 ...
- (optional) <hash> test/feat for SPEC-HE-M

## Test counts
- Before: <baseline>
- After: <after>
- +<n> net (typography 7 + hero 6 + motion 2 + integration 2 ≈ 17 if fully covered)

## TypeCheck/Lint/Test/Build
All ✓

## Manual smoke (E.3)
All ✓ (or list issues)

## Anti-template checklist
8/8 ✓

## Outstanding concerns
- Playwright gap: visual regression unresolved (deferred per design-notes)
- Admin font regression: <none observed / list>
- Dark mode: <ok / issues>
```

## TL;DR

```
读 11 个 context 文件 + design-notes ASCII mockup →
§A typography (TEST-RED → IMPL-GREEN, 2 commits scope site-home) →
§B hero-component (TEST-RED → IMPL-GREEN, 2 commits) →
§C motion-a11y (if needed) →
§D page integration (TEST-RED → IMPL-GREEN, 2 commits) →
§E 验收（test/typecheck/lint/build + manual smoke checklist）→
写 completion-report.md → 停。
```

收工。
