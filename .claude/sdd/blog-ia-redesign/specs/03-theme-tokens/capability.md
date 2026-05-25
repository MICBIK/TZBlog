# Spec 03 · Theme Tokens

> 三套主题 token + 路由级硬映射 + shadcn 兼容 + 字体按 layout 加载。
>
> Reference: `theme-token-strategy.md` 全文

---

## Specs

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| theme-001 | 根 layout | 渲染 | `<html data-theme="aurora">` |
| theme-002 | `/posts/<slug>` 路由 | 渲染 | DOM 中最近 wrapper 含 `data-theme="ink"` |
| theme-003 | Channel kind=STREAM | 调 `resolveChannelTheme` | 返回 `'terminal'` |
| theme-004 | Channel kind=ARTICLES + layout=CHRONICLE | 调 `resolveChannelTheme` | 返回 `'aurora'` |
| theme-005 | Entry kind=ARTICLE 在 STREAM channel | 调 `resolveEntryTheme(entry, channel)` | 返回 `'ink'`（entry kind 覆盖 channel） |
| theme-006 | shadcn Button 在 aurora theme | 渲染 | `--color-background` 解析为 aurora 的 `--bg` |
| theme-007 | shadcn Button 在 terminal theme | 渲染 | 实际 border-radius 为 0（被覆盖） |
| theme-008 | `prefers-reduced-motion: reduce` | aurora hero | 极光动画停止 |
| theme-009 | font-prose | 在 aurora theme | 解析为 Inter Variable |
| theme-010 | font-prose | 在 ink theme | 解析为 Noto Serif SC |
| theme-011 | font-mono | 在 terminal theme | 解析为 JetBrains Mono |
| theme-012 | 三个主题切换（DOM swap data-theme） | 测量 contrast | 全部 AA 4.5:1 |
| theme-013 | grep `Channel.theme` 字段 | 在 schema | 0 命中（field 不存在） |
| theme-014 | grep "theme switcher" / "切换主题" | 在 src/ | 0 命中（无前台切换器） |

---

## Test File

- `src/lib/theme/resolveTheme.test.ts` → 003 ~ 005
- `src/components/theme/ThemeProvider.test.tsx` → 001 / 002
- `src/components/theme/shadcn-integration.test.tsx` → 006 / 007
- `src/__tests__/theme-guards.test.ts` → 013 / 014（grep guard）
- `e2e/theme-contrast.spec.ts` → 012（Playwright）

---

## Acceptance

- [ ] 14 spec 全 pass
- [ ] 三皮 screenshot 对比 demo-front/demos/ 视觉 ≥ 90% 还原（人工 review）

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
