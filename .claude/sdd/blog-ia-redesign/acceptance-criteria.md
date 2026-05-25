# Acceptance Criteria — 验收清单

> codex 一次性跑完后，HaiDen 用本清单验收。任何一项不通过 → 退回重做。
>
> Reference: `proposal.md` §验收 / `README.md` §完工标准

---

## 1. 功能门（Functional Gate）

### 1.1 数据层

- [ ] `\dt` 输出含：channels / entries / series / channel_translations / entry_translations / series_translations / tags / tags_on_entries / entry_views / entry_likes / comments / rate_limit_logs / page_views / media / site_config / users / accounts / sessions / verification_tokens
- [ ] `\dt` 输出**不含**：posts / columns / post_translations / column_translations / tags_on_posts / post_views / post_likes
- [ ] `SELECT COUNT(*) FROM channels` ≥ 3（含 articles / stream / guestbook）
- [ ] `SELECT COUNT(*) FROM entries WHERE status='PUBLISHED'` ≥ 7（覆盖 7 个 EntryKind 各至少 1 个）
- [ ] `SELECT COUNT(*) FROM users WHERE role='ADMIN'` = 1
- [ ] `SELECT COUNT(*) FROM rate_limit_logs` 起始 = 0（cron 未跑前）

### 1.2 公开端路由

- [ ] `GET /` → 200，渲染 hero + enabled channel preview blocks + trending
- [ ] `GET /c/articles` → 200，CHRONICLE layout
- [ ] `GET /c/stream` → 200，GREP layout
- [ ] `GET /posts/why-i-rewrote-my-blog` → 200，Ink theme + 完整文章渲染
- [ ] `GET /c/stream/link-postgres-locks` → 200，LINK kind 卡片
- [ ] `GET /c/stream/note-2026-05-23` → 200，NOTE kind 渲染
- [ ] `GET /c/articles/series/ebpf-deep-dive` → 200，Series 详情
- [ ] `GET /guestbook` → 200，未登录显示 magic link 登录表单
- [ ] `GET /tags/systems` → 200，跨 channel 聚合
- [ ] `GET /about` → 200，About 页（SiteConfig.metadata.about 渲染）
- [ ] `GET /sitemap.xml` → 200，含所有 published entry URL

### 1.3 后台路由

- [ ] `GET /admin` → 302 redirect to `/login`（未登录）
- [ ] `GET /admin` → 200，admin dashboard（登录后）
- [ ] `GET /admin/channels` → 200，渲染 channel 列表
- [ ] `GET /admin/channels/new` → 200，5 步表单
- [ ] `GET /admin/entries` → 200，渲染 entry 列表（含 kind / status / channel 筛选）
- [ ] `GET /admin/entries/new?channelId=<articles>` → 200，编辑器加载

### 1.4 编辑器

- [ ] Milkdown 编辑器加载 < 500ms（dev mode 5s）
- [ ] 8 个 round-trip fixture 全 pass
- [ ] `<kbd>` `<sup>` 保留**或**有文档化降级
- [ ] slash menu / bubble menu / 图片拖拽 / Mod+S 全工作
- [ ] mobile 375px 不 overflow

### 1.5 主题

- [ ] `/` → Aurora 主题（DOM 含 `data-theme="aurora"`）
- [ ] `/posts/<slug>` → Ink 主题
- [ ] `/c/<stream-slug>` → Terminal 主题
- [ ] 三皮切换无 flash of unstyled content
- [ ] AA 4.5:1 contrast 全过

### 1.6 认证 + Guestbook

- [ ] `/login` 双表单（visitor magic link + admin credentials）工作
- [ ] 填邮箱 → 收到中文 magic link 邮件
- [ ] 点击邮件链接 → 自动登录 → 跳转 `/guestbook`
- [ ] 提交 message → 显示在自己 thread
- [ ] admin 在 `/admin` 看到所有 visitor threads
- [ ] 第三方 visitor 看不到他人 thread

### 1.7 推荐

- [ ] 首页 trending 区显示 5 条最高 score entries
- [ ] 文章详情下一篇推荐工作（series-aware）
- [ ] cron service 启动且每小时跑 recomputeAllTrending

---

## 2. 质量门（Quality Gate）

- [ ] `pnpm typecheck` 0 error
- [ ] `pnpm lint` 0 warning
- [ ] `pnpm test` 全部 215 spec 通过
- [ ] `pnpm build` 成功，无 warning
- [ ] CI 全绿
- [ ] husky commit-msg hook 拦截违规 commit

---

## 3. 性能门（Performance Gate）

- [ ] 首页 Lighthouse mobile ≥ 85
- [ ] 文章详情 Lighthouse mobile ≥ 85
- [ ] 首页 bundle gzip < 250KB
- [ ] 文章详情 bundle gzip < 300KB
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] INP < 200ms

---

## 4. 整洁门（Cleanliness Gate）

下列命令在 `src/` + `prisma/` 中**必须 0 命中**（除 archived `.claude/sdd/` 文档）：

```bash
grep -r "model Post " prisma/                     # 0
grep -r "model Column " prisma/                   # 0
grep -rwn "HomeGarden" src/                       # 0
grep -rwn "HomeHero" src/                         # 0
grep -rwn "HomeColumns" src/                      # 0
grep -rwn "HomeFeaturedAndRecent" src/            # 0
grep -rwn "HomePrinciples" src/                   # 0
grep -rwn "NotionBlockEditor" src/                # 0
grep -rwn "PostEditor" src/                       # 0
grep -rwn "MarkdownEditorWithPreview" src/        # 0
grep -r "from \"@blocknote" src/                  # 0
grep -r "from \"@codemirror" src/                 # 0
grep -r "import.*notionEditorAdapter" src/        # 0
grep -r "import.*markdownBridge" src/             # 0（旧的；新文件名 milkdownBridge.ts）
grep -r "listPosts\|getPostBySlug" src/           # 0
grep -E "@blocknote|@codemirror" package.json     # 0
```

CI 必须加 `cleanup-guard.test.ts` 作为最后一道闸。

---

## 5. SDD 闭环门（SDD Loop Gate）

- [ ] 每个 capability 至少有同 scope 的 `test:` commit + `feat:` commit 对
- [ ] husky `commit-msg` hook 未误拦也未漏拦
- [ ] `[no-tdd]` 标签仅出现在 cleanup / docs / 纯样式 commit
- [ ] `git log --grep="test(" --oneline | wc -l` ≥ 200（覆盖 215 spec 主要项）

---

## 6. 视觉门（Visual Gate）

人工 review：截图对比 `demo-front/demos/{aurora-portal,ink-garden,terminal-workshop}/` 三套对应方向的 HTML：

- [ ] Aurora Portal `/`（hero + project strip + recent）→ 视觉还原 ≥ 90%
- [ ] Ink Garden `/posts/<slug>`（衬线大字 + 朱砂落款 + 52ch reading width）→ 还原 ≥ 95%
- [ ] Terminal Workshop `/c/stream`（grep filter + 等宽 columns + 黑底荧光绿）→ 还原 ≥ 90%

如 ha1den 在 Terminal Workshop demo 有标注"交互问题"，本次 spec 09 必须修复。

---

## 7. 可扩展门（Extensibility Gate / 元模型动态性）

**这是最核心的验收**：

1. HaiDen 在 admin 新建 Channel：
   - slug: `smoke-test`
   - kind: `NOTES`
   - layout: `TIMELINE`
   - translations: { zh: name="冒烟测试" }
   - enabled: true
2. 在 admin 新建 3 个 Entry（kind=NOTE，channelId=smoke-test）
3. 不执行 `pnpm build`，不重启 dev server
4. 访问 `/c/smoke-test` → 应立即看到 3 条 NOTE 渲染（TIMELINE layout）
5. 访问 `/` → 应看到 smoke-test channel 的 preview block

**验收通过**：完全无前端代码改动 → 元模型设计成功

**验收失败**：任何需要改代码才能看到新 channel → 元模型设计需重做

---

## 8. 文档门（Documentation Gate）

- [ ] `memory-bank/projectBrief.md` 已更新（Post→Entry 元模型说明）
- [ ] `memory-bank/systemPatterns.md` 已更新：
  - §2 路由组织（columns 删除，新增 /c, /guestbook）
  - §8 主题系统（重写）
  - §10 反垃圾（加 magic link rate-limit）
  - §11 评论审核（加 visibility 字段）
  - §14 编辑器契约（重写 → Milkdown）
- [ ] `memory-bank/knownIssues.md` 已清理（旧 Post/Column 相关 issue 标 RESOLVED）
- [ ] `memory-bank/progress.md` 加 blog-ia-redesign 完成行
- [ ] CLAUDE.md §14（如有）已与新 systemPatterns 一致

---

## 9. Git 历史门（Git Hygiene Gate）

- [ ] 所有 commit 走 conventional commits + scope（test/feat/refactor/chore/docs）
- [ ] commit-msg hook 工作
- [ ] 无 `--no-verify` 绕过的 commit
- [ ] BlockNote SDD 已 `git mv` 到 `.claude/sdd/archive/2026-05-25-notion-block-editor/`
- [ ] 加 `SUPERSEDED.md` footer
- [ ] PR 描述含本 acceptance-criteria.md 完成清单

---

## 10. HaiDen 主观验收

ha1den 自己用一下：
- [ ] 写一篇 ARTICLE，编辑器体验是否像 Notion/Obsidian
- [ ] 体验 Ink 主题文章详情（朱砂落款 + 52ch + 衬线字）感觉如何
- [ ] 在 Terminal 主题 GREP layout 输入关键字，filter 反馈是否流畅
- [ ] 在 admin 新建 Channel 流程是否易用
- [ ] 在 admin 编辑 entry，metadata 表单是否符合直觉
- [ ] magic link 登录流程是否顺畅
- [ ] 整体审美是否与 demo-front 期望一致

如任何一项打 ≤ 3/5 → 列具体反馈，标 P0/P1/P2，进入修复迭代。

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T14:00:00Z -->
