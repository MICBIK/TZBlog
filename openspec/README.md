# TZBlog OpenSpec Workspace

本目录用于管理 TZBlog 的正式变更。

## 目录说明

- `project.md`
  项目基线和长期上下文
- `specs/`
  当前主线 capability specs
- `changes/`
  正在进行中的 change
- `changes/archive/`
  已完成 change 的归档
- `AGENTS.md`
  给 AI 协作者的 OpenSpec 执行规则

## 默认命令

```bash
npx -y @fission-ai/openspec@1.2.0 list
npx -y @fission-ai/openspec@1.2.0 new change <change-name>
npx -y @fission-ai/openspec@1.2.0 validate <change-name> --type change --strict
npx -y @fission-ai/openspec@1.2.0 archive <change-name> -y
```

## 执行原则

- 开始实现前先确认 active changes
- 没有 change 时先创建 proposal / specs / tasks
- tasks 必须持续更新
- 完成后先 archive，再提交 git

具体规则见：

- `project.md`
- `../docs/TZBlog OpenSpec 变更管理规范.md`
