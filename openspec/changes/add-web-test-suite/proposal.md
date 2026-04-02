## Why

Web app 无测试。payload.ts normalizer、umami.ts 范围函数等纯逻辑无回归保护。

## What Changes

1. 添加 vitest 到 apps/web
2. 导出 payload.ts 和 umami.ts 中的纯函数供测试
3. 编写 20 个测试覆盖核心数据转换逻辑

## Capabilities

### Modified Capabilities

- `platform-foundation`：Web 端从零测试升级为有数据层单元测试

## Impact

- 新增 vitest 依赖和 3 个文件
- 6 个函数添加 export 关键字（不改逻辑）
