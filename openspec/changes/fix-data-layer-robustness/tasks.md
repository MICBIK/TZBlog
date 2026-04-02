## 前置条件

> 无。

## 1. payload.ts 类型加固

- [ ] 1.1 定义 PayloadPostDoc / PayloadProjectDoc / PayloadDocDoc / PayloadNoteDoc 类型
- [ ] 1.2 替换所有 normalizer 的 `Record<string, any>` 参数
- [ ] 1.3 替换所有 fetchPayload 调用处的泛型参数

## 2. 类型去重

- [ ] 2.1 `github.ts` 删除 PinnedRepo interface，从 content.ts 导入

## 3. getReposStats 容错

- [ ] 3.1 改为 Promise.allSettled + fallback

## 4. 清理

- [ ] 4.1 删除 `content.ts` 的 `mainContentNavItems`
- [ ] 4.2 删除 `content-fallback.ts`

## 5. 组件修复

- [ ] 5.1 ProjectCard.astro stars 添加默认值

## 6. umami 注释

- [ ] 6.1 epoch 添加注释

## 7. 验证

- [ ] 7.1 构建成功

## 8. 收尾

- [ ] 8.1 提交 atomic commit
