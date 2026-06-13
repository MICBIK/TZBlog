# tzblog 设计宪法 · DESIGN.md

> **地位**：本文件是 tzblog 视觉设计语言的**单一数据源（single source of truth）**。
> 当本文件与 `migration-spec.md` / `frontend-handoff.md` / 任何页面内联 `:root` 冲突时，**以本文件为准**。
> 下游文档（migration-spec §3 的 `@theme`、各组件 props）从这里派生，不得各自另立 token。
> 维护者：Creative Director 流程产出 · 最后更新随每次设计决策同步。

---

## 0. 为什么需要这份文件（诊断结论）

当前"设计系统"实际上是 **20 份各自漂移的内联 `:root` 副本**。最能定义品牌的磷光绿已裂成 **3 个值 + 2 套命名**，且**文档（早已写 `#3fe08f`）与代码（漂成 3 个绿）已分叉**——典型的"有规范、没强制"。

本文件的职责：把隐性、漂移的终端语言，**固化成显性、可强制、可迁移**的契约，并在迁移到 Next.js + shadcn/Aceternity/Magic 之前，立好**约束这些库的"终端皮肤"规格**，防止它们的默认审美反向吞掉品牌身份。

---

## 1. 设计哲学与母题

**一句话**：这是一个开发者用了一年、住了人的**终端工作台**，不是又一个圆角紫渐变 SaaS 模板。

**母题**：CRT 磷光终端 — 近黑画布、单一磷光绿、等宽骨架、命令行语义、扫描线肌理。

**双轨人格（two registers）**——这是品牌的核心结构，必须显性管理：

| | 前台「舞台」(stage) | 后台「驾驶舱」(cockpit) |
|---|---|---|
| 页面 | home/about/article/search/works/library/pathways/landing/archive/auth/account/404/500 | admin-* 六页 |
| 气质 | 终端戏剧化，敢用磷光绿做表达 | 克制控制台，效率优先 |
| 绿预算 | 每屏 ≤ 2 处高亮（eyebrow + 主 CTA / 一个签名时刻） | 仅状态点、激活态、关键数字 |
| 密度 | 留白叙事 | 信息密度即功能 |
| 动效预算 | 允许一个决定性 flourish | 仅功能性反馈（hover/active/toast） |

> 现状的 `#3fe08f`(前台) vs `#46d98a`(后台) **无意中编码了这个双轨，但那是事故不是设计**。本宪法把它改成：**同一个绿，两种用量预算**——色相统一，靠"用多用少"区分人格，而不是靠不同的绿。

---

## 2. 色彩契约（canonical）

### 2.1 唯一磷光绿

```
--acc        : #3fe08f   /* 唯一品牌磷光绿，全站统一，无例外 */
--acc-dim    : #1f7a4d   /* 绿的暗态：边框/hover 底/低强调 */
```

**裁定理由**：`#3fe08f` 占据最高频、最定义身份的内容阅读面（home/article），饱和度最高、最贴 CRT 磷光隐喻；现有四份文档也早已canonize 它。`#46d98a`(后台/index/landing)、`#3fdd84`(search) 一律**视为漂移，收敛回 `#3fe08f`**。

### 2.2 全量 token 表（语义角色）

```
/* 画布与面 */
--bg         : #0b0f14   /* 近黑画布，唯一页面背景 */
--panel      : #11171f   /* 一级面：卡片/区块 */
--panel-2    : #141b24   /* 二级面：嵌套/侧栏/输入框 */
/* 线 */
--line       : #1f2730   /* 标准 hairline 边框 */
--line-2     : #2a343f   /* 强调/悬停边框 */
/* 文字 */
--fg         : #c9d4df   /* 正文 */
--fg-strong  : #eef3f8   /* 标题/强调 */
--muted      : #6b7a89   /* 次要文字（AA 合格下限） */
--dim        : #7d8a97   /* ⚠ 见 2.4：原 #48555f 不合格，提升至此 */
/* 彩色（极克制） */
--acc        : #3fe08f   /* 磷光绿，唯一 chromatic accent */
--acc-dim    : #1f7a4d
--amber      : #e3b341   /* 警示/草稿态，每屏最多一次 */
--danger     : #e06a5a   /* 删除/错误 */
--info       : #56a8e8   /* 链接/信息（仅 landing/admin 已用，谨慎扩散） */
```

**铁律**：彩色只有绿是品牌色；amber/danger/info 是**功能态色**，不参与品牌表达，不得当装饰。每屏彩色 ≤ 2 处叙事性使用。

### 2.3 命名统一

- **canonical 名 = `--acc` / `--acc-dim`**（前台已用）。
- `--accent` / `--accent-dim`（后台/index/landing/search）= **漂移命名**，迁移时统一为 `--color-acc`（Tailwind v4 `@theme`，见 migration-spec §3）。
- **原型期安全策略**：内联样式大量 `var(--accent)` 引用，**直接改 hex 值、暂留旧名**（避免断引用）；命名收敛留到迁移期组件化时一次性做。

### 2.4 WCAG 对比度（color-expert 校验）

| 前景 / 背景 | 比值 | 结论 |
|---|---|---|
| `#3fe08f` on `#0b0f14` | ≈ 10.5:1 | ✅ AAA，绿可安全做正文/accent |
| `--muted #6b7a89` on `#0b0f14` | ≈ 4.6:1 | ✅ 刚过 AA（正文 4.5） |
| **`--dim #48555f` on `#0b0f14`** | **≈ 2.3:1** | ❌ **不合格**——小字必须修 |

**修正**：`--dim` 从 `#48555f` 提升到 **`#7d8a97`**（≈ 4.5:1）。`#48555f` 仅可用于**非文字**的装饰线/禁用态。

### 2.5 跨层 fallback bug（必修）

`assets/site-chrome.css` 用 `var(--accent, var(--green, #46d98a))` 兜底。前台页只定义 `--acc` 不定义 `--accent` → **共享底栏/特效在前台页实际渲染成 fallback `#46d98a`，与页面内容的 `#3fe08f` 不一致**（同一页两个绿）。
**修正**：把 site-chrome.css 的兜底改为 `var(--acc, var(--accent, #3fe08f))`，或统一加 `--acc` 别名。

---

## 3. 字体与排版标度（首次正式定义）

```
--font-mono : 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
--font-sans : 'Noto Sans SC', system-ui, -apple-system, sans-serif;
```

**分工铁律**：
- **mono** → 代码、数字、ID/hash、eyebrow/kicker、命令行提示符、表格数值、标签、计数。
- **sans** → 长文正文、段落、说明性文字。
- 标题可用 mono（终端感）或 sans（可读性），但**同一层级全站统一**，不混。

**模块标度（major third 1.25，fluid）**：

| token | clamp() | 用途 |
|---|---|---|
| `--t-xs` | 12px | 标签/计数/版权 |
| `--t-sm` | 14px | 次要文字/表格 |
| `--t-base` | `clamp(15px,.95rem+.1vw,16px)` | 正文 |
| `--t-md` | 20px | 卡片标题/区块小标 |
| `--t-lg` | `clamp(24px,1.2rem+1vw,32px)` | 区块标题 |
| `--t-xl` | `clamp(32px,1.5rem+2vw,48px)` | 页面 H1 |
| `--t-hero` | `clamp(40px,2rem+4vw,72px)` | hero（仅 landing/home） |

行高：正文 1.7，标题 1.2，mono 数据 1.4。字间距：mono 大标 `-0.01em`，正文 0。

---

## 4. 间距 / 圆角 / 边框 / 阴影（终端姿态）

```
/* 间距：4px 基 */
--s-1:4px --s-2:8px --s-3:12px --s-4:16px --s-6:24px --s-8:32px --s-12:48px --s-16:64px --s-24:96px
--radius : 6px        /* 锐利。卡片/按钮/输入框统一 6px，不超过 8px */
--radius-pill: 999px  /* 仅 chip/状态 pill */
```

**姿态铁律**：
- **锐利 ≤ 6px**，不要 SaaS 大圆角（12–24px 一律禁止，那是模板感来源）。
- **边框承重，不靠阴影**：用 `--line` hairline 描边划分层次。
- **没有柔和投影**。需要强调时用**磷光辉光** `0 0 12px color-mix(in oklab, var(--acc) 30%, transparent)`，仅用于激活态/焦点/签名时刻，不得滥用。
- 焦点环（a11y）：`:focus-visible{ outline:2px solid var(--acc); outline-offset:2px }`，全站统一，不许 `outline:none` 裸删。

---

## 5. 动效语言

**性格**：机器精确 + 少量人性。系统反馈用线性/步进（终端感），人触发的过渡用 ease-out。

```
--ease-machine : linear;
--ease-out     : cubic-bezier(.2,.7,.2,1);
--ease-snap    : steps(N)        /* 光标闪烁/打字机 */
--dur-fast:120ms --dur-base:240ms --dur-slow:520ms
```

| 效果 | 规格 | 来源（原型单一数据源） |
|---|---|---|
| 扫描线/网格/点阵/aurora 漂移 | 慢循环，仅 `transform/opacity` | site-chrome.css |
| 点击字母掉落 | 1.9s 缓落淡出，落点抖动 | site-chrome.js `initGlyphs` |
| 启动加载条 | 最短 520ms | `initLoad` |
| 报错红条 | 6s 自动收起 | `initErr` |
| 跨页过渡 | `@view-transition{navigation:auto}` 淡入 | site-chrome.css |
| 章节滚动入场 | `.rv`→`.rv.in`：opacity 0→1 + `translateY(16px)`→0，`.5s` + `cubic-bezier(.16,1,.3,1)`，IntersectionObserver 触发一次 | home / article / about 内联 |

**滚动入场按页型分治（有意原则，非遗漏）**：仅**长叙事页**（首页 / 文章 / 关于）做章节滚动入场——长滚动里它提供空间定位价值。**功能 / 列表页**（搜索 / 作品 / 归档 / 学习路径）**不加**：这些页要的是即时可用，等动画反而拖慢操作。三页参数已统一为上表那套；新增长叙事页沿用 `.rv`，新增功能页不引入 reveal。

**`prefers-reduced-motion: reduce` 下全部关闭**（掉字 no-op、aurora/扫描静止、加载条不闪、跨页 VT 静切 `::view-transition-*{animation:none}`、`.rv` 直接可见）。这是 a11y 硬要求，不是可选。

---

## 6. 终端皮肤契约 — 约束迁移库（迁移保命条款）

> shadcn/ui、Aceternity、Magic UI 都带**强默认审美**（圆角、柔影、亮色优先、渐变）。**它们服从本宪法，不是反过来。**

**6.1 Tailwind v4 `@theme`**：§2–§5 的 token 即 `globals.css` 的 `@theme` 唯一来源（见 migration-spec §3），组件只准引用语义 token，禁止字面色值/魔法间距。

**6.2 shadcn/ui（业务 UI 主力）**：
- 安装后**改写其 CSS 变量**映射到本宪法 token（`--background→--bg`、`--primary→--acc`、`--border→--line`、`--radius→6px`）。
- 默认 `--radius:0.5rem`/柔影/亮色一律覆盖；暗色单主题，不引亮色。
- 用 shadcn 的**结构与 a11y**（Radix 焦点/键盘），用本宪法的**皮肤**。

**6.3 Aceternity / Magic UI（仅营销面）**：
- **只准出现在 `marketing/` 即 landing**，不得进入 app/admin/阅读面。
- 任何组件落地前**去圆角(→6px)、去多彩渐变、强制暗底 + 单磷光绿**；它们的炫光必须降级成磷光绿辉光，不许保留紫/粉/彩虹默认。

**6.4 framer-motion**：用 §5 的 `--ease-*` / `--dur-*`，不许每个组件自创时长缓动；reduced-motion 用 `useReducedMotion()` 全局降级。

---

## 7. 反模板 / 反 AI 味 护栏（本品牌专属）

- ❌ 圆角 > 8px、柔和投影、亮色回退、米黄/纯白画布
- ❌ 紫/粉渐变、彩虹炫光、每个标题配 emoji 图标
- ❌ 等宽等重的"无观点仪表盘"卡片墙（account 现状即反面教材）
- ❌ 第二个绿、第二套 token 命名、字面色值
- ✅ 每个关键 surface 有**一个**决定性签名时刻（如 account 的磷光绿阅读热力图）
- ✅ 真实内容（haiden 真选题/数字/友链），honest placeholder 而非编造

---

## 8. 漂移修正清单

### 8.1 已执行（2026-06-14，全站 grep 核验零残留）

> 核验暴露：绿色实际漂移为 **5 个值 + 3 套 token 命名**（远超初诊的"3 值"）。已全部收敛到 canonical `#3fe08f` / `#1f7a4d`。

- **A. 绿值收敛（改 hex、留旧名）** — 已完成：
  - `--accent:#46d98a` → `#3fe08f`（admin-dashboard/settings/analytics/media/sections、index、landing）
  - `--accent:#3fdd84` → `#3fe08f`（front-search）
  - `--green:#4ade80` → `#3fe08f`（front-works/library/pathways）｜ `--green:#4ee39a` → `#3fe08f`（admin-editor）
  - 全部 `--*-dim`（`#2f8a5a`/`#1f6e45`/`#2f8f56`/`#2f8f63`）→ `#1f7a4d`
  - 绿色 rgba 孪生值 `70,217,138`/`74,222,128`/`78,227,154` → `63,224,143`（含装饰 tint/glow/selection）
  - 装饰绿：landing 窗口绿灯、admin-sections 分类色样 → `#3fe08f`
- **B. 对比度** — 已完成：8 个前台页 `--dim:#48555f` → `#7d8a97`（4.5:1）；site-chrome 底栏 fallback 同步。
- **C. 跨层 fallback** — 已完成：**实际在 `admin-chrome.css`（非 §C 原写的 site-chrome.css）**，`var(--accent,var(--green,#46d98a))` → `var(--accent,var(--acc,#3fe08f))`（6 处 + 激活态 rgba）。

### 8.2 已执行（2026-06-14，续）

- **D. account.html 签名级重设计** — 已完成：删重复 `<meta robots>`（原 7 + 60 两条留一）；身份对齐（prompt `haiden@` → `reader_42@`，与正文登录读者一致）；4 个统计盒改为 `<button>` 可点、与下方 tab 联动高亮（`selectView()` 单一驱动）；补**真实签到模块**（连续天数 + 本周打卡条 + 可点签到，点击增计并标记今日）；补**阅读热力图**（18 周 × 7 GitHub 贡献格，确定性强度、磷光绿 4 级透明度——决定性签名时刻）。全部用 canonical token，无新增漂移。

### 8.3 故意推迟到迁移阶段（不在静态原型上改）

> 判断：E/F 基本不可感（`#0b0f14` vs `#0a0e14` 为每通道 1/255 级差，token 名是内部实现），且改名涉及数百处 `var()` 引用、高 churn 高风险，而静态 HTML 即将被替换。正解是迁移时由 Tailwind `@theme` **一次性归一**——宪法已声明 canonical 名/值，迁移 AI 有单一数据源，无需在 throwaway HTML 上手改。

- **E. 中性梯度三套并存**：前台 `--bg:#0b0f14`/`--muted:#6b7a89`；admin `--bg:#0a0e14`/`--muted:#6b7686`/`--faint:#46505e`；works/library/pathways `--bg:#0a0e14`/`--muted:#5f7491`。迁移时统一为一组中性 token。
- **F. token 命名未统一**：`--acc`（前台）/ `--accent`（admin）/ `--green`（works/library/pathways/editor）三套名指同一角色。迁移时归一为单一语义名（如 `--color-accent`）。

---

## 9. 文档关系

```
DESIGN.md（本文件 · 视觉单一数据源）
   ├─ migration-spec.md      §3 @theme / §6 工作范围  ← 派生自本文件
   ├─ frontend-handoff.md    逐页效果事实来源
   ├─ production-readiness-checklist.md  缺口（含对比度项）
   └─ remaining-work.md      前后端拆分
```

迁移 loop AI 与后续设计：**先读 DESIGN.md 定契约**，再按 migration-spec 执行；任何新组件/新页的 color/type/space/motion 决策以本文件为唯一裁判。
