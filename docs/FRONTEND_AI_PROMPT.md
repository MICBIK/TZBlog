# 前端开发任务提示词

你好！我是TZBlog项目的前端开发AI。这是一个Next.js 15 + React 19 + TypeScript的技术博客平台项目。

---

## 📋 项目背景

**项目名称**: TZBlog - 个人技术博客平台  
**GitHub仓库**: https://github.com/MICBIK/TZBlog.git  
**当前状态**: 项目规划完成，后端正在开发中，前端需要从零开始

---

## 🎯 你的任务

### 主要职责
负责TZBlog项目的**完整前端开发**，包括：
1. Next.js 15项目初始化和配置
2. 用户界面开发（首页、文章页、后台管理）
3. Markdown编辑器集成
4. API对接（与后端联调）
5. 响应式设计实现
6. SEO优化

### 技术栈（必须严格遵守）
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
Markdown渲染: react-markdown + remark/rehype
代码高亮: prism-react-renderer
```

---

## 📚 必读文档

在开始之前，请先阅读以下文档（按顺序）：

1. **[README.md](https://github.com/MICBIK/TZBlog/blob/main/README.md)** - 项目简介
2. **[docs/PROJECT_OVERVIEW.md](https://github.com/MICBIK/TZBlog/blob/main/docs/PROJECT_OVERVIEW.md)** - 项目总览（必读）
3. **[docs/PROJECT_STANDARDS.md](https://github.com/MICBIK/TZBlog/blob/main/docs/PROJECT_STANDARDS.md)** - 开发规范（必读）
4. **[docs/FRONTEND_BACKEND_TASKS.md](https://github.com/MICBIK/TZBlog/blob/main/docs/FRONTEND_BACKEND_TASKS.md)** - 前后端任务分工
5. **[docs/superpowers/specs/frontend-architecture.md](https://github.com/MICBIK/TZBlog/blob/main/docs/superpowers/specs/frontend-architecture.md)** - 前端架构设计
6. **[docs/superpowers/specs/api-design.md](https://github.com/MICBIK/TZBlog/blob/main/docs/superpowers/specs/api-design.md)** - API接口文档

---

## 🚀 开始工作流程

### Step 1: 克隆仓库并创建分支
```bash
# 克隆仓库
git clone https://github.com/MICBIK/TZBlog.git
cd TZBlog

# 创建并切换到前端开发分支
git checkout -b feature/frontend-init

# 开始工作
```

### Step 2: Phase 1 任务清单（必须按顺序完成）

#### Task 1.2.1: Next.js项目初始化 (3小时)
**目标**: 创建Next.js 15项目，配置TypeScript、Tailwind、shadcn/ui

**交付物**:
- [ ] 在项目根目录创建`frontend/`目录
- [ ] 使用create-next-app创建项目（Next.js 15 + TypeScript + Tailwind + App Router）
- [ ] 配置TypeScript strict mode
- [ ] 配置Tailwind CSS v4
- [ ] 安装shadcn/ui并初始化
- [ ] 配置ESLint + Prettier
- [ ] 创建frontend/.env.example
- [ ] 编写frontend/README.md

**初始化命令**:
```bash
cd TZBlog
pnpm create next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias "@/*"

cd frontend
pnpm dlx shadcn@latest init

# 安装额外依赖
pnpm add zustand @tanstack/react-query axios
pnpm add -D @types/node
```

**配置文件**:

**frontend/.env.example**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**frontend/tsconfig.json** (确保strict: true):
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    // ... 其他配置
  }
}
```

**验收标准**:
```bash
cd frontend
pnpm dev  # 能正常启动，访问 http://localhost:3000
pnpm build # 能正常构建
pnpm lint # 无错误
```

---

#### Task 1.2.2: API客户端封装 (4小时)
**目标**: 封装axios，实现请求拦截器、Token注入、错误处理

**交付物**:
- [ ] 创建`lib/api/client.ts`
- [ ] 实现请求/响应拦截器
- [ ] Token自动注入
- [ ] 错误统一处理
- [ ] 创建`lib/api/article.ts` (示例API方法)
- [ ] 创建`types/api.ts` (API类型定义)

**实现示例**:

**frontend/lib/api/client.ts**:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动注入Token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response.data, // 直接返回data
  (error) => {
    if (error.response?.status === 401) {
      // 401跳转登录
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**frontend/types/api.ts**:
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: string[];
  } | null;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  author: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  tags: string[];
  viewCount: number;
  likeCount: number;
  isPremium: boolean;
  publishedAt: string;
}
```

**验收标准**:
```typescript
// 能正常调用
import apiClient from '@/lib/api/client';

const response = await apiClient.get('/articles');
```

---

#### Task 1.2.3: 基础组件库 (6小时)
**目标**: 安装shadcn/ui核心组件，创建Loading、ErrorBoundary

**交付物**:
- [ ] 安装shadcn/ui核心组件（Button, Card, Input等）
- [ ] 创建`components/ui/`目录
- [ ] 创建`components/shared/Loading.tsx`
- [ ] 创建`components/shared/ErrorBoundary.tsx`

**shadcn组件安装**:
```bash
cd frontend
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add toast
pnpm dlx shadcn@latest add alert
```

**frontend/components/shared/Loading.tsx**:
```typescript
export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    </div>
  );
}
```

**验收标准**:
```tsx
<Button variant="default">Click</Button>
<Loading />
```

---

#### Task 1.2.4: 路由结构规划 (2小时)
**目标**: 创建app目录结构，配置路由分组

**交付物**:
- [ ] 创建完整的app目录结构
- [ ] 创建各级layout.tsx
- [ ] 创建placeholder页面

**目录结构**:
```
frontend/app/
├── (public)/              # 公开页面组
│   ├── layout.tsx
│   ├── page.tsx          # 首页
│   ├── articles/
│   │   ├── page.tsx      # 文章列表
│   │   └── [slug]/
│   │       └── page.tsx  # 文章详情
│   ├── about/
│   │   └── page.tsx
│   └── archive/
│       └── page.tsx
├── (auth)/               # 认证页面组
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (dashboard)/          # 后台管理组
│   ├── layout.tsx
│   └── admin/
│       ├── page.tsx      # Dashboard
│       ├── articles/
│       │   ├── page.tsx  # 文章列表
│       │   ├── new/
│       │   │   └── page.tsx
│       │   └── [id]/
│       │       └── edit/
│       │           └── page.tsx
│       └── settings/
│           └── page.tsx
├── api/                  # API路由（如需）
├── layout.tsx            # 根布局
├── globals.css
└── error.tsx
```

**验收标准**:
```bash
# 能访问各个路由
http://localhost:3000/
http://localhost:3000/articles
http://localhost:3000/login
http://localhost:3000/admin
```

---

#### Task 1.3.1: Docker配置 (2小时)
**目标**: 创建前端Dockerfile，更新docker-compose.yml

**交付物**:
- [ ] 创建`frontend/Dockerfile`
- [ ] 创建`frontend/.dockerignore`
- [ ] 更新根目录`docker-compose.yml`

**frontend/Dockerfile**:
```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**验收标准**:
```bash
cd frontend
docker build -t tzblog-frontend .
docker run -p 3000:3000 tzblog-frontend
```

---

#### Task 1.3.2: GitHub Actions CI (3小时)
**目标**: 配置前端CI/CD自动化

**交付物**:
- [ ] 创建`.github/workflows/frontend-ci.yml`

**. github/workflows/frontend-ci.yml**:
```yaml
name: Frontend CI

on:
  push:
    branches: [develop, main]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'
  pull_request:
    branches: [develop, main]
    paths:
      - 'frontend/**'

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml
      
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install --frozen-lockfile
      
      - name: Run ESLint
        run: |
          cd frontend
          pnpm lint
      
      - name: Type check
        run: |
          cd frontend
          pnpm tsc --noEmit
      
      - name: Build
        run: |
          cd frontend
          pnpm build
```

**验收标准**:
- PR自动触发CI
- ESLint、TypeScript检查、Build都通过

---

## 📋 Phase 1 完成标准

完成以上所有任务后，应该满足：

### 功能检查
- [x] `pnpm dev` 能启动开发服务器
- [x] `pnpm build` 能构建成功
- [x] `pnpm lint` 无错误
- [x] 所有路由能正常访问
- [x] API客户端能正常调用
- [x] shadcn组件能正常使用
- [x] Docker能构建并运行
- [x] CI能正常执行

### 提交代码
```bash
# 提交到前端分支
git add .
git commit -m "feat(frontend): Phase 1 - Initialize Next.js project and setup infrastructure

- Initialize Next.js 15 with TypeScript and Tailwind CSS v4
- Setup shadcn/ui component library
- Implement API client with axios interceptors
- Create app directory structure with route groups
- Add Docker configuration
- Setup GitHub Actions CI/CD
- Add basic shared components (Loading, ErrorBoundary)

Tasks completed:
- Task 1.2.1: Next.js project initialization
- Task 1.2.2: API client encapsulation
- Task 1.2.3: Basic component library
- Task 1.2.4: Route structure planning
- Task 1.3.1: Docker configuration
- Task 1.3.2: GitHub Actions CI"

# 推送到远程
git push -u origin feature/frontend-init

# 创建PR
gh pr create \
  --base develop \
  --head feature/frontend-init \
  --title "feat(frontend): Phase 1 - Infrastructure Setup" \
  --body "## 完成的任务

### Phase 1 基础设施搭建
- [x] Task 1.2.1: Next.js项目初始化
- [x] Task 1.2.2: API客户端封装
- [x] Task 1.2.3: 基础组件库
- [x] Task 1.2.4: 路由结构规划
- [x] Task 1.3.1: Docker配置
- [x] Task 1.3.2: GitHub Actions CI

### 验收标准
- [x] 开发服务器正常启动
- [x] 构建成功
- [x] Lint检查通过
- [x] TypeScript检查通过
- [x] Docker构建成功
- [x] CI流程通过

### 截图
（添加必要的截图）"
```

---

## ⚠️ 重要提醒

### 必须遵守的规范

1. **代码规范**
   - 使用TypeScript strict mode
   - 所有组件使用函数组件
   - 使用PascalCase命名组件
   - 使用camelCase命名函数和变量

2. **Commit规范**
   ```
   feat(frontend): 简短描述
   fix(frontend): 修复内容
   refactor(frontend): 重构内容
   ```

3. **文件命名**
   - 组件：`PascalCase.tsx`
   - 工具函数：`camelCase.ts`
   - Hooks：`useSomething.ts`

4. **禁止操作**
   - ❌ 不要修改后端代码
   - ❌ 不要修改docs/文档
   - ❌ 不要提交.env文件
   - ❌ 不要提交node_modules

### API对接约定

后端API地址：`http://localhost:8080/api/v1`

当前可用的API：（后端开发中，待通知）
- 后端完成后会通知你可用的API
- API文档参考：`docs/superpowers/specs/api-design.md`

---

## 📞 协作方式

### 遇到问题时
1. 先查阅项目文档
2. 检查GitHub Issues
3. 向ha1den反馈
4. 必要时与后端AI沟通

### 每日同步
- 每天下班前提交当天进度
- 标记完成的任务
- 记录遇到的问题
- 预告明天的计划

---

## 🎯 下一步

完成Phase 1后，会开始Phase 2：
- 登录注册页面
- Markdown编辑器
- 文章展示页面
- 后台管理界面

具体任务见：`docs/FRONTEND_BACKEND_TASKS.md`

---

**现在开始吧！从Task 1.2.1开始，一步步完成Phase 1的所有任务。Good luck! 🚀**
