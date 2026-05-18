# /project:finish-feature

完成当前 Feature 的收尾：

1. 运行 /opsx:verify 验证实现完整性
2. 修复 verify 发现的问题（如有）
3. 运行 /opsx:archive 归档
4. 更新 memory-bank/progress.md（勾选完成项）
5. 更新 memory-bank/activeContext.md（下一步计划）
6. 如架构有变化，同步 openspec/config.yaml 的 context
7. 说："Feature [名称] 已完成归档，下一个任务是：[下一步]"
