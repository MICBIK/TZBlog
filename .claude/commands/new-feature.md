# /project:new-feature

开始新功能的完整开发流程（OpenSpec + SDD + TDD 串联）。

## 阶段 -1：探索入口检查（场景 0 衔接）

0. 检查会话历史是否刚从场景 0 explore 退出：
   - **是**（用户在 explore 中选了 [A]，AI 已 auto-capture 了 proposal/design）→
     跳到步骤 5（质量检查），同时确保读取已生成的 proposal.md/design.md
   - **否** → 走完整流程从步骤 1 开始

## 阶段一：需求对齐

1. 确认 memory-bank/activeContext.md 是最新状态
2. 询问功能名称（如果未提供）
3. 运行 /opsx:new <feature-name>（步骤 0 已 capture 的跳过此步）
4. 生成/检查 proposal.md 质量：
   - Intent 说明「为什么」
   - Scope 有明确边界
   - Approach 列出受影响的 Prisma 模型 / 路由 / 组件
   - 涉及 UI 说明参考设计（Claude/Apple/OpenAI 的哪个细节）
5. 展示 proposal.md，等待明确确认

## 阶段一·B：specs 生成

6. proposal 确认后，在 `openspec/changes/<feature>/specs/<capability>/spec.md`
   写 GIVEN/WHEN/THEN 用例：
   - 每条 spec 一个独立 SCENARIO 块，给唯一 spec-id（如 `cms-post-001`）
   - 涉及数据持久化：包含 Prisma schema 片段
   - 涉及 API / Server Action：包含 endpoint + 请求/响应 zod schema
   - 涉及 UI：包含 ASCII wireframe 或文字布局描述

## 阶段一·C：test-map 强制环节（无 test-map 禁生成 tasks）

7. 生成 `openspec/changes/<feature>/test-map.md`：
   ```markdown
   | Spec-ID | Test Layer | Test File | Test Function | Notes |
   |---------|-----------|-----------|---------------|-------|
   | cms-post-001 | unit | src/lib/services/post.test.ts | createDraftReturnsId | Vitest |
   | cms-post-002 | integration | src/app/api/posts/route.test.ts | POST_validatesZod | API |
   | cms-ui-001 | unit | src/app/(admin)/posts/__tests__/Editor.test.tsx | renders_tiptap | RTL |
   ```
8. 展示 test-map.md 给用户确认。**未确认禁止生成 tasks.md**

## 阶段二：tasks.md（SDD 微循环结构）

9. 按 test-map.md 生成 tasks.md，严格微循环结构 + 阶段前缀：
   ```
   1. [P1] CMS 文章 service
     1.1.a [TEST-RED]  写 cms-post-001 失败测试（createDraftReturnsId）
     1.1.b [IMPL-GREEN] 实现 createDraft service
     1.2.a [TEST-RED]  写 cms-post-002 失败测试（POST_validatesZod）
     1.2.b [IMPL-GREEN] 实现 POST /api/posts 路由
   2. [P1] CMS 编辑器 UI
     2.1.a [TEST-RED]  写 cms-ui-001 失败测试
     2.1.b [IMPL-GREEN] 实现 Editor 组件
   ```
10. 禁止纯实现任务（没有对应 [TEST-RED] 的 [IMPL-GREEN]）
11. NO-TDD 任务必须用 `[NO-TDD]` 标签且分类清楚（样式/文档/元文件）

## 阶段三：调研（search-first）

12. 调研：是否有现成 shadcn 组件 / Tiptap extension / 已有 service 可复用？
13. 检索代码库中类似实现

## 阶段四：TDD 微循环执行（守门员）

每个微循环严格按以下顺序：

### [TEST-RED] 守门员（14）
14. 响应开头打 `[TDD: RED 写测试中]`
15. 写出测试代码（按 test-map 中的函数名）
16. **立即跑测试**：`pnpm test -- <test-file>` 或 `pnpm test:watch`
17. **粘真实终端输出**，必须含 `FAIL` / `FAILED` 关键字
18. 响应结尾切到 `[TDD: RED 已 FAIL ✓]`
19. **git commit**：`test(<scope>): <spec-id>`

### [IMPL-GREEN] 守门员（20）
20. 响应开头打 `[TDD: GREEN 写实现中]`
21. 检查上一条响应是否有 `[TDD: RED 已 FAIL ✓]` 徽章和 FAIL 输出。**没有则停止，回到步骤 14**
22. 写最少量代码使测试通过
23. **重跑测试**，粘真实 PASS 输出
24. 响应结尾切到 `[TDD: GREEN 已 PASS ✓]`
25. **git commit**：`feat(<scope>): <spec-id>`
26. 进入下一微循环（回步骤 14）或进入收尾

### 例外路径
27. 测试环境不可用（Postgres 没启、Prisma 没 generate）→ 补 `[RED-补证]` 任务挂起当前微循环
28. NO-TDD 任务（纯样式/文档/元文件）→ 响应开头打 `[TDD: NO-TDD 已加 [no-tdd]]`，commit message 加 `[no-tdd]` 标签

## 阶段五：质量门与归档（通过 /project:finish-feature 完成）

29. 全部微循环完成 → 跑整套测试套件 `pnpm test`，粘 PASS 输出
30. `pnpm typecheck && pnpm lint` 通过
31. /project:finish-feature 收尾

## 关键检查矩阵（每步执行前自查）

| 步骤 | 必须有 | 没有则 |
|------|--------|--------|
| 生成 tasks.md | test-map.md 已确认 | 退回到步骤 7 |
| 写 [IMPL-GREEN] 代码 | 上一条响应有 RED FAIL 输出 | 退回到步骤 14 |
| feat: commit | 前 5 commit 内有同 scope test: | husky commit-msg hook 自动拒绝 |
| /opsx:archive | 全部测试 PASS + typecheck + lint | 不允许归档 |
