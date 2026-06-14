# TZBlog 后端开发 - Phase 1-3 完整实施

## Goal: 完成TZBlog后端Phase 1-3所有功能

在feature/backend-phase1-3分支上，完成后端基础设施、用户认证、文章管理、评论点赞等核心功能的完整开发。

---

## 项目背景

**项目**: TZBlog - 个人技术博客平台  
**GitHub**: https://github.com/MICBIK/TZBlog.git  
**当前分支**: main  
**工作目录**: /Users/baihaibin/Documents/WorkSpares/TZBlog  
**角色**: 后端全栈开发

**技术栈**:
- Go 1.22+ + Gin + GORM
- PostgreSQL 15+ + Redis 7+
- JWT认证 + bcrypt密码加密
- Cloudflare R2对象存储
- Docker + GitHub Actions

---

## 必读文档（项目根目录已存在）

1. docs/PROJECT_STANDARDS.md - Go代码规范
2. docs/superpowers/specs/backend-architecture.md - 后端架构
3. docs/superpowers/specs/database-design.md - 数据库设计（10张表）
4. docs/superpowers/specs/api-design.md - API接口规范
5. docs/superpowers/specs/security-strategy.md - 安全策略
6. docs/TASK_BREAKDOWN.md - Phase 1任务
7. docs/TASK_BREAKDOWN_PHASE2-6.md - Phase 2-3任务

**请先读取这些文档理解设计后再编码！**

---

## Phase 1: 基础设施搭建 (8个任务，34小时)

### Task 1.1.1: Go项目脚手架初始化 (4h)
创建backend/目录，初始化go.mod，配置Makefile

### Task 1.1.2: 数据库迁移 (8h)
创建10张核心表：users, articles, categories, tags, article_tags, comments, likes, follows, subscriptions, orders

### Task 1.1.3: 配置管理 (3h)
使用Viper读取config.yaml和环境变量

### Task 1.1.4: JWT认证中间件 (6h)
实现GenerateToken、ValidateToken、Auth中间件

### Task 1.1.5: 基础中间件 (4h)
实现CORS、Logger、Recovery、RequestID中间件

### Task 1.1.6: 统一响应格式 (2h)
实现pkg/response包，Success和Error函数

### Task 1.3.1: Docker容器化 (4h)
创建Dockerfile和docker-compose.yml

### Task 1.3.2: GitHub Actions CI (3h)
配置.github/workflows/backend-ci.yml

---

## Phase 2: 核心功能开发 (12个任务，45小时)

### 2.1 用户认证系统 (3个任务，12h)

#### Task 2.1.1: 用户注册API (6h)
**交付物**:
- POST /api/v1/auth/register
- 密码加密（bcrypt）
- 用户名/邮箱唯一性检查
- 返回JWT token
- 单元测试覆盖率>85%

**实现要点**:
```go
type RegisterRequest struct {
    Username string `json:"username" binding:"required,min=3,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
}
```

**测试用例**:
- 正常注册成功
- 用户名/邮箱重复返回错误
- 密码/邮箱格式验证

---

#### Task 2.1.2: 用户登录API (4h)
**交付物**:
- POST /api/v1/auth/login
- 密码验证（bcrypt.CompareHashAndPassword）
- 生成JWT token
- 单元测试

---

#### Task 2.1.3: 获取当前用户信息API (2h)
**交付物**:
- GET /api/v1/auth/me
- 需要JWT认证
- 返回用户信息（不含password_hash）

---

### 2.2 文章管理API (5个任务，26h)

#### Task 2.2.1: 创建文章API (6h)
**交付物**:
- POST /api/v1/articles
- 需要管理员权限
- 自动生成slug（使用github.com/gosimple/slug）
- 计算阅读时长（字数/200）
- 关联标签
- 单元测试

**实现要点**:
```go
type CreateArticleRequest struct {
    Title      string   `json:"title" binding:"required,max=255"`
    Content    string   `json:"content" binding:"required"`
    Summary    string   `json:"summary" binding:"max=500"`
    CoverImage string   `json:"coverImage"`
    CategoryID int64    `json:"categoryId"`
    Tags       []string `json:"tags"`
    IsPremium  bool     `json:"isPremium"`
    Status     string   `json:"status" binding:"oneof=draft published"`
}
```

---

#### Task 2.2.2: 文章列表API (6h)
**交付物**:
- GET /api/v1/articles
- 分页支持（page, limit）
- 筛选支持（category, tag, status）
- 排序支持（latest, popular）
- Redis缓存热门文章
- 单元测试

**Query参数**:
```
?page=1&limit=20&category=frontend&tag=react&status=published&sort=latest
```

---

#### Task 2.2.3: 文章详情API (4h)
**交付物**:
- GET /api/v1/articles/:slug
- 关联查询（作者、标签、分类）
- 浏览量+1（异步，防刷）
- 相关文章推荐（同标签/分类）
- Redis缓存
- 单元测试

---

#### Task 2.2.4: 更新和删除文章API (4h)
**交付物**:
- PUT /api/v1/articles/:id
- DELETE /api/v1/articles/:id
- 权限检查（仅作者或管理员）
- 软删除（deleted_at）
- 清除Redis缓存
- 单元测试

---

#### Task 2.2.5: 分类和标签API (4h)
**交付物**:
- GET /api/v1/categories（分类列表）
- POST /api/v1/categories（需管理员）
- GET /api/v1/tags（标签列表，按使用频率排序）
- POST /api/v1/tags（需管理员）
- 单元测试

---

### 2.3 图片上传功能 (2个任务，9h)

#### Task 2.3.1: Cloudflare R2集成 (6h)
**交付物**:
- 集成aws-sdk-go-v2（R2兼容S3 API）
- 实现UploadImage函数
- 图片大小限制（5MB）
- 图片格式验证（jpg, png, webp）
- 返回CDN URL
- 单元测试

**实现示例**:
```go
import "github.com/aws/aws-sdk-go-v2/service/s3"

type StorageService struct {
    client *s3.Client
    bucket string
}

func (s *StorageService) UploadImage(file []byte, filename string) (string, error) {
    // 1. 生成唯一文件名（UUID + 扩展名）
    // 2. 上传到R2
    // 3. 返回CDN URL
}
```

---

#### Task 2.3.2: 图片上传API (3h)
**交付物**:
- POST /api/v1/upload/image
- multipart/form-data解析
- 需要认证
- 返回图片URL
- 单元测试

---

## Phase 3: 高级功能开发 (5个任务，24h)

### 3.1 评论系统 (1个任务，8h)

#### Task 3.1.1: 评论API (8h)
**交付物**:
- POST /api/v1/articles/:id/comments（发表评论）
- GET /api/v1/articles/:id/comments（获取评论列表）
- DELETE /api/v1/comments/:id（删除评论）
- 支持嵌套回复（parent_id）
- 分页支持
- 单元测试

**实现要点**:
```go
type CreateCommentRequest struct {
    Content  string `json:"content" binding:"required,max=1000"`
    ParentID *int64 `json:"parentId"`
}

// 递归查询评论树
func buildCommentTree(comments []Comment) []CommentWithReplies
```

---

### 3.2 点赞功能 (1个任务，4h)

#### Task 3.2.1: 点赞API (4h)
**交付物**:
- POST /api/v1/articles/:id/like（点赞文章）
- POST /api/v1/comments/:id/like（点赞评论）
- 防重复点赞（UNIQUE约束）
- Redis缓存点赞数
- 单元测试

**实现要点**:
```go
// 检查是否已点赞
func (r *LikeRepository) HasLiked(userID, targetID int64, targetType string) bool

// 切换点赞状态
func (s *LikeService) ToggleLike(userID, targetID int64, targetType string) (liked bool, count int)
```

---

### 3.3 浏览统计 (1个任务，4h)

#### Task 3.3.1: 浏览统计API (4h)
**交付物**:
- 浏览量记录（防刷，同IP 1小时内只计1次）
- Redis缓存浏览数
- 定时同步到PostgreSQL（每分钟）
- 热门文章排行

**实现要点**:
```go
// Redis key: article:view:{article_id}:{ip_hash}
func (s *ViewService) RecordView(articleID int64, ip string) error {
    key := fmt.Sprintf("article:view:%d:%s", articleID, hashIP(ip))
    
    // 如果key不存在，说明1小时内未访问过
    exists := s.redis.Exists(ctx, key).Val()
    if exists == 0 {
        s.redis.Set(ctx, key, 1, 1*time.Hour)
        s.redis.Incr(ctx, fmt.Sprintf("article:view_count:%d", articleID))
        return nil
    }
    return nil
}
```

---

### 3.4 阅读进度记录 (1个任务，4h)

#### Task 3.4.1: 阅读进度API (4h)
**交付物**:
- POST /api/v1/articles/:id/progress（记录阅读进度）
- GET /api/v1/articles/:id/progress（获取阅读进度）
- 存储阅读百分比和位置
- 用于退款判定

**实现要点**:
```go
type RecordProgressRequest struct {
    Progress     int `json:"progress" binding:"min=0,max=100"`  // 百分比
    LastPosition int `json:"lastPosition"`                       // 字符位置
}

// user_read_progress表
// PRIMARY KEY (user_id, article_id)
```

---

### 3.5 后台统计API (1个任务，4h)

#### Task 3.5.1: 统计API (4h)
**交付物**:
- GET /api/v1/admin/stats/overview（概览统计）
- GET /api/v1/admin/stats/articles（文章统计）
- GET /api/v1/admin/stats/traffic（流量统计）
- Redis缓存（5分钟）

**返回数据**:
```go
type OverviewStats struct {
    TotalArticles   int64 `json:"totalArticles"`
    TotalUsers      int64 `json:"totalUsers"`
    TotalViews      int64 `json:"totalViews"`
    TotalComments   int64 `json:"totalComments"`
    TodayViews      int64 `json:"todayViews"`
    TodayComments   int64 `json:"todayComments"`
}
```

---

## 开发规范（必须严格遵守）

### Git工作流
```bash
# 1. 创建分支
git checkout -b feature/backend-phase1-3

# 2. 每完成一个Task提交
git add .
git commit -m "feat(backend): complete Task 2.1.1 - user register API"

# 3. 定期推送
git push origin feature/backend-phase1-3

# 4. 全部完成后创建PR
gh pr create --base develop --head feature/backend-phase1-3
```

### Commit规范
- feat(backend): 新功能
- fix(backend): Bug修复
- test(backend): 测试
- refactor(backend): 重构

### 代码规范
- 包名小写无分隔
- 接口名词+er后缀
- 结构体PascalCase
- 方法PascalCase动词开头
- GORM参数化查询
- 错误必须处理

---

## Phase 1-3 完成标准

### 功能检查
- make run启动成功
- make migrate-up创建所有表
- make test所有测试通过（覆盖率>80%）
- make lint无错误
- docker-compose up -d所有服务正常
- CI流程通过

### API完整性
- 认证API：注册、登录、获取用户信息 ✅
- 文章API：CRUD、列表、详情、点赞 ✅
- 分类标签API：列表、创建 ✅
- 评论API：创建、列表、删除 ✅
- 上传API：图片上传 ✅
- 统计API：后台概览 ✅

### 代码质量
- 单元测试覆盖率>80%
- 无golint警告
- 符合PROJECT_STANDARDS.md

---

## 任务进度追踪（共25个任务）

### Phase 1 (8个任务)
- [ ] 1.1.1: Go脚手架
- [ ] 1.1.2: 数据库迁移
- [ ] 1.1.3: 配置管理
- [ ] 1.1.4: JWT认证
- [ ] 1.1.5: 基础中间件
- [ ] 1.1.6: 统一响应
- [ ] 1.3.1: Docker
- [ ] 1.3.2: CI/CD

### Phase 2 (12个任务)
- [ ] 2.1.1: 用户注册API
- [ ] 2.1.2: 用户登录API
- [ ] 2.1.3: 获取用户API
- [ ] 2.2.1: 创建文章API
- [ ] 2.2.2: 文章列表API
- [ ] 2.2.3: 文章详情API
- [ ] 2.2.4: 更新删除文章API
- [ ] 2.2.5: 分类标签API
- [ ] 2.3.1: R2集成
- [ ] 2.3.2: 图片上传API

### Phase 3 (5个任务)
- [ ] 3.1.1: 评论API
- [ ] 3.2.1: 点赞API
- [ ] 3.3.1: 浏览统计API
- [ ] 3.4.1: 阅读进度API
- [ ] 3.5.1: 后台统计API

---

## 重要提醒

### 禁止操作
- 不要修改frontend/代码
- 不要修改docs/文档
- 不要提交.env文件
- 不要提交敏感信息

### 必须操作
- 严格按顺序执行（Phase 1→2→3）
- 每个Task完成后验收
- 单元测试覆盖率>80%
- 使用bcrypt加密密码
- 使用GORM参数化查询
- 错误日志使用zap

---

## 最终交付

Phase 1-3全部完成后创建PR，PR描述包含：

1. 完成的25个任务清单
2. API接口清单
3. 测试覆盖率报告
4. 使用说明（如何启动、如何测试）
5. 环境变量说明

---

现在开始执行！从Phase 1的Task 1.1.1开始，一步步完成所有25个任务。Good luck!
