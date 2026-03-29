## Context

TZBlog 当前会在 OpenClaw 所在机器上执行开发任务，但并非所有机器都适合 Docker 拉镜像、起数据库和长时间运行本地服务。需要把默认验证方式收束到低负载、可恢复的范围内。

## Decision

默认验证策略改为：

- 允许：lint、type generation、静态构建、OpenSpec validate
- 禁止默认执行：Docker 拉镜像、数据库容器启动、长时间本地服务验证
- 例外：只有在用户显式要求时才允许重型运行时验证
- 完成后由用户在自己的机器上做运行时验收并反馈报错
