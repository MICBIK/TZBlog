# /project:new-feature

开始新功能的完整开发流程（ECC PRP + SDD 增强串联）。

## 阶段 -1：探索入口检查（场景 0 衔接）

0. 检查会话历史是否刚从场景 0 explore 退出：
   - **是**（用户在 explore 中选了 [A]，AI 已 auto-capture 了 proposal/design-notes）→ 跳到步骤 5
   - **否** → 走完整流程从步骤 1 开始

## 阶段一：需求对齐

1. 确认 memory-bank/progress.md 的 Current Focus 是最新状态
2. 询问功能名称（如果未提供）
3. 使用 ECC `/prp-prd` 生成需求文档（或直接由用户描述需求）
4. 检查需求质量：
   - Problem Statement 说明了「为什么」
   - Scope 有明确边界（Must/Should/Won't）
   - 涉及 UI 说明组件选型（参考 ECC design-system / frontend-patterns skill）
   - 涉及 DB/Schema 说明迁移方案
5. 展示需求，等待用户明确确认

## 阶段一·B：specs 生成

6. 需求确认后，在 `.claude/sdd/<feature>/specs/<capability>/spec.md`
   写 GIVEN/WHEN/THEN 用例：
   - 每条 spec 一个独立 SCENARIO 块，给唯一 spec-id（kebab-case）
   - 覆盖正常路径 + 边界 + 错误场景

## 阶段一·C：test-map 强制环节（无 test-map 禁生成 plan tasks）

7. 生成 `.claude/sdd/<feature>/test-map.md`：
   ```markdown
   | Spec-ID | Test Layer | Test File | Test Function | Notes |
   |---------|-----------|-----------|---------------|-------|
   | auth-session-001 | unit | <path>/auth.test.ts | refreshTokenSuccess | <runtime> |
   ```
8. 展示 test-map.md 给用户确认。**未确认禁止进入下一阶段**

## 阶段二：实施计划（ECC /prp-plan + SDD 增强）

9. 使用 ECC `/prp-plan` 生成实施计划，**Tasks 段必须使用 SDD 微循环结构**：
   ```
   1. <module-name>
     1.1.a [TEST-RED]  写 auth-session-001 的失败测试
     1.1.b [IMPL-GREEN] 实现 refresh token 逻辑
   ```
10. 禁止纯实现任务
11. NO-TDD 任务必须用 `[NO-TDD]` 标签

## 阶段三：调研（ECC search-first skill）

12. 使用 ECC 的 `search-first` skill 调研是否有现成组件/库可复用
13. 检索代码库中类似实现

## 阶段四：TDD 微循环执行

每个微循环使用 ECC 的 `/tdd` 流程 + SDD 增量：

### [TEST-RED]
14. 响应开头打 `🏹 柳七月·开弓态 [TDD: RED 写测试中]`
15. 写出测试代码（按 test-map 中的函数名）
16. 立即跑测试，粘贴真实终端 FAIL 输出
17. **git commit**：`test(<scope>): <spec-id>`

### [IMPL-GREEN]
18. 响应开头打 `⚔️ 孟川·出刀态 [TDD: GREEN 写实现中]`
19. 检查上一步是否有 RED FAIL 输出。**没有则回到步骤 14**
20. 写最少量代码使测试通过，粘贴 PASS 输出
21. **git commit**：`feat(<scope>): <spec-id>`
22. 进入下一微循环或收尾

### 例外路径
23. 测试环境不可用 → 补 `[RED-补证]` 任务挂起
24. NO-TDD → 打 `[TDD: NO-TDD]` 徽章，commit 加 `[no-tdd]`

## 阶段五：质量门与归档

25. 全部微循环完成 → 使用 ECC `verification-loop` skill 跑完整质量门（Build → Type → Lint → Test → Security → Diff）
26. 使用 ECC `code-reviewer` agent 做代码审查
27. /project:finish-feature 收尾

## 关键检查矩阵

| 步骤 | 必须有 | 没有则 |
|------|--------|--------|
| 生成 plan tasks | test-map.md 已确认 | 退回到步骤 7 |
| 写 [IMPL-GREEN] | 上一步有 RED FAIL 输出 | 退回到步骤 14 |
| feat: commit | 前 5 commit 内有同 scope test: | commit-msg hook 拒绝 |
| 归档 | verification-loop 全 PASS | 不允许归档 |
