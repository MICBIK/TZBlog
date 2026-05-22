# Execution Plan — 10 项任务的批次依赖与推荐顺序

> 接收 AI 的执行路线图。串联执行优先；同批次内可并行（如果接收 AI 支持多 session）。

## 依赖图

```
                              ┌─────────────────────┐
                              │ Batch 0：快速清债   │
                              │  (并行可，0 依赖)   │
                              ├─────────────────────┤
                              │ 0.1 docs-sync       │
                              │ 0.2 confirm-dialog- │
                              │     replication     │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ Batch 1：首页系统    │
                              │ (Editorial 视觉系统) │
                              ├──────────────────────┤
                              │  1.1 hero-editorial  │  ← 必须先做（定视觉基线）
                              │       │              │
                              │       ▼              │
                              │  1.2 tech-stack-     │ ← 1.2 / 1.3 可并行
                              │      section         │
                              │  1.3 github-data-card│
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ Batch 2：独立页      │
                              │  (沿用 Editorial)   │
                              ├─────────────────────┤
                              │  2.1 about-page     │ ← 沿用 hero-editorial 风
                              │  2.2 tags-pages     │ ← 0 依赖，可与 2.1 并行
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ Batch 3：数据消费    │
                              ├─────────────────────┤
                              │  3.1 analytics-     │ ← 数据源 PageView 已就绪
                              │      dashboard       │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ Batch 4：文档收尾    │
                              ├─────────────────────┤
                              │  4.1 readme-and-docs│
                              │  4.2 lighthouse-prep│ ← 需 1.x + 2.x 完成才能跑
                              └─────────────────────┘
```

## 推荐执行顺序

**串联模式（默认）**：按 0 → 1 → 2 → 3 → 4 依次。

**并行模式（如接收 AI 支持多 session）**：

| 阶段 | 可并行 SDD |
|------|-----------|
| 阶段 1 | 0.1 docs-sync + 0.2 confirm-dialog-replication（独立） |
| 阶段 2 | 1.1 hero-editorial（独自） |
| 阶段 3 | 1.2 tech-stack-section + 1.3 github-data-card（共享 1.1 视觉） |
| 阶段 4 | 2.1 about-page + 2.2 tags-pages（独立） |
| 阶段 5 | 3.1 analytics-dashboard（独自） |
| 阶段 6 | 4.1 readme-and-docs + 4.2 lighthouse-prep |

## 工作量预估（接收 AI 视角）

| Batch | 累计耗时（串联） | 累计耗时（并行 2 session） |
|------|------------------|---------------------------|
| 0 | 1.5h | 1h |
| 1 | 1.5h + 3 天 ≈ 1.5h + 24h | 1h + 16h（1.1 阻塞） |
| 2 | + 1.5 天 ≈ + 12h | + 8h（2.1/2.2 并行） |
| 3 | + 2 天 ≈ + 16h | + 16h |
| 4 | + 1 天 ≈ + 8h | + 4h（4.1/4.2 并行） |
| **总计** | **~60h** | **~45h** |

> ⚠️ 单 SDD 工作量包含：写测试 RED + 实现 GREEN + 质量门 + commit + 自检。 NOT 包含人工 UI smoke。

## 关键阻塞点

| 阶段 | 阻塞 | 说明 |
|------|------|------|
| 1.1 → 1.2 / 1.3 / 2.1 | hero-editorial 视觉基线 | Editorial 风的字体栈 / 配色 / 间距系统在 1.1 落地后才能复用 |
| 4.2 Lighthouse | 首页 + 详情页完整内容 | 需有真实内容才能跑 Lighthouse；空 placeholder 跑出来不准 |
| **3.1 analytics-dashboard** | 接收 AI 需选图表库（recharts / visx / tremor / 自研 SVG） | SDD 内列了 tradeoff 让接收 AI 决定；若不确定，**默认 recharts**（最易上手） |

## 中途审计 checkpoint（可选）

如果 ha1den 想在每批次完成后中断让 claude 审计：

| Checkpoint | 触发时机 | 审计重点 |
|-----------|---------|---------|
| CP-0 | Batch 0 完成 | TDD 节奏 + commit-msg hook 是否生效 / 测试输出是否真实 |
| CP-1 | Batch 1 完成 | Editorial 视觉一致性 / 主题变量是否用对 / 响应式断点 |
| CP-2 | Batch 2 完成 | About placeholder 是否够明显（避免 ha1den 漏改） / Tags 页 SEO（含 metadata + sitemap） |
| CP-3 | Batch 3 完成 | Analytics 仪表盘 N+1 查询 / 缓存策略 / 图表 a11y |
| CP-4 | Batch 4 完成 | README 准确性 / Lighthouse 实测 + 报告 |

如果不中断，接收 AI 全部完成后 claude 一次性深度审计 + bug 修复（这是 ha1den 默认计划）。

## Commit 节奏（汇总）

```
test(docs):                ←  0.1 docs-sync 唯一 commit（[no-tdd] 仅纯 .md）
test(admin-posts) ↔ feat(admin-posts)   ←  0.2 confirm-dialog-replication × 1
test(admin-columns) ↔ feat(admin-columns) ←  0.2 同任务第二组

test(site-home) ↔ feat(site-home)       ←  1.1 hero-editorial 多组
test(site-home) ↔ feat(site-home)       ←  1.2 tech-stack-section
test(site-home) ↔ feat(site-home)       ←  1.3 github-data-card

test(site-about) ↔ feat(site-about)     ←  2.1 about-page
test(site-tags) ↔ feat(site-tags)       ←  2.2 tags-pages

test(admin-analytics) ↔ feat(admin-analytics) ←  3.1 analytics-dashboard 多组

docs: [no-tdd]                          ←  4.1 readme-and-docs (.md 文件)
chore(perf) / 视项目情况                ←  4.2 lighthouse-prep
```

> ⚠️ scope 命名必须与 SDD 内的 task list 一致。错误 scope 会导致 hook 拒绝。
