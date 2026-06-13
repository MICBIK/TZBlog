# TZBlog 项目信息

## 项目基本信息

- **项目名称**: TZBlog
- **项目描述**: 个人技术博客平台 - 专注高质量技术内容创作，支持知识付费
- **项目负责人**: ha1den
- **GitHub仓库**: https://github.com/MICBIK/TZBlog.git
- **创建时间**: 2026-06-14

## 仓库管理规范

### Git配置
```bash
# 克隆仓库
git clone https://github.com/MICBIK/TZBlog.git
cd TZBlog

# 配置用户信息
git config user.name "HaiDen"
git config user.email "your-email@example.com"
```

### 分支策略
```
main              # 生产环境分支（受保护）
└── develop       # 开发分支
    ├── feature/xxx   # 功能分支
    ├── bugfix/xxx    # 修复分支
    └── hotfix/xxx    # 紧急修复
```

### 分支命名规范
- `feature/功能名称` - 新功能开发
  - 例: `feature/article-list`
  - 例: `feature/user-auth`
- `bugfix/问题描述` - Bug修复
  - 例: `bugfix/comment-delete`
- `hotfix/紧急问题` - 生产环境紧急修复
  - 例: `hotfix/security-patch`
- `refactor/重构内容` - 代码重构
  - 例: `refactor/api-error-handling`
- `docs/文档更新` - 文档更新
  - 例: `docs/update-readme`

### Commit规范
```bash
# 格式
<type>(<scope>): <subject>

# 类型
feat:     新功能
fix:      Bug修复
refactor: 重构
docs:     文档更新
style:    代码格式
test:     测试相关
chore:    构建/工具配置
perf:     性能优化

# 示例
feat(article): add article list pagination
fix(auth): resolve JWT token expiration issue
refactor(api): simplify error handling
docs(readme): update installation guide
test(user): add user service unit tests
chore(deps): update dependencies
```

### 工作流程

#### 1. 创建新功能分支
```bash
# 从develop分支创建
git checkout develop
git pull origin develop
git checkout -b feature/article-list

# 开发...

# 提交
git add .
git commit -m "feat(article): implement article list with pagination"
git push -u origin feature/article-list
```

#### 2. 创建Pull Request
```bash
# 使用GitHub CLI
gh pr create \
  --base develop \
  --head feature/article-list \
  --title "feat(article): Add article list pagination" \
  --body "## 变更描述
实现文章列表分页功能

## 变更清单
- [x] 实现后端分页API
- [x] 添加前端分页组件
- [x] 单元测试覆盖率85%

## 测试计划
- 手动测试分页功能
- 运行所有单元测试
- 测试边界情况"
```

#### 3. Code Review后合并
```bash
# PR通过后，合并到develop
# 由maintainer在GitHub上操作

# 本地更新
git checkout develop
git pull origin develop

# 删除本地功能分支
git branch -d feature/article-list
```

#### 4. 发布到生产环境
```bash
# develop测试通过后，合并到main
git checkout main
git pull origin main
git merge develop
git push origin main

# 打标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### PR模板
```markdown
## 📝 变更描述
简要描述本次PR的目的和内容

## 🔗 相关Issue
Closes #123

## ✅ 变更清单
- [ ] 实现功能A
- [ ] 添加单元测试
- [ ] 更新API文档

## 🧪 测试计划
- 手动测试功能
- 运行所有单元测试（覆盖率>80%）
- 测试边界情况

## 📸 截图（如有UI变更）

## ⚠️ 注意事项
（如：需要运行数据库迁移、需要更新环境变量等）

## 📋 Checklist
- [ ] 代码符合规范（通过lint检查）
- [ ] 单元测试通过
- [ ] 文档已更新
- [ ] 无ESLint/Golint警告
```

### 保护规则

#### main分支保护
```yaml
规则:
  - 禁止直接push
  - PR必须经过Code Review
  - CI必须通过
  - 至少1个approve
  - 分支必须是最新的
```

#### develop分支保护
```yaml
规则:
  - PR必须经过Code Review
  - CI必须通过
  - 可以选择性要求approve
```

## 常用Git命令

### 日常开发
```bash
# 查看状态
git status

# 查看修改
git diff

# 暂存修改
git add .

# 提交
git commit -m "feat(xxx): add xxx"

# 推送
git push

# 拉取最新代码
git pull

# 查看日志
git log --oneline --graph

# 查看分支
git branch -a
```

### 分支操作
```bash
# 创建并切换分支
git checkout -b feature/xxx

# 切换分支
git checkout develop

# 删除本地分支
git branch -d feature/xxx

# 删除远程分支
git push origin --delete feature/xxx

# 重命名分支
git branch -m old-name new-name
```

### 撤销操作
```bash
# 撤销工作区修改
git checkout -- file.txt

# 撤销暂存区修改
git reset HEAD file.txt

# 撤销最后一次提交（保留修改）
git reset --soft HEAD^

# 撤销最后一次提交（不保留修改）
git reset --hard HEAD^

# 修改最后一次提交信息
git commit --amend
```

### 合并操作
```bash
# 合并分支
git merge feature/xxx

# 变基
git rebase develop

# 解决冲突后
git add .
git rebase --continue
```

## GitHub Actions CI/CD

### 后端CI
```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [develop, main]
    paths:
      - 'backend/**'
  pull_request:
    branches: [develop, main]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.22'
      - name: Run tests
        run: |
          cd backend
          go test -v -race -coverprofile=coverage.out ./...
      - name: Check coverage
        run: |
          cd backend
          go tool cover -func=coverage.out
```

### 前端CI
```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI

on:
  push:
    branches: [develop, main]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [develop, main]
    paths:
      - 'frontend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
      - name: Lint
        run: |
          cd frontend
          pnpm lint
      - name: Type check
        run: |
          cd frontend
          pnpm tsc --noEmit
      - name: Test
        run: |
          cd frontend
          pnpm test
      - name: Build
        run: |
          cd frontend
          pnpm build
```

## 项目协作

### Issue管理
- 使用GitHub Issues跟踪任务
- Label分类：`bug`, `feature`, `docs`, `enhancement`
- Milestone设置里程碑
- Assignee指定负责人

### Project管理
使用GitHub Projects看板：
- **Todo**: 待开始的任务
- **In Progress**: 进行中的任务
- **Review**: 等待Review的PR
- **Done**: 已完成的任务

### Code Review规范
- PR大小适中（建议<500行）
- 描述清晰，说明变更目的
- 添加测试用例
- 更新相关文档
- Reviewer及时响应（24小时内）
- 遵循"两个approval"原则（重要功能）

## 注意事项

### ⚠️ 禁止操作
- ❌ 直接push到main分支
- ❌ force push到共享分支
- ❌ 提交敏感信息（密码、密钥等）
- ❌ 提交大文件（>10MB）
- ❌ 删除.gitignore中的规则

### ✅ 最佳实践
- ✅ 提交前运行测试
- ✅ 保持提交信息清晰
- ✅ 经常pull最新代码
- ✅ 功能分支及时合并
- ✅ 定期清理本地分支

## 远程仓库信息

```bash
# 查看远程仓库
git remote -v

# 输出示例
origin  https://github.com/MICBIK/TZBlog.git (fetch)
origin  https://github.com/MICBIK/TZBlog.git (push)
```

## 团队成员
- **Owner**: MICBIK
- **Maintainer**: ha1den
- **Contributors**: (待添加)

---

最后更新: 2026-06-14
