# specs/checkbox-sync — progress.md 勾选同步

> spec-id 前缀：`SPEC-DS-CB`
> 验证方式：grep before/after

## SPEC-DS-CB-1 — 勾选"文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）"

### Background

`memory-bank/progress.md` 第 142 行（**P2 前台展示 / Week 3-4** 段下）：

```markdown
- [ ] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）
```

5 个 sub-component 全部已 shipped：

| Sub-component | 实施位置 | Archive |
|---|---|---|
| Shiki | P0 脚手架 | 已并入 P0 commits |
| TOC | D2 详情页 TOC 侧栏 | `archive/2026-05-21-seo-and-feed/`（注：D2 不是独立 SDD，已记录在 progress.md:75） |
| 浏览上报 | analytics-beacon SDD `<AnalyticsBeacon>` | `archive/2026-05-21-analytics-beacon/` |
| 点赞 | D3 SDD `<LikeButton>` | `archive/2026-05-21-comments-and-likes/` |
| 评论区 | D3 SDD `<CommentSection>` | `archive/2026-05-21-comments-and-likes/` |

### GIVEN / WHEN / THEN

```gherkin
GIVEN memory-bank/progress.md line 142 currently reads:
  "- [ ] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）"

WHEN executing this spec

THEN line 142 must be replaced with:
  "- [x] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）—— D2 (TOC) + D3 (likes/comments) + analytics-beacon (page views) 已分别 archived"

AND grep validation passes:
  grep -n "文章详情（Shiki + TOC" memory-bank/progress.md
  # expected: 1 hit, on line 142, with "[x]" prefix

AND no other line in progress.md is modified
```

### Acceptance

- `[ ]` → `[x]`
- 行尾追加 archive 引用注脚（一行内）
- 文件无意外 whitespace / 换行变化（用 git diff 检查仅 1 行 changed）

---

## SPEC-DS-CB-2 — 勾选"自研 Analytics 客户端上报（<AnalyticsBeacon>）"

### Background

`memory-bank/progress.md` 第 145 行（**P2 前台展示 / Week 3-4** 段下）：

```markdown
- [ ] 自研 Analytics 客户端上报（<AnalyticsBeacon>）
```

完整 shipped 在 analytics-beacon SDD（commits `4900742 → ccab40e`，archive `2026-05-21-analytics-beacon/`）。

### GIVEN / WHEN / THEN

```gherkin
GIVEN memory-bank/progress.md line 145 currently reads:
  "- [ ] 自研 Analytics 客户端上报（<AnalyticsBeacon>）"

WHEN executing this spec

THEN line 145 must be replaced with:
  "- [x] 自研 Analytics 客户端上报（<AnalyticsBeacon>）—— archive/2026-05-21-analytics-beacon/"

AND grep validation passes:
  grep -n "自研 Analytics 客户端上报" memory-bank/progress.md
  # expected: 1 hit, on line 145, with "[x]" prefix

AND no other line in progress.md is modified
```

### Acceptance

- `[ ]` → `[x]`
- 行尾追加 archive 引用
- git diff 仅 1 行 changed

---

## 安全网（R2 决策）

如果实施 AI 在执行 SPEC-DS-CB-1 或 SPEC-DS-CB-2 之前 grep 整个 P2 段，发现**额外**的 `- [ ]` 行实际上已完成（例如：tags-pages 已写而未勾选）：

- **STOP** — 不要扩大 scope
- 写一份 `additional-stale-items.md` 到 `.claude/sdd/docs-sync/` 列出发现
- 在 completion-report.md 中标注 "Found additional stale items, awaiting ha1den decision"
- 不修改这些 extra 行（除非 ha1den 后续指示）

## 不该勾选的行（reference / 禁区）

仅供 grep 排除参考，**不要修改**：

| 行号 | 内容 | 状态 |
|------|------|------|
| 141 | `[ ] 首页 Hero + 技术栈 + 最近文章 + GitHub 数据` | Recent Posts 已 shipped (D1)，但 Hero/技术栈/GitHub 未完成（hero-editorial / tech-stack-section / github-data-card SDD 才会做） |
| 143 | `[ ] 文章列表 + 专栏聚合页 + 标签页` | 列表 + 聚合页已 shipped，标签页未做（tags-pages SDD 才会做） |
| P3 段全部 | 部署上线相关 | 未启动 |
| P4 段全部 | 打磨缓冲相关 | 未启动 |

仅 142 + 145 是 100% shipped 但 unchecked 的情况。
