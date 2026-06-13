# API接口完整设计文档

## 基础规范

### 1. RESTful API设计原则
- 使用标准HTTP方法：GET, POST, PUT, PATCH, DELETE
- URL路径使用复数名词：`/api/v1/articles`
- 版本控制：`/api/v1/`
- 统一响应格式

### 2. 响应格式
```json
{
  "success": true,
  "data": {},
  "error": null,
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### 3. 错误响应
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": ["title字段不能为空"]
  }
}
```

---

## 认证相关 API

### POST /api/v1/auth/register
注册新用户
```json
// Request
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "Pass@123"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "zhangsan",
      "email": "zhangsan@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /api/v1/auth/login
用户登录
```json
// Request
{
  "email": "zhangsan@example.com",
  "password": "Pass@123"
}

// Response (同注册)
```

### POST /api/v1/auth/logout
用户登出 [需认证]

### GET /api/v1/auth/me
获取当前用户信息 [需认证]

---

## 文章相关 API

### GET /api/v1/articles
获取文章列表

**Query参数**：
- page: 页码 (默认1)
- limit: 每页数量 (默认20)
- category: 分类slug
- tag: 标签slug
- status: published/draft (需管理员权限查看draft)
- search: 搜索关键词
- sort: latest/popular/trending

```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Next.js 15新特性详解",
      "slug": "nextjs-15-features",
      "summary": "深入解析Next.js 15的重大更新...",
      "coverImage": "https://cdn.tzblog.com/covers/1.jpg",
      "author": {
        "id": 1,
        "username": "admin",
        "displayName": "TZ",
        "avatarUrl": "..."
      },
      "tags": ["Next.js", "React"],
      "viewCount": 1234,
      "likeCount": 56,
      "isPremium": false,
      "publishedAt": "2026-06-13T10:00:00Z"
    }
  ],
  "metadata": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### GET /api/v1/articles/:slug
获取文章详情
```json
// Response
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Next.js 15新特性详解",
    "slug": "nextjs-15-features",
    "content": "# 完整Markdown内容...",
    "author": {
      "id": 1,
      "username": "admin",
      "displayName": "TZ",
      "avatarUrl": "...",
      "bio": "..."
    },
    "tags": [
      { "id": 1, "name": "Next.js", "slug": "nextjs" }
    ],
    "category": {
      "id": 1,
      "name": "前端开发",
      "slug": "frontend"
    },
    "viewCount": 1234,
    "likeCount": 56,
    "commentCount": 23,
    "isPremium": false,
    "relatedArticles": [
      {
        "id": 2,
        "title": "React 19新特性",
        "slug": "react-19-features",
        "coverImage": "..."
      }
    ],
    "publishedAt": "2026-06-13T10:00:00Z",
    "updatedAt": "2026-06-14T08:00:00Z"
  }
}
```

### POST /api/v1/articles
创建文章 [需管理员权限]
```json
// Request
{
  "title": "文章标题",
  "slug": "article-slug",
  "summary": "文章摘要",
  "content": "# Markdown内容",
  "coverImage": "https://cdn.tzblog.com/covers/1.jpg",
  "categoryId": 1,
  "tags": ["Next.js", "React"],
  "isPremium": false,
  "status": "published"
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "article-slug",
    "status": "published"
  }
}
```

### PUT /api/v1/articles/:id
更新文章 [需管理员权限]
```json
// Request (同创建文章)
```

### DELETE /api/v1/articles/:id
删除文章 [需管理员权限]

### POST /api/v1/articles/:id/like
点赞文章
```json
// Response
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 57
  }
}
```

---

## 分类相关 API

### GET /api/v1/categories
获取分类列表
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "前端开发",
      "slug": "frontend",
      "description": "前端技术文章",
      "articleCount": 45
    }
  ]
}
```

### GET /api/v1/articles/by-category/:slug
按分类获取文章

---

## 标签相关 API

### GET /api/v1/tags
获取标签列表（按使用频率排序）

### GET /api/v1/articles/by-tag/:slug
按标签获取文章

---

## 评论相关 API

### GET /api/v1/articles/:id/comments
获取文章评论列表
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "很棒的文章！",
      "author": {
        "id": 2,
        "username": "lisi",
        "displayName": "李四",
        "avatarUrl": "..."
      },
      "likeCount": 5,
      "replies": [
        {
          "id": 2,
          "content": "赞同",
          "author": {...}
        }
      ],
      "createdAt": "2026-06-14T10:00:00Z"
    }
  ]
}
```

### POST /api/v1/articles/:id/comments
发表评论 [需认证]
```json
// Request
{
  "content": "评论内容",
  "parentId": null  // 回复评论时填写父评论ID
}
```

### DELETE /api/v1/comments/:id
删除评论 [需认证，仅作者或管理员]

---

## 用户相关 API

### GET /api/v1/users/:username
获取用户公开信息
```json
// Response
{
  "success": true,
  "data": {
    "id": 1,
    "username": "zhangsan",
    "displayName": "张三",
    "avatarUrl": "...",
    "bio": "全栈开发者",
    "articleCount": 25,
    "followerCount": 100,
    "followingCount": 50
  }
}
```

### POST /api/v1/users/:id/follow
关注用户 [需认证]

### POST /api/v1/users/:id/unfollow
取消关注 [需认证]

---

## 搜索 API

### GET /api/v1/search
全局搜索
```
Query参数:
- q: 搜索关键词
- type: article/user (默认article)
- limit: 结果数量 (默认20)
```

---

## 媒体上传 API

### POST /api/v1/upload/image
上传图片 [需认证]
```
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "data": {
    "url": "https://cdn.tzblog.com/images/xxx.jpg"
  }
}
```
