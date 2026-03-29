## Why

在受限或共享机器上直接拉 Docker 镜像、启动 PostgreSQL 等重服务验证，会带来明显资源压力，甚至影响机器稳定性。TZBlog 的协作流程需要明确约束：默认只做轻量编译/静态检查，把运行时验证留给用户自己的机器进行。

## What Changes

- 将“避免重型本地运行时验证”的约束写入项目流程文档
- 明确 OpenClaw/AI 默认只做 lint / type generation / build 等轻量验证
- 明确 Docker、数据库、长时间本地服务验证需要用户显式要求

## Capabilities

### Modified Capabilities

- `change-governance`: 增加受限环境下的验证方式约束

## Impact

- 更新项目流程与接管文档
- 影响后续 AI / OpenClaw 的默认验证行为
