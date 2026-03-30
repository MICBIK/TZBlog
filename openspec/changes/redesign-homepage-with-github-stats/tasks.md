## 1. 基线与准备

- [x] 1.1 建立 proposal / design / spec delta / tasks
- [x] 1.2 验证 OpenSpec change 结构合规
- [x] 1.3 安装依赖 `cal-heatmap`
- [x] 1.4 新增 `.env.example` 环境变量（GITHUB_TOKEN / UMAMI_BASE_URL / UMAMI_API_KEY / UMAMI_WEBSITE_ID）

## 2. 数据层

- [x] 2.1 创建 `apps/web/src/lib/github.ts`（getContributionCalendar + getReposStats）
- [x] 2.2 创建 `apps/web/src/lib/umami.ts`（getUmamiStats + getTodayRange + getAllTimeRange）
- [x] 2.3 更新 `apps/web/src/data/content.ts`：扩展 aboutProfile（增加 avatar / techStack / socialLinks 等字段），新增 pinnedRepos 配置

## 3. 组件层

- [x] 3.1 创建 `ContributionGraph.astro`（接收预取数据，客户端调用 cal-heatmap 渲染）
- [x] 3.2 创建 `ProjectCard.astro`（名称 + 描述 + Star badge + 语言标签）
- [x] 3.3 创建 `SiteStatsBar.astro`（4 个统计指标卡片）

## 4. 首页重构

- [x] 4.1 重写 `index.astro`：删除旧 6 section 结构
- [x] 4.2 实现 Section 1 - Hero 个人身份（名字 + 角色 + 社交链接）
- [x] 4.3 实现 Section 2 - GitHub Activity（贡献热力图 + 开源项目卡片）
- [x] 4.4 实现 Section 3 - Recent Posts（最新 3 篇文章 + "查看全部 →"）
- [x] 4.5 实现 Section 4 - About / Tech Stack（简短 bio + 技术栈标签）
- [x] 4.6 实现 Section 5 - Site Stats（接 Umami 数据的统计面板）

## 5. 样式

- [x] 5.1 在 `global.css` 新增首页重构相关样式（hero-identity / github-activity / project-card / stats-bar）
- [x] 5.2 响应式适配（移动端热力图横向滚动、卡片网格变单列）

## 6. 清理
- [x] 6.1 删除 `content.ts` 中不再使用的导出（heroMetrics / missionPanels / homeSections）
- [x] 6.2 清理 `global.css` 中不再使用的样式（.hero-cinematic / .signal-deck / .mission-grid-upgraded / .home-river-grid 等）

## 7. 验证与交付
- [x] 7.1 运行 `astro check` - 0 errors, 0 warnings
- [x] 7.2 运行 `astro build` - 20 pages built successfully
- [ ] 7.3 由用户本机验证视觉效果
- [x] 7.4 提交并推送 GitHub
