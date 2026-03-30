## Why

TZBlog 当前已经有可运行的本地开发环境，但启动流程仍然依赖开发者手动执行多条命令、打开多个终端并自行判断服务状态。对于“只是想快速看一下当前效果”的场景，这个成本偏高，也容易在端口占用、环境变量缺失或服务残留时出错。

## What Changes

- 新增一个脚本化的一键本地启动入口
- 提供 `start / stop / status / restart` 等常用操作
- 暴露根级 `pnpm` 命令，减少记忆成本
- 更新本地启动文档与 README，补充推荐用法和日志位置

## Capabilities

### New Capabilities

### Modified Capabilities
- `workspace-bootstrap`: 为本地开发环境补充脚本化启动入口和服务状态管理

## Impact

- 新增一个仓库内脚本目录与本地开发辅助脚本
- 更新根级 `package.json` 命令入口
- 更新 README 和本地启动文档
- 不改变产品功能，只降低本地预览和开发的启动成本
