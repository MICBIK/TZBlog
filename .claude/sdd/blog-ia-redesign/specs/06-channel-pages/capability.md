# Spec 06 · Channel Pages

> 5 个 layout 实现：CHRONICLE / CARDS / TIMELINE / GREP / FEED。
>
> Reference: `channel-meta-cms.md` §4 / `theme-token-strategy.md` §4 / `demo-front/directions/`

---

## Specs

### CHRONICLE layout

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| chl-001 | Channel layout=CHRONICLE + 5 entries | 访问 `/c/<slug>` | 渲染单列长文流，每行 cover/title/excerpt/meta |
| chl-002 | Entry metadata.cover 缺失 | 渲染卡 | 显示 placeholder 或省略图块 |
| chl-003 | 无 published entry | 渲染 | 显示空状态提示 |

### CARDS layout

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| chl-004 | layout=CARDS + 9 entries | 访问 | 桌面 3 列 / 平板 2 列 / 手机 1 列 |
| chl-005 | hover 卡片 | hover | 上浮 + accent 描边 |

### TIMELINE layout

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| chl-006 | layout=TIMELINE + 多日 entries | 渲染 | 竖直时间轴，同日聚合 + 跨日 header |
| chl-007 | Note 含 metadata.mood | 渲染 | 显示 mood 图标 |

### GREP layout

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| chl-008 | layout=GREP + 20 entries | 渲染 | 单色等宽表格 + 顶部固定搜索框 |
| chl-009 | 输入关键字 | client filter | 高亮匹配行；不匹配行隐藏 |
| chl-010 | mobile | 渲染 | 表格水平滚动不破坏 layout |

### FEED layout

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| chl-011 | layout=FEED + 30 entries | 渲染 | Masonry 瀑布流（CSS columns） |
| chl-012 | 滚到底 | 触发 | 无限滚动加载下一批 |

### 共用

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| chl-013 | Channel.kind 与 layout 不兼容（如 NOTES + CHRONICLE） | seed 直接造数据 | admin UI 应拒绝（spec 10），后端容忍但前台正常渲染 |
| chl-014 | 任意 channel 页 | metadata | `<title>` + OG 标签正确 |
| chl-015 | 任意 channel 页 | reduced-motion | 动效禁用 |

---

## Test File

- `src/components/channel-layouts/ChronicleLayout.test.tsx`
- `src/components/channel-layouts/CardsLayout.test.tsx`
- `src/components/channel-layouts/TimelineLayout.test.tsx`
- `src/components/channel-layouts/GrepLayout.test.tsx`
- `src/components/channel-layouts/FeedLayout.test.tsx`
- `src/app/(site)/c/[slug]/page.test.tsx`

---

## Acceptance

- [x] 15 spec 全 pass
- [x] 5 个 layout × 3 主题 = 15 组合截图对比 demo-front（见 `.claude/sdd/blog-ia-redesign/smoke/channel-layouts/`）

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
