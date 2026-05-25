# blog-ia-redesign · SDD Umbrella

> 把 TZBlog 从「硬编码 4 板块博客」重构为「可持续装下任意 Channel/Entry 的个人内容操作系统」。
>
> 作者：HaiDen + Claude  ·  启动日期：2026-05-25  ·  目标交付方：codex（一次性长任务执行）

---

## 一句话定位

把当前 `Post + Column + 硬编码首页` 元模型升级为 `Channel + Entry + Series + 动态首页`，并在同次重构里完成：

- **Notion-like (Milkdown) 编辑器** 替换 CodeMirror 6 source editor
- **邮箱 magic link 登录**（Resend SMTP，无白名单 + 频控反垃圾）
- **私密留言板（Guestbook）** —— 留言仅本人与管理员可见
- **三主题路由级硬映射**：Aurora 首页 / Ink 文章详情 / Terminal 技术 stream
- **trending score 推荐 + 系列下一篇**
- **破坏式数据迁移**：drop 旧表、重 seed showcase 数据，不保 URL 兼容
- **代码彻底清理**：旧 Post/Column/HomeGarden/PostEditor 等 delete，不留 deprecated 残留

---

## 文档读取顺序（codex 必读）

| # | 文件 | 用途 | 谁负责 |
|---|------|------|--------|
| 1 | `proposal.md` | 范围 / 已锁决策 / 解除约束 / 不要做的事 | 必读首篇 |
| 2 | `research/editor-comparison.md` | Milkdown 集成完整方案 + 候选对比 | 影响 §02 |
| 3 | `research/magic-link-auth.md` | Auth.js v5 + Resend + magic link 完整代码 | 影响 §12 |
| 4 | `research/channel-meta-cms.md` | Channel/Entry 元模型设计 + Zod schemas | 影响 §01 §10 §11 |
| 5 | `research/recommendation-algorithm.md` | trending 公式 + 下一篇算法 | 影响 §14 |
| 6 | `research/theme-token-strategy.md` | 三主题 CSS 变量分层 + 完整 globals.css | 影响 §03 §04 §07 §08 §09 |
| 7 | `design-notes.md` | 关键设计决策记录（含 Open Questions 答案） | 必读 |
| 8 | `schema-diff.md` | Prisma schema 完整 diff（before/after） | 影响 §01 §15 |
| 9 | `migration-plan.md` | 破坏式数据迁移步骤 + reseed 内容 | 影响 §15 |
| 10 | `specs/01-schema/*.md` ... `specs/16-cleanup/*.md` | 16 组 GIVEN/WHEN/THEN | 实现门 |
| 11 | `test-map.md` | 每个 spec-id 对应的测试函数 / 文件 / 层级 | 必读 |
| 12 | `tasks.md` | M1-M5 微循环（每个 micro-cycle = [TEST-RED] + [IMPL-GREEN] 配对） | 执行清单 |
| 13 | `acceptance-criteria.md` | 验收清单（含可执行命令 + 截图要求） | 自检门 |
| 14 | `codex-handoff.md` | codex 入口：自检流程 + 失败回滚 + 与人协作节奏 | 执行 SOP |

---

## 这次重构 **不做** 的事

- ❌ AI 热点同步 + AI 评论自动生成（推迟到 V2 backlog，单独 SDD）
- ❌ 多语言 i18n routing（推迟到 V3 SDD，schema 仍保留 *Translation 子表）
- ❌ 主题用户切换器（决策已锁：路由级硬映射）
- ❌ Channel page builder / 拖拽编辑（永不做，强约束）
- ❌ 保留旧 URL 兼容（开发期，破坏式迁移）
- ❌ 保留 deprecated 代码 / re-export shim（删干净）
- ❌ 评论邮件通知（V2 backlog）
- ❌ 用户社区 / 关注 / 个人主页（永不做，定位仍是个人博客）
- ❌ 商业合作专门页面（用 About 页 + SiteConfig 扩展即可，不开独立 Channel）

---

## 全局约束（贯穿所有 spec）

| 约束 | 内容 |
|---|---|
| 存储格式 | `Entry.body` 永远是 Markdown 字符串，**禁止**切到 ProseMirror JSON 持久化 |
| 渲染管道 | 复用现有 `renderMarkdown` (remark + rehype + Shiki)，编辑器内 preview 也走这套 |
| 编辑器 | Milkdown，必须通过 Markdown round-trip parity test |
| 颜色 | 所有颜色用 CSS 变量，三主题 token 各自独立 layer |
| 数据 | 任何前台展示字段绝不硬编码 default copy；从 SiteConfig / Channel / Entry 读取 |
| 安全 | 留言登录走 magic link；rate-limit 在 /api 入口；evidence-based 反垃圾（无白名单） |
| 测试 | 严格 SDD 微循环：1 spec = 1 [TEST-RED] + [IMPL-GREEN] 配对 |
| Commit | `test(<scope>): <spec-id>` 后 `feat(<scope>): <spec-id>`；纯样式才允许 `[no-tdd]` |
| 不留残留 | 旧表 drop、旧组件 delete、旧路由 remove，grep 关键字（Post/Column/HomeGarden/PostEditor）在 src/ 应该是 0 命中 |

---

## 完工标准（高层，详见 `acceptance-criteria.md`）

- [ ] 后台可在 Channel 管理新建任意频道（如「每日一笑」「读书推荐」），无需任何前端代码改动即可在前台显示
- [ ] 文章编辑器 = Milkdown，支持 slash command / 拖拽 / 图片 / 代码块 / 数学公式
- [ ] 同一 Markdown 文档在编辑器中所见与 publish 页所见 parity（视觉对齐 ≥ 95%）
- [ ] 路由 `/` = Aurora 皮，`/posts/[slug]` = Ink 皮，`/c/[slug]` 中 kind=STREAM 的 = Terminal 皮
- [ ] 访客通过邮箱 magic link 登录后可在 Guestbook 留言（仅本人 + admin 可见）
- [ ] 首页「推荐文章」接 trending score，每小时刷新
- [ ] 文章详情底部「下一篇」按 series → similar tags 智能推荐
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` 全绿
- [ ] 旧 Post/Column 表 + 旧组件 + 旧路由全部 drop / delete，仓库 grep 0 残留
- [ ] 三主题截图对比 demo-front 中对应方向 ≥ 90% 还原

---

## 状态

| 阶段 | 状态 | 备注 |
|------|------|------|
| Phase A：调研 + proposal | ✅ 完成 | 5 个 Agent 全部 sandbox 失败；主代理接管全部 research 写作 |
| Phase B：specs / test-map / tasks | ✅ 完成 | 16 capability + 215 spec + test-map + tasks |
| Phase C：schema-diff / migration / acceptance / handoff | ✅ 完成 | 4 份 control 文档全部落盘 |
| Phase D：HaiDen review + 定稿 | ⏳ 待 HaiDen 审阅 | 关键修正：D15 BlockNote SDD supersede + D16 fixture/方法论复用 |
| 交付 codex 执行 | ⏳ HaiDen review 后启动 | |

## 与 5/24 BlockNote SDD 的关系

| 项 | 决策 |
|---|------|
| BlockNote SDD `.claude/sdd/notion-block-editor/` | **SUPERSEDED**，归档到 `.claude/sdd/archive/2026-05-25-notion-block-editor/` |
| 编辑器选型 | Milkdown（覆盖 BlockNote）|
| BlockNote 集成代码 | 进入 cleanup checklist 全部 delete |
| BlockNote SDD 的 P0 fixture (sample.md) | **保留**：1:1 转译为 Milkdown POC fixture |
| BlockNote SDD 的 round-trip 方法论 | **保留**：复用为 Milkdown editor-comparison.md §4 |

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T12:00:00Z -->
