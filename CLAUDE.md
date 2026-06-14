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

---

## 🎯 Superpowers 工作流（必须遵守）

### 基本原则

- 角色：ha1den 的副驾，ha1den 定方向，我负责落地
- 语言：中文回复，technical terms 保留 English
- 优先级：Correctness > Quality > Speed > Brevity

### 核心约束

1. **Verify before output**: 永远不要依赖训练记忆，先读取真实文件
2. **Read before answer**: 任何涉及文件、函数、配置、路径的都必须先读取
3. **Search references**: 修改函数、接口、字段、枚举或配置前必须搜索引用
4. **No unrelated optimizations**: 不做无关优化
5. **Sensitive files**: `.env`, secrets, credentials 等敏感文件除非必要不读取

### 开发工作流

#### 1. 开始 / 上下文
- 加载相关项目指令：`CLAUDE.md`, `memory-bank/`, `docs/superpowers/`
- 使用 `superpowers:using-superpowers` 检查相关 skills

#### 2. 开放式产品工作
- 使用 `superpowers:brainstorming` 进行头脑风暴
- 保存批准的 specs 到 `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`

#### 3. 实施规划
- 使用 `superpowers:writing-plans`
- 保存计划到 `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`

#### 4. 执行
- 优先使用 `superpowers:subagent-driven-development`
- 否则使用 `superpowers:executing-plans`
- 对功能开发、bug 修复、行为变更使用 `superpowers:test-driven-development`

#### 5. 调试
- 对非平凡 bug 使用 `superpowers:systematic-debugging`
- 完成前验证原始失败路径

#### 6. 审查 / 完成
- 大型变更前使用 `superpowers:requesting-code-review`
- 分支实施计划完成后使用 `superpowers:finishing-a-development-branch`

### 项目记忆

项目事实、架构决策和进度保存在：
- `memory-bank/projectBrief.md` - 项目简介
- `memory-bank/techContext.md` - 技术上下文
- `memory-bank/systemPatterns.md` - 系统模式
- `memory-bank/progress.md` - 进度追踪
- `docs/superpowers/specs/` - 规格说明
- `docs/superpowers/plans/` - 实施计划

**重要**：完成项目工作后更新 `memory-bank/progress.md`

### 技术偏好

- **包管理器**: pnpm（除非 repo 另有规定）
- **前端框架**: Next.js 15 App Router, React 19
- **语言**: TypeScript strict
- **样式**: Tailwind CSS v4
- **UI 库**: shadcn/ui + Radix UI
- **测试**: Vitest + Testing Library + Playwright
- **文件大小**: 200-400 行典型，800 行最大
- **命名**: 组件 `PascalCase.tsx`，工具 `camelCase.ts`
- **类型**: 优先 `interface`，联合类型用 `type`

### 禁止操作（除非有明确理由）

- ❌ 删除现有注释
- ❌ 修改数据库 schema（未经确认）
- ❌ 安装未解释的依赖

---

## 🔄 完整开发流程（后端示例）

### 阶段 1: 准备
```bash
# 1. 检查当前分支
git branch --show-current

# 2. 如果不在正确分支，切换到 main
git checkout main
git pull origin main

# 3. 创建功能分支
git checkout -b feature/backend/<功能名>
```

### 阶段 2: 规划
1. 使用 Superpowers skill: `superpowers:writing-plans`
2. 生成计划文档到 `docs/superpowers/plans/`
3. 确认计划合理后进入实施

### 阶段 3: 开发（TDD）
1. 使用 Superpowers skill: `superpowers:test-driven-development`
2. 先写测试（RED）
3. 写实现代码（GREEN）
4. 重构（REFACTOR）
5. 确保测试覆盖率 ≥80%

### 阶段 4: 代码审查
1. 使用 Superpowers skill: `superpowers:requesting-code-review`
2. 修复所有 CRITICAL 和 HIGH 问题
3. 考虑修复 MEDIUM 问题

### 阶段 5: 提交
```bash
# 1. 只添加 backend/ 目录
git add backend/

# 2. 提交（格式必须正确）
git commit -m "feat(backend): 功能描述"

# 3. 推送
git push -u origin feature/backend/<功能名>

# 4. 创建 PR
gh pr create --title "feat(backend): 功能描述" --body "详细说明"
```

### 阶段 6: 完成
1. 使用 Superpowers skill: `superpowers:finishing-a-development-branch`
2. 更新 `memory-bank/progress.md`
3. 清理临时文件

---

## 📋 检查清单

### 开始工作前
- [ ] 确认在正确的分支（`feature/backend/*` 或 `feature/frontend/*`）
- [ ] 已 pull 最新的 main 分支
- [ ] 清楚要实现的功能
- [ ] 加载了项目 CLAUDE.md 和 memory-bank

### 编码前
- [ ] 使用 Superpowers 进行规划
- [ ] 生成了计划文档（如需要）
- [ ] 明确了测试策略

### 提交前
- [ ] 确认当前分支正确
- [ ] 只添加了正确目录的文件（backend/ 或 frontend/）
- [ ] 代码已通过 lint 检查
- [ ] 提交信息格式正确（`type(scope): subject`）
- [ ] 测试通过且覆盖率达标

### 推送前
- [ ] 代码已构建成功
- [ ] 没有 TypeScript/Go 编译错误
- [ ] 没有 linter 错误

---

## 🚨 违规警告

如果违反以下规则，Git Hooks 会阻止提交：

1. ❌ 在错误的分支工作（如在 frontend 分支修改 backend）
2. ❌ 提交信息格式错误
3. ❌ 修改了错误目录的文件

如果违反以下规则，GitHub Actions 会阻止 PR 合并：

1. ❌ 分支命名不规范
2. ❌ 文件修改范围超出 scope
3. ❌ 任何提交信息格式错误

---

**最后更新**: 2026-06-14  
**维护者**: TZBlog Team
