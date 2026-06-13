# TZBlog 项目开发规范

## 📋 目录
1. [代码规范](#代码规范)
2. [Git工作流](#git工作流)
3. [测试规范](#测试规范)
4. [文档规范](#文档规范)
5. [安全规范](#安全规范)
6. [性能规范](#性能规范)

---

## 代码规范

### Go后端代码规范

#### 1. 项目结构
```
backend/
├── cmd/
│   └── server/
│       └── main.go                 # 入口文件
├── internal/
│   ├── api/
│   │   ├── handlers/              # HTTP处理器
│   │   │   ├── article_handler.go
│   │   │   ├── user_handler.go
│   │   │   └── auth_handler.go
│   │   ├── middleware/            # 中间件
│   │   │   ├── auth.go
│   │   │   ├── cors.go
│   │   │   └── logger.go
│   │   └── routes/                # 路由定义
│   │       └── routes.go
│   ├── domain/                    # 领域模型
│   │   ├── article/
│   │   │   ├── model.go          # 数据模型
│   │   │   ├── repository.go     # 接口定义
│   │   │   └── service.go        # 业务逻辑
│   │   └── user/
│   ├── repository/                # 数据访问实现
│   │   ├── postgres/
│   │   │   ├── article_repo.go
│   │   │   └── user_repo.go
│   │   └── redis/
│   │       └── cache_repo.go
│   ├── service/                   # 业务服务实现
│   │   ├── article_service.go
│   │   └── user_service.go
│   └── pkg/                       # 内部工具包
│       ├── auth/
│       ├── cache/
│       └── email/
├── pkg/                           # 公共工具包
│   ├── logger/
│   ├── validator/
│   ├── response/
│   └── errors/
├── config/
│   ├── config.go
│   └── config.yaml
├── migrations/                    # 数据库迁移
│   ├── 000001_init_schema.up.sql
│   └── 000001_init_schema.down.sql
├── scripts/                       # 脚本工具
├── tests/                         # 集成测试
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── go.mod
```

#### 2. 命名规范
```go
// 包名：小写，单词无分隔
package article

// 接口：名词 + er后缀
type ArticleRepository interface {
    FindByID(id int64) (*Article, error)
}

// 结构体：PascalCase
type Article struct {
    ID    int64  `json:"id"`
    Title string `json:"title"`
}

// 方法：PascalCase，动词开头
func (s *ArticleService) CreateArticle(req *CreateRequest) error {
    // ...
}

// 常量：PascalCase或UPPER_CASE
const (
    StatusDraft     = "draft"
    StatusPublished = "published"
)

// 私有变量/函数：camelCase
func validateTitle(title string) error {
    // ...
}
```

#### 3. 错误处理
```go
// 自定义错误类型
var (
    ErrArticleNotFound = errors.New("article not found")
    ErrUnauthorized    = errors.New("unauthorized")
)

// 错误包装
func (r *ArticleRepository) FindBySlug(slug string) (*Article, error) {
    var article Article
    if err := r.db.Where("slug = ?", slug).First(&article).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, ErrArticleNotFound
        }
        return nil, fmt.Errorf("failed to find article: %w", err)
    }
    return &article, nil
}

// Handler层错误处理
func (h *ArticleHandler) GetArticle(c *gin.Context) {
    article, err := h.service.GetBySlug(c.Param("slug"))
    if err != nil {
        if errors.Is(err, ErrArticleNotFound) {
            response.Error(c, http.StatusNotFound, "文章不存在")
            return
        }
        response.Error(c, http.StatusInternalServerError, "服务器错误")
        return
    }
    response.Success(c, article)
}
```

#### 4. 日志规范
```go
import "go.uber.org/zap"

// 结构化日志
logger.Info("article created",
    zap.Int64("article_id", article.ID),
    zap.String("author", author.Username),
)

// 错误日志
logger.Error("failed to create article",
    zap.Error(err),
    zap.String("title", req.Title),
)
```

---

### TypeScript/React前端规范

#### 1. 项目结构
```
frontend/
├── app/
│   ├── (public)/                  # 公开页面
│   │   ├── page.tsx              # 首页
│   │   ├── articles/
│   │   │   ├── page.tsx          # 文章列表
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # 文章详情
│   │   ├── about/
│   │   └── archive/
│   ├── (auth)/                    # 认证页面
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/               # 后台管理
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx          # Dashboard首页
│   │       ├── articles/
│   │       ├── media/
│   │       └── settings/
│   ├── api/                       # API路由
│   │   └── auth/
│   ├── layout.tsx
│   ├── globals.css
│   └── error.tsx
├── components/
│   ├── ui/                        # shadcn组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── article/
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleList.tsx
│   │   └── ArticleDetail.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   ├── editor/
│   │   └── MarkdownEditor.tsx
│   └── shared/
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── api/                       # API客户端
│   │   ├── client.ts
│   │   ├── article.ts
│   │   └── auth.ts
│   ├── hooks/                     # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useArticles.ts
│   │   └── useDebounce.ts
│   ├── store/                     # 状态管理
│   │   └── authStore.ts
│   ├── utils/                     # 工具函数
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── cn.ts
│   └── constants.ts
├── types/
│   ├── article.ts
│   ├── user.ts
│   └── api.ts
├── public/
│   ├── images/
│   └── fonts/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

#### 2. 命名规范
```typescript
// 组件：PascalCase
export function ArticleCard({ article }: ArticleCardProps) {
  return <div>...</div>
}

// Hooks：use开头，camelCase
export function useArticles() {
  // ...
}

// 类型/接口：PascalCase
interface Article {
  id: number;
  title: string;
}

type ArticleStatus = 'draft' | 'published' | 'archived';

// 常量：UPPER_SNAKE_CASE
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
export const MAX_TITLE_LENGTH = 255;

// 函数：camelCase
function formatDate(date: Date): string {
  // ...
}

// 文件名
// 组件：PascalCase.tsx
// 工具函数：camelCase.ts
// Hooks：use开头
```

#### 3. TypeScript类型定义
```typescript
// types/article.ts
export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  author: Author;
  tags: Tag[];
  publishedAt: string;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  categoryId: number;
  tags: string[];
}

export type ArticleStatus = 'draft' | 'published' | 'archived';
```

#### 4. React组件规范
```typescript
// 使用函数组件 + TypeScript
interface ArticleCardProps {
  article: Article;
  onClick?: (id: number) => void;
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  const handleClick = () => {
    onClick?.(article.id);
  };

  return (
    <div onClick={handleClick} className="...">
      <h3>{article.title}</h3>
      <p>{article.summary}</p>
    </div>
  );
}

// 服务端组件 vs 客户端组件
// 默认服务端组件
export default async function ArticlePage({ params }) {
  const article = await fetchArticle(params.slug);
  return <ArticleDetail article={article} />;
}

// 需要交互时使用客户端组件
'use client';

export function LikeButton({ articleId }: { articleId: number }) {
  const [liked, setLiked] = useState(false);
  
  const handleLike = async () => {
    await likeArticle(articleId);
    setLiked(true);
  };

  return <button onClick={handleLike}>...</button>;
}
```

---

## Git工作流

### 1. 分支策略
```
main            # 生产环境分支，受保护
├── develop     # 开发分支
│   ├── feature/article-list      # 功能分支
│   ├── feature/user-auth
│   ├── bugfix/comment-delete     # 修复分支
│   └── hotfix/security-patch     # 紧急修复
```

### 2. 分支命名
- `feature/功能名称` - 新功能开发
- `bugfix/问题描述` - Bug修复
- `hotfix/紧急问题` - 生产环境紧急修复
- `refactor/重构内容` - 代码重构
- `docs/文档更新` - 文档更新

### 3. Commit规范
```bash
# 格式
<type>(<scope>): <subject>

# 类型
feat:     新功能
fix:      Bug修复
refactor: 重构
docs:     文档更新
style:    代码格式（不影响功能）
test:     测试相关
chore:    构建/工具配置

# 示例
feat(article): add article list pagination
fix(auth): resolve JWT token expiration issue
refactor(api): simplify error handling
docs(readme): update installation guide
```

### 4. Pull Request规范
```markdown
## 📝 变更描述
简要描述本次PR的目的和内容

## 🔗 相关Issue
Closes #123

## ✅ 变更清单
- [ ] 实现文章列表分页功能
- [ ] 添加单元测试
- [ ] 更新API文档

## 🧪 测试计划
- 手动测试分页功能
- 运行所有单元测试
- 测试边界情况

## 📸 截图（如有UI变更）

## ⚠️ 注意事项
需要运行数据库迁移
```

---

## 测试规范

### 1. 测试覆盖率要求
- **单元测试覆盖率**: ≥ 80%
- **核心业务逻辑**: ≥ 90%
- **工具函数**: 100%

### 2. Go后端测试
```go
// article_service_test.go
func TestArticleService_CreateArticle(t *testing.T) {
    // Arrange
    mockRepo := &MockArticleRepository{}
    service := NewArticleService(mockRepo)
    req := &CreateArticleRequest{
        Title:   "Test Article",
        Content: "Content",
    }

    // Act
    article, err := service.CreateArticle(req)

    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, article)
    assert.Equal(t, "Test Article", article.Title)
}
```

### 3. 前端测试
```typescript
// ArticleCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ArticleCard } from './ArticleCard';

describe('ArticleCard', () => {
  const mockArticle = {
    id: 1,
    title: 'Test Article',
    summary: 'Test Summary'
  };

  it('renders article title', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ArticleCard article={mockArticle} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Test Article'));
    expect(handleClick).toHaveBeenCalledWith(1);
  });
});
```

---

## 文档规范

### 1. 代码注释
```go
// CreateArticle 创建新文章
// 参数:
//   - req: 文章创建请求
// 返回:
//   - *Article: 创建的文章对象
//   - error: 错误信息
func (s *ArticleService) CreateArticle(req *CreateArticleRequest) (*Article, error) {
    // 验证标题长度
    if len(req.Title) > 255 {
        return nil, ErrTitleTooLong
    }
    
    // ...
}
```

### 2. API文档
使用Swagger/OpenAPI规范，保持docs/superpowers/specs/api-design.md同步更新

### 3. README维护
每个模块保持README.md，说明：
- 模块功能
- 使用方法
- 配置说明
- 示例代码

---

## 安全规范

### 1. 敏感信息
- ❌ 禁止提交敏感信息到Git
- ✅ 使用环境变量
- ✅ .env文件加入.gitignore
- ✅ 提供.env.example模板

### 2. SQL注入防护
```go
// ✅ 正确：使用参数化查询
db.Where("slug = ?", slug).First(&article)

// ❌ 错误：字符串拼接
db.Where("slug = '" + slug + "'").First(&article)
```

### 3. XSS防护
```typescript
// ✅ React自动转义
<div>{article.title}</div>

// ⚠️ 使用dangerouslySetInnerHTML前必须sanitize
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(content)
}} />
```

### 4. 认证授权
- JWT Token有效期：7天
- Refresh Token有效期：30天
- 敏感操作需要二次验证

---

## 性能规范

### 1. 数据库查询
- 避免N+1查询，使用JOIN或预加载
- 合理使用索引
- 分页查询使用LIMIT
- 慢查询监控（>100ms记录日志）

### 2. API性能
- 响应时间目标：<200ms (P95)
- 使用Redis缓存热点数据
- 图片使用CDN
- 启用HTTP/2

### 3. 前端性能
- Lighthouse分数目标：≥90
- 首屏加载时间：<2s
- 代码分割，按需加载
- 图片懒加载

---

## 开发环境配置

### 必需工具
- **Go**: 1.22+
- **Node.js**: 20+
- **pnpm**: 9+
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Docker**: 24+

### IDE推荐
- **后端**: GoLand / VS Code + Go扩展
- **前端**: VS Code + ESLint + Prettier

### 代码格式化
```bash
# Go
go fmt ./...
goimports -w .

# TypeScript/React
pnpm prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"
pnpm eslint --fix "**/*.{ts,tsx}"
```

---

## 质量检查清单

### 提交前检查
- [ ] 代码格式化完成
- [ ] 单元测试通过
- [ ] 类型检查通过（TS/Go）
- [ ] 无ESLint/Golint警告
- [ ] 更新相关文档
- [ ] 提交信息符合规范

### PR合并前检查
- [ ] 代码Review通过
- [ ] CI/CD通过
- [ ] 测试覆盖率达标
- [ ] 无安全漏洞
- [ ] 性能无明显下降
