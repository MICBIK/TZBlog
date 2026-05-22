# Handoff — about-page

> 你（接收 AI）正在执行 TZBlog 的 about-page SDD。预计 0.5 天。

## 30 秒概览

`/about` 当前只有 "Coming soon" stub。要重建为 Editorial 风的 4 段 About 页（Hero / Now / Story / Contact），内容静态 ts 文件 placeholder。

## 阅读顺序

1. master.md / handoff-guide.md / design-system.md / known-findings.md
2. `.claude/sdd/about-page/proposal.md`
3. `.claude/sdd/about-page/specs/{content,sections,page}/spec.md`
4. `.claude/sdd/about-page/test-map.md`
5. `.claude/sdd/about-page/design-notes.md` — 含 ASCII + placeholder 完整内容 + section skeleton
6. `.claude/sdd/about-page/tasks.md`

## 依赖

- hero-editorial（CSS tokens 如 `--text-hero` / `--text-h1` / `--text-lead` / `--space-section`）

## 执行总览

```
§A content (scope about-content)
§B sections (4 个 component，4 个 TDD pair，scope 各自)
§C page (scope about-page)
```

10 commits 左右。

## 关键约束

- **静态 ts 文件** 存内容（R1）
- **不抽 `<AboutSection>` wrapper** (R7) — 各 section 自己组织
- **content/about.ts 必须有 `// TODO[pre-launch]:` 警告**
- **first story paragraph 必须以 "Placeholder:" 开头** 便于 grep 检查

## Editorial 风

- 每 section hairline label + rule line + h2
- serif body, mono label
- AboutHero 不加 keyframe motion（区别于 HomeHero）
- 4 段间用 `--space-section`

## ha1den 上线前提醒

completion-report 高亮：
> ⚠️ Pre-launch ACTION REQUIRED: edit `src/lib/content/about.ts` and replace all "Placeholder:" strings.

## 禁止事项

| 禁止 | 为什么 |
|------|-------|
| 接 DB / CMS 存 about | R1 静态够 |
| 加头像 portrait | MVP 不要 |
| i18n / 多语言 | V2 |
| 删 placeholder 警告注释 | ha1den 需要可见提醒 |
| 改 layout.tsx | About 用 layout 已有 main wrapper |
| `--no-verify` | 违反 |

## TL;DR

```
读 SDD → §A content RED+GREEN → §B 4 sections RED+GREEN ×4 → §C page RED+GREEN → 全套质量门 → completion-report (with placeholder warning) → 停。
```

收工。
