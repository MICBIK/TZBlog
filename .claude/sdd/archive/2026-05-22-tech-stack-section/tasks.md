# tasks.md — tech-stack-section

> 阶段前缀 `[TS]`
> commit scope 约定：`site-home`
> 依赖：hero-editorial 完成（Editorial token 已在 globals.css）

## §0 准备

- [ ] §0.1 阅读 context（master / handoff-guide / design-system / known-findings / proposal / specs / test-map / design-notes）
- [ ] §0.2 inspect 现状：
  - `src/app/(site)/page.tsx`（line 9-16 techStack const + line 46-61 旧 section）
  - `src/app/(site)/page.test.tsx`（现有测试）
- [ ] §0.3 确认 hero-editorial 阶段已完成（globals.css 含 @theme block）

## §A [TS] component

### A.1 [SPEC-TS-C-1..5] TechStack 组件

#### A.1.a [TEST-RED] 写 `src/components/site/TechStack.test.tsx`

- [ ] A.1.a.1 写 5 个 it() 覆盖 SPEC-TS-C-1..5（test-map 提供模板）
- [ ] A.1.a.2 跑 `pnpm vitest run src/components/site/TechStack.test.tsx`
- [ ] A.1.a.3 **必须看到** FAIL（TechStack 不存在）
- [ ] A.1.a.4 commit: `test(site-home): SPEC-TS-C-1..5 TechStack rendering`

#### A.1.b [IMPL-GREEN] 新建 `src/components/site/TechStack.tsx`

- [ ] A.1.b.1 实现 RSC 组件，按 design-notes 的代码骨架：
  - 定义 `interface TechItem { name: string; note?: string }`
  - 定义 `interface TechCategory { label: string; items: TechItem[] }`
  - 定义 `const techStack: TechCategory[] = [...]`（5 类目，按 design-notes 锁定数据）
  - 返回 JSX：5 个 `<section aria-labelledby="ts-<label>">` 含 h3 label + 子 grid
- [ ] A.1.b.2 跑测试 PASS
- [ ] A.1.b.3 typecheck + lint 全绿
- [ ] A.1.b.4 commit: `feat(site-home): SPEC-TS-C-1..5 TechStack component with Editorial categorized layout`

## §B [TS] integration

### B.1 [SPEC-TS-I-1..2] page.tsx 替换

#### B.1.a [TEST-RED]

- [ ] B.1.a.1 新建 `src/app/(site)/page.integration.test.ts`（node env）按 test-map 模板
- [ ] B.1.a.2 在 `src/app/(site)/page.test.tsx` 加新测试：renders TechStack + 老 terminal 消失
- [ ] B.1.a.3 跑 `pnpm vitest run` 这两个 test 文件 — 看 FAIL
- [ ] B.1.a.4 commit: `test(site-home): SPEC-TS-I-1..2 homepage integrates TechStack and drops terminal`

#### B.1.b [IMPL-GREEN]

- [ ] B.1.b.1 改 `src/app/(site)/page.tsx`:
  - 删 line 9-16 `const techStack = [...]`
  - 删 line 46-61 旧 Tech Stack `<section>` 块（包括注释 `{/* Tech Stack */}`）
  - 加 `import { TechStack } from "@/components/site/TechStack"`
  - 在 hero 后插入 `<TechStack />`
- [ ] B.1.b.2 跑测试 PASS
- [ ] B.1.b.3 跑全套 `pnpm test` 验证 page.test 其他测试不破
- [ ] B.1.b.4 typecheck + lint + build 全绿
- [ ] B.1.b.5 commit: `feat(site-home): SPEC-TS-I-1..2 wire TechStack into homepage, drop terminal section`

## §C 验收

- [ ] C.1 全套 test / typecheck / lint / build
- [ ] C.2 dev server manual smoke：
  - 首页 hero 后能看到 TechStack section
  - 5 类目 + 各 item 视觉协调（与 hero-editorial Editorial 风一致）
  - 响应式：mobile 单列 / tablet 双列 / desktop 三列
  - 无终端 `$ whoami` 残留
- [ ] C.3 git log 复核 4 commits
- [ ] C.4 写 completion-report.md

## §D 不归档
