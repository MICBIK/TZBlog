## Why

首页是全站唯一一个需要同时调用 4 组外部 API 的页面（GitHub GraphQL、GitHub REST × 3、Payload CMS、Umami × 2），但当前所有请求以**瀑布流串行**方式执行：

```
getContributionCalendar()        ~300-800ms
  → getReposStats() 串行 ×3      ~(300+300ms sleep) = ~900-1500ms
    → getPosts()                  ~100-300ms
      → Promise.all(umami ×2)    ~100-300ms
```

累计耗时约 **1.4-2.9 秒**，而其他页面通常只有 1 个 API 调用（< 300ms），导致用户从任何页面跳转至首页时感到明显卡顿。

此外，`getReposStats()` 函数内部使用 `for…await` 串行循环并在每次请求间插入 100ms `setTimeout` 延迟（注释称"速率限制处理"），但 GitHub REST API 对认证请求的速率限制为 5000 次/小时，3 个并发请求远不会触发限流，该延迟完全不必要。

## What Changes

1. **并行化首页数据请求**：将 `index.astro` 中的 4 组串行 `await` 改为单个 `Promise.all` 并行执行
2. **并行化仓库统计请求**：将 `getReposStats()` 从 `for…await` + sleep 改为 `Promise.all` 并发

改动后首页数据获取耗时从"所有请求耗时之和"降为"最慢单个请求的耗时"，预计 **3-5 倍加速**。

## Capabilities

### Modified Capabilities

- `platform-foundation`：首页数据加载性能从串行瀑布流优化为全并行，消除不必要的人为延迟

## Impact

- 仅影响 2 个文件：
  - `apps/web/src/pages/index.astro`（frontmatter 数据获取逻辑）
  - `apps/web/src/lib/github.ts`（`getReposStats` 函数）
- 不影响 API 返回数据格式、页面渲染逻辑或其他页面
- 不引入新依赖
- 风险极低：所有请求之间无数据依赖，并行化不改变结果语义
