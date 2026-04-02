# Design: add-web-test-suite

## vitest 配置

`apps/web/vitest.config.ts`，node 环境，include `tests/**/*.test.ts`。

## 导出纯函数

payload.ts: export flattenArray, flattenSections, normalizePost/Project/Doc/Note
umami.ts: export readMetricValue, normalizeUmamiStats

## 测试文件

- `tests/lib/payload.test.ts` — 11 个测试
- `tests/lib/umami.test.ts` — 9 个测试
