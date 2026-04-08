## Why

项目无 CI，代码质量依赖手动 build 验证。CMS schema 变更可能悄然搞坏前台构建。

## What Changes

新增 `.github/workflows/ci.yml`，在 push/PR 到 main 时自动运行 lint → test → build。

## Capabilities

### Modified Capabilities

- `platform-foundation`：新增自动化质量门禁

## Impact

- 新增 1 个文件
- 不影响现有代码
