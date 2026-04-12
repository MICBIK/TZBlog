## Why

数据层存在多个健壮性问题：

1. `payload.ts` 全部 normalizer 使用 `Record<string, any>`，strict 模式下不安全
2. `PinnedRepo` 类型在 `github.ts` 和 `content.ts` 重复定义
3. `content.ts` 导出 `mainContentNavItems` 全项目无引用（死代码）
4. `content-fallback.ts` 空文件残留
5. `ProjectCard.astro` 的 `stars` prop 无默认值，API 返回 null 时崩溃
6. `github.ts` 的 `getReposStats` 使用 `Promise.all`，一个失败全部失败，应改用 `Promise.allSettled`
7. `umami.ts` 硬编码 epoch `1672531200000` 无注释

## What Changes

1. `payload.ts`：为 Payload API 响应定义具体类型替代 `Record<string, any>`
2. `github.ts`：删除重复的 `PinnedRepo` interface，改为从 `content.ts` 导入
3. `github.ts`：`getReposStats` 改用 `Promise.allSettled` + fallback
4. `content.ts`：删除未使用的 `mainContentNavItems`
5. 删除 `content-fallback.ts`
6. `ProjectCard.astro`：`stars` 添加默认值 0
7. `umami.ts`：给 epoch 加注释

## Capabilities

### Modified Capabilities

- `platform-foundation`：数据层从 any 类型升级为类型安全，消除死代码

## Impact

- 影响 6 个文件，均为类型/逻辑层面
- 不影响页面渲染结果
