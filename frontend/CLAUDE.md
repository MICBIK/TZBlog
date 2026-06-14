# 前端 AI 开发指南

> 本文档专门为前端 AI 助手编写，包含所有必要的开发规范和约束。

---

## 🚨 重要：分支和目录约束

### 必须遵守的规则

1. **只在前端分支工作**
   - ✅ 分支名必须是: `feature/frontend/<功能名>`
   - ❌ 不能使用: `feature/frontend-init`, `main`, `develop` 等

2. **只修改前端目录**
   - ✅ 只能修改 `frontend/` 目录
   - ✅ 可以修改 `README.md`、`docker-compose.yml`（如需要）
   - ❌ 不能修改 `backend/` 目录

3. **提交信息格式**
   - ✅ 格式: `feat(frontend): description`
   - ✅ 示例: `fix(frontend): resolve navbar issue`
   - ❌ 错误: `feat: add feature`（缺少 scope）

### 自动检查机制

**Git Hooks 会自动检查**：

- 分支名称是否正确
- 是否只修改了 frontend/ 目录
- 提交信息格式是否正确

**如果违规，提交会被拒绝！**

---

## 🌿 前端开发工作流程

### 1. 创建功能分支

```bash
# 从 main 创建新分支
git checkout main
git pull origin main
git checkout -b feature/frontend/<功能名>

# 示例
git checkout -b feature/frontend/article-page
git checkout -b feature/frontend/user-profile
git checkout -b feature/frontend/admin-dashboard
```

### 2. 开发

```bash
# 进入前端目录
cd frontend

# 安装依赖（如果需要）
pnpm install

# 运行开发服务器
pnpm dev

# 编写代码...
# 只修改 frontend/ 目录的文件
```

### 3. 提交

```bash
# 添加修改的文件
git add frontend/

# 提交（会自动检查格式）
git commit -m "feat(frontend): add article detail page"

# 如果检查失败，会显示错误信息
# 按照提示修正后重新提交
```

### 4. 推送

```bash
# 推送到远程
git push origin feature/frontend/<功能名>
```

### 5. 创建 PR

在 GitHub 上创建 Pull Request:

- From: `feature/frontend/<功能名>`
- To: `main`

---

## 📝 提交信息规范

### 格式

```
type(frontend): subject
```

### Type 类型

| Type     | 使用场景  | 示例                                          |
| -------- | --------- | --------------------------------------------- |
| feat     | 新功能    | `feat(frontend): add user login page`         |
| fix      | Bug 修复  | `fix(frontend): resolve navbar overflow`      |
| style    | 样式/格式 | `style(frontend): apply responsive design`    |
| refactor | 重构      | `refactor(frontend): extract auth components` |
| perf     | 性能优化  | `perf(frontend): optimize image loading`      |
| test     | 测试      | `test(frontend): add unit tests for utils`    |
| docs     | 文档      | `docs: update frontend README`                |
| chore    | 构建/工具 | `chore: update frontend dependencies`         |

### ✅ 正确示例

```bash
git commit -m "feat(frontend): add article list component"
git commit -m "fix(frontend): resolve login redirect issue"
git commit -m "style(frontend): update navbar responsive layout"
git commit -m "refactor(frontend): extract useAuth hook"
```

### ❌ 错误示例

```bash
git commit -m "add component"              # 缺少 type 和 scope
git commit -m "feat: add something"        # 缺少 frontend scope
git commit -m "Added login page"           # 时态错误，缺少格式
git commit -m "fix(backend): something"    # scope 错误（前端不能用 backend）
```

---

## 🛑 禁止的操作

### ❌ 不能做的事情

1. **不能在错误的分支工作**

   ```bash
   # ❌ 错误
   git checkout feature/frontend-init  # 旧分支
   git checkout main                   # 主分支
   git checkout feature/backend/xxx    # 后端分支

   # ✅ 正确
   git checkout feature/frontend/my-feature
   ```

2. **不能修改后端目录**

   ```bash
   # ❌ 错误
   git add backend/
   git add .  # 可能包含 backend/

   # ✅ 正确
   git add frontend/
   git add frontend/app/
   ```

3. **不能使用错误的提交格式**

   ```bash
   # ❌ 错误
   git commit -m "update"
   git commit -m "feat: add feature"
   git commit -m "feat(backend): something"

   # ✅ 正确
   git commit -m "feat(frontend): add feature"
   ```

---

## 🔧 技术栈

### 前端技术

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **UI 库**: shadcn/ui + Radix UI
- **状态管理**: Zustand
- **请求库**: Axios
- **表单**: React Hook Form
- **验证**: Zod

### 项目结构

```
frontend/
├── app/                    # App Router 页面
│   ├── (auth)/            # 认证相关页面
│   ├── (dashboard)/       # 管理后台
│   └── (public)/          # 公开页面
├── components/            # React 组件
│   ├── ui/               # UI 组件（shadcn）
│   ├── shared/           # 共享组件
│   └── providers/        # Provider 组件
├── lib/                  # 工具库
│   ├── api/             # API 客户端
│   ├── store/           # 状态管理
│   └── utils.ts         # 工具函数
└── types/               # TypeScript 类型定义
```

### 开发命令

```bash
# 开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 格式化代码
pnpm format

# 运行测试
pnpm test
```

---

## 📋 开发检查清单

### 开始工作前

- [ ] 确认在正确的分支 (`feature/frontend/*`)
- [ ] 已经 pull 最新的 main 分支
- [ ] 清楚要实现的功能

### 提交前

- [ ] 确认当前分支正确
- [ ] 只添加了 frontend/ 目录的文件
- [ ] 代码已通过 lint 检查 (`pnpm lint`)
- [ ] 提交信息格式正确
- [ ] 本地测试通过

### 推送前

- [ ] 代码已构建成功 (`pnpm build`)
- [ ] 没有 TypeScript 错误
- [ ] 没有 ESLint 错误

---

## ⚠️ 常见问题

### Q: 不小心在 main 分支工作了怎么办？

```bash
# 1. 暂存改动
git stash push -m "临时保存前端改动"

# 2. 创建正确的分支
git checkout -b feature/frontend/my-feature

# 3. 应用改动
git stash pop
```

### Q: 不小心修改了 backend/ 目录怎么办？

```bash
# 撤销 backend/ 的改动
git restore backend/

# 或者只添加 frontend/ 的文件
git add frontend/
git commit -m "feat(frontend): my feature"
```

### Q: 提交信息格式错误被拒绝了怎么办？

```bash
# 修改最后一次提交信息
git commit --amend -m "feat(frontend): correct format"
```

### Q: 需要修改后端接口怎么办？

前端 AI **不能**修改后端代码！

**正确做法**:

1. 告知用户需要后端修改
2. 描述需要的接口变更
3. 等待后端 AI 完成修改

---

## 🎯 AI 助手提醒

作为前端 AI 助手，你应该：

1. **开始工作前**
   - 检查当前分支: `git branch --show-current`
   - 确保在 `feature/frontend/*` 分支

2. **工作中**
   - 只修改 `frontend/` 目录
   - 遵循前端技术栈和规范
   - 编写符合项目风格的代码

3. **提交时**
   - 只添加 `frontend/` 目录: `git add frontend/`
   - 使用正确格式: `feat(frontend): description`

4. **遇到问题**
   - 如果需要后端修改，告知用户
   - 如果分支错误，立即纠正
   - 如果提交被拒绝，检查错误信息并修正

---

## 📚 参考文档

- **分支策略**: `../.github/BRANCH_STRATEGY.md`
- **项目总览**: `../CLAUDE.md`
- **前端 README**: `./README.md`

---

**最后更新**: 2026-06-14  
**适用对象**: 前端 AI 助手  
**重要性**: ⭐⭐⭐⭐⭐ 必读
