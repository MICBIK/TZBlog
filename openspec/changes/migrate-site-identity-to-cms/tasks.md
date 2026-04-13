## 1. 基线与准备

- [ ] 1.1 读取当前 `SiteProfile` global 字段定义
- [ ] 1.2 梳理 `content.ts` 中所有站点身份导出的引用点

## 2. CMS 侧

- [ ] 2.1 扩展 `SiteProfile` global：增加 `siteMeta` (title/description/location) 字段组
- [ ] 2.2 扩展 `SiteProfile` global：增加 `socialLinks` (label/href/icon) array 字段
- [ ] 2.3 扩展 `SiteProfile` global：增加 `pinnedRepos` (owner/repo) array 字段
- [ ] 2.4 运行 `pnpm --filter cms generate:types` 更新类型

## 3. Web 侧

- [ ] 3.1 在 `payload.ts` 新增 `getSiteSettings()` 聚合函数
- [ ] 3.2 修改 `SiteLayout.astro` 从 CMS 读取 siteMeta，fallback 到静态值
- [ ] 3.3 修改 `index.astro` 从 CMS 读取 aboutProfile / socialLinks / pinnedRepos
- [ ] 3.4 清理 `content.ts` 中过时字段（如 `currentStatus`）

## 4. 验证

- [ ] 4.1 运行 `astro check` — 0 errors
- [ ] 4.2 运行 `pnpm --filter web test --run` — 全部通过
- [ ] 4.3 CMS 无数据时 fallback 正常工作
- [ ] 4.4 CMS 有数据时正确覆盖静态值
