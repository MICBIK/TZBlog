# Theme Token Strategy — Aurora · Ink · Terminal 三主题路由级硬映射

> 决策来源：D6（路由级硬映射，无前台切换器） + D12（具体映射规则） + Q10（Channel.theme 字段不存在） + A4（详细映射表）。
>
> 三皮 token 来源：`demo-front/directions/01-aurora-portal.md`、`05-ink-garden.md`、`03-terminal-workshop.md`。

---

## 1. 设计哲学

### 1.1 三主题不是"换色"，是"换语境"

| 主题 | 内容定位 | 视觉语境 |
|------|---------|---------|
| Aurora Portal | 身份门户 / 总览 / 关于 / 留言板 / 标签聚合 | 玻璃 + 极光 + 暖色光场 + 衬线 display + 软圆角（14px） |
| Ink Garden | 长文阅读（ARTICLE kind） | 米纸 + 墨黛 + 朱砂落款 + 衬线（Noto Serif SC）+ 极小圆角（2px）|
| Terminal Workshop | 技术 stream / 链接收藏 / 笔记 grep | 黑底 + 荧光绿 + 等宽（JetBrains Mono）+ 0 圆角 + CRT 扫描线 |

**关键约束**：
- 用户**不能切换**主题（D6）
- Channel.theme 字段**不存在**（Q10）
- 主题由**路由路径 + Channel.kind/layout 推论**（D12 / A4）
- 不允许组件内引用 layer-2 token（如 `var(--aurora-1)`），只引 layer-1（如 `var(--bg)`）

### 1.2 Tailwind v4 `@theme inline` 的作用（关键）

Tailwind v4 默认会在 build 时把 `@theme` 块内的 CSS 变量定型——这会让运行时切主题失效。**`@theme inline` 关键字**强制 Tailwind 把 token 暴露为 `var(...)` 引用而不是字面值，这是路由级切换零重编译的核心。

```css
/* ❌ 错（build 时定型）*/
@theme {
  --color-bg: hsl(var(--bg));
}

/* ✅ 对（运行时跟随 [data-theme]）*/
@theme inline {
  --color-bg: hsl(var(--bg));
  --color-fg: hsl(var(--fg));
}
```

证据：项目现 `src/app/globals.css` 第 229-265 行已经在用这个模式（[未验证] 需要 codex 实测确认行号，但模式正确）。

---

## 2. Token 命名约定（三层）

### Layer 1 · Semantic Tokens（组件唯一允许引用）

```
--bg          页面底色
--bg-elev     卡片 / 弹出层底色
--fg          主文色
--fg-muted    副文色
--accent      强调色（按主题映射到 layer-2）
--accent-fg   强调色之上的文字色
--border      边框色
--border-muted 极淡边框
--ring        focus ring 色
--muted       静默背景（如 hover 灰）
--muted-fg    静默背景之上的文字
--card        卡片背景
--card-fg     卡片文字
--popover     弹出层
--popover-fg  弹出层文字
--destructive 危险色（删除按钮）
--destructive-fg
--success     成功色
--warning     警告色
```

### Layer 2 · Theme-Specific Tokens（仅在主题定义内部引用）

```
/* Aurora */
--aurora-1, --aurora-2, --aurora-3  极光层渐变色
--aurora-glow                       泛光色
--aurora-glass-stroke               玻璃描边

/* Ink */
--ink-paper, --ink-paper-deep       米纸 / 投影
--ink-vermilion                     朱砂强调
--ink-gold                          暗金
--ink-seal-stroke                   印章描边

/* Terminal */
--term-phosphor                     荧光磷绿
--term-amber                        琥珀次色
--term-crimson                      红色错误
--term-comment                      注释灰
--term-rule                         分隔线
```

### Layer 3 · Tailwind Aliases（兼容 shadcn）

```
--color-background  → hsl(var(--bg))
--color-foreground  → hsl(var(--fg))
--color-card        → hsl(var(--card))
--color-card-foreground → hsl(var(--card-fg))
...
```

shadcn/ui 默认引用 `--color-background` 命名。我们写双写 alias 让 shadcn 组件不用改一行代码。

---

## 3. 完整 `globals.css` 草案

`src/styles/globals.css`：

```css
@import "tailwindcss";

/* ============================================================
   Layer 1 + Layer 2: Default theme = Aurora
   ============================================================ */
:root,
[data-theme="aurora"] {
  /* Layer 1 semantic (HSL channel for opacity ops) */
  --bg:           240 30% 98%;        /* near ivory */
  --bg-elev:      240 25% 96%;
  --fg:           250 30% 12%;
  --fg-muted:     250 15% 42%;
  --muted:        240 20% 94%;
  --muted-fg:     250 12% 48%;
  --card:         0 0% 100%;
  --card-fg:      var(--fg);
  --popover:      0 0% 100%;
  --popover-fg:   var(--fg);
  --accent:       30 85% 60%;          /* sunrise tangerine */
  --accent-fg:    0 0% 100%;
  --border:       240 14% 88%;
  --border-muted: 240 10% 92%;
  --ring:         30 85% 60%;
  --destructive:  0 75% 50%;
  --destructive-fg: 0 0% 100%;
  --success:      150 60% 40%;
  --warning:      40 90% 50%;

  /* Layer 2 Aurora-specific */
  --aurora-1:     45 78% 75%;
  --aurora-2:     200 75% 80%;
  --aurora-3:     320 70% 78%;
  --aurora-glow:  30 85% 70%;
  --aurora-glass-stroke: 0 0% 100% / 0.15;

  /* Radius / shadow / typography */
  --radius:       14px;
  --radius-sm:    8px;
  --radius-full:  999px;
  --shadow-soft:  0 10px 40px -15px hsl(250 30% 12% / 0.12);
  --shadow-card:  0 4px 24px -8px hsl(250 30% 12% / 0.08);
  --font-display: "Cormorant Garamond", "Source Han Serif SC", Georgia, serif;
  --font-prose:   "Inter", "PingFang SC", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", "Fira Code", monospace;
}

/* ============================================================
   Aurora · dark variant (for guestbook 等情景，路由级触发)
   ============================================================ */
[data-theme="aurora"][data-mode="dark"] {
  --bg:           250 30% 8%;
  --bg-elev:      250 25% 14%;
  --fg:           45 78% 95%;
  --fg-muted:     45 25% 70%;
  --muted:        250 20% 18%;
  --muted-fg:     250 12% 65%;
  --card:         250 25% 14%;
  --card-fg:      var(--fg);
  --popover:      250 25% 14%;
  --popover-fg:   var(--fg);
  --accent:       200 78% 65%;
  --aurora-1:     280 55% 35%;
  --aurora-2:     200 75% 45%;
  --aurora-3:     320 50% 50%;
  --aurora-glow:  200 78% 55%;
  --aurora-glass-stroke: 0 0% 100% / 0.08;
}

/* ============================================================
   Ink Garden 主题（覆盖 layer-1 + layer-2）
   ============================================================ */
[data-theme="ink"] {
  --bg:           45 50% 94%;          /* 米纸 */
  --bg-elev:      45 40% 90%;
  --fg:           250 8% 14%;          /* 墨黛 */
  --fg-muted:     250 5% 38%;
  --muted:        45 25% 88%;
  --muted-fg:     250 5% 45%;
  --card:         45 50% 96%;
  --card-fg:      var(--fg);
  --popover:      45 50% 96%;
  --popover-fg:   var(--fg);
  --accent:       12 75% 45%;          /* 朱砂 */
  --accent-fg:    45 50% 96%;
  --border:       45 20% 82%;
  --border-muted: 45 18% 88%;
  --ring:         12 75% 45%;
  --destructive:  12 75% 45%;
  --destructive-fg: 45 50% 96%;
  --success:      150 30% 35%;
  --warning:      35 60% 45%;

  --ink-paper:    45 50% 94%;
  --ink-paper-deep: 40 30% 86%;
  --ink-vermilion: 12 75% 45%;
  --ink-gold:     45 60% 55%;
  --ink-seal-stroke: 12 75% 45% / 0.4;

  --radius:       2px;
  --radius-sm:    1px;
  --radius-full:  999px;
  --shadow-soft:  0 4px 18px -8px hsl(250 8% 14% / 0.08);
  --shadow-card:  0 2px 8px -4px hsl(250 8% 14% / 0.06);
  --font-display: "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif;
  --font-prose:   "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif;
  --font-mono:    "JetBrains Mono", monospace;
}

/* ============================================================
   Terminal Workshop 主题
   ============================================================ */
[data-theme="terminal"] {
  --bg:           0 0% 4%;
  --bg-elev:      0 0% 7%;
  --fg:           210 8% 80%;
  --fg-muted:     210 8% 55%;
  --muted:        0 0% 10%;
  --muted-fg:     210 8% 60%;
  --card:         0 0% 7%;
  --card-fg:      var(--fg);
  --popover:      0 0% 7%;
  --popover-fg:   var(--fg);
  --accent:       128 100% 60%;        /* 荧光绿 */
  --accent-fg:    0 0% 4%;
  --border:       0 0% 11%;
  --border-muted: 0 0% 9%;
  --ring:         128 100% 60%;
  --destructive:  350 100% 65%;
  --destructive-fg: 0 0% 4%;
  --success:      128 100% 60%;
  --warning:      35 100% 55%;

  --term-phosphor: 128 100% 60%;
  --term-amber:    35 100% 55%;
  --term-crimson:  350 100% 65%;
  --term-comment:  210 8% 35%;
  --term-rule:     0 0% 11%;

  --radius:       0;
  --radius-sm:    0;
  --radius-full:  0;
  --shadow-soft:  0 0 0 1px hsl(128 100% 60% / 0.1);
  --shadow-card:  0 0 0 1px hsl(128 100% 60% / 0.06);
  --font-display: "JetBrains Mono", "Fira Code", monospace;
  --font-prose:   "JetBrains Mono", "Fira Code", monospace;
  --font-mono:    "JetBrains Mono", "Fira Code", monospace;
}

/* ============================================================
   Layer 3 — Tailwind aliases for shadcn compatibility
   ============================================================ */
@theme inline {
  --color-background:       hsl(var(--bg));
  --color-foreground:       hsl(var(--fg));
  --color-bg:               hsl(var(--bg));
  --color-bg-elev:          hsl(var(--bg-elev));
  --color-fg:               hsl(var(--fg));
  --color-fg-muted:         hsl(var(--fg-muted));
  --color-muted:            hsl(var(--muted));
  --color-muted-fg:         hsl(var(--muted-fg));
  --color-muted-foreground: hsl(var(--muted-fg));
  --color-card:             hsl(var(--card));
  --color-card-foreground:  hsl(var(--card-fg));
  --color-popover:          hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-fg));
  --color-accent:           hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-fg));
  --color-border:           hsl(var(--border));
  --color-input:            hsl(var(--border));
  --color-ring:             hsl(var(--ring));
  --color-destructive:      hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-fg));

  --radius:                 var(--radius);
  --font-sans:              var(--font-prose);
  --font-serif:             var(--font-display);
  --font-mono:              var(--font-mono);
}

/* ============================================================
   Reset + base
   ============================================================ */
html, body {
  background: hsl(var(--bg));
  color: hsl(var(--fg));
  font-family: var(--font-prose);
  -webkit-font-smoothing: antialiased;
}

/* Aurora 极光层（仅在 [data-theme="aurora"][data-hero="true"] 上启用） */
[data-theme="aurora"][data-hero="true"]::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(at 20% 30%, hsl(var(--aurora-1) / 0.4), transparent 60%),
    radial-gradient(at 80% 20%, hsl(var(--aurora-2) / 0.35), transparent 60%),
    radial-gradient(at 50% 80%, hsl(var(--aurora-3) / 0.3), transparent 60%);
  filter: blur(40px);
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  [data-theme="aurora"][data-hero="true"]::before {
    animation: aurora-drift 35s ease-in-out infinite alternate;
  }
}

@keyframes aurora-drift {
  0%   { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-3%, 2%) scale(1.05); }
}

/* Ink 米纸纹理 */
[data-theme="ink"] body {
  background-image: url("data:image/svg+xml;base64,...");  /* 极淡 noise SVG */
  background-blend-mode: multiply;
}

/* Terminal 扫描线 */
[data-theme="terminal"] body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 2px,
    hsl(0 0% 0% / 0.04) 2px,
    hsl(0 0% 0% / 0.04) 3px
  );
}

@media (prefers-reduced-motion: reduce) {
  [data-theme="aurora"][data-hero="true"]::before { animation: none; }
}

/* Terminal: 强制 0 圆角覆盖 shadcn (phase 1 妥协) */
[data-theme="terminal"] [class*="rounded-"],
[data-theme="terminal"] [class*="rounded"] {
  border-radius: 0 !important;
}
```

---

## 4. 路由级硬映射（A4 + D12 实现）

### 4.1 映射表

| 路由模式 | `data-theme` | 触发位置 |
|---------|-------------|---------|
| `/` | `aurora` | `src/app/(site)/layout.tsx` |
| `/about` | `aurora` | 同 |
| `/guestbook` | `aurora` | 同 |
| `/login` | `aurora` | 同 |
| `/tags` | `aurora` | 同 |
| `/tags/[slug]` | `aurora` | 同 |
| `/posts/[slug]` | `ink` | `src/app/(site)/posts/[slug]/layout.tsx` |
| `/c/[slug]` | 由 channel 推论（详见 §4.2） | `src/app/(site)/c/[slug]/layout.tsx` |
| `/c/[slug]/[entry-slug]` | 由 entry.kind + channel 推论 | `src/app/(site)/c/[slug]/[entry-slug]/layout.tsx` |
| `/c/[slug]/series/[series-slug]` | 同 channel | 同 |
| `/admin/*` | `admin`（独立 token，详见 §6） | `src/app/(admin)/admin/layout.tsx` |

### 4.2 Channel 推论函数

```typescript
// src/lib/theme/resolveTheme.ts
import type { Channel, Entry } from '@prisma/client'

export type ThemeName = 'aurora' | 'ink' | 'terminal' | 'admin'

export function resolveChannelTheme(channel: Pick<Channel, 'kind' | 'layout'>): ThemeName {
  if (channel.kind === 'STREAM') return 'terminal'
  if (channel.layout === 'GREP' || channel.layout === 'TIMELINE') {
    // GREP 通常给 LINKS/STREAM（终端感）；TIMELINE 给 NOTES（aurora 更适合）
    // 决策：GREP → terminal，TIMELINE → aurora
    return channel.layout === 'GREP' ? 'terminal' : 'aurora'
  }
  if (channel.layout === 'FEED') return 'aurora'
  // CHRONICLE / CARDS / 默认 → aurora（ARTICLES kind 在 channel 列表页用 aurora，
  // 单篇 ARTICLE 详情页再切 ink）
  return 'aurora'
}

export function resolveEntryTheme(entry: Pick<Entry, 'kind'>, channel: Pick<Channel, 'kind' | 'layout'>): ThemeName {
  if (entry.kind === 'ARTICLE') return 'ink'
  return resolveChannelTheme(channel)
}
```

### 4.3 Layout 应用

```tsx
// src/app/(site)/layout.tsx
import './globals.css'
import { Inter, Cormorant_Garamond } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hans" data-theme="aurora">
      <body className={`${inter.variable} ${cormorant.variable}`}>
        {children}
      </body>
    </html>
  )
}
```

```tsx
// src/app/(site)/posts/[slug]/layout.tsx
import { Noto_Serif_SC } from 'next/font/google'

const notoSerifSC = Noto_Serif_SC({
  subsets: ['chinese-simplified'],
  weight: ['400', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
})

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="ink" className={notoSerifSC.variable}>
      {children}
    </div>
  )
}
```

```tsx
// src/app/(site)/c/[slug]/layout.tsx
import { JetBrains_Mono } from 'next/font/google'
import { db } from '@/lib/db'
import { resolveChannelTheme } from '@/lib/theme/resolveTheme'
import { notFound } from 'next/navigation'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export default async function ChannelLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const channel = await db.channel.findUnique({ where: { slug } })
  if (!channel) notFound()

  const theme = resolveChannelTheme(channel)

  return (
    <div
      data-theme={theme}
      className={theme === 'terminal' ? jetbrainsMono.variable : ''}
    >
      {children}
    </div>
  )
}
```

---

## 5. 字体加载策略（next/font + 按 layout 范围加载）

| Layout | 字体集 |
|--------|------|
| `(site)/layout.tsx` | Inter + Cormorant Garamond（Aurora 默认）|
| `(site)/posts/[slug]/layout.tsx` | Noto Serif SC（中文衬线，Ink 阅读用） |
| `(site)/c/[slug]/layout.tsx` (terminal theme) | JetBrains Mono |
| `(site)/c/[slug]/layout.tsx` (其他) | 继承父 layout 字体 |
| `(admin)/admin/layout.tsx` | Inter only（轻量）|

**优势**：
- next/font 自动 self-host，避免 Google Fonts 阻塞
- 按 layout 范围加载，未访问对应路由不下载字体
- variable 字体名（`--font-inter`）暴露给 CSS 变量，主题层调用 `var(--font-prose)` 时 fallback chain 命中

---

## 6. Admin 主题（独立，不属于三皮）

`src/app/(admin)/admin/layout.tsx`：

```tsx
<div data-theme="admin">{children}</div>
```

`globals.css` 加：

```css
[data-theme="admin"] {
  --bg:        240 10% 98%;
  --bg-elev:   0 0% 100%;
  --fg:        240 10% 12%;
  --fg-muted:  240 5% 40%;
  --muted:     240 5% 96%;
  --muted-fg:  240 5% 45%;
  --card:      0 0% 100%;
  --card-fg:   var(--fg);
  --accent:    220 90% 55%;
  --accent-fg: 0 0% 100%;
  --border:    240 6% 90%;
  --ring:      220 90% 55%;
  --radius:    8px;
  --font-prose: "Inter", system-ui, sans-serif;
  --font-display: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

[data-theme="admin"][data-mode="dark"] {
  --bg:        240 10% 10%;
  --bg-elev:   240 8% 14%;
  --fg:        0 0% 95%;
  --fg-muted:  240 5% 65%;
  --muted:     240 8% 16%;
  --muted-fg:  240 5% 60%;
  --card:      240 8% 14%;
  --border:    240 6% 22%;
}
```

Admin 保留 light/dark mode 切换（管理员需要）；公开端三皮不切。

---

## 7. shadcn/ui 兼容策略

### 7.1 双 alias（已含在 §3 globals.css 中）

`--color-background` 与 `--bg` 双写，shadcn 组件零修改可工作。

### 7.2 Terminal 圆角强制覆盖（phase 1）

```css
[data-theme="terminal"] [class*="rounded-"] {
  border-radius: 0 !important;
}
```

**Phase 1 妥协**：用 `!important` 覆盖 shadcn 默认 `rounded-md`。
**Phase 2 改进**：fork shadcn 模板去除硬编码 `rounded-*`，改用 `rounded-[var(--radius)]`。

### 7.3 shadcn 组件主题验证清单

每个 shadcn 组件在三皮下都必须截图对比：

- [ ] Button (default / outline / ghost / destructive)
- [ ] Input / Textarea / Select
- [ ] Card / Separator
- [ ] Dialog / DropdownMenu / Popover
- [ ] Tabs
- [ ] Toast (Sonner)
- [ ] Badge

---

## 8. ThemeProvider Server Component

```tsx
// src/components/theme/ThemeProvider.tsx
import type { ThemeName } from '@/lib/theme/resolveTheme'

export interface ThemeProviderProps {
  theme: ThemeName
  hero?: boolean
  mode?: 'light' | 'dark'
  children: React.ReactNode
}

export function ThemeProvider({ theme, hero, mode, children }: ThemeProviderProps) {
  return (
    <div
      data-theme={theme}
      data-hero={hero ? 'true' : undefined}
      data-mode={mode}
    >
      {children}
    </div>
  )
}
```

用在动态推论场景：

```tsx
// src/app/(site)/c/[slug]/[entry-slug]/page.tsx (摘要)
const theme = resolveEntryTheme(entry, channel)
return (
  <ThemeProvider theme={theme}>
    <EntryDetail entry={entry} />
  </ThemeProvider>
)
```

---

## 9. 测试策略（详见 specs/03-theme-tokens + specs/04-public-shell）

| Spec-ID | 测试 | 层级 |
|---------|------|------|
| theme-001 | rootHasAuroraThemeByDefault | unit (component test) |
| theme-002 | postSlugRouteResolvesToInkTheme | unit |
| theme-003 | channelStreamKindResolvesToTerminal | unit |
| theme-004 | channelArticleKindWithChronicleLayoutResolvesToAurora | unit |
| theme-005 | entryArticleKindOverridesParentChannelTheme | unit |
| theme-006 | shadcnButtonInheritsBgInAllThreeThemes | jsdom snapshot |
| theme-007 | terminalForcesZeroBorderRadius | unit |
| theme-008 | reducedMotionDisablesAuroraDrift | jsdom + mock matchMedia |
| theme-009 | fontProseFallbacksToSystem | unit |

---

## 10. 风险表

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Tailwind v4 `@theme inline` 与 build 时定型冲突 | 中 | 高 | 必须用 `inline` 关键字；测试覆盖三皮切换 |
| shadcn 组件硬编码 `rounded-md` 在 Terminal 主题难看 | 高 | 中 | `!important` 覆盖（phase 1）；phase 2 fork |
| 三套字体加载导致首屏 LCP 退化 | 中 | 中 | next/font self-host + display=swap；preload 主字体 |
| 极光层 `backdrop-filter` 在 Safari 旧版断片 | 中 | 低 | feature query `@supports` fallback |
| OKLCH 在旧浏览器（Safari < 15）不支持 | 中 | 低 | 我们用 HSL（更广支持） |
| 路由层级嵌套覆盖 `data-theme` 时优先级问题 | 中 | 中 | 子 layout 用最近 wrapper 覆盖父；测试覆盖 |
| Channel.theme 字段被未来 PR 偷偷加回来 | 中 | 高 | CI grep 守门（详见 `acceptance-criteria.md`） |

---

## 11. 一次性集成 checklist（供 codex 执行）

- [ ] 完整替换 `src/styles/globals.css` 为 §3 草案
- [ ] 创建 `src/lib/theme/resolveTheme.ts`
- [ ] 创建 `src/components/theme/ThemeProvider.tsx`
- [ ] `src/app/(site)/layout.tsx` 加 Aurora 默认 + Inter + Cormorant
- [ ] `src/app/(site)/posts/[slug]/layout.tsx` 加 Ink + Noto Serif SC
- [ ] `src/app/(site)/c/[slug]/layout.tsx` 推论 theme + 可选 JetBrains Mono
- [ ] `src/app/(site)/c/[slug]/[entry-slug]/layout.tsx` 推论 entry theme
- [ ] `src/app/(site)/c/[slug]/series/[series-slug]/layout.tsx` 同 channel
- [ ] `src/app/(admin)/admin/layout.tsx` 加 admin 主题
- [ ] `src/app/(site)/guestbook/layout.tsx` 加 aurora
- [ ] `src/app/(site)/login/layout.tsx` 加 aurora
- [ ] 删除任何"主题切换按钮"组件 / state / context（grep 守门）
- [ ] 三皮 screenshot 对比 demo-front/demos/{aurora-portal,ink-garden,terminal-workshop}/index.html
- [ ] 跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:00:00Z -->
