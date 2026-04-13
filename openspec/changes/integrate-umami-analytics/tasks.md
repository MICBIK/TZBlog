## 1. 基线与准备

- [x] 1.1 确认现有 Umami 代码实现完整性（umami.ts + index.astro + test）
- [x] 1.2 选择部署方式：Docker self-hosted vs Umami Cloud

## 2. Umami 实例部署

- [x] 2.1 方案 A：创建 `infra/docker-compose.umami.yml` 用于本地/VPS 部署
- [ ] 2.2 方案 B：注册 Umami Cloud（https://cloud.umami.is）
- [ ] 2.3 在 Umami 中注册 TZBlog 站点，获取 Website ID
- [ ] 2.4 生成 API Token

## 3. 前端集成

- [x] 3.1 在 `SiteLayout.astro` `<head>` 注入 Umami 追踪脚本（`<script defer src=".../script.js" data-website-id="...">`）
- [x] 3.2 追踪脚本使用环境变量配置，缺失时不注入
- [x] 3.3 更新 `.env.example` 增加 `UMAMI_TRACKING_SCRIPT_URL` 说明

## 4. 验证

- [ ] 4.1 本地访问页面后 Umami 面板可见统计数据
- [ ] 4.2 首页统计面板显示非零数据
- [x] 4.3 `astro build` 构建正常
- [x] 4.4 无 Umami 配置时静默降级（统计面板显示 0）
