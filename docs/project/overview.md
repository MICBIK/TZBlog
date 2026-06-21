# TZBlog 项目总览

> 个人技术博客平台 - 完整规划与实施指南  
> 最后更新: 2026-06-14

---

## 📌 快速导航

### 核心文档
1. **[README.md](../README.md)** - 项目简介与快速开始
2. **[PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)** - 开发规范（必读）
3. **[TASK_BREAKDOWN.md](./TASK_BREAKDOWN.md)** - Phase 1 详细任务
4. **[TASK_BREAKDOWN_PHASE2-6.md](./TASK_BREAKDOWN_PHASE2-6.md)** - Phase 2-6 详细任务

### 设计文档 (docs/superpowers/specs/)
- **[final-tech-stack.md](./superpowers/specs/final-tech-stack.md)** - 最终技术方案
- **[database-design.md](./superpowers/specs/database-design.md)** - 数据库设计
- **[api-design.md](./superpowers/specs/api-design.md)** - API接口文档
- **[backend-architecture.md](./superpowers/specs/backend-architecture.md)** - 后端架构
- **[frontend-architecture.md](./superpowers/specs/frontend-architecture.md)** - 前端架构
- **[seo-strategy.md](./superpowers/specs/seo-strategy.md)** - SEO优化策略
- **[security-strategy.md](./superpowers/specs/security-strategy.md)** - 安全策略
- **[cache-strategy.md](./superpowers/specs/cache-strategy.md)** - 缓存策略
- **[deployment-architecture.md](./superpowers/specs/deployment-architecture.md)** - 部署架构

### 商业规划
- **[monetization-strategy.md](./superpowers/specs/monetization-strategy.md)** - 盈利模式
- **[refund-policy.md](./superpowers/specs/refund-policy.md)** - 退款策略

### 技术选型参考
- **[editor-comparison.md](./superpowers/specs/editor-comparison.md)** - 编辑器对比
- **[search-recommendation.md](./superpowers/specs/search-recommendation.md)** - 搜索引擎推荐
- **[tech-stack-detail.md](./superpowers/specs/tech-stack-detail.md)** - 技术栈详解
- **[geo-optimization.md](./superpowers/specs/geo-optimization.md)** - 地理位置优化

### 实施计划
- **[implementation-roadmap.md](./superpowers/plans/implementation-roadmap.md)** - 实施路线图

---

## 🎯 项目概览

### 项目定位
个人技术博客平台，专注高质量技术内容创作，突出个人品牌，支持知识付费。

### 核心特色
1. **内容优先** - Markdown编辑，专业代码高亮
2. **个人品牌** - 作者信息突出展示，定制头像服务
3. **社交互动** - 评论、点赞、关注
4. **商业化潜力** - 付费内容、会员订阅、技术咨询

### 目标用户
- **主要**: 技术开发者、产品经理、设计师
- **次要**: 技术爱好者、学生
- **付费用户**: 寻求深度教程、技术咨询的专业人士

---

## 🛠️ 技术栈

### 前端
```yaml
框架: Next.js 15 (App Router)
UI库: React 19
语言: TypeScript (strict mode)
样式: Tailwind CSS v4
组件库: shadcn/ui + Radix UI
动画: Framer Motion
状态管理: Zustand
数据获取: TanStack Query
编辑器: @uiw/react-md-editor
Markdown渲染: react-markdown
代码高亮: prism-react-renderer
```

### 后端
```yaml
语言: Go 1.22+
框架: Gin
ORM: GORM
数据库: PostgreSQL 15+
缓存: Redis 7+
搜索: Meilisearch (Phase 2引入)
对象存储: Cloudflare R2
日志: zap
JWT: golang-jwt/jwt
```

### 基础设施
```yaml
前端部署: Vercel
后端部署: 云服务器 (腾讯云/阿里云)
CDN: Cloudflare
监控: Sentry + Prometheus
CI/CD: GitHub Actions
```

---

## 📊 数据库设计

### 核心表 (10张)
1. **users** - 用户表
2. **articles** - 文章表
3. **categories** - 分类表
4. **tags** - 标签表
5. **article_tags** - 文章标签关联
6. **comments** - 评论表
7. **likes** - 点赞表
8. **follows** - 关注表
9. **subscriptions** - 订阅会员
10. **orders** - 订单表

### 辅助表 (可选)
- **article_views** - 浏览记录
- **user_read_progress** - 阅读进度

详见: [database-design.md](./superpowers/specs/database-design.md)

---

## 🔌 核心API

### 认证
- `POST /api/v1/auth/register` - 注册
- `POST /api/v1/auth/login` - 登录
- `GET /api/v1/auth/me` - 获取当前用户

### 文章
- `GET /api/v1/articles` - 文章列表
- `GET /api/v1/articles/:slug` - 文章详情
- `POST /api/v1/articles` - 创建文章
- `PUT /api/v1/articles/:id` - 更新文章
- `DELETE /api/v1/articles/:id` - 删除文章

### 互动
- `POST /api/v1/articles/:id/like` - 点赞
- `POST /api/v1/articles/:id/comments` - 发表评论
- `GET /api/v1/articles/:id/comments` - 获取评论

### 媒体
- `POST /api/v1/upload/image` - 上传图片

详见: [api-design.md](./superpowers/specs/api-design.md)

---

## 📅 开发时间线

### Phase 1: 基础设施搭建 (Week 1-2)
**目标**: 前后端能跑通基础功能

**后端**:
- [x] 项目脚手架
- [x] 数据库设计与迁移
- [x] JWT认证中间件
- [x] 统一响应格式
- [x] 配置管理

**前端**:
- [x] Next.js项目初始化
- [x] Tailwind + shadcn/ui配置
- [x] API客户端封装
- [x] 路由结构规划

**DevOps**:
- [x] Docker容器化
- [x] GitHub Actions CI

---

### Phase 2: 核心功能开发 (Week 3-6)
**目标**: 实现文章发布、浏览的完整流程

**功能清单**:
- [x] 用户注册/登录
- [x] 文章CRUD API
- [x] 图片上传到R2
- [x] Markdown编辑器
- [x] 文章列表页
- [x] 文章详情页
- [x] 后台管理界面

---

### Phase 3: 高级功能 (Week 7-9)
**目标**: 增加社交互动功能

**功能清单**:
- [x] 评论系统
- [x] 点赞功能
- [x] 浏览统计
- [x] 阅读进度
- [x] 后台统计Dashboard

---

### Phase 4: SEO优化 (Week 10-11)
**目标**: 提升搜索引擎排名

**任务**:
- [x] Meta标签动态生成
- [x] Sitemap自动生成
- [x] 结构化数据
- [x] 性能优化（Lighthouse 90+）
- [x] 图片CDN配置
- [x] Redis缓存策略

---

### Phase 5: 上线部署 (Week 12)
**目标**: 网站正式上线

**任务**:
- [x] 域名备案
- [x] 服务器配置
- [x] Cloudflare CDN
- [x] SSL证书
- [x] 监控告警
- [x] 备份策略

---

### Phase 6: 运营迭代 (持续)

**0-6个月**: 内容积累期
- 发布50+篇文章
- SEO优化
- 社交媒体推广

**6-12个月**: 初步变现
- Google AdSense
- 联盟营销
- 付费内容试水

**12个月+**: 深度变现
- 会员订阅
- 知识付费课程
- 技术咨询服务

---

## 💰 成本预估

### 最小化配置 (月成本: ¥80)
```
腾讯云轻量 2核4G    ¥74
域名分摊           ¥5
Cloudflare R2      ¥0 (免费额度)
Vercel            ¥0 (免费版)
```

### 推荐配置 (月成本: ¥390)
```
阿里云ECS 2核4G    ¥200
Cloudflare R2      ¥50
Vercel Pro        ¥140
```

### 流量起来后 (月成本: ¥1000+)
```
服务器升级         ¥400
CDN流量           ¥300
数据库独立         ¥300
```

---

## 🎨 商业模式

### 阶段一: 流量积累 (0-6月)
- 专注内容质量
- SEO优化
- 建立邮件列表
- 收入: ¥0

### 阶段二: 初步变现 (6-12月)
- Google AdSense: ¥600-3000/月
- 联盟营销: ¥1200-5000/月
- 付费文章试水: ¥500-2000/月
- **预期收入**: ¥2000-10000/月

### 阶段三: 深度变现 (12月+)
- 会员订阅 (¥99/月, ¥999/年)
  - 目标: 100个年费会员 = ¥99900/年
- 专栏课程 (¥199-699/个)
  - 目标: 10个专栏 × 50人 = ¥99500
- 技术咨询 (¥2999/天)
  - 目标: 每月2天 = ¥5998/月
- **预期收入**: ¥20000-50000/月

详见: [monetization-strategy.md](./superpowers/specs/monetization-strategy.md)

---

## 🔒 安全策略

### 核心原则
1. **认证授权**: JWT + 角色权限
2. **SQL注入防护**: GORM参数化查询
3. **XSS防护**: React自动转义 + DOMPurify
4. **CSRF防护**: gin-csrf中间件
5. **请求频率限制**: 100次/分钟
6. **敏感信息保护**: 环境变量 + .gitignore

详见: [security-strategy.md](./superpowers/specs/security-strategy.md)

---

## 🚀 SEO策略

### 技术SEO
- Next.js动态Meta生成
- 结构化数据(JSON-LD)
- Sitemap自动生成
- robots.txt配置

### 内容SEO
- 关键词研究（Ahrefs, 5118）
- 长尾关键词定位
- 内部链接建设
- 外部权威引用

### 性能优化
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Lighthouse ≥ 90分

详见: [seo-strategy.md](./superpowers/specs/seo-strategy.md)

---

## 📈 关键指标

### 技术指标
- [ ] 测试覆盖率 ≥ 80%
- [ ] API响应时间 < 200ms (P95)
- [ ] 首屏加载时间 < 2s
- [ ] Lighthouse分数 ≥ 90
- [ ] 错误率 < 0.1%

### 业务指标
- [ ] 日活用户 (DAU)
- [ ] 文章发布数
- [ ] 文章平均阅读时长
- [ ] 评论数/文章
- [ ] 注册转化率
- [ ] 付费转化率

---

## 🎯 里程碑

### M1 - MVP上线 (Week 12)
- [ ] 用户能注册登录
- [ ] 能发布和浏览文章
- [ ] 基础SEO配置
- [ ] 网站正式上线

### M2 - 功能完善 (Month 3)
- [ ] 评论系统上线
- [ ] 后台统计完善
- [ ] 搜索功能引入
- [ ] 发布50篇文章

### M3 - 初步变现 (Month 6)
- [ ] Google AdSense接入
- [ ] 月收入 > ¥2000
- [ ] 自然流量 > 10000/月

### M4 - 深度商业化 (Month 12)
- [ ] 会员系统上线
- [ ] 付费课程发布
- [ ] 月收入 > ¥20000

---

## 📚 开发规范

### Git工作流
```
main (生产环境)
└── develop (开发分支)
    ├── feature/xxx (功能分支)
    ├── bugfix/xxx (修复分支)
    └── hotfix/xxx (紧急修复)
```

### Commit规范
```
feat(article): add pagination
fix(auth): resolve token expiration
refactor(api): simplify error handling
docs(readme): update installation guide
```

### 代码质量
- ESLint/Golint无警告
- Prettier格式化
- 单元测试覆盖率 ≥ 80%
- 代码Review通过

详见: [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md)

---

## 🛠️ 开发环境

### 必需工具
- Go 1.22+
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+
- Docker 24+

### 启动项目
```bash
# 克隆仓库
git clone https://github.com/yourusername/tzblog.git
cd tzblog

# 启动Docker服务
docker-compose up -d

# 后端
cd backend
cp .env.example .env
make migrate-up
make run

# 前端
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

---

## 📖 文档索引

### 必读文档（开发前）
1. ✅ [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md) - 开发规范
2. ✅ [database-design.md](./superpowers/specs/database-design.md) - 数据库设计
3. ✅ [api-design.md](./superpowers/specs/api-design.md) - API接口
4. ✅ [TASK_BREAKDOWN.md](./TASK_BREAKDOWN.md) - 任务分解

### 架构设计
- [backend-architecture.md](./superpowers/specs/backend-architecture.md)
- [frontend-architecture.md](./superpowers/specs/frontend-architecture.md)
- [cache-strategy.md](./superpowers/specs/cache-strategy.md)
- [security-strategy.md](./superpowers/specs/security-strategy.md)

### 产品规划
- [final-tech-stack.md](./superpowers/specs/final-tech-stack.md)
- [monetization-strategy.md](./superpowers/specs/monetization-strategy.md)
- [seo-strategy.md](./superpowers/specs/seo-strategy.md)

### 部署运维
- [deployment-architecture.md](./superpowers/specs/deployment-architecture.md)
- [implementation-roadmap.md](./superpowers/plans/implementation-roadmap.md)

---

## 🤝 协作流程

### 开发流程
1. 从develop分支创建feature分支
2. 本地开发 + 单元测试
3. 提交PR到develop
4. Code Review
5. CI/CD自动测试
6. 合并到develop
7. 测试环境验证
8. 合并到main并发布

### 任务管理
- 使用GitHub Issues跟踪任务
- 使用GitHub Projects看板管理
- 每周Review进度

---

## 📞 联系方式

- **项目负责人**: ha1den
- **GitHub**: [项目仓库链接]
- **文档更新**: 遵循语义化版本

---

## ✅ 下一步行动

现在所有规划文档已完成，可以开始编码！

### 立即开始
1. **阅读必读文档**（约2小时）
2. **搭建开发环境**（约1小时）
3. **开始Phase 1 第一个任务**

### 从哪里开始？
推荐顺序：
1. 后端项目脚手架 (Task 1.1.1)
2. 数据库设计与迁移 (Task 1.1.2)
3. 前端项目初始化 (Task 1.2.1)

**准备好了吗？让我们开始编码吧！** 🚀
