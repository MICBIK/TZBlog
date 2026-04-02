# TZBlog 静态审计阶段总结（待审批）

> 范围：仅基于当前仓库静态代码、配置、OpenSpec 与项目文档的对账结果。
> 边界：本阶段未启动项目、容器、数据库、CMS Admin、dev server，也未执行 `astro check` / `astro build` / OpenSpec validate。

## 1. 本阶段已静态收口

### CMS / 内容模型
- 已补齐 `Posts / Projects / Docs / Notes` 四个 collection 注册
- 已统一写权限策略为：公开读、登录写
- 已在 `payload.config.ts` 补齐面向前台本地调试的 `cors` / `csrf`

### Astro / 前台数据链路
- 已建立统一 `payload.ts` 数据访问层
- 已移除主内容链路对示例内容 fallback 的依赖
- 已为列表页、首页 Recent Posts、搜索页补齐 empty state
- 已去掉四个详情页页面内的重复 slug 请求，统一为 `getStaticPaths()` 取数 + `Astro.props` 直传
- 已补齐 `/notes` 一级导航入口
- 已修正文章列表页精选逻辑，优先使用 `featured`
- 已将首页阶段文案更新为 `Phase 3 · CMS Content Integration`

### 文档 / OpenSpec
- 已同步两条 active OpenSpec change 的 proposal / design / tasks / spec
- 已同步 `README.md`、`PROJECT_INDEX.md`、接管指南、启动指南
- 已同步 `TZBlog CMS数据链路实现方案.md` 到当前主实现

## 2. 明确保留兼容 / 暂不在本轮扩修

### 保留兼容
- `apps/web/src/lib/payload.ts` 当前仍保留 `PAYLOAD_PUBLIC_URL` 兼容兜底
- 当前前台正式入口变量仍应视为 `PAYLOAD_API_URL`，但是否彻底移除兼容层，建议单独开 change 再收紧

### 暂不扩修
- `payload.ts` 仍存在 `Record<string, any>` 类型债
- `payload.ts` 仍导出 `getPostBySlug / getProjectBySlug / getDocBySlug / getNoteBySlug`；当前详情页主链路已不再使用它们，如要进一步收紧 API 面，建议单独开 change
- 站点身份信息仍为静态硬编码，尚未进入 CMS / globals
- `Projects / Docs.updatedAt` 仍按显式业务字段处理；如要切到 Payload 系统时间戳，应单独变更
- `apps/web/dist` 为本地旧构建残留，不能作为真实状态依据
- `apps/cms/src/payload-types.ts` 为自动生成文件；当前仓库已存在本地生成痕迹，但尚未在允许环境重新运行 `generate:types` 验证同步与完整性

## 3. 必须在允许环境完成的运行时验收

### CMS 侧
- 启动 Payload CMS，确认启动正常
- 进入 Admin，确认四个内容 collection 可见可用
- 创建发布内容并验证 API 只返回 `published`
- 创建草稿内容并验证前台不暴露草稿

### Web 侧
- 运行 `astro check`
- 运行 `astro build`
- 验证 `/posts`、`/projects`、`/docs`、`/notes`、`/search` 与首页真实效果
- 验证搜索页可以检索到新发布内容

### 收尾
- 重新生成 `payload-types.ts`
- 运行 OpenSpec validate
- 输出最终审批总结，等待 Haiden 确认后再决定后续动作

## 4. 当前结论

本轮静态审计的主目标已经基本达成：
- 两条 active change 的主线实现、OpenSpec、项目主文档已基本对齐
- 最危险的“假 fallback / 文档停留在旧阶段 / 详情页重复请求”问题已完成静态收口
- 剩余未闭环部分主要集中在运行时验收，而不是继续扩大静态改动面
