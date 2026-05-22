# tasks.md — hero-editorial

> 微循环结构：1 spec = 1 micro-cycle (TEST-RED + IMPL-GREEN pair)，可酌情合并相关 spec
> 阶段前缀 `[HE]`
> commit scope 约定：`site-home`
> Reference: `src/components/admin/comments/CommentsTable.tsx` 等已有 jsdom 测试模式

## §0 准备

- [ ] §0.1 阅读 context：
  - `.claude/sdd/handoff-pre-deploy/master.md`
  - `.claude/sdd/handoff-pre-deploy/handoff-guide.md`
  - `.claude/sdd/handoff-pre-deploy/design-system.md`（**critical**）
  - `.claude/sdd/handoff-pre-deploy/known-findings.md`（hero-editorial 段）
  - `.claude/sdd/hero-editorial/proposal.md`
  - `.claude/sdd/hero-editorial/specs/*/spec.md`
  - `.claude/sdd/hero-editorial/test-map.md`
  - `.claude/sdd/hero-editorial/design-notes.md`（**ASCII mockup + locked decisions**）

- [ ] §0.2 现状摸底：
  - `src/app/layout.tsx`（现有 Geist 字体配置）
  - `src/app/globals.css`（现有 :root 块 + Tailwind v4 配置）
  - `src/app/(site)/page.tsx`（现有 hero 22-46 行）
  - `src/app/(site)/page.test.tsx`（验证 RSC 测试模式）
  - `package.json`（确认 next/font 内置 + 无 Playwright）
  - `vitest.config.ts`（node + jsdom 双 environment）

## §A [HE] typography-system（all 3 spec 一个微循环）

### A.1 [SPEC-HE-T-1..3] Editorial typography 接入

#### A.1.a [TEST-RED] 写测试

- [ ] A.1.a.1 新建 `src/app/globals.test.ts`（node env），按 test-map 模板，含：
  - 测试 1: globals.css 含 `@theme {`
  - 测试 2: globals.css 含 `--font-serif:` 定义
  - 测试 3: globals.css 含 `--text-hero: clamp(`
  - 测试 4: globals.css 含 `--space-section: clamp(`
  - 测试 5: globals.css 含 `--ease-out-expo:`
  - 测试 6: globals.css 含 `@media (prefers-reduced-motion: reduce)` + `[data-reveal]` 规则
  - 测试 7: globals.css `--font-sans:` 含 `var(--font-inter)`
- [ ] A.1.a.2 新建 `src/components/site/HeroEditorial.test.tsx`（jsdom），含：
  - 测试: HeroEditorial 不存在 → import 报错（先确认 RED）
  - **跳过此项**——先用其他测试驱动 RED
- [ ] A.1.a.3 新建 `src/app/layout.test.tsx`（jsdom，**可选** —— 若 layout 测试难写，可改 grep 测试 layout.tsx 源文件）：
  - 测试: layout.tsx 源代码含 `import { Source_Serif_4 } from "next/font/google"`
  - 测试: layout.tsx 源代码含 `import { Inter } from "next/font/google"`
- [ ] A.1.a.4 跑 `pnpm vitest run src/app/globals.test.ts`
- [ ] A.1.a.5 **必须看到** 全部测试 FAIL（globals.css 现在没有 @theme / Inter / clamp 等）
- [ ] A.1.a.6 粘 FAIL 输出
- [ ] A.1.a.7 `git add` 测试文件 + commit:
  ```
  test(site-home): SPEC-HE-T-1..3 typography system tokens and font loading
  ```

#### A.1.b [IMPL-GREEN] 写实现

- [ ] A.1.b.1 改 `src/app/layout.tsx`：
  - 新增 import:
    ```ts
    import { Source_Serif_4 } from "next/font/google"
    import { Inter } from "next/font/google"
    ```
  - 新增字体实例:
    ```ts
    const sourceSerif = Source_Serif_4({
      subsets: ["latin"],
      variable: "--font-source-serif",
      display: "swap",
    })

    const inter = Inter({
      subsets: ["latin"],
      variable: "--font-inter",
      display: "swap",
    })
    ```
  - className chain 在 `<html>` 或 `<body>` 上加 `${sourceSerif.variable} ${inter.variable}`（保留现有 Geist）
- [ ] A.1.b.2 改 `src/app/globals.css`：
  - 在 `@import "tailwindcss";` 之后、`:root {` 之前新增 `@theme` 块（按 design-notes 模板）
  - 修改 `:root --font-sans` 把 `var(--font-inter)` 加在最前面
  - 在文件末尾追加 `@keyframes editorial-reveal` + `[data-reveal]` 规则 + `@media (prefers-reduced-motion: reduce)` 规则
- [ ] A.1.b.3 跑 `pnpm vitest run src/app/globals.test.ts` — 看 PASS
- [ ] A.1.b.4 跑 `pnpm typecheck` — 全绿
- [ ] A.1.b.5 跑 `pnpm lint` — 全绿
- [ ] A.1.b.6 粘 PASS 输出
- [ ] A.1.b.7 commit:
  ```
  feat(site-home): SPEC-HE-T-1..3 Editorial typography system

  - Load Source Serif 4 + Inter via next/font/google (Latin subset, display swap)
  - Add @theme block to globals.css with clamp-based text/space/tracking/leading/motion tokens
  - Remap --font-sans to prefer Inter while preserving Geist + CJK fallback
  - Add @keyframes editorial-reveal + [data-reveal] CSS for reveal motion
  - Add prefers-reduced-motion media query disabling reveal
  ```

## §B [HE] hero-component

### B.1 [SPEC-HE-H-1..6] HeroEditorial 全套渲染

#### B.1.a [TEST-RED] 写 `src/components/site/HeroEditorial.test.tsx`

- [ ] B.1.a.1 写所有 6 个测试（H-1 to H-6）按 spec 验收条件
  - 测试模式参考 design-notes 的 mockup + test-map 模板
- [ ] B.1.a.2 跑 `pnpm vitest run src/components/site/HeroEditorial.test.tsx`
- [ ] B.1.a.3 **必须看到** 全部 FAIL（HeroEditorial.tsx 不存在）
- [ ] B.1.a.4 粘 FAIL 输出
- [ ] B.1.a.5 commit:
  ```
  test(site-home): SPEC-HE-H-1..6 HeroEditorial rendering + asymmetric grid + signature elements
  ```

#### B.1.b [IMPL-GREEN] 新建 `src/components/site/HeroEditorial.tsx`

- [ ] B.1.b.1 RSC（默认）写 HeroEditorial：
  - 按 design-notes 的 ASCII mockup 实现
  - 6 个签名元素：hero h1 + 2 CTA + hairline label + dateline + rule line + numbered marginalia
  - `lg:grid-cols-[7fr_5fr]` 不对称布局
  - 用 `font-serif` / `font-sans` / Tailwind v4 var classes
  - 每个 reveal child 加 `data-reveal` + inline style `--reveal-delay`
- [ ] B.1.b.2 跑 `pnpm vitest run src/components/site/HeroEditorial.test.tsx` — 看 PASS
- [ ] B.1.b.3 跑 `pnpm typecheck && pnpm lint` 全绿
- [ ] B.1.b.4 commit:
  ```
  feat(site-home): SPEC-HE-H-1..6 HeroEditorial component with asymmetric grid + signature elements
  ```

## §C [HE] motion-a11y

### C.1 [SPEC-HE-M-1..2] motion + reduce-motion 接入

> 大部分动画 CSS 已在 §A 阶段加到 globals.css。本阶段补：
> - HeroEditorial.tsx 中 data-reveal + delay 的实际应用（如果 §B 已含，归并 §C）
> - 额外测试覆盖

#### C.1.a [TEST-RED] 补测试

- [ ] C.1.a.1 在 `HeroEditorial.test.tsx` 加 SPEC-HE-M-1 测试：每个 reveal 子元素有 `data-reveal` attribute + inline style 含 `--reveal-delay`
- [ ] C.1.a.2 在 `src/app/globals.test.ts` 加 SPEC-HE-M-2 测试：globals.css 含 `@media (prefers-reduced-motion: reduce)` 且块内含 `animation: none`（其实 SPEC-HE-T-2 已覆盖，可合并）
- [ ] C.1.a.3 跑测试，看新增 spec FAIL（若 §B impl 已经满足，则可跳过此微循环；若没满足，FAIL）
- [ ] C.1.a.4 commit (if needed):
  ```
  test(site-home): SPEC-HE-M-1..2 reveal animation data attributes + reduce-motion guard
  ```

#### C.1.b [IMPL-GREEN] 完善

- [ ] C.1.b.1 确认 HeroEditorial.tsx 的 reveal children 都有 data-reveal + delay
- [ ] C.1.b.2 跑测试 PASS
- [ ] C.1.b.3 commit (if needed):
  ```
  feat(site-home): SPEC-HE-M-1..2 stagger reveal + reduce-motion
  ```

## §D 集成

### D.1 page.tsx 替换 hero

- [ ] D.1.a [TEST-RED] 在 `src/app/(site)/page.test.tsx` 加测试：
  - 测试: homepage renders HeroEditorial (查 className 或 testid 或 hero text)
  - 测试: existing Recent Posts + Site Stats 仍渲染（regression guard）
- [ ] D.1.a 跑测试，看新 spec FAIL
- [ ] D.1.a commit: `test(site-home): SPEC-HE-D-1 page integrates HeroEditorial`
- [ ] D.1.b [IMPL-GREEN] 改 `src/app/(site)/page.tsx`：
  - 删 22-46 行的旧 hero `<section>`
  - 在该位置 import + render `<HeroEditorial />`
  - 保留 Tech Stack (待 tech-stack-section SDD 替换)、Recent Posts、Site Stats
- [ ] D.1.b 跑测试 PASS + 跑 `pnpm test` 全套 + `pnpm build` 全绿
- [ ] D.1.b commit: `feat(site-home): SPEC-HE-D-1 wire HeroEditorial into homepage`

## §E 验收

- [ ] E.1 全套测试：`pnpm test`
- [ ] E.2 typecheck + lint + build
- [ ] E.3 dev server 跑起来 manual smoke：
  - 访问 / 看 hero 视觉（serif h1 / 不对称 grid / signature elements）
  - 浏览器 DevTools 模拟 prefers-reduced-motion: reduce，确认动画禁
  - mobile size 切换确认堆叠正确
  - 暗色模式切确认 Editorial 可读
- [ ] E.4 git log 复核 commits
- [ ] E.5 写 completion-report.md

## §F 不归档

- [ ] F.1 **不** archive
- [ ] F.2 **不** /project:finish-feature
- [ ] F.3 **不** 修改 memory-bank
