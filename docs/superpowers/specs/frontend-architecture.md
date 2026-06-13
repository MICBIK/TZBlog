# 前端架构设计

## 项目结构
```
frontend/
├── app/
│   ├── (public)/           # 公开页面
│   │   ├── page.tsx        # 首页
│   │   ├── articles/
│   │   │   ├── page.tsx    # 文章列表
│   │   │   └── [slug]/
│   │   │       └── page.tsx # 文章详情
│   │   ├── about/
│   │   └── archive/
│   ├── (auth)/             # 认证页面
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/        # 后台管理
│   │   └── admin/
│   │       ├── articles/
│   │       ├── media/
│   │       └── settings/
│   ├── api/                # API路由
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                 # shadcn组件
│   ├── article/
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleList.tsx
│   │   └── ArticleDetail.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   └── shared/
├── lib/
│   ├── api/                # API客户端
│   ├── hooks/              # 自定义Hooks
│   ├── store/              # 状态管理
│   └── utils/
├── types/
└── public/
```

## 关键技术实现

### 1. API客户端封装
```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```
