# Proposal — about-page

> Stage: Pre-deploy P2 cleanup
> Created: 2026-05-22
> Path: `.claude/sdd/about-page/`
> Tier: T2 / 0.5 day
> 视觉方向：Editorial（继承 hero-editorial 基线）

## Why

`/about` 当前只有 "Coming soon" stub。Editorial blog 必须有一个有内容、有人格、值得品读的 About 页：
- 谁是 ha1den
- 在写什么 / 在做什么
- 怎么联系
- Now（最近在 ship 什么）

不修这层：访客看到 "Coming soon" → 体感是半成品博客。

## What

单页面 `/about`，分 4 段（Hero / Now / Story / Contact），全部 Editorial 排版。

### Capability: page
- 改 `src/app/(site)/about/page.tsx`
- async RSC（未来可接 GitHub data；MVP 静态）
- 渲染 4 段

### Capability: section components
- 新建 `src/components/site/about/`
  - `AboutHero.tsx`（serif 大字 + lead）
  - `AboutNow.tsx`（最近聚焦 / lists）
  - `AboutStory.tsx`（长 prose）
  - `AboutContact.tsx`（邮箱 / GitHub / mastodon 等）

### Capability: content
- 新建 `src/lib/content/about.ts`
- 导出 placeholder 文案（ha1den 上线前替换）
- 用 const 对象，类型化：
  ```ts
  export const aboutContent = {
    hero: { headline, lead },
    now: { intro, items: [...] },
    story: { paragraphs: [...] },
    contact: { email, links: [...] }
  } as const
  ```

### 不在范围
- 多语言（V2）
- 头像/照片（可后加 `<img>`）
- 时间线 timeline 组件
- now.txt 协议远程拉取
- DB 存储 about（静态足够）
- mailto obfuscation（mailto:）

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | 静态 vs DB / CMS | **静态 ts 文件** | About 改动低频，DB 过度设计 |
| R2 | 单一长 page vs 多段 components | **多段 components** | 可独立测试，可独立替换 |
| R3 | placeholder 内容方式 | **明显 placeholder 文案 + warning 注释** | ha1den 上线前必须替换 |
| R4 | "Now" section 数据源 | **同样静态** | MVP；future 可接 GitHub events |
| R5 | Contact 链接：mailto vs form | **mailto + 外链** | 无后端表单流程；mailto + GitHub/X 链接足够 |
| R6 | metadata SEO | **next.metadata export** | description + openGraph |
| R7 | 多 component 是否抽 `AboutSection` 共用 | **不抽** | 各 section 结构差异大，重复 3-4 行 padding 可接受 |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| content | `specs/content/spec.md` | SPEC-AB-D-1..3 |
| sections | `specs/sections/spec.md` | SPEC-AB-S-1..4 |
| page | `specs/page/spec.md` | SPEC-AB-P-1..3 |

## Impact

- 新增：
  - `src/lib/content/about.ts` + `.test.ts`
  - `src/components/site/about/AboutHero.tsx` + `.test.tsx`
  - `src/components/site/about/AboutNow.tsx` + `.test.tsx`
  - `src/components/site/about/AboutStory.tsx` + `.test.tsx`
  - `src/components/site/about/AboutContact.tsx` + `.test.tsx`
- 修改：
  - `src/app/(site)/about/page.tsx`（完整重写）
- 依赖：无新装

## Workflow

1. SDD 7 件套
2. **§A content**: 3 spec → 1 TDD pair
3. **§B sections × 4**: 每个 component 1 spec → 4 个 TDD pair（可合并 commit）
4. **§C page**: 3 spec → 1 TDD pair（接入）
5. 质量门 + completion-report

## Risks

| 风险 | 缓解 |
|------|------|
| ha1den 忘改 placeholder | content/about.ts 顶端加 `// TODO: replace before launch` 注释 + handoff 提醒 |
| About 太长影响 mobile | section spacing + max-w 控制（Editorial baseline） |
| Contact 邮箱被爬虫 | mailto + 不在文本明文显示 `@` (但 MVP 不强求) |
| metadata 重复 site title | `title: "About"` template merges with site default |
