# TZBlog Frontend

TZBlog 个人技术博客平台的前端应用，基于 Next.js 16 (App Router) + React 19 + TypeScript 构建。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | Next.js 16 (App Router, Turbopack) |
| UI 库 | React 19 |
| 语言 | TypeScript (strict mode) |
| 样式 | Tailwind CSS v4 |
| 组件库 | shadcn/ui + Radix UI |
| 动画 | Framer Motion |
| 状态管理 | Zustand |
| 数据获取 | TanStack Query |
| HTTP 客户端 | Axios |
| 编辑器 | @uiw/react-md-editor |
| Markdown 渲染 | react-markdown + remark/rehype |
| 代码高亮 | prism-react-renderer |

## 环境要求

- Node.js >= 20
- pnpm >= 9

## 快速开始

```bash
# 安装依赖
pnpm install

# 复制环境变量模板并按需修改
cp .env.example .env.local

# 启动开发服务器
pnpm dev
# 访问 http://localhost:3000
```

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产环境构建 |
| `pnpm start` | 启动生产服务器（需先 build） |
| `pnpm lint` | 运行 ESLint 检查 |
| `pnpm lint:fix` | 自动修复 ESLint 问题 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm format` | 用 Prettier 格式化代码 |
| `pnpm format:check` | 检查代码格式 |

## 目录结构

```
frontend/
├── app/                # App Router 页面（route groups: public/auth/dashboard）
├── components/         # React 组件
│   ├── ui/            # shadcn/ui 组件
│   └── shared/        # 通用组件（Loading、ErrorBoundary）
├── lib/               # 工具库（api 客户端、hooks、store、utils）
├── types/             # TypeScript 类型定义
└── public/            # 静态资源
```

## 开发规范

遵循项目根目录 `docs/PROJECT_STANDARDS.md` 中的 TypeScript/React 前端规范，要点：

- TypeScript strict mode，所有组件使用函数组件
- 组件命名 PascalCase，工具函数 camelCase，Hooks 以 `use` 开头
- Commit 信息格式：`<type>(frontend): <subject>`
- 禁止提交 `.env` 文件与 `node_modules`
