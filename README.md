# TZBlog - 个人技术博客平台

> 专注高质量技术内容创作，支持知识付费的现代化博客系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)](https://go.dev/)
[![Node Version](https://img.shields.io/badge/Node-20+-339933?logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)

---

## ✨ 项目特色

- 🎨 **现代化UI** - 基于Next.js 15 + React 19 + Tailwind v4 + shadcn/ui
- ⚡ **高性能后端** - Go + Gin + PostgreSQL + Redis
- 📝 **Markdown优先** - 专业代码高亮，技术博客标配
- 🔍 **SEO友好** - 动态Meta、Sitemap、结构化数据
- 💰 **商业化支持** - 付费内容、会员订阅、知识付费
- 🎯 **个人品牌** - 突出作者信息，建立技术影响力

---

## 📚 完整文档

### 🚀 快速开始
- **[PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md)** - 项目总览（强烈推荐先读这个）

### 📖 开发指南
- **[PROJECT_STANDARDS.md](./docs/PROJECT_STANDARDS.md)** - 开发规范（必读）
- **[TASK_BREAKDOWN.md](./docs/TASK_BREAKDOWN.md)** - Phase 1 详细任务
- **[TASK_BREAKDOWN_PHASE2-6.md](./docs/TASK_BREAKDOWN_PHASE2-6.md)** - Phase 2-6 详细任务

### 🏗️ 架构设计
- [数据库设计](./docs/superpowers/specs/database-design.md)
- [API接口文档](./docs/superpowers/specs/api-design.md)
- [后端架构](./docs/superpowers/specs/backend-architecture.md)
- [前端架构](./docs/superpowers/specs/frontend-architecture.md)
- [缓存策略](./docs/superpowers/specs/cache-strategy.md)
- [安全策略](./docs/superpowers/specs/security-strategy.md)

### 💼 产品规划
- [最终技术方案](./docs/superpowers/specs/final-tech-stack.md)
- [盈利模式](./docs/superpowers/specs/monetization-strategy.md)
- [SEO策略](./docs/superpowers/specs/seo-strategy.md)
- [部署架构](./docs/superpowers/specs/deployment-architecture.md)

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router) + React 19
- **语言**: TypeScript (strict mode)
- **样式**: Tailwind CSS v4
- **组件库**: shadcn/ui + Radix UI
- **状态管理**: Zustand
- **数据获取**: TanStack Query
- **编辑器**: @uiw/react-md-editor

### 后端
- **语言**: Go 1.22+
- **框架**: Gin
- **ORM**: GORM
- **数据库**: PostgreSQL 15+
- **缓存**: Redis 7+
- **搜索**: Meilisearch (Phase 2)
- **存储**: Cloudflare R2

### DevOps
- **前端部署**: Vercel
- **后端部署**: 云服务器
- **CDN**: Cloudflare
- **CI/CD**: GitHub Actions
- **监控**: Sentry + Prometheus

---

## 🚀 快速开始

### 环境要求
- Go 1.22+
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+
- Docker 24+ (可选)

### 方式一：Docker一键启动（推荐）
```bash
# 克隆仓库
git clone https://github.com/yourusername/tzblog.git
cd tzblog

# 启动所有服务
docker-compose up -d

# 访问
# 前端: http://localhost:3000
# 后端: http://localhost:8080
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### 方式二：手动启动

#### 1. 启动数据库服务
```bash
# 启动PostgreSQL
docker run -d \
  --name tzblog-postgres \
  -e POSTGRES_DB=tzblog \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine

# 启动Redis
docker run -d \
  --name tzblog-redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### 2. 启动后端
```bash
cd backend

# 复制配置文件
cp .env.example .env

# 安装依赖
go mod download

# 运行数据库迁移
make migrate-up

# 启动服务
make run

# 后端服务运行在 http://localhost:8080
```

#### 3. 启动前端
```bash
cd frontend

# 复制配置文件
cp .env.example .env.local

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 前端服务运行在 http://localhost:3000
```

---

## 📂 项目结构

```
tzblog/
├── backend/                    # Go后端
│   ├── cmd/
│   │   └── server/
│   │       └── main.go        # 应用入口
│   ├── internal/
│   │   ├── api/               # API层
│   │   ├── domain/            # 领域模型
│   │   ├── repository/        # 数据访问层
│   │   └── service/           # 业务逻辑层
│   ├── pkg/                   # 公共工具包
│   ├── config/                # 配置文件
│   ├── migrations/            # 数据库迁移
│   ├── Dockerfile
│   ├── Makefile
│   └── go.mod
├── frontend/                   # Next.js前端
│   ├── app/                   # 页面路由
│   │   ├── (public)/         # 公开页面
│   │   ├── (auth)/           # 认证页面
│   │   └── (dashboard)/      # 后台管理
│   ├── components/            # React组件
│   │   ├── ui/               # shadcn组件
│   │   ├── article/
│   │   ├── layout/
│   │   └── shared/
│   ├── lib/                   # 工具函数
│   │   ├── api/              # API客户端
│   │   ├── hooks/            # 自定义Hooks
│   │   └── store/            # 状态管理
│   ├── types/                 # TypeScript类型
│   ├── public/                # 静态资源
│   ├── Dockerfile
│   └── package.json
├── docs/                      # 完整文档
│   ├── PROJECT_OVERVIEW.md   # 项目总览
│   ├── PROJECT_STANDARDS.md  # 开发规范
│   ├── TASK_BREAKDOWN.md     # 任务分解
│   └── superpowers/
│       ├── specs/            # 设计文档
│       └── plans/            # 实施计划
├── TZBlog设计初稿/            # UI设计文件
├── docker-compose.yml
└── README.md
```

---

## 🎯 开发路线图

### ✅ Phase 1: 基础设施搭建 (Week 1-2)
- [x] 项目脚手架
- [x] 数据库设计
- [x] JWT认证
- [x] Docker容器化
- [x] CI/CD配置

### 🚧 Phase 2: 核心功能开发 (Week 3-6)
- [ ] 用户注册/登录
- [ ] 文章CRUD
- [ ] Markdown编辑器
- [ ] 图片上传到R2
- [ ] 文章展示页面
- [ ] 后台管理界面

### 📅 Phase 3: 高级功能 (Week 7-9)
- [ ] 评论系统
- [ ] 点赞功能
- [ ] 浏览统计
- [ ] 后台统计分析

### 📅 Phase 4: SEO优化 (Week 10-11)
- [ ] Meta标签动态生成
- [ ] Sitemap自动生成
- [ ] 性能优化
- [ ] Lighthouse 90+

### 📅 Phase 5: 上线部署 (Week 12)
- [ ] 服务器配置
- [ ] 域名备案
- [ ] Cloudflare CDN
- [ ] 监控告警

### 📅 Phase 6: 运营迭代 (持续)
- [ ] 内容创作
- [ ] SEO优化
- [ ] 功能迭代
- [ ] 商业化

详见: [TASK_BREAKDOWN.md](./docs/TASK_BREAKDOWN.md)

---

## 📖 开发规范

### Git提交规范
```bash
feat(article): add pagination feature
fix(auth): resolve JWT token expiration
refactor(api): simplify error handling
docs(readme): update installation guide
```

### 分支管理
```
main              # 生产环境
├── develop       # 开发分支
│   ├── feature/article-list
│   ├── feature/user-auth
│   └── bugfix/comment-delete
```

### 代码质量要求
- ✅ 单元测试覆盖率 ≥ 80%
- ✅ ESLint/Golint无警告
- ✅ Prettier格式化
- ✅ TypeScript严格模式
- ✅ Code Review通过

详见: [PROJECT_STANDARDS.md](./docs/PROJECT_STANDARDS.md)

---

## 🧪 测试

### 后端测试
```bash
cd backend

# 运行所有测试
make test

# 查看覆盖率
make test-coverage

# 运行特定包测试
go test ./internal/service/...
```

### 前端测试
```bash
cd frontend

# 运行单元测试
pnpm test

# 查看覆盖率
pnpm test:coverage

# E2E测试
pnpm test:e2e
```

---

## 🔨 常用命令

### 后端Makefile
```bash
make run          # 启动服务
make build        # 编译
make test         # 运行测试
make lint         # 代码检查
make migrate-up   # 数据库迁移
make migrate-down # 回滚迁移
```

### 前端pnpm scripts
```bash
pnpm dev          # 开发服务器
pnpm build        # 生产构建
pnpm start        # 启动生产服务
pnpm lint         # ESLint检查
pnpm format       # Prettier格式化
```

---

## 💰 商业模式

### 阶段一: 流量积累 (0-6月)
- 发布50+篇高质量文章
- SEO优化，获得自然流量
- 建立邮件订阅列表

### 阶段二: 初步变现 (6-12月)
- Google AdSense: ¥600-3000/月
- 联盟营销: ¥1200-5000/月
- 付费文章: ¥500-2000/月
- **预期**: ¥2000-10000/月

### 阶段三: 深度变现 (12月+)
- 会员订阅 (¥99/月, ¥999/年)
- 知识付费课程 (¥199-699/个)
- 技术咨询服务 (¥2999/天)
- **预期**: ¥20000-50000/月

详见: [monetization-strategy.md](./docs/superpowers/specs/monetization-strategy.md)

---

## 💡 核心功能

### 已规划功能
- ✅ 用户认证（注册/登录/JWT）
- ✅ 文章管理（CRUD）
- ✅ Markdown编辑器
- ✅ 图片上传（Cloudflare R2）
- ✅ 分类和标签
- ✅ 评论系统
- ✅ 点赞功能
- ✅ 浏览统计
- ✅ 全文搜索（Meilisearch）
- ✅ SEO优化
- ✅ 付费内容
- ✅ 会员订阅

### 未来功能
- [ ] 用户关注
- [ ] 邮件通知
- [ ] RSS订阅
- [ ] 移动App
- [ ] 国际化(i18n)

---

## 📊 性能目标

### 前端性能
- Lighthouse分数: ≥ 90
- 首屏加载: < 2s
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

### 后端性能
- API响应时间: < 200ms (P95)
- 数据库查询: < 100ms
- 并发支持: 1000 req/s
- 错误率: < 0.1%

---

## 🔒 安全特性

- ✅ JWT认证
- ✅ 密码加密（bcrypt）
- ✅ SQL注入防护（GORM参数化）
- ✅ XSS防护（React + DOMPurify）
- ✅ CSRF防护
- ✅ 请求频率限制
- ✅ HTTPS强制
- ✅ 环境变量管理

详见: [security-strategy.md](./docs/superpowers/specs/security-strategy.md)

---

## 🤝 贡献指南

欢迎贡献！请遵循以下流程：

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

请确保：
- 遵循代码规范
- 添加单元测试
- 更新相关文档
- PR描述清晰

---

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](./LICENSE) 文件。

---

## 👨‍💻 作者

**ha1den**

- GitHub: [@ha1den](https://github.com/ha1den)
- 博客: [TZBlog.com](https://tzblog.com) (即将上线)

---

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/)
- [Gin](https://gin-gonic.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [GORM](https://gorm.io/)
- [Meilisearch](https://www.meilisearch.com/)

---

## 📞 支持

如有问题或建议：

- 提交 [Issue](https://github.com/yourusername/tzblog/issues)
- 发起 [Discussion](https://github.com/yourusername/tzblog/discussions)
- 邮件联系: your@email.com

---

## 🎯 下一步

1. 阅读 [PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md) 了解项目全貌
2. 查看 [PROJECT_STANDARDS.md](./docs/PROJECT_STANDARDS.md) 学习开发规范
3. 开始 [Phase 1 任务](./docs/TASK_BREAKDOWN.md)
4. 开始编码！🚀

---

**⭐ 如果觉得这个项目对你有帮助，请给个Star！**
