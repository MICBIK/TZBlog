# Phase 2-6 详细任务（续）

## Phase 2: 核心功能开发 (Week 3-6)

### 2.1 用户认证系统 (Day 11-14)

#### Task 2.1.1: 用户注册API
**负责人**: 后端  
**工时**: 6小时  
**交付物**:
- [ ] POST /api/v1/auth/register接口
- [ ] 密码加密（bcrypt）
- [ ] 邮箱验证
- [ ] 用户名唯一性检查
- [ ] 单元测试（覆盖率>85%）

**实现要点**:
```go
type RegisterRequest struct {
    Username string `json:"username" binding:"required,min=3,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
}

func (h *AuthHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, 400, "参数验证失败")
        return
    }
    
    // 1. 检查用户名/邮箱是否已存在
    // 2. 密码加密 bcrypt.GenerateFromPassword
    // 3. 创建用户
    // 4. 生成JWT token
    // 5. 返回用户信息 + token
}
```

**测试用例**:
- ✅ 正常注册成功
- ✅ 用户名重复返回错误
- ✅ 邮箱重复返回错误
- ✅ 密码长度不足返回错误
- ✅ 邮箱格式错误返回错误

**依赖**: Phase 1完成

---

#### Task 2.1.2: 用户登录API
**负责人**: 后端  
**工时**: 4小时  
**交付物**:
- [ ] POST /api/v1/auth/login接口
- [ ] 密码验证
- [ ] 生成JWT token
- [ ] 单元测试

**依赖**: Task 2.1.1

---

#### Task 2.1.3: 获取当前用户信息API
**负责人**: 后端  
**工时**: 2小时  
**交付物**:
- [ ] GET /api/v1/auth/me接口
- [ ] 需要JWT认证
- [ ] 返回用户信息（不含密码）

**依赖**: Task 2.1.1

---

#### Task 2.1.4: 前端登录注册页面
**负责人**: 前端  
**工时**: 8小时  
**交付物**:
- [ ] 登录页面UI
- [ ] 注册页面UI
- [ ] 表单验证（react-hook-form）
- [ ] 错误提示
- [ ] 登录成功跳转

**页面路径**:
- `/login` - 登录
- `/register` - 注册

**表单验证规则**:
```typescript
const schema = z.object({
  email: z.string().email('邮箱格式错误'),
  password: z.string().min(8, '密码至少8位'),
});
```

**依赖**: Task 2.1.1, Task 2.1.2

---

#### Task 2.1.5: 前端认证状态管理
**负责人**: 前端  
**工时**: 4小时  
**交付物**:
- [ ] 使用Zustand管理认证状态
- [ ] useAuth hook
- [ ] 登录后token存储
- [ ] 登出功能
- [ ] 路由保护（需要登录的页面）

**实现示例**:
```typescript
// lib/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  token: null,
  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

// lib/hooks/useAuth.ts
export function useAuth() {
  const { user, token, login, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return { user, token, login, logout: handleLogout, isAuthenticated: !!token };
}
```

**依赖**: Task 2.1.4

---

### 2.2 文章管理后端 (Day 15-20)

#### Task 2.2.1: 文章CRUD API - 创建
**负责人**: 后端  
**工时**: 6小时  
**交付物**:
- [ ] POST /api/v1/articles
- [ ] 需要管理员权限
- [ ] 自动生成slug
- [ ] 计算阅读时长
- [ ] 单元测试

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

func (h *ArticleHandler) CreateArticle(c *gin.Context) {
    // 1. 参数验证
    // 2. 生成唯一slug（title转拼音+随机后缀）
    // 3. 计算阅读时长（content字数/200）
    // 4. 创建文章
    // 5. 关联标签
    // 6. 返回文章ID和slug
}
```

**依赖**: Phase 1完成

---

#### Task 2.2.2: 文章CRUD API - 查询列表
**负责人**: 后端  
**工时**: 6小时  
**交付物**:
- [ ] GET /api/v1/articles
- [ ] 支持分页
- [ ] 支持筛选（category, tag, status）
- [ ] 支持排序（latest, popular）
- [ ] 单元测试

**Query参数**:
```
?page=1&limit=20&category=frontend&tag=react&status=published&sort=latest
```

**依赖**: Task 2.2.1

---

#### Task 2.2.3: 文章CRUD API - 获取详情
**负责人**: 后端  
**工时**: 4小时  
**交付物**:
- [ ] GET /api/v1/articles/:slug
- [ ] 关联查询（作者、标签、分类）
- [ ] 浏览量+1（异步）
- [ ] 相关文章推荐
- [ ] 单元测试

**依赖**: Task 2.2.1

---

#### Task 2.2.4: 文章CRUD API - 更新和删除
**负责人**: 后端  
**工时**: 4小时  
**交付物**:
- [ ] PUT /api/v1/articles/:id
- [ ] DELETE /api/v1/articles/:id
- [ ] 权限检查（仅作者或管理员）
- [ ] 软删除
- [ ] 单元测试

**依赖**: Task 2.2.1

---

#### Task 2.2.5: 分类和标签API
**负责人**: 后端  
**工时**: 4小时  
**交付物**:
- [ ] GET /api/v1/categories
- [ ] POST /api/v1/categories (需管理员)
- [ ] GET /api/v1/tags
- [ ] POST /api/v1/tags (需管理员)
- [ ] 单元测试

**依赖**: Phase 1完成

---

### 2.3 图片上传功能 (Day 21-23)

#### Task 2.3.1: Cloudflare R2集成
**负责人**: 后端  
**工时**: 6小时  
**交付物**:
- [ ] 集成aws-sdk-go-v2（R2兼容S3）
- [ ] 实现上传接口
- [ ] 图片大小限制（5MB）
- [ ] 图片格式验证（jpg, png, webp）
- [ ] 返回CDN URL

**实现示例**:
```go
import (
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

type StorageService struct {
    client *s3.Client
    bucket string
}

func (s *StorageService) UploadImage(file []byte, filename string) (string, error) {
    // 1. 生成唯一文件名（UUID + 原扩展名）
    // 2. 上传到R2
    // 3. 返回CDN URL
    return "https://cdn.tzblog.com/images/xxx.jpg", nil
}
```

**依赖**: Phase 1完成

---

#### Task 2.3.2: 图片上传API
**负责人**: 后端  
**工时**: 3小时  
**交付物**:
- [ ] POST /api/v1/upload/image
- [ ] multipart/form-data解析
- [ ] 需要认证
- [ ] 返回图片URL

**依赖**: Task 2.3.1

---

#### Task 2.3.3: 前端图片上传组件
**负责人**: 前端  
**工时**: 4小时  
**交付物**:
- [ ] 图片选择按钮
- [ ] 拖拽上传
- [ ] 上传进度显示
- [ ] 预览功能
- [ ] 复制URL到剪贴板

**依赖**: Task 2.3.2

---

### 2.4 Markdown编辑器集成 (Day 24-26)

#### Task 2.4.1: 集成@uiw/react-md-editor
**负责人**: 前端  
**工时**: 4小时  
**交付物**:
- [ ] 安装@uiw/react-md-editor
- [ ] 创建MarkdownEditor组件
- [ ] 工具栏配置
- [ ] 实时预览

**实现示例**:
```tsx
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

export function MarkdownEditor({ value, onChange }) {
  return (
    <MDEditor
      value={value}
      onChange={onChange}
      preview="live"
      height={600}
    />
  );
}
```

**依赖**: Phase 1完成

---

#### Task 2.4.2: 图片粘贴上传
**负责人**: 前端  
**工时**: 4小时  
**交付物**:
- [ ] 监听粘贴事件
- [ ] 提取剪贴板图片
- [ ] 自动上传
- [ ] 插入Markdown链接

**依赖**: Task 2.4.1, Task 2.3.3

---

#### Task 2.4.3: 文章创建页面
**负责人**: 前端  
**工时**: 8小时  
**交付物**:
- [ ] /admin/articles/new页面
- [ ] 标题输入
- [ ] Markdown编辑器
- [ ] 分类选择
- [ ] 标签输入（支持创建）
- [ ] 封面图上传
- [ ] 保存草稿/发布按钮

**依赖**: Task 2.4.1, Task 2.4.2

---

### 2.5 前端文章展示 (Day 27-32)

#### Task 2.5.1: 首页设计实现
**负责人**: 前端  
**工时**: 10小时  
**交付物**:
- [ ] Hero区域
- [ ] 精选文章展示
- [ ] 最新文章列表
- [ ] 热门标签云
- [ ] 响应式布局

**参考UI设计**: TZBlog设计初稿/front-home.html

**依赖**: Task 2.2.2 API

---

#### Task 2.5.2: 文章列表页
**负责人**: 前端  
**工时**: 8小时  
**交付物**:
- [ ] /articles页面
- [ ] 文章卡片组件
- [ ] 分页组件
- [ ] 分类筛选
- [ ] 标签筛选
- [ ] 加载状态

**依赖**: Task 2.2.2 API

---

#### Task 2.5.3: 文章详情页
**负责人**: 前端  
**工时**: 12小时  
**交付物**:
- [ ] /articles/[slug]页面
- [ ] Markdown渲染（react-markdown）
- [ ] 代码高亮（prism-react-renderer）
- [ ] 目录导航
- [ ] 作者信息卡
- [ ] 点赞按钮
- [ ] 阅读进度条
- [ ] 相关文章推荐

**Markdown渲染**:
```tsx
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

<ReactMarkdown
  components={{
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
  }}
>
  {content}
</ReactMarkdown>
```

**依赖**: Task 2.2.3 API

---

### 2.6 后台管理界面 (Day 33-36)

#### Task 2.6.1: 管理后台布局
**负责人**: 前端  
**工时**: 6小时  
**交付物**:
- [ ] /admin布局
- [ ] 侧边栏导航
- [ ] 顶部面包屑
- [ ] 用户信息下拉菜单
- [ ] 响应式适配

**依赖**: Phase 1完成

---

#### Task 2.6.2: 文章管理列表
**负责人**: 前端  
**工时**: 8小时  
**交付物**:
- [ ] /admin/articles页面
- [ ] 文章列表表格
- [ ] 状态筛选（全部/草稿/已发布）
- [ ] 搜索功能
- [ ] 编辑/删除操作
- [ ] 批量操作

**依赖**: Task 2.2.2 API

---

#### Task 2.6.3: 文章编辑页
**负责人**: 前端  
**工时**: 4小时  
**交付物**:
- [ ] /admin/articles/[id]/edit页面
- [ ] 复用创建页面组件
- [ ] 预填充数据

**依赖**: Task 2.4.3, Task 2.2.4 API

---

#### Task 2.6.4: Dashboard首页
**负责人**: 前端  
**工时**: 6小时  
**交付物**:
- [ ] /admin/page.tsx
- [ ] 数据统计卡片（文章数、浏览量、评论数）
- [ ] 最新评论列表
- [ ] 最近文章列表

**依赖**: 统计API（可后续实现）

---

## Phase 2 验收标准

### 后端
- [ ] 用户注册/登录API正常工作
- [ ] 文章CRUD API完整
- [ ] 图片上传到R2成功
- [ ] 分类标签管理API
- [ ] 单元测试覆盖率 > 80%
- [ ] API文档更新

### 前端
- [ ] 用户能注册登录
- [ ] 管理员能创建/编辑文章
- [ ] 首页展示文章列表
- [ ] 文章详情页渲染正确
- [ ] Markdown编辑器功能完善
- [ ] 响应式适配完成

### 集成测试
```bash
# E2E测试场景
1. 用户注册 -> 登录成功
2. 创建文章 -> 首页能看到
3. 点击文章 -> 详情页正确展示
4. 上传图片 -> 图片能访问
5. 编辑文章 -> 更新成功
```

---

## Phase 3: 高级功能开发 (Week 7-9)

### 3.1 评论系统 (Day 37-40)

#### Task 3.1.1: 评论API
**负责人**: 后端  
**工时**: 8小时  
**交付物**:
- [ ] POST /api/v1/articles/:id/comments
- [ ] GET /api/v1/articles/:id/comments
- [ ] DELETE /api/v1/comments/:id
- [ ] 支持嵌套回复
- [ ] 单元测试

**依赖**: Phase 2完成

---

#### Task 3.1.2: 前端评论组件
**负责人**: 前端  
**工时**: 10小时  
**交付物**:
- [ ] 评论列表组件
- [ ] 评论表单
- [ ] 回复功能
- [ ] 删除确认
- [ ] 分页加载

**依赖**: Task 3.1.1

---

### 3.2 点赞功能 (Day 41-42)

#### Task 3.2.1: 点赞API
**负责人**: 后端  
**工时**: 4小时  
**交付物**:
- [ ] POST /api/v1/articles/:id/like
- [ ] POST /api/v1/comments/:id/like
- [ ] 防重复点赞
- [ ] Redis缓存点赞数

**依赖**: Phase 2完成

---

#### Task 3.2.2: 前端点赞按钮
**负责人**: 前端  
**工时**: 3小时  
**交付物**:
- [ ] 点赞按钮组件
- [ ] 动画效果
- [ ] 实时更新点赞数

**依赖**: Task 3.2.1

---

### 3.3 浏览统计 (Day 43-44)

#### Task 3.3.1: 浏览统计API
**负责人**: 后端  
**工时**: 4小时  
**交付物**:
- [ ] 浏览量记录（防刷）
- [ ] Redis缓存浏览数
- [ ] 定时同步到PostgreSQL

**依赖**: Phase 2完成

---

#### Task 3.3.2: 阅读进度记录
**负责人**: 前后端  
**工时**: 6小时  
**交付物**:
- [ ] 记录用户阅读进度API
- [ ] 前端上报阅读位置
- [ ] 下次访问恢复位置

**依赖**: Phase 2完成

---

### 3.4 后台统计分析 (Day 45-48)

#### Task 3.4.1: 统计API
**负责人**: 后端  
**工时**: 8小时  
**交付物**:
- [ ] GET /api/v1/admin/stats/overview
- [ ] GET /api/v1/admin/stats/articles
- [ ] GET /api/v1/admin/stats/traffic
- [ ] 缓存策略

**依赖**: Phase 2完成

---

#### Task 3.4.2: 统计Dashboard
**负责人**: 前端  
**工时**: 10小时  
**交付物**:
- [ ] /admin/analytics页面
- [ ] 数据图表（recharts）
- [ ] 文章排行榜
- [ ] 流量趋势图

**依赖**: Task 3.4.1

---

[继续Phase 4-6...]

## Phase 4: SEO优化与性能调优 (Week 10-11)

参考docs/superpowers/specs/seo-strategy.md实施

### 4.1 SEO基础设施
- [ ] Meta标签动态生成
- [ ] Sitemap.xml自动生成
- [ ] robots.txt配置
- [ ] 结构化数据（JSON-LD）

### 4.2 性能优化
- [ ] 图片CDN配置
- [ ] Redis缓存策略
- [ ] 前端代码分割
- [ ] Lighthouse优化到90+

---

## Phase 5: 上线部署 (Week 12)

### 5.1 服务器配置
- [ ] 购买云服务器
- [ ] 域名备案（如需）
- [ ] SSL证书配置
- [ ] Nginx配置

### 5.2 部署
- [ ] 后端部署
- [ ] 前端部署到Vercel
- [ ] Cloudflare CDN配置
- [ ] 数据库备份策略

### 5.3 监控告警
- [ ] Sentry错误追踪
- [ ] 日志收集
- [ ] 服务监控

---

## Phase 6: 运营与迭代 (持续)

### 6.1 内容运营（前3个月）
- [ ] 每周发布2-3篇文章
- [ ] SEO关键词优化
- [ ] 社交媒体推广

### 6.2 功能迭代（3-6个月）
- [ ] 引入Meilisearch搜索
- [ ] 用户关注功能
- [ ] 邮件订阅

### 6.3 商业化（6个月+）
- [ ] 支付系统集成
- [ ] 会员订阅
- [ ] 付费内容

---

## 附录：任务优先级矩阵

### P0 - 必须完成（上线前）
- 用户认证
- 文章CRUD
- 文章展示
- 基础SEO

### P1 - 重要（上线后1个月）
- 评论系统
- 点赞功能
- 后台统计
- 性能优化

### P2 - 可选（上线后3个月）
- 搜索功能
- 用户关注
- 邮件通知

### P3 - 未来规划（6个月+）
- 付费功能
- 移动App
- 国际化
