# proposal: blog-ia-redesign

> SDD umbrella 提案。作者：HaiDen + Claude。日期：2026-05-25。
>
> 本文是整个重构的范围与决策锚点。所有 specs 必须遵守这里定义的边界。

---

## Intent（为什么做）

当前 TZBlog 是「硬编码 4 板块博客」（首页 / 文章 / 专栏 / 关于）。每加一个新栏目（每日一笑 / 每日热点 / AI 知识 / 读书推荐 / 编程心得 / ...）必须改 6 处代码：

1. 建表（Prisma migration）
2. 写 API（CRUD route）
3. 写 Server Component（前台展示）
4. 写 layout slot（首页插入）
5. 写后台 CRUD UI（admin 管理）
6. 写测试覆盖以上 5 项

这不是博客限制，是 **IA（信息架构）锁死**。要解决就得换元模型：把 `Post + Column` 升级为通用的 `Channel + Entry`，让「新栏目」成为后台操作而不是工程任务。

同时趁这次重构一并完成：

- **编辑体验升级**：当前 CodeMirror 6 source editor → Milkdown（Notion/Obsidian 级别）
- **互动升级**：当前只匿名评论 → 加入邮箱 magic link 登录 + Guestbook 私密留言板
- **视觉升级**：当前单一 design system → 三套主题 design system，让不同内容类型有不同视觉语汇
- **推荐升级**：当前无推荐 → trending score + 系列下一篇

---

## Scope

### In Scope

| 模块 | 内容 |
|------|------|
| 数据层 | Prisma schema 升级：Channel + Entry + Series + 迁移旧 Post/Column 为 reseed |
| 后台 | Channel CRUD + Entry 编辑（替换 PostEditor，接入 Milkdown） |
| 编辑器 | Milkdown 集成 + slash command + bubble menu + 图片上传 + 代码块 Shiki + Mod+S 保存 + Markdown round-trip parity |
| 前台 | 首页改造为动态 Channel 渲染；新增 Channel 列表 / Entry 详情（三皮根据路由切换）；保留 `/posts/[slug]` SEO URL 给 ARTICLE kind |
| 主题 | 三套 CSS 变量 token（Aurora / Ink / Terminal）+ 路由级硬映射 |
| 认证 | Auth.js v5 加 Email provider（Resend）+ 现有 Credentials provider 共存 |
| 留言 | Guestbook（GUESTBOOK kind channel）+ Comment 加 visibility 字段，私密会话仅本人 + admin 可见 |
| 推荐 | trendingScore cron 每小时 + 下一篇算法（series + similar tags） |
| 清理 | 旧 Post/Column/HomeGarden/PostEditor 等代码 delete |
| Seed | reseed 一批 showcase Channel + Entry（覆盖三主题 + 5 layout） |

### Out of Scope（明确推迟）

| 项 | 推迟到 | 理由 |
|---|--------|------|
| AI 热点同步 + AI 评论生成 | V2 单独 SDD | 用户："此功能有待商榷" |
| 多语言 i18n routing | V3 独立 SDD | 不与 IA 重构耦合 |
| 主题用户切换器 | 永不做 | 路由级硬映射决策已锁，违反"每页定调"设计意图 |
| Channel page builder / 拖拽编辑 | 永不做 | 防止滑成 Strapi，强约束 5-6 个预设 layout |
| 评论邮件通知 | V2 backlog | |
| 用户系统扩展（个人主页 / 关注 / 私信） | 永不做 | 定位仍是个人博客 |
| 商业合作专门页面 | 不做 | About 页 + SiteConfig 扩展即可 |
| URL 向后兼容 | 不做 | 开发期可破坏，旧 URL 全废 |

---

## Already-Decided（已锁定决策）

下面每条都是 ha1den 明确确认后锁定的，spec 编写时不再追问。

| # | 项 | 决策 | 来源 |
|---|---|------|------|
| D1 | 重构范围 | 全量做（不分阶段渐进） | 用户："愿意重构" |
| D2 | 编辑器策略 | Milkdown（Markdown-native，节点 1:1 映射 Markdown AST） | 用户选择 |
| D3 | 登录方式 | Auth.js v5 Email Provider + Resend SMTP（沿用 split-config） | 用户选择 |
| D4 | 邮箱域名白名单 | **无白名单**，完全开放 + 频控反垃圾 | 用户最终选择（覆盖原"域名限制"诉求） |
| D5 | AI 热点 + 评论 | 推迟到 V2 backlog | 用户："此功能有待商榷" |
| D6 | 三主题切换粒度 | 路由级硬映射，无前台切换器 | 用户选择 |
| D7 | 数据迁移策略 | 破坏式（drop 旧表 + reseed），不保 URL 兼容 | 用户："开发阶段，可大胆处理" |
| D8 | 旧代码处理 | 全部 delete，不留 `_deprecated` / re-export shim / 注释残骸 | 用户："不要有残留，避免堆成屎山" |
| D9 | 编辑器约束解除 | CLAUDE.md §14"禁止 Tiptap/ProseMirror"约束 → 解除 | 用户要 Notion 体验 |
| D10 | Channel layout 数量 | 限定 5 个预设：CHRONICLE / CARDS / TIMELINE / GREP / FEED | 防过度抽象 |
| D11 | SMTP 服务 | Resend（详细对比见 research/magic-link-auth.md） | 用户选择 |
| D12 | 主题映射规则 | `/` 和 `/c/[slug]` (非 STREAM) 和 `/about` = Aurora；`/posts/[slug]` = Ink；Channel kind=STREAM 或 layout=GREP/TIMELINE = Terminal | 推论自 D6 |
| D13 | 反垃圾依赖 | magic link 验证 + rate-limit + 留言频控 + 后台审核（无 IP/邮箱白名单） | 用户选择 |
| D14 | 长任务执行 | codex 一次性跑完全部 16 spec，HaiDen 配合 review | 用户："交由 codex 一次性全部完成" |
| D15 | 历史 BlockNote SDD 处置 | `.claude/sdd/notion-block-editor/` 标 SUPERSEDED + 归档 `.claude/sdd/archive/2026-05-25-notion-block-editor/`；现有 BlockNote 集成代码（`NotionBlockEditor.tsx` / `markdownBridge.ts` / `notionEditorAdapter.ts` / `predecessorRemoval.test.ts` / `@blocknote/*` deps）进入 cleanup checklist 全部 delete | ha1den 2026-05-25 决策（在被告知 5/24 Gate B PASS 历史后仍选切换 Milkdown） |
| D16 | 可复用经验 | BlockNote SDD 的 P0 fixture（`.claude/sdd/notion-block-editor/poc/sample.md`）+ test-map round-trip 方法论 1:1 转译给 Milkdown POC，避免推倒重来损失 | 经验沉淀，不丢 5/24 调研价值 |

---

## 解除的约束（写进 systemPatterns.md）

CLAUDE.md / systemPatterns.md §14 原约束：

> ~~编辑器永远显示 Markdown 原文；禁止回退到 Tiptap / ProseMirror / WYSIWYG~~

**本次重构正式解除**，改为：

| 新约束 | 内容 |
|--------|------|
| C1 | 编辑器底层可以是 ProseMirror / Tiptap / Milkdown 等任何 rich block 库 |
| C2 | **存储格式必须是 Markdown 字符串**（不可改为 editor 私有 JSON） |
| C3 | 必须通过 Markdown round-trip parity test：指定 fixture 文档 import → export 后字面相等（详见 acceptance-criteria.md） |
| C4 | 渲染必须复用 `renderMarkdown` 管道（不允许另起渲染器） |
| C5 | 编辑器候选必须通过 acceptance-criteria.md 中的「编辑器最小 contract」 |
| C6 | 编辑器内 preview 也必须走 `renderMarkdown`，禁止 `miniRenderMarkdown` 类客户端简化 renderer |

---

## Approach（高层路径）

### 三轴重构

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ Axis 1: 元模型           │  │ Axis 2: 主题系统         │  │ Axis 3: 互动 + 编辑器     │
│                         │  │                         │  │                         │
│ Channel + Entry + Series│  │ Aurora (route /)        │  │ Magic link 登录         │
│ + metadata Json         │  │ Ink (route /posts)      │  │ Guestbook 私密         │
│ + 5 layouts             │  │ Terminal (STREAM)       │  │ trending + 下一篇       │
│ + per-kind Zod schema   │  │ + CSS var layering      │  │ + Milkdown 编辑器       │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
                                       │
                                       ↓
                       16 capability spec ($specs/01..16)
                                       │
                                       ↓
                       codex 一次性执行 M1 → M2 → M3 → M4 → M5
```

### M1-M5 Milestones

| M | 名称 | 关键内容 | spec 子集 | 工时预估 |
|---|------|----------|-----------|----------|
| M1 | Schema + Migration | Channel/Entry/Series 模型 + drop 旧表 + reseed showcase | §01, §15 | 5 天 |
| M2 | Admin CMS + Editor | Channel CRUD + Entry 编辑 + Milkdown 接入 | §02, §10, §11 | 6 天 |
| M3 | Theme System | 三主题 token + 路由级切换 + globals.css + shadcn 兼容 | §03, §04 | 4 天 |
| M4 | Public UI | 首页动态 Channel + Channel 列表 + Entry 详情（三皮） | §05, §06, §07, §08, §09 | 6 天 |
| M5 | Auth + Guestbook + 推荐 | Magic link + Guestbook + trending cron + 下一篇 + 旧代码 cleanup | §12, §13, §14, §16 | 4 天 |

**总：3-4 周（codex 不间断执行约 3-4 天，扣除人工 review + 调整约 4 周）**

每个 milestone 完成后：
- 跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- 跑 milestone 专属 smoke test
- HaiDen review checkpoint
- 通过才进下一 milestone

---

## Risks + Mitigations

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Milkdown round-trip 有损（特殊语法丢失） | 中 | 高 | 编写 fixture-based round-trip test，5-8 个 Markdown 测试文档全 pass 才合格；发现损失立刻补 plugin 或加自定义 schema |
| 元模型滑向通用 CMS | 中 | 高 | 强约束 layout = 5 个；metadata schema 必须 typed（Zod discriminated union）；admin UI 不暴露 schema editor；不开放 page builder |
| Resend 在中国邮箱投递率不稳 | 高 | 中 | research/magic-link-auth.md 给 fallback 方案（自建 SMTP via SendGrid relay）；dev 环境用 console log magic link |
| trending 算法对低流量过敏 | 中 | 低 | 加权 recency + 冷启动 fallback（按 createdAt desc）；low-data mode 在 SiteConfig 可配 |
| Codex 一次性执行 16 spec 失败/超时 | 中 | 高 | acceptance-criteria.md 写明每个 milestone 的 checkpoint 命令；每 milestone 完成 commit + verify 通过才进下一个；失败时按 codex-handoff.md 的失败回滚流程 |
| 三主题 token 命名冲突 | 中 | 中 | research/theme-token-strategy.md 给严格命名规则 + 完整 globals.css 草案；命名前缀强制（aurora-/ink-/terminal-） |
| 数据破坏式迁移误删 ha1den 已写真实内容 | 高 | 高 | migration-plan.md 第一步要求 `pnpm db:export-json` 全量导出当前 DB 到 backup/，加 `--force` flag 才执行 drop |
| Milkdown 学习成本高 | 中 | 中 | research/editor-comparison.md 给完整集成代码 + 推荐 phase 1 最小集，phase 2 增强延后 |

---

## Open Questions

下面问题在 design-notes.md 详述，默认按"倾向"答案推进，除非 HaiDen review 时推翻：

- [ ] Q1 M1 Tag 模型是否要升级？倾向**不升级**，标签是通用的，无 channel 强归属
- [ ] Q2 M2 编辑器图片上传走现有 `/api/media/upload` 还是 Milkdown 内置 plugin？倾向**用现有 endpoint**（MinIO 已接入，统一鉴权）
- [ ] Q3 M3 三套字体加载方式（每个 layout 独立 next/font 还是统一 root）？倾向**layout 独立**，避免每页加载全部
- [ ] Q4 M4 首页 Channel 顺序是 Channel.order 字段还是后台拖拽？倾向 **Channel.order Int 字段**，后台 UI 出上下移动按钮（不做拖拽）
- [ ] Q5 M5 Magic link 邮件中文/英文？倾向**中文**（内容主语言）
- [ ] Q6 Channel 是否软删除？倾向**硬删除**（开发期），生产期改为 archive flag
- [ ] Q7 Guestbook 是否做 thread 树？倾向**不做**，1 visitor 创建 1 thread Entry，admin 回复=Comment with visibility=PRIVATE_TO_VISITOR
- [ ] Q8 首页 Hero 文案/头像是否需要 HaiDen 提供？倾向**先用 placeholder bio**，HaiDen 后续在 SiteConfig 替换
- [ ] Q9 是否在 M5 同时做 SitemapV2（按 Channel 重新生成 sitemap）？倾向**做**（已有 sitemap 路由要更新）
- [ ] Q10 Channel.theme 字段是否暴露给 admin 选择？倾向**不暴露**，theme 由 kind/layout 推论（路由级硬映射的延伸）

---

## 验收（高层维度）

详见 `acceptance-criteria.md`。

1. **功能门**：16 capability 每条都通过对应 e2e/integration/unit smoke
2. **质量门**：`typecheck` / `lint` / `test` / `build` 全绿
3. **性能门**：Lighthouse mobile ≥ 85，首页 bundle gzip < 250KB，文章详情 < 300KB
4. **整洁门**：grep `model Post ` / `HomeGarden` / `PostEditor` 在 src/ 和 prisma/ 中 **0 命中**（除 archived SDD 文档）
5. **SDD 闭环门**：16 capability 都有 `test(<scope>): <spec-id>` commit + `feat(<scope>): <spec-id>` commit 对
6. **视觉门**：三主题截图对比 `demo-front/demos/{aurora-portal,ink-garden,terminal-workshop}/*.html` ≥ 90% 还原度（人工 review）
7. **可扩展门**：HaiDen 在后台新建一个 Channel（名为「smoke-test-channel」），slug `smoke-test`，kind=NOTES，layout=TIMELINE，添加 3 条 Entry，前台 `/c/smoke-test` 立即可见且能正常浏览 → 完成

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T12:00:00Z -->
