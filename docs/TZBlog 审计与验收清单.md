# TZBlog 审计与验收清单（进行中）

> 说明：此清单用于把本轮静态收口、待修问题与受限环境外的运行时验收项分开记录，避免把“代码已改”误说成“任务已完结”。

## A. 本轮已修（静态可确认）

### CMS / 数据模型
- [x] `Posts / Projects / Docs / Notes` 四个 collection 已注册进 `apps/cms/src/payload.config.ts`
- [x] 四个内容 collection 的写权限已显式收紧为：公开读、登录写
- [x] `payload.config.ts` 已补 `cors` / `csrf` 到 `http://localhost:4321`

### Web / Astro 数据链路
- [x] `apps/web/src/lib/payload.ts` 已作为统一 Payload API 层
- [x] 前台主内容链路已移除示例内容 fallback；API 不可用时返回空集合
- [x] `/posts`、`/projects`、`/docs`、`/notes`、首页 Recent Posts、`/search` 已补 empty state
- [x] 四个详情页已去掉页面内的重复 slug 请求，改为 `getStaticPaths()` 取数 + `Astro.props` 直传
- [x] `/notes` 已补回一级导航入口（header / footer 可达）
- [x] `posts/index.astro` 的 Featured Signal 已优先使用 `featured` 标记
- [x] 站点阶段文案已更新为 `Phase 3 · CMS Content Integration`

### 文档 / OpenSpec 对账
- [x] `openspec/changes/build-payload-content-collections/` 相关 design / tasks / spec 已同步
- [x] `openspec/changes/connect-astro-to-payload-api/` 相关 proposal / design / tasks 已同步
- [x] `docs/TZBlog CMS数据链路实现方案.md` 已同步到当前实现
- [x] `README.md` 已同步到当前实现
- [x] `docs/TZBlog 本地启动与停止指南.md` 已同步到当前实现
- [x] `docs/TZBlog 接管与启动指南.md` 已同步到当前实现
- [x] `docs/PROJECT_INDEX.md` 已同步到当前实现

## B. 已发现但本轮暂不扩修（后续独立 change 候选）

### 结构 / 类型债
- [ ] `apps/web/src/lib/payload.ts` 仍大量使用 `Record<string, any>`，类型约束较松
- [ ] `apps/web/src/lib/payload.ts` 仍保留 `PAYLOAD_PUBLIC_URL` 兼容兜底；若要把前台环境变量契约正式收紧到仅 `PAYLOAD_API_URL`，应单独评估并开 change
- [ ] `apps/web/src/lib/payload.ts` 仍导出 `getPostBySlug / getProjectBySlug / getDocBySlug / getNoteBySlug`；当前详情页主链路已不再使用它们，如要收紧 API 面，应单独评估并开 change
- [ ] 站点身份信息（GitHub 用户、邮箱、置顶仓库、地点、头像等）仍是静态硬编码，未进入 CMS / globals
- [ ] `Projects / Docs` 当前使用显式业务字段 `updatedAt`；若未来要统一为 Payload 自动时间戳，需要单独变更 schema 与前台契约

### 环境污染 / 认知风险
- [ ] `apps/web/dist` 存在本地旧构建残留，虽然未被 git 跟踪，但后续运行时验收时不能把它当真相
- [ ] `apps/cms/src/payload-types.ts` 为自动生成文件；当前仓库已存在本地生成痕迹，但尚未在允许环境重新运行 `generate:types` 验证同步与完整性

## C. 只能在允许环境完成的运行时验收

### CMS 侧
- [ ] 启动 Payload CMS，确认无启动错误
- [ ] 进入 Admin，确认侧边栏出现 `Posts / Projects / Docs / Notes`
- [ ] 创建并发布测试内容，验证 API 返回 `published` 内容
- [ ] 创建草稿内容，验证草稿不会暴露给前台

### Web 侧
- [ ] 运行 `astro check`
- [ ] 运行 `astro build`
- [ ] 确认构建日志中无异常 warning（或仅保留预期 warning）
- [ ] 验证 `/posts /projects /docs /notes /search /` 的真实运行效果
- [ ] 验证搜索页能检索到新发布内容

### 收尾
- [ ] 重新生成 `payload-types.ts`（在允许环境）
- [ ] 完成最终一轮审计总结
- [ ] 等待 Haiden 审批，暂不推 GitHub
