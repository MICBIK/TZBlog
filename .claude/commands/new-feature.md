# /project:new-feature

开始新功能的完整开发流程（OpenSpec + ECC TDD 串联）：

1. 确认 memory-bank/activeContext.md 是最新状态
2. 如果用户没提供功能名称，询问
3. 运行 /opsx:new <feature-name>
4. 生成 proposal.md 后质量检查（Intent/Scope/Approach/UI选型/DB变更）
5. 展示 proposal.md，等待明确确认

收到确认后：
6. 调研：是否有现成 shadcn/Aceternity/ECC Skill 可复用？
7. 写用户旅程："As a [role], I want to [action], so that [benefit]"
8. 生成测试用例（正常路径+边界+错误场景），确认 RED
9. git checkpoint: test: add tests for <feature-name>
10. 最小实现使测试通过，确认 GREEN
11. git checkpoint: feat: implement <feature-name>

（重构和收尾通过 /project:finish-feature 完成）
