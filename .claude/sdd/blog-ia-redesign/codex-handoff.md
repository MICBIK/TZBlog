# Codex Handoff — 执行 SOP

> codex 一次性执行入口：完整工作流程 + 自检流程 + 失败回滚 + 决策授权。
>
> 假设 codex 是无状态的，本文档要让 codex 不依赖此对话即可执行。
>
> **status: LOCKED · 2026-05-25 · HaiDen 已 review 签字**
>
> **执行授权范围（HaiDen 预授权，不需要再问）**：
> - 全部 SDD 范围内的破坏性操作（drop 旧表 / migrate reset / rm -rf 旧组件 / git mv 归档 / pnpm remove 旧包）
> - 全部 215 spec 的 [TEST-RED] + [IMPL-GREEN] commit
> - milestone 间自动推进（无人工 checkpoint，全绿即进下一个）
> - SDD 决策的 sub-decision（fixture 命名、文件路径细节、变量命名等）
> - 失败时按本文档 §4 自动 fallback，不询问

---

## 0. 你（codex）的任务

把 TZBlog 从「硬编码 4 板块博客」重构为「Channel + Entry 元模型博客」，同次重构完成：

1. Prisma schema 替换（破坏式迁移）
2. Milkdown 编辑器集成（替换 BlockNote + CodeMirror）
3. 三主题（Aurora / Ink / Terminal）路由级硬映射
4. Auth.js v5 + Resend Email Provider + magic link
5. 私密 Guestbook 留言板
6. Trending score + 下一篇推荐
7. 完整旧代码清理 + SDD 归档

**HaiDen 不会在执行过程中回复**。你必须靠本 SDD 包内的所有文档自主完成。任何决策歧义按 §4 自动 fallback 处理。最终交付：一个完成所有 acceptance gate 的 PR。

工时预估：3-4 周连续。建议你按 milestone 切分会话以保持上下文窗口健康。

---

## 1. 阅读顺序（必读，按顺序）

```
1. .claude/sdd/blog-ia-redesign/README.md        # 本 SDD 总入口
2. .claude/sdd/blog-ia-redesign/proposal.md      # 16 锁定决策 + 5 milestone
3. .claude/sdd/blog-ia-redesign/design-notes.md  # 11 个 Open Question 答案 + 11 个架构决策
4. .claude/sdd/blog-ia-redesign/research/*.md    # 5 份调研：
   - channel-meta-cms.md       (Channel/Entry 元模型 + Prisma schema 完整草案)
   - editor-comparison.md      (Milkdown 完整集成 skeleton + 8 fixture)
   - magic-link-auth.md        (Auth.js v5 + Resend + 三维频控)
   - theme-token-strategy.md   (三主题 token + 路由级映射 + 字体加载)
   - recommendation-algorithm.md  (trending 公式 + 下一篇 + cron 部署)
5. .claude/sdd/blog-ia-redesign/schema-diff.md   # before/after Prisma diff
6. .claude/sdd/blog-ia-redesign/migration-plan.md  # 破坏式迁移 5 步骤
7. .claude/sdd/blog-ia-redesign/specs/*/capability.md  # 16 capability spec (GIVEN/WHEN/THEN)
8. .claude/sdd/blog-ia-redesign/test-map.md      # spec-id → 测试函数映射 (215 spec)
9. .claude/sdd/blog-ia-redesign/tasks.md         # M1-M5 微循环结构 + commit 数预估
10. .claude/sdd/blog-ia-redesign/acceptance-criteria.md  # 验收清单
11. CLAUDE.md                                     # 项目级指令
12. memory-bank/systemPatterns.md                # 当前架构 (将被部分重写)
```

读完 1-10 之后再开始动手。**禁止跳读**。

---

## 2. 执行节奏（M1-M5）

每个 milestone：
1. 读对应 capability spec
2. 按 tasks.md 中微循环顺序写 [TEST-RED] + [IMPL-GREEN]
3. 每 commit 必须粘真实终端 FAIL/PASS 输出
4. milestone 完成跑：
   ```bash
   pnpm typecheck && pnpm lint && pnpm test && pnpm build
   ```
5. **全绿自动进下个 milestone**（无人工 checkpoint）。任一项失败 → 按 §4 自动 fallback，最多重试 3 轮，仍失败则 issue 加旁路（记录在 `KNOWN-DEVIATIONS.md`）继续推进，不阻塞。

### Milestone tag

每完成一个 milestone 打 git tag 便于后续诊断：

```bash
git tag m1-schema-migration-complete
git tag m2-editor-admin-complete
git tag m3-theme-system-complete
git tag m4-public-ui-complete
git tag m5-auth-guestbook-recommendation-complete
```

---

## 3. 不可越线（违反即拒绝合入）

1. **Entry.body 永远是 Markdown 字符串**——不允许切到 ProseMirror JSON
2. **不留 deprecated 代码 / re-export shim / 注释残骸**——grep guard 守门
3. **5 个 layout + 8 个 EntryKind enum 不能扩展**——admin 不能加新值
4. **Channel.theme 字段不存在**——主题由路由推论
5. **不做 page builder / 拖拽编辑**——admin 仅表单
6. **Markdown round-trip parity test 必须全 pass**（editor-001 ~ 007、009）——任一失败按 §4.2 处理 editor-008
7. **不做用户系统扩展**（个人主页 / 关注 / 私信）
8. **不做 AI 热点同步**（V2 backlog）
9. **不做多语言 i18n routing**（V3 backlog）
10. **每条 spec = 1 [TEST-RED] commit + 1 [IMPL-GREEN] commit**——禁批量
11. **`[no-tdd]` 仅限纯样式 / 文档 / 纯 deps**——重构 / 配置变更 / 依赖增减不在范围
12. **不调用未在 5 份 research 中预先批准的第三方库**——例外：本文档 §4 fallback 路径中预先批准的备选库

---

## 4. 失败回滚 / 自动 fallback 流程

### 4.1 单 spec 失败（普通）

- `[IMPL-GREEN]` 阶段实现写不通，超时 1 小时未通过：
  1. revert 最近的 `[IMPL-GREEN]` 尝试
  2. 重审 spec：测试期望是否正确？
  3. 如认为 spec 有问题：自动跳过此 spec，在 `KNOWN-DEVIATIONS.md` 加一行记录（spec-id + 跳过理由 + impact），继续推进
  4. 如认为实现有问题但找不到：重试 3 轮（每轮换思路），仍失败则跳过 + 记录
- **不报告 HaiDen，自动决策跳过**

### 4.2 Editor Gate B 失败（最高风险点，预设决策）

editor-001 ~ 007、009 round-trip fixture 任一失败 → **STOP M2，按以下顺序自动 fallback**：

| 失败 spec | 自动 fallback |
|----------|-------------|
| editor-008（inline HTML `<kbd>` `<sup>` 丢失） | **自动接受降级**（B1 path）：文档化到 `KNOWN-DEVIATIONS.md`，加 editor onboarding 提示用 inline code (`` `Ctrl+S` ``) 替代。继续推进。 |
| editor-001 ~ 007、009 任一失败 | 1) 加 `@milkdown/plugin-trailing` `@milkdown/plugin-history` 等增强 plugin 重试<br>2) 如仍失败 → 自动切换到 MDXEditor（Lexical-based）重做 §02 spec<br>3) 仍失败 → 在 `KNOWN-DEVIATIONS.md` 记录所有失败 fixture + 实施降级版（用 source view + preview split），不阻塞 |

不询问 HaiDen。MDXEditor 备选包：`@mdxeditor/editor` `@mdxeditor/plugin-codeblock` 等（已预授权）。

### 4.3 Milestone 失败（严重）

- M1 失败（schema 写不出）：3 轮重试 → 仍失败 → tag `m1-failed-needs-review` 后停下，在 `M1-FAILURE-REPORT.md` 写完整 root cause（含 prisma error / typecheck error 截图）
- M2 / M3 / M4 / M5 失败：同上模式

只在**根本性失败**（schema 写不出 / Prisma 版本不兼容 / Next.js 16 重大 break）时才停下。日常 spec 失败按 §4.1 自动跳过。

### 4.4 整体回滚（仅在自动 fallback 全失败时）

```bash
git tag pre-blog-ia-redesign  # M1 开始前打 tag（自动）
git reset --hard pre-blog-ia-redesign  # 仅当 codex 判断无法继续时执行
```

**预授权**：codex 可以自主判断是否回滚到 tag。判断标准：≥ 3 个 milestone 失败 + `KNOWN-DEVIATIONS.md` ≥ 30 条记录 → 触发整体回滚 + 写完整 `EXECUTION-FAILURE-REPORT.md` 后停下。

### 4.5 第三方库 / 网络问题

- `pnpm add` 失败（网络 / registry）：自动重试 3 次（间隔 30s），仍失败则切换到 npm registry mirror（`pnpm config set registry https://registry.npmmirror.com/`），仍失败记录后跳过该 deps，找替代实现
- Resend API 在 dev 模式下 mock（不实际发邮件），`AUTH_RESEND_KEY` 缺失时 console.log magic link URL 即可（详见 magic-link-auth.md §11）

---

## 5. 决策授权（HaiDen 委托给 codex）

下面这些都**不用问**，直接做决策：

| 场景 | 决策权 |
|------|-------|
| 文件命名 / 路径细节 | codex 自主决定，符合 CLAUDE.md 编码规范即可 |
| 微小重构（同一 commit 内的内联优化） | codex 自主 |
| 包版本选择（同 major 内最新 stable） | codex 自主 |
| 测试命名（描述性 camelCase） | codex 自主 |
| commit 信息内容（符合 conventional commits） | codex 自主 |
| 删除旧文件批次 ≤ 10 个 | 预授权，直接 `rm` |
| 删除旧文件批次 > 10 个 | 预授权（本 SDD 范围内），直接 `rm` |
| `git mv` 归档 | 预授权 |
| `git tag` | 预授权 |
| `pnpm prisma migrate reset --force` | 预授权（仅本 SDD 执行期间） |
| `pnpm add` 在 5 份 research 范围内的包 | 预授权 |
| `pnpm add` §4 fallback 中的备选包 | 预授权 |
| `pnpm remove @blocknote/* @codemirror/*` | 预授权 |
| 编辑 `memory-bank/*.md` | 预授权（按 design-notes.md §"与现有 systemPatterns.md 的关系"表执行） |
| 编辑 `CLAUDE.md` §14 | 预授权（同步去掉 Tiptap/ProseMirror 禁止条款，引用本 SDD） |
| `git push -u origin <branch>` | 预授权（任何分支） |
| `git push origin main` | **禁止**（除非走 PR） |
| `gh pr create` | 预授权 |

进入下列任一情况 → **必须停下写 report 后退出**（即"严重失败"）：

- ≥ 3 个 milestone 失败（不只是单 spec）
- `KNOWN-DEVIATIONS.md` ≥ 30 条
- 数据库无法启动 / Prisma 完全不兼容
- 真实安全 issue 出现（如 Resend secret 不慎入 git）

退出方式：
```bash
git tag execution-paused-$(date +%F)
git push --tags
# 在 PR 描述写完整 root cause + 当前状态 + 建议方向
```

---

## 6. 工具偏好

- 包管理：**pnpm only**（绝对禁止 npm / yarn）
- 测试：vitest + @testing-library + Playwright
- 部署：Docker Compose + Caddy 自部署 VPS
- ORM：Prisma 7
- 编辑器：Milkdown 7.x（fallback：MDXEditor 见 §4.2）
- 邮件：Resend SDK + React Email
- Cron：node-cron 包 + 独立 docker service

---

## 7. 自检清单（每 milestone 末跑一次）

```bash
# 1. 类型
pnpm typecheck                                    # 0 error

# 2. Lint
pnpm lint                                         # 0 warning

# 3. 测试
pnpm test                                         # 全 pass（容忍 KNOWN-DEVIATIONS.md 中标记的 skipped）

# 4. 构建
pnpm build                                        # 成功

# 5. Cleanup guard
grep -r "model Post " prisma/ | wc -l            # = 0
grep -rwn "HomeGarden" src/ | wc -l              # = 0
grep -r "from \"@blocknote" src/ | wc -l         # = 0
grep -E "@blocknote|@codemirror" package.json | wc -l  # = 0

# 6. 数据库
pnpm prisma migrate status                       # up to date
psql $DATABASE_URL -c "SELECT COUNT(*) FROM channels"  # ≥ 3

# 7. Smoke 浏览器（M3 后启用）
# 手动 fetch 验证（dev server 已启动情况下）：
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/        # 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/c/articles  # 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/c/stream    # 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/posts/why-i-rewrote-my-blog  # 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/guestbook   # 200
```

任一项失败 → 进入 §4 自动 fallback 流程。不进下个 milestone。

---

## 8. 完工后必做（自动执行）

按顺序执行，无需询问：

1. 更新 `memory-bank/progress.md` 加 blog-ia-redesign 完成行
2. 更新 `memory-bank/systemPatterns.md`（按 design-notes.md §"与现有 systemPatterns.md 的关系"表执行）
3. 更新 `memory-bank/activeContext.md` 清除"Post/Column" 残留描述
4. 更新 `memory-bank/knownIssues.md` 标 RESOLVED 旧 issue
5. 编辑 `CLAUDE.md` §14：解除 "禁止 Tiptap/ProseMirror" 约束，引用本 SDD acceptance criteria
6. `git mv .claude/sdd/notion-block-editor .claude/sdd/archive/2026-05-25-notion-block-editor`
7. 在 `.claude/sdd/archive/2026-05-25-notion-block-editor/SUPERSEDED.md` 写：`本 SDD 已被 .claude/sdd/blog-ia-redesign/ 取代（2026-05-25 决策）。BlockNote 集成代码已全部删除，fixture/方法论被新 SDD 复用。`
8. `git mv .claude/sdd/blog-ia-redesign .claude/sdd/archive/$(date +%F)-blog-ia-redesign`
9. 在 `.claude/sdd/archive/$(date +%F)-blog-ia-redesign/COMPLETED.md` 写完工签字 + 执行日志摘要
10. `gh pr create --title "feat(blog-ia-redesign): Channel/Entry 元模型 + Milkdown + 三主题 + magic link + guestbook + 推荐" --body "<完整 acceptance-criteria.md 完成清单>"`
11. PR 描述附 `KNOWN-DEVIATIONS.md` 全文（如有）

---

## 9. 卡死时的自检流程

按顺序：

1. 重读对应 capability spec
2. 重读对应 research 文档
3. 重读 CLAUDE.md 场景 0-3
4. 检查 `memory-bank/knownIssues.md` 是否已知
5. 尝试两个不同假设修复（A 假设失败 → B 假设）
6. 仍卡死 → 跳过该 spec + 写入 `KNOWN-DEVIATIONS.md` + 继续推进
7. 全 milestone 都卡 → §4.3 严重失败流程

**禁止：在卡死时停下等回复**。HaiDen 不会在执行期间回复。

---

## 10. 完工标志

下面 6 项全 ✅ 即完工：

- [ ] 215 spec 全 pass（或 `KNOWN-DEVIATIONS.md` 完整记录跳过项）
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 全绿
- [ ] grep cleanup guard 0 命中
- [ ] BlockNote SDD 已归档 + 现有 BlockNote 集成代码已删
- [ ] memory-bank 4 份文档已更新
- [ ] PR 已创建 + 描述含 acceptance checklist + KNOWN-DEVIATIONS

完工后 commit 一个 `chore: blog-ia-redesign complete [no-tdd]` 并 push。HaiDen 会自行 review PR。

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T14:00:00Z · LOCKED 2026-05-25T14:20:00Z -->
