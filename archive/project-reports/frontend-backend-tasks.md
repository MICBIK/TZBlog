# TZBlog 前后端任务分工

> 前端由 ha1den 负责，后端由 Claude 负责

---

## 🎯 Phase 1: 基础设施搭建 (Week 1-2)

### 后端任务 (Claude负责)

#### ✅ Task 1.1.1: Go项目脚手架初始化
**工时**: 4小时  
**交付物**:
- [ ] 创建backend目录结构
- [ ] 初始化go.mod
- [ ] 配置Makefile
- [ ] 编写README.md

#### ✅ Task 1.1.2: 数据库设计与迁移
**工时**: 8小时  
**交付物**:
- [ ] 安装golang-migrate
- [ ] 创建10张核心表的迁移文件
- [ ] 编写up/down脚本
- [ ] 测试迁移

#### ✅ Task 1.1.3: 配置管理
**工时**: 3小时  
**交付物**:
- [ ] Viper配置读取
- [ ] config.yaml
- [ ] .env.example

#### ✅ Task 1.1.4: JWT认证中间件
**工时**: 6小时  
**交付物**:
- [ ] JWT Token生成/验证
- [ ] Auth中间件
- [ ] 单元测试

#### ✅ Task 1.1.5: 基础中间件
**工时**: 4小时  
**交付物**:
- [ ] CORS中间件
- [ ] Logger中间件
- [ ] Recovery中间件
- [ ] RequestID中间件

#### ✅ Task 1.1.6: 统一响应格式
**工时**: 2小时  
**交付物**:
- [ ] response包
- [ ] Success/Error函数
- [ ] 错误码定义

#### ✅ Task 1.3.1: Docker容器化
**工时**: 4小时  
**交付物**:
- [ ] 后端Dockerfile
- [ ] docker-compose.yml（包含PostgreSQL, Redis）

#### ✅ Task 1.3.2: GitHub Actions CI
**工时**: 3小时  
**交付物**:
- [ ] .github/workflows/backend-ci.yml
- [ ] 测试、构建、lint自动化

**后端Phase 1总工时**: ~34小时

---

### 前端任务 (ha1den负责)

#### ✅ Task 1.2.1: Next.js项目初始化
**工时**: 3小时  
**交付物**:
- [ ] 使用create-next-app创建项目
- [ ] 配置TypeScript strict mode
- [ ] 配置Tailwind CSS v4
- [ ] 安装shadcn/ui
- [ ] 配置eslint + prettier

#### ✅ Task 1.2.2: API客户端封装
**工时**: 4小时  
**交付物**:
- [ ] axios封装
- [ ] 请求/响应拦截器
- [ ] Token自动注入
- [ ] 错误统一处理

#### ✅ Task 1.2.3: 基础组件库
**工时**: 6小时  
**交付物**:
- [ ] 安装shadcn/ui核心组件
- [ ] Loading组件
- [ ] ErrorBoundary

#### ✅ Task 1.2.4: 路由结构规划
**工时**: 2小时  
**交付物**:
- [ ] 创建app目录结构
- [ ] 配置路由分组
- [ ] 创建布局文件

#### ✅ Task 1.3.1: Docker配置
**工时**: 2小时  
**交付物**:
- [ ] 前端Dockerfile
- [ ] 更新docker-compose.yml

#### ✅ Task 1.3.2: GitHub Actions CI
**工时**: 3小时  
**交付物**:
- [ ] .github/workflows/frontend-ci.yml
- [ ] ESLint、TypeScript、Build自动化

**前端Phase 1总工时**: ~20小时

---

## 🎯 Phase 2: 核心功能开发 (Week 3-6)

### 后端任务 (Claude负责)

#### 2.1 用户认证系统
- [ ] Task 2.1.1: 用户注册API (6h)
- [ ] Task 2.1.2: 用户登录API (4h)
- [ ] Task 2.1.3: 获取当前用户API (2h)

#### 2.2 文章管理API
- [ ] Task 2.2.1: 创建文章API (6h)
- [ ] Task 2.2.2: 文章列表API (6h)
- [ ] Task 2.2.3: 文章详情API (4h)
- [ ] Task 2.2.4: 更新/删除文章API (4h)
- [ ] Task 2.2.5: 分类和标签API (4h)

#### 2.3 图片上传
- [ ] Task 2.3.1: Cloudflare R2集成 (6h)
- [ ] Task 2.3.2: 图片上传API (3h)

**后端Phase 2总工时**: ~45小时

---

### 前端任务 (ha1den负责)

#### 2.1 用户认证界面
- [ ] Task 2.1.4: 登录注册页面 (8h)
- [ ] Task 2.1.5: 认证状态管理 (4h)

#### 2.4 Markdown编辑器
- [ ] Task 2.4.1: 集成@uiw/react-md-editor (4h)
- [ ] Task 2.4.2: 图片粘贴上传 (4h)
- [ ] Task 2.4.3: 文章创建页面 (8h)

#### 2.5 前端文章展示
- [ ] Task 2.5.1: 首页设计实现 (10h)
- [ ] Task 2.5.2: 文章列表页 (8h)
- [ ] Task 2.5.3: 文章详情页 (12h)

#### 2.6 后台管理界面
- [ ] Task 2.6.1: 管理后台布局 (6h)
- [ ] Task 2.6.2: 文章管理列表 (8h)
- [ ] Task 2.6.3: 文章编辑页 (4h)
- [ ] Task 2.6.4: Dashboard首页 (6h)

**前端Phase 2总工时**: ~82小时

---

## 🎯 Phase 3-6 (Week 7-12+)

详细任务见 [docs/TASK_BREAKDOWN_PHASE2-6.md](../docs/TASK_BREAKDOWN_PHASE2-6.md)

### 后端任务 (Claude负责)
- [ ] Phase 3: 评论API、点赞API、统计API
- [ ] Phase 4: SEO支持API、性能优化
- [ ] Phase 5: 部署脚本、监控配置
- [ ] Phase 6: 付费功能API、订阅系统

### 前端任务 (ha1den负责)
- [ ] Phase 3: 评论组件、点赞按钮、统计Dashboard
- [ ] Phase 4: SEO优化、性能优化
- [ ] Phase 5: Vercel部署
- [ ] Phase 6: 支付界面、会员中心

---

## 📋 协作规范

### Git工作流
- **后端分支**: `feature/backend-xxx`
- **前端分支**: `feature/frontend-xxx`
- **提交规范**: `feat(backend): xxx` / `feat(frontend): xxx`

### 联调约定
1. 后端API开发完成后通知前端
2. 提供API文档和测试数据
3. 前端发现API问题提Issue
4. 定期（每天）同步进度

### 开发环境
- 后端: `http://localhost:8080`
- 前端: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 代码Review
- 后端PR由ha1den Review
- 前端PR由Claude协助Review（如需）
- 相互帮助解决问题

---

## 📊 当前状态

### Phase 1 状态
- **后端**: 🔴 未开始（等待Claude开始）
- **前端**: 🔴 未开始（等待ha1den开始）

### 下一步
1. ✅ **立即**: Claude开始后端Task 1.1.1
2. ⏳ **同步**: ha1den开始前端Task 1.2.1
3. 🔄 **持续**: 每日同步进度

---

**开始时间**: 2026-06-14  
**目标完成**: Phase 1 在2周内完成
