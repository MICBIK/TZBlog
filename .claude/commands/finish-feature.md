# /project:finish-feature

完成当前 Feature 的收尾：

1. 全部微循环已完成，使用 ECC `verification-loop` skill 跑完整质量门：
   - Build → TypeCheck → Lint → Test（粘贴 PASS 输出）→ Security → Diff Review
2. 使用 ECC `code-reviewer` agent 做代码审查，修复 CRITICAL/HIGH 问题
3. 更新 memory-bank/progress.md（勾选完成项 + 更新 Current Focus）
4. 如架构有变化，同步 memory-bank/systemPatterns.md
5. 考虑运行 ECC `/save-session` 保存当前会话上下文
6. 输出："Feature [名称] 已完成，下一个任务是：[下一步]"
