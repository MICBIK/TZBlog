# Spec 04 · Public Shell

> 公开端 site shell：SiteHeader / SiteFooter / Aurora 极光层 / Navigation by enabled Channels。
>
> Reference: `theme-token-strategy.md` §4 / `channel-meta-cms.md` §5 / `demo-front/directions/01-aurora-portal.md`

---

## Specs

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| shell-001 | SiteHeader | 渲染 | 含 brand 名 + 主导航 + 主题切换图标（仅 admin 主题，前台 hidden） |
| shell-002 | SiteHeader nav | 渲染 | 动态读 `SELECT FROM channels WHERE enabled=true ORDER BY order ASC`，渲染对应 `<Link href="/c/<slug>">` |
| shell-003 | SiteHeader nav | enabled channel 包含 GUESTBOOK | 渲染额外 `<Link href="/guestbook">` 入口（不通过 /c/ 路径） |
| shell-004 | SiteHeader nav | 固定项 | 含 `/about` 链接（始终最末位） |
| shell-005 | SiteFooter | 渲染 | 含 colophon (站点描述 + 作者 + 版权 + RSS 链接) |
| shell-006 | 任意 (site) page | 加载 | SiteHeader + main + SiteFooter 三段式 |
| shell-007 | Aurora hero on `/` | 渲染 | `data-hero="true"` 触发 `::before` 极光层 |
| shell-008 | `/posts/[slug]` | 渲染 | Ink 主题，**无** 极光层 |
| shell-009 | mobile viewport (375px) | SiteHeader | 折叠成汉堡菜单 |
| shell-010 | `prefers-reduced-motion: reduce` | aurora hero | 极光不动 |

---

## Test File

- `src/components/site/SiteHeader.test.tsx`
- `src/components/site/SiteFooter.test.tsx`
- `src/app/(site)/layout.test.tsx`

---

## Acceptance

- [ ] 10 spec 全 pass
- [ ] 加新 Channel + enabled=true → 前台自动出现 nav 项（验证元模型动态性）

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
