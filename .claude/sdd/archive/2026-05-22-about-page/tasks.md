# tasks.md — about-page

> 阶段前缀 `[AB]`
> commit scopes: `about-content` / `about-hero` / `about-now` / `about-story` / `about-contact` / `about-page`

## §0 准备

- [ ] 读 SDD 全套 + master / handoff-guide / design-system / known-findings
- [ ] inspect: 现有 `src/app/(site)/about/page.tsx` (是 stub)
- [ ] inspect: hero-editorial 完成后的 CSS tokens（如 --text-hero, --space-section）

## §A [AB] content (SPEC-AB-D-1..3)

### A.1 [TEST-RED]
- 新建 `src/lib/content/about.test.ts`
- 跑 → FAIL
- commit: `test(about-content): SPEC-AB-D-1..3 aboutContent shape + placeholder warning`

### A.1 [IMPL-GREEN]
- 新建 `src/lib/content/about.ts`：
  - 顶端 `// TODO[pre-launch]: replace placeholder ...` comment
  - 导出 `aboutContent` 满足 SPEC-AB-D-1 类型
  - 用 "Placeholder:" 前缀 in first story paragraph
- 跑 → PASS
- commit: `feat(about-content): SPEC-AB-D-1..3 static aboutContent with pre-launch placeholder`

## §B [AB] sections (SPEC-AB-S-1..4)

### B.1 AboutHero [TEST-RED]
- 新建 `src/components/site/about/AboutHero.test.tsx`
- 跑 → FAIL
- commit: `test(about-hero): SPEC-AB-S-1 hero section`

### B.1 [IMPL-GREEN]
- 新建 `src/components/site/about/AboutHero.tsx`
- 跑 → PASS
- commit: `feat(about-hero): SPEC-AB-S-1 AboutHero with hairline + serif headline + lead`

### B.2 AboutNow [TEST-RED + IMPL-GREEN]
- test → `test(about-now): SPEC-AB-S-2 intro + items list`
- impl → `feat(about-now): SPEC-AB-S-2 AboutNow definition list`

### B.3 AboutStory [TEST-RED + IMPL-GREEN]
- test → `test(about-story): SPEC-AB-S-3 prose paragraphs`
- impl → `feat(about-story): SPEC-AB-S-3 AboutStory readable measure`

### B.4 AboutContact [TEST-RED + IMPL-GREEN]
- test → `test(about-contact): SPEC-AB-S-4 mailto + external links`
- impl → `feat(about-contact): SPEC-AB-S-4 AboutContact links list`

## §C [AB] page (SPEC-AB-P-1..3)

### C.1 [TEST-RED]
- 改 `src/app/(site)/about/page.tsx` 旁的 `page.test.tsx`（新建）
- 跑 → FAIL
- commit: `test(about-page): SPEC-AB-P-1..3 page composition + metadata + headings`

### C.1 [IMPL-GREEN]
- 改 `src/app/(site)/about/page.tsx` 重写：
  - import 4 sections + aboutContent
  - export metadata
  - 渲染 4 段 + space-section
- 跑 → PASS, full pnpm test
- commit: `feat(about-page): SPEC-AB-P-1..3 rebuild About page with Editorial sections`

## §D 验收

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] dev server manual smoke：访问 /about 看 4 段渲染、style 正确、链接 work
- [ ] completion-report.md，**high-light "ha1den must replace placeholder before launch"**

## §E 不归档
