# TZBlog 项目指南

欢迎来到 TZBlog 项目！这是一个现代化的全栈博客系统。

---

## 📋 目录

- [项目结构](#项目结构)
- [分支管理](#分支管理)
- [开发规范](#开发规范)
- [快速开始](#快速开始)
- [常见问题](#常见问题)

---

## 🏗️ 项目结构

```
TZBlog/
├── backend/          # Go 后端服务
│   ├── cmd/         # 应用入口
│   ├── internal/    # 内部包
│   ├── pkg/         # 公共包
│   └── docs/        # 后端文档
├── frontend/         # Next.js 前端应用
│   ├── app/         # App Router 页面
│   ├── components/  # React 组件
│   └── lib/         # 工具库
├── .github/         # GitHub 配置
│   ├── BRANCH_STRATEGY.md  # 分支管理策略（必读）
│   └── workflows/   # CI/CD 配置
└── .husky/          # Git Hooks
```

---

## 🌿 分支管理（重要！）

### ⚠️ 防止分支混用

**项目已配置自动检查机制，防止前后端分支混用！**

### 分支命名规范

#### 后端开发
```bash
# 创建后端功能分支
git checkout -b feature/backend/<功能名>

# 示例
git checkout -b feature/backend/user-auth
git checkout -b feature/backend/article-api
```

**后端分支只能修改 `backend/` 目录！**

#### 前端开发
```bash
# 创建前端功能分支
git checkout -b feature/frontend/<功能名>

# 示例
git checkout -b feature/frontend/login-page
git checkout -b feature/frontend/article-list
```

**前端分支只能修改 `frontend/` 目录！**

### 完整工作流程

#### 后端开发流程
```bash
# 1. 创建分支
git checkout main
git pull origin main
git checkout -b feature/backend/my-feature

# 2. 开发（只修改 backend/ 目录）
# 编写代码...

# 3. 提交（会自动检查）
git add backend/
git commit -m "feat(backend): add my feature"

# 4. 推送
git push origin feature/backend/my-feature

# 5. 创建 PR
# 在 GitHub 上创建 PR: feature/backend/* -> main
```

#### 前端开发流程
```bash
# 1. 创建分支
git checkout main
git pull origin main
git checkout -b feature/frontend/my-feature

# 2. 开发（只修改 frontend/ 目录）
# 编写代码...

# 3. 提交（会自动检查）
git add frontend/
git commit -m "feat(frontend): add my feature"

# 4. 推送
git push origin feature/frontend/my-feature

# 5. 创建 PR
# 在 GitHub 上创建 PR: feature/frontend/* -> main
```

---

## 📝 提交信息规范

### 格式
```
type(scope): subject
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(backend): add user authentication` |
| fix | Bug 修复 | `fix(frontend): resolve login redirect` |
| docs | 文档 | `docs: update API documentation` |
| style | 代码格式 | `style: apply prettier formatting` |
| refactor | 重构 | `refactor(backend): extract service layer` |
| perf | 性能优化 | `perf(backend): optimize queries` |
| test | 测试 | `test(backend): add unit tests` |
| chore | 构建/工具 | `chore: update dependencies` |

### ✅ 正确示例
```bash
git commit -m "feat(backend): add JWT authentication"
git commit -m "fix(frontend): resolve navbar responsive issue"
git commit -m "docs: update README"
```

### ❌ 错误示例
```bash
git commit -m "add feature"           # 缺少 type
git commit -m "feat: something"       # scope 不明确
git commit -m "Added authentication"  # 时态错误
```

---

## 🛡️ 自动检查机制

### 本地检查（Git Hooks）

提交时会自动检查：
- ✅ 分支名称是否正确
- ✅ 修改的文件是否在正确的目录
- ✅ 提交信息格式是否正确

如果检查失败，提交会被阻止并显示错误信息。

### PR 检查（GitHub Actions）

创建 PR 时会自动检查：
- ✅ 分支命名规范
- ✅ 文件修改范围
- ✅ 所有提交信息格式

不通过检查的 PR 无法合并。

---

## 🚀 快速开始

### 后端开发

```bash
# 进入后端目录
cd backend

# 安装依赖
go mod download

# 运行开发服务器
go run cmd/server/main.go

# 运行测试
go test ./...
```

### 前端开发

```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 运行开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

---

## ⚠️ 常见问题

### Q: 不小心在错误的分支工作了怎么办？

**A**: 使用 stash 转移改动

```bash
# 1. 暂存当前改动
git stash push -m "临时保存"

# 2. 切换到正确的分支
git checkout feature/backend/my-feature

# 3. 应用暂存的改动
git stash pop
```

### Q: 提交时显示"分支名称错误"怎么办？

**A**: 重命名分支

```bash
# 重命名当前分支
git branch -m feature/backend/正确的名称

# 如果已经推送，删除远程旧分支
git push origin :旧分支名
git push origin feature/backend/正确的名称
```

### Q: 需要同时修改前后端怎么办？

**A**: 分别创建两个分支

1. 创建 `feature/backend/功能名` 完成后端
2. 创建 `feature/frontend/功能名` 完成前端
3. 两个 PR 分别合并

### Q: 提交信息格式检查失败怎么办？

**A**: 修改最后一次提交信息

```bash
# 修改最后一次提交信息
git commit --amend -m "feat(backend): 正确的格式"

# 如果已经推送，强制推送
git push origin feature/backend/my-feature --force
```

---

## 📚 详细文档

- **分支管理策略**: [.github/BRANCH_STRATEGY.md](.github/BRANCH_STRATEGY.md)
- **后端文档**: [backend/docs/](backend/docs/)
- **前端文档**: [frontend/README.md](frontend/README.md)
- **API 文档**: 运行后访问 `/api/docs`

---

## 🎯 重要提醒

1. **后端 AI 工作时**：
   - 只在 `feature/backend/*` 分支工作
   - 只修改 `backend/` 目录
   - 提交信息必须包含 `(backend)` scope

2. **前端 AI 工作时**：
   - 只在 `feature/frontend/*` 分支工作
   - 只修改 `frontend/` 目录
   - 提交信息必须包含 `(frontend)` scope

3. **自动检查会阻止违规操作**：
   - 本地 Git Hooks 实时拦截
   - GitHub Actions PR 检查
   - 不符合规范无法合并

---

## 📞 需要帮助？

- 查看分支策略: `.github/BRANCH_STRATEGY.md`
- 查看后端文档: `backend/docs/`
- 查看前端文档: `frontend/README.md`

---

**最后更新**: 2026-06-14  
**维护者**: TZBlog Team
