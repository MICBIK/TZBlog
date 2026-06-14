# TZBlog 分支管理策略

## 分支结构

```
main (生产分支，只接受 PR)
  ├─ develop (开发主分支)
  │   ├─ feature/backend/* (后端功能分支)
  │   └─ feature/frontend/* (前端功能分支)
  ├─ hotfix/* (紧急修复分支)
  └─ release/* (发布分支)
```

---

## 分支说明

### main 分支
- **用途**: 生产环境代码
- **保护**: 禁止直接推送，只能通过 PR 合并
- **合并来源**: develop、hotfix、release
- **命名**: `main`

### develop 分支
- **用途**: 开发环境集成分支
- **保护**: 禁止直接推送，只能通过 PR 合并
- **合并来源**: feature 分支
- **命名**: `develop`

### feature 分支（功能开发）

#### 后端功能分支
- **用途**: 后端功能开发、bug 修复
- **命名规范**: `feature/backend/<功能名>`
- **示例**: 
  - `feature/backend/user-auth`
  - `feature/backend/article-api`
  - `feature/backend/payment-system`
- **工作目录**: 仅修改 `backend/` 目录
- **合并目标**: develop

#### 前端功能分支
- **用途**: 前端功能开发、bug 修复
- **命名规范**: `feature/frontend/<功能名>`
- **示例**:
  - `feature/frontend/login-page`
  - `feature/frontend/article-list`
  - `feature/frontend/admin-dashboard`
- **工作目录**: 仅修改 `frontend/` 目录
- **合并目标**: develop

### hotfix 分支（紧急修复）
- **用途**: 生产环境紧急 bug 修复
- **命名规范**: `hotfix/<问题描述>`
- **示例**: `hotfix/security-patch`
- **基于**: main 分支
- **合并目标**: main 和 develop

### release 分支（发布准备）
- **用途**: 发布前的最后测试和准备
- **命名规范**: `release/v<版本号>`
- **示例**: `release/v1.0.0`
- **基于**: develop 分支
- **合并目标**: main 和 develop

---

## 工作流程

### 后端开发流程

1. **创建功能分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/backend/新功能名
   ```

2. **开发和提交**
   ```bash
   # 只修改 backend/ 目录
   git add backend/
   git commit -m "feat(backend): 功能描述"
   ```

3. **推送和创建 PR**
   ```bash
   git push origin feature/backend/新功能名
   # 在 GitHub 上创建 PR: feature/backend/* -> develop
   ```

4. **代码审查和合并**
   - 通过 CI/CD 检查
   - 代码审查通过
   - 合并到 develop

### 前端开发流程

1. **创建功能分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/frontend/新功能名
   ```

2. **开发和提交**
   ```bash
   # 只修改 frontend/ 目录
   git add frontend/
   git commit -m "feat(frontend): 功能描述"
   ```

3. **推送和创建 PR**
   ```bash
   git push origin feature/frontend/新功能名
   # 在 GitHub 上创建 PR: feature/frontend/* -> develop
   ```

4. **代码审查和合并**
   - 通过 CI/CD 检查
   - 代码审查通过
   - 合并到 develop

### 发布流程

1. **创建 release 分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   ```

2. **测试和修复**
   ```bash
   # 只做 bug 修复和版本号更新
   git commit -m "chore: bump version to 1.0.0"
   ```

3. **合并到 main**
   ```bash
   # 创建 PR: release/v1.0.0 -> main
   # 合并后打 tag
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **回合并到 develop**
   ```bash
   # 创建 PR: release/v1.0.0 -> develop
   ```

---

## 分支保护规则

### main 分支保护
- ✅ 禁止直接推送
- ✅ 要求 PR 审查（至少 1 人）
- ✅ 要求 CI/CD 通过
- ✅ 要求分支为最新
- ✅ 限制删除

### develop 分支保护
- ✅ 禁止直接推送
- ✅ 要求 PR 审查
- ✅ 要求 CI/CD 通过
- ✅ 限制删除

---

## 提交信息规范

### 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(backend): add user authentication` |
| fix | Bug 修复 | `fix(frontend): resolve login redirect issue` |
| docs | 文档更新 | `docs: update API documentation` |
| style | 代码格式 | `style(frontend): apply prettier formatting` |
| refactor | 重构 | `refactor(backend): extract auth service` |
| perf | 性能优化 | `perf(backend): optimize database queries` |
| test | 测试 | `test(backend): add unit tests for auth` |
| chore | 构建/工具 | `chore: update dependencies` |
| ci | CI/CD | `ci: add frontend build workflow` |

### Scope 范围
- **backend**: 后端相关
- **frontend**: 前端相关
- **docs**: 文档
- **ci**: CI/CD
- 省略 scope 表示通用修改

---

## 常见问题

### Q: 如何避免分支混用？

**A**: 遵循以下原则：
1. 后端工作 **只在** `feature/backend/*` 分支
2. 前端工作 **只在** `feature/frontend/*` 分支
3. 提交前检查当前分支: `git branch --show-current`
4. 提交时只添加对应目录: `git add backend/` 或 `git add frontend/`

### Q: 不小心在错误分支工作了怎么办？

**A**: 使用 stash 转移改动：
```bash
# 1. 暂存当前改动
git stash push -m "临时保存"

# 2. 切换到正确分支
git checkout 正确的分支名

# 3. 应用暂存的改动
git stash pop
```

### Q: 需要同时修改前后端怎么办？

**A**: 分别创建两个分支：
1. 创建 `feature/backend/功能名` 完成后端
2. 创建 `feature/frontend/功能名` 完成前端
3. 两个 PR 分别合并到 develop

### Q: 紧急修复生产问题怎么办？

**A**: 使用 hotfix 分支：
```bash
# 1. 基于 main 创建 hotfix
git checkout main
git checkout -b hotfix/问题描述

# 2. 修复并测试
git commit -m "fix: 问题描述"

# 3. 合并到 main 和 develop
# PR: hotfix/* -> main
# PR: hotfix/* -> develop
```

---

## 检查清单

### 创建分支前
- [ ] 已经 pull 最新的 develop 分支
- [ ] 分支名称符合规范（backend/frontend）
- [ ] 清楚要修改的目录范围

### 提交前
- [ ] 确认当前分支正确
- [ ] 只添加对应目录的文件
- [ ] 提交信息符合规范
- [ ] 代码已通过本地测试

### 推送前
- [ ] 代码已 rebase 到最新的 develop
- [ ] 解决了所有冲突
- [ ] 本地测试通过

### 创建 PR 前
- [ ] CI/CD 检查通过
- [ ] 代码覆盖率符合要求
- [ ] 已添加必要的文档

---

## Git Hooks（自动检查）

项目已配置 Git Hooks 自动检查：

### pre-commit
- 检查当前分支名称
- 检查提交文件范围
- 运行代码格式化
- 运行 lint 检查

### commit-msg
- 检查提交信息格式
- 验证 type 和 scope

### pre-push
- 运行测试套件
- 检查代码覆盖率

---

## 参考资料

- [Git Flow 工作流](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**最后更新**: 2026-06-14  
**维护者**: TZBlog Team
