# public-ui-and-editor-overhaul — Handoff README

> **执行方读完这一份就能开干**。
> 本目录是一份完整的 SDD（Spec-Driven Development）feature，被设计为可由另一个 AI / 工程师独立完成实施。
> 主脑：ha1den / 起草：副驾（tevxz1n 协议 v3）/ 起草日期：2026-05-23 / 状态：proposal aligned，等待 implementation。

---

## 0. 这份 SDD 在做什么

一句话：**把 TZBlog 前台、Markdown 阅读/编辑体验、后台管理界面、多语言现状从"半成品 / 不一致 / 不达标"重做到"成熟的个人技术博客"水准。**

具体清单（用户原话）：

1. Markdown 阅读体验重做（callout / code / table / list / inline / kbd / 双主题）
2. 编辑器源码契约修复（左侧必须是 markdown 字符）
3. 编辑器预览一致性（右侧与发布态视觉等价）
4. 前台首页重做与增强
5. About 页重做与增强
6. 后台管理界面可读性与设计修复
7. 未完成页面与界面补全
8. 多语言问题系统梳理（**仅文档化，不做迁移**）
9. 参考研究与设计分析（已沉淀在 design-research.md）
10. 文档同步（V2/V3 / memory-bank / README）
11. 最终浏览器逐页验收

---

## 1. 必读顺序（不允许跳过）

执行方在写第一行测试 / 代码前必须按以下顺序读完：

| # | 文件 | 用途 | 阅读时间 |
|---|---|---|---|
| 1 | `README.md`（本文件） | 入口、强约束、SDD/TDD 协议 | 10 min |
| 2 | `proposal.md` | 整体方案、范围、明确不做、风险 | 20 min |
| 3 | `design-research.md` | 参考案例与设计判断 | 30 min |
| 4 | `design-notes.md` | 设计系统决策（token、组件原则、选型） | 30 min |
| 5 | `specs/markdown-reading/spec.md` | MR-* GIVEN/WHEN/THEN | 20 min |
| 6 | `specs/editor-source-contract/spec.md` | EC-* GIVEN/WHEN/THEN | 20 min |
| 7 | `specs/editor-preview-parity/spec.md` | EP-* | 15 min |
| 8 | `specs/home-redesign/spec.md` | H-* | 15 min |
| 9 | `specs/about-redesign/spec.md` | A-* | 15 min |
| 10 | `specs/admin-readability/spec.md` | AR-* | 15 min |
| 11 | `specs/incomplete-pages-inventory/spec.md` | IP-* | 5 min |
| 12 | `specs/i18n-current-state-audit/spec.md` | I18N-* | 10 min |
| 13 | `test-map.md` | spec-id → 测试函数映射 | 20 min |
| 14 | `tasks.md` | TDD 微循环任务清单（你的主要工作清单） | 30 min |
| 15 | `i18n-current-state.md` | 多语言现状详尽审计 | 15 min |
| 16 | `incomplete-pages-inventory.md` | 路由完成度盘点 | 10 min |
| 17 | `browser-audit-checklist.md` | 浏览器逐页审查清单 | 10 min |
| 18 | `deferred-v2-v3.md` | V2/V3 延后清单 | 10 min |

**总阅读时间：约 4-5 小时**。这是 SDD 协议的"先读后做"硬约束，跳过会引入 spec 偏离风险。

读完后回到 `tasks.md §0-§2` 开始 Pre-flight 检查。

---

## 2. 项目背景（最小集）

执行方应已熟悉 TZBlog（如果是新加入的 AI，先读这些）：

- 项目根 `/Users/baihaibin/Documents/WorkSpares/TZBlog/CLAUDE.md` — 项目级指令
- `memory-bank/projectBrief.md` — 项目定位与目标
- `memory-bank/techContext.md` — 技术栈版本与脚本
- `memory-bank/systemPatterns.md` — 代码约定（含 §13 Markdown pipeline 与 §14 编辑器契约，本 SDD 核心相关）
- `memory-bank/activeContext.md` — 当前进度
- `memory-bank/progress.md` — 已完成项与 V2/V3 backlog
- `memory-bank/knownIssues.md` — 已知问题（特别 KI-004 多语言）

执行方应已熟悉 SDD/TDD 协议：

- `CLAUDE.md "完整开发流程"` 段（场景 0/1/2/3 + SDD 增量层）
- TDD 微循环 commit pair 模式（test→feat / 节奏严格）
- husky commit-msg hook 守护（未带 `[no-tdd]` 的 feat: 前 5 commit 内必须有同 scope 的 test:）
- ECC `/tdd` 命令 + `tdd-guide` agent

---

## 3. 强约束（违反即视为 spec 偏离）

### 3.1 SDD/TDD 节奏

- 每条 spec 写 **真实 RED 测试**（粘 FAIL 输出）→ 写 **最小 GREEN 实现**（粘 PASS 输出）→ 可选 REFACTOR
- 不允许 "声明式 RED"（"测试应该失败"而无真实终端输出）
- 不允许把所有测试堆在最后写
- commit 节奏严格按 `tasks.md §0` Scope + spec-id

### 3.2 范围 / 不变量（详 proposal.md §3 + §9）

- 不动 Prisma schema
- 不动 API contract
- 不做多语言路由（仅文档化）
- 不引入未在 design-notes §11 列出的依赖
- 不退化任何现有测试

### 3.3 决策已锁定，不允许自行变更

以下决策在 `design-notes.md` 已锁定，不允许执行方擅自改：

- **Token 命名 + 值起点**（design-notes §2.1）。微调允许但需记入 §12 "调整日志"
- **Callout 五分类 + GitHub icon set**（design-notes §3.1）
- **Shiki light/dark dual theme**（design-notes §3.2）
- **编辑器选 CodeMirror 6**（design-notes §4.1）— 如反对，提案前先与 ha1den 同步并更新 design-notes EC-D1
- **预览走客户端完整 unified 管道**（design-notes §5.1）— 失败可退回服务端 API
- **不引入 framer-motion / lucide-react / next-intl / marked**（design-notes §11）

### 3.4 文档同步

- 每条偏离 design-notes 的实现，必须在 design-notes §12 加一行
- 实施 / 完成时同步 memory-bank 4 个文件（详 tasks.md M3-D-4）
- 不允许"代码改了文档没改"

### 3.5 浏览器审查

- 归档前必须按 `browser-audit-checklist.md` 走完 12 路由 × 2 mode = 120 个 checkbox
- 所有 P0 issue 必须 close
- 截图归档到 `audit/` 子目录

---

## 4. 工作流（一句话版本）

```
P-1..P-8 (pre-flight)
  ↓
M1-A markdown-reading (22 pairs)
  ↓
M1-B editor-source-contract (16 pairs)
  ↓
M1-C editor-preview-parity (11 pairs)
  ↓ [M1 出口检查：四绿 + 编辑器手动验收]
M2-A admin-readability (11 pairs)
  ↓
M2-B home-redesign (8 pairs)
  ↓
M2-C about-redesign (9 pairs)
  ↓ [M2 出口检查：四绿 + 浏览器 audit M2 阶段]
M3-A incomplete-pages-inventory (2 pairs + 2 docs)
  ↓
M3-B i18n-current-state-audit (3 pairs + 3 docs)
  ↓
M3-C browser audit 完整
  ↓
M3-D 归档 (completion-report + memory-bank sync + git mv archive)
```

每个微循环 ≤ 30 分钟工作量。详 `tasks.md §3-§5`。

---

## 5. 关键文件路径速查

### 5.1 本 SDD 内

```
.claude/sdd/public-ui-and-editor-overhaul/
├── README.md                         # 本文件
├── proposal.md                       # 总体方案
├── design-research.md                # 参考研究
├── design-notes.md                   # 设计决策 + token + 选型
├── specs/
│   ├── markdown-reading/spec.md      # MR-1..MR-10
│   ├── editor-source-contract/spec.md # EC-1..EC-9
│   ├── editor-preview-parity/spec.md  # EP-1..EP-7
│   ├── home-redesign/spec.md         # H-1..H-11
│   ├── about-redesign/spec.md        # A-1..A-12
│   ├── admin-readability/spec.md     # AR-1..AR-10
│   ├── incomplete-pages-inventory/spec.md # IP-1..IP-5
│   └── i18n-current-state-audit/spec.md   # I18N-1..I18N-6
├── test-map.md                       # spec-id → test 函数
├── tasks.md                          # TDD 微循环任务清单
├── i18n-current-state.md             # 多语言现状审计
├── incomplete-pages-inventory.md     # 路由完成度盘点
├── browser-audit-checklist.md        # 浏览器审查清单
├── deferred-v2-v3.md                 # V2/V3 延后清单
└── audit/                            # 执行方在 M3-C 阶段填充
    ├── light/                        # light mode 截图
    └── dark/                         # dark mode 截图
```

### 5.2 代码 / 测试 关键位置

```
TZBlog/
├── src/app/
│   ├── (site)/
│   │   ├── page.tsx              # 首页（home-redesign）
│   │   ├── page.test.tsx
│   │   ├── about/page.tsx        # About（about-redesign）
│   │   ├── about/page.test.tsx
│   │   └── posts/[slug]/page.tsx # 详情页（markdown-reading 影响）
│   ├── (admin)/
│   │   ├── admin/layout.tsx      # admin layout（admin-readability AR-1）
│   │   ├── admin/_editor-demo/   # 编辑器 PoC 沙箱
│   │   └── login/page.tsx
│   ├── api/                      # 所有 API（不动）
│   ├── globals.css               # 主 CSS + 全部 token（markdown-reading + admin-readability）
│   ├── globals.test.ts           # CSS 测试
│   ├── layout.tsx                # RootLayout
│   ├── sitemap.ts                # sitemap（i18n-current-state §13）
│   ├── rss.xml/route.ts          # RSS（i18n 同上）
│   └── robots.ts                 # robots
├── src/lib/
│   ├── markdown.ts               # renderMarkdown 主管道（markdown-reading 核心）
│   ├── markdown.test.ts
│   ├── markdown/__fixtures__/    # 测试 fixture
│   ├── i18n.ts                   # i18n helper（i18n-current-state §1）
│   ├── content/                  # 静态内容数据（about.ts / principles.ts / tech-stack.ts）
│   ├── services/                 # 服务层（不动；i18n-current-state §3）
│   └── visual/contrast.ts        # 对比度 helper（M1-A-3 新建）
├── src/components/
│   ├── editor/                   # 编辑器全套（editor-source-contract + editor-preview-parity）
│   │   ├── MarkdownEditor.tsx                 # CM6 source editor
│   │   ├── MarkdownEditorWithPreview.tsx      # 双栏容器
│   │   ├── MarkdownPreview.tsx                # 详情页用（保留）
│   │   ├── EditorToolbar.tsx                  # toolbar
│   │   └── *.test.tsx
│   ├── markdown/
│   │   └── MarkdownCopyButtons.tsx            # 复制按钮（MR-3.4）
│   ├── site/                     # 前台组件（home-redesign + about-redesign）
│   │   ├── HomeHero.tsx / HomeFeaturedAndRecent.tsx / HomeColumns.tsx / HomePrinciples.tsx / HomeStats.tsx
│   │   ├── TechStack.tsx / GithubCard.tsx / PostCard.tsx / PostToc.tsx
│   │   ├── SiteHeader.tsx / SiteFooter.tsx
│   │   └── about/AboutHero.tsx / AboutNow.tsx / AboutProjectIntent.tsx / ...
│   └── admin/                    # 后台组件（admin-readability）
│       ├── AdminSidebar.tsx / AdminHeader.tsx（M2-A 重写 / 新建）
│       ├── EmptyState.tsx（M2-A-16 新建）
│       ├── posts/ columns/ comments/ media/
│       └── *.test.tsx
├── memory-bank/                  # 项目记忆库（M3-D-4 同步）
├── package.json                  # 依赖（M1-B 增减）
└── prisma/schema.prisma          # DB schema（不动）
```

---

## 6. SDD 协议关键 commit 模板

按 `tasks.md §0` scope 命名。例：

```
test(markdown): MR-1.1 callout tokens existence
feat(markdown): MR-1.1 callout tokens

test(editor): EC-1.1 literal source
feat(editor): EC-1.1 codemirror 6 source editor

test(admin): AR-3 muted-fg contrast
feat(admin): AR-3 muted-fg contrast

chore(editor): EC-6.3 remove tiptap deps         # 无对应 test，但属合理 chore
docs(memory): sync after public-ui-and-editor-overhaul [no-tdd]
```

**husky commit-msg hook** 守护：

- `feat:` 没带 `[no-tdd]` 时必须前 5 commit 内有同 scope 的 `test:`
- `[no-tdd]` 标签仅限：纯样式（CSS / Tailwind）、文档（*.md / docs）、纯依赖增减（package.json + lockfile）
- **重构 / 配置改 / 业务逻辑** 都**不**在 `[no-tdd]` 范围

---

## 7. 不要做的事

执行方在 implementation 期间不允许：

- 跳过 spec 直接动手（先 RED 后 GREEN，严格 micro-cycle）
- 把 8 capability 并行做（按 milestone M1 → M2 → M3 顺序）
- 在没有 ha1den 同意的情况下偏离 design-notes 锁定决策
- 引入 design-notes §11 之外的新依赖
- 改 DB schema / API contract
- 退化现有测试（460 passed / 1 skipped 基线）
- 把 markdown 编辑器搞回 rich-text / WYSIWYG（永久禁止）
- 把多语言迁移塞进本轮（V3 独立 SDD）
- "假装" 多语言（i18n-current-state spec I18N-3）
- 隐藏 / silent failure（throw or visible toast）
- 用 git reset --hard / force push 等破坏性操作（详 CLAUDE.md 核心约束 #6）

---

## 8. 出现意外时

执行方在 implementation 期间发现：

- **spec 写错了 / 自相矛盾**：停下，先在该 spec 末尾加 "Issue Found" 段，描述问题，更新 spec 后再继续；不允许"绕过 spec"
- **decision 不可行**（如 CodeMirror 6 bundle 太大）：在 design-notes §12 调整日志记一条，更新对应 spec / task，**然后**才动代码
- **DB / API 必须改**：停下，回到 proposal.md §3 重新评估；如确实需要，在本目录新建 `addendum-<topic>.md` 写明背景 → 等 ha1den 同意 → 再动
- **测试基线退化**：必须修复 / 调整测试到不退化为止
- **time / scope 不可控**：M3 阶段如不能完成的 spec，写到 `completion-report.md` "未做项" 并明确归属 V2 / V3

---

## 9. 完成定义（DoD）

详 `tasks.md §6`。要点：

- 四绿（typecheck / lint / test / build）
- 浏览器审查 light + dark 12 路由完成，所有 P0 issue close
- memory-bank 4 文件同步
- completion-report.md 写完
- SDD 目录 `git mv` 归档到 `archive/`
- ha1den 复审通过

---

## 10. 联系 / 提问

如果 implementation 期间有任何不确定，**优先**：

1. 重读 `design-notes.md` 看决策是否已锁定
2. 重读对应 spec 看是否已答
3. 看 `memory-bank/systemPatterns.md` 看项目约定
4. 看 `memory-bank/knownIssues.md` 看已知问题
5. 还是不行就在本目录加 `question-<topic>.md` 列问题等回复

不要：

- 自行猜 / 自行决定关键路径
- 看一眼问题就 commit 半成品

---

## 11. 一句话总结

> 这是一份 8 capability / ~176 spec / ~82 commit pair / ~42-58h 的中等规模 SDD feature。
> 工作流是严格的 SDD/TDD micro-cycle，**目标是把 TZBlog 从"半成品骨架"升级到"成熟的个人技术博客"水准**，
> 同时保持 schema / API / 路由树不动，把多语言迁移完整推到 V3 独立 SDD。
> 准备好了就从 `tasks.md §0` Pre-flight 开始。

收工，副驾。

—— 起草：tevxz1n 副驾 @ 2026-05-23
