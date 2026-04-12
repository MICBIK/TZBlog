## 前置条件

> 无。

## 1. payload.ts 类型加固

- [x] 1.1 定义 PayloadPostDoc / PayloadProjectDoc / PayloadDocDoc / PayloadNoteDoc 类型
- [x] 1.2 替换所有 normalizer 的 `Record<string, any>` 参数
- [x] 1.3 替换所有 fetchPayload 调用处的泛型参数（含 PayloadSiteProfileDoc / PayloadLabExperimentDoc）

## 2. 类型去重

- [x] 2.1 `github.ts` 已从 content.ts 导入 PinnedRepo（此前迭代已完成）

## 3. getReposStats 容错

- [x] 3.1 已改为 Promise.allSettled + fallback（此前迭代已完成）

## 4. 清理

- [x] 4.1 `content.ts` 的 `mainContentNavItems` 已不存在（此前迭代已清理）
- [x] 4.2 `content-fallback.ts` 已不存在（此前迭代已删除）

## 5. 组件修复

- [x] 5.1 ProjectCard.astro stars 已有默认值 0（此前迭代已完成）

## 6. umami 注释

- [x] 6.1 epoch 已有注释 `// 2023-01-01T00:00:00Z — 建站时间`（此前迭代已完成）

## 7. 验证

- [x] 7.1 `pnpm build` 构建成功（2026-04-12 验证通过）

## 8. 收尾

- [x] 8.1 代码已在历史 commit 47845be 中提交（2026-04-12 确认）
