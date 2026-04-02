## 前置条件

> 无外部依赖，可直接执行。

## 1. 修改 github.ts

- [x] 1.1 将 `getReposStats` 函数从 `for…await` + sleep 改为 `Promise.all` 并发（见 design.md 第2节）
- [x] 1.2 确认返回值顺序与 `pinnedRepos` 输入顺序一致

## 2. 修改 index.astro

- [x] 2.1 将 `todayRange` / `allTimeRange` 的同步计算提到数据请求之前
- [x] 2.2 将 4 组串行 `await` 合并为单个 `Promise.all`（见 design.md 第3节）
- [x] 2.3 确认解构赋值变量名和类型与后续使用保持一致

## 3. 验证

- [x] 3.1 运行 `cd apps/web && pnpm run build`，确认构建成功
- [ ] 3.2 确认首页 5 个区块渲染结果与改前一致
- [x] 3.3 确认构建日志中无新增警告（GitHub 403 为 token 配额耗尽，非本次变更引入）

## 4. 收尾

- [x] 4.1 更新本 tasks.md 勾选完成项
- [ ] 4.2 提交 atomic commit：`perf(web): parallelize homepage data fetches to eliminate waterfall`
