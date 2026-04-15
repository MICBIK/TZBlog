## Tasks

### Phase 1: 环境变量配置 ⏳ in-progress

- [x] 1.1 在 Vercel 添加 `PUBLIC_UMAMI_BASE_URL` 到 Production + Preview + Development
- [x] 1.2 在 Vercel 添加 `PUBLIC_UMAMI_API_KEY` 到 Production + Preview + Development
- [x] 1.3 在 Vercel 添加 `PUBLIC_UMAMI_WEBSITE_ID` 到 Production + Preview + Development
- [x] 1.4 在 Vercel 添加 `PUBLIC_UMAMI_SCRIPT_URL` 到 Production + Preview + Development
- [ ] 1.5 验证环境变量已正确配置（`vercel env ls`）

### Phase 2: 代码修改 ⏳ in-progress

- [ ] 2.1 修改 `apps/web/src/layouts/BaseLayout.astro:42-43`
  - 替换 `import.meta.env.UMAMI_SCRIPT_URL` → `import.meta.env.PUBLIC_UMAMI_SCRIPT_URL`
  - 替换 `import.meta.env.UMAMI_WEBSITE_ID` → `import.meta.env.PUBLIC_UMAMI_WEBSITE_ID`

- [ ] 2.2 修改 `apps/web/src/lib/umami.ts:6-7`
  - 替换 `import.meta.env.UMAMI_BASE_URL` → `import.meta.env.PUBLIC_UMAMI_BASE_URL`
  - 替换 `import.meta.env.UMAMI_API_KEY` → `import.meta.env.PUBLIC_UMAMI_API_KEY`

- [ ] 2.3 修改 `apps/web/src/pages/index.astro`
  - 查找所有 `import.meta.env.UMAMI_WEBSITE_ID` 引用
  - 替换为 `import.meta.env.PUBLIC_UMAMI_WEBSITE_ID`

### Phase 3: 文档更新 ⏳ in-progress

- [ ] 3.1 更新 `.env.example`（根目录）
  - 添加 `PUBLIC_UMAMI_*` 变量示例
  - 标注旧的 `UMAMI_*` 变量为 deprecated（可选）

- [ ] 3.2 更新 `apps/web/.env.example`
  - 同步环境变量文档

### Phase 4: 测试与部署 ⏳ pending

- [ ] 4.1 本地验证
  - 在 `apps/web/.env` 中添加 `PUBLIC_UMAMI_*` 变量
  - 运行 `pnpm build --filter web`
  - 检查构建产物中是否包含 Umami 脚本

- [ ] 4.2 提交代码
  - Git commit: `fix(analytics): use PUBLIC_ prefix for Umami env vars`
  - Git push 触发 Vercel 自动部署

- [ ] 4.3 验证部署结果
  - 检查最新部署的 HTML 源码（`vercel curl / --deployment <url> | grep umami`）
  - 预期：可见 `<script defer src="https://cloud.umami.is/script.js" ...>`

- [ ] 4.4 生产环境验证
  - 访问生产站点，打开浏览器开发者工具
  - 检查 Console：无 Umami 相关错误
  - 检查 Network：可见 `POST https://cloud.umami.is/api/send` 请求（状态码 200）
  - 等待 5-10 分钟，刷新首页，检查站点统计数据是否更新

### Phase 5: 清理（可选） ⏳ pending

- [ ] 5.1 删除 Vercel 上旧的 `UMAMI_*` 环境变量（如果确认无其他地方使用）
  - `vercel env rm UMAMI_BASE_URL production preview development -y`
  - `vercel env rm UMAMI_API_KEY production preview development -y`
  - `vercel env rm UMAMI_WEBSITE_ID production preview development -y`
  - `vercel env rm UMAMI_SCRIPT_URL production preview development -y`

## Progress Tracking

- **Started**: 2026-04-15 21:00
- **Current Phase**: Phase 1 (环境变量配置) - 80% complete
- **Blocked**: None
- **Next Steps**: 完成 Phase 2 代码修改

## Notes

- 环境变量已在 Vercel 配置完成（Production + Preview + Development）
- 需要修改 3 个文件的环境变量引用
- 部署后需要等待访问量积累，初期统计数据为 0 是正常的
