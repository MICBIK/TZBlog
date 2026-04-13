## 1. 基线与准备

- [x] 1.1 确认 `PAYLOAD_PUBLIC_URL` 在项目中无其他引用
- [x] 1.2 确认四个 `getXxxBySlug` 函数在项目中无调用点

## 2. 实现

- [x] 2.1 移除 `PAYLOAD_PUBLIC_URL` 兼容层，简化 `API_URL` 定义
- [x] 2.2 删除 `getPostBySlug` / `getProjectBySlug` / `getDocBySlug` / `getNoteBySlug`
- [x] 2.3 替换 `PayloadTextItem` 为精确类型定义

## 3. 验证

- [x] 3.1 运行 `astro check` — 0 errors
- [x] 3.2 运行 `pnpm --filter web test --run` — 全部通过
- [ ] 3.3 启动 CMS + 运行 `astro build` — 构建成功
