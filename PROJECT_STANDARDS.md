# TZBlog 项目规范

> 基于 ha1den 全局规则，针对 TZBlog 项目的具体规范

## 目录结构

- `backend/` - Go 后端代码
- `frontend/` - Next.js 前端代码
- `docs/` - 项目文档
- `memory-bank/` - 项目记忆库
- `.claude-rules/` - Claude 开发规范

---

## 后端规范 (Go)

### 代码规范

参考：`.claude-rules/go/coding-style.md`

**核心原则**:
- ✅ **不可变性**: 永远返回新对象，不修改原对象
- ✅ **KISS**: 保持简单
- ✅ **DRY**: 不重复代码
- ✅ **YAGNI**: 只实现需要的功能

**命名规范**:
```go
// 包名：小写，无分隔符
package article

// 接口：名词 + er 后缀
type ArticleRepository interface {}

// 结构体：PascalCase
type Article struct {}

// 方法：PascalCase，动词开头
func (s *Service) CreateArticle() {}

// 常量：UPPER_SNAKE_CASE 或 PascalCase
const MaxImageSize = 5 * 1024 * 1024
```

**文件组织**:
- 200-400 行为宜，最大 800 行
- 按功能/领域组织，不按类型
- 高内聚，低耦合

**错误处理**:
```go
// ✅ 正确：明确处理所有错误
if err != nil {
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    return nil, fmt.Errorf("failed to find: %w", err)
}

// ❌ 错误：忽略错误
_ = doSomething()
```

---

## 前端规范 (Next.js + React)

### 代码规范

参考：`.claude-rules/web/coding-style.md`

**文件组织**:
```
frontend/
├── app/              # Next.js 15 App Router
├── components/       # 按功能组织
│   ├── article/
│   ├── auth/
│   └── ui/          # 通用 UI 组件
├── lib/             # 工具函数
├── hooks/           # 自定义 Hooks
└── styles/          # 全局样式
```

**命名规范**:
- 组件：PascalCase (`ArticleCard.tsx`)
- Hooks：camelCase with `use` prefix (`useAuth.ts`)
- 工具函数：camelCase (`formatDate.ts`)

**CSS 规范**:
```css
:root {
  --color-primary: oklch(68% 0.21 250);
  --space-base: 1rem;
  --duration-normal: 300ms;
}
```

---

## Git 工作流

参考：`.claude-rules/common/git-workflow.md`

### Commit 规范

```bash
<type>: <description>

<optional body>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 重构
- `docs`: 文档
- `test`: 测试
- `chore`: 构建/工具
- `perf`: 性能优化
- `ci`: CI/CD

**示例**:
```bash
feat(backend): add user authentication API

- Implement JWT token generation
- Add bcrypt password hashing
- Create login/register endpoints

Closes #123
```

### 分支策略

- `main` - 生产分支
- `develop` - 开发分支
- `feature/*` - 功能分支
- `hotfix/*` - 紧急修复

---

## 测试规范

参考：`.claude-rules/common/testing.md`

### 测试覆盖率要求

- **最低**: 80%
- **目标**: 85%+

### 测试类型

1. **单元测试** - 函数、组件
2. **集成测试** - API、数据库
3. **E2E 测试** - 关键用户流程

### TDD 工作流

```
1. 写测试（RED）
2. 运行测试 - 应该失败
3. 写最小实现（GREEN）
4. 运行测试 - 应该通过
5. 重构（IMPROVE）
6. 验证覆盖率 (80%+)
```

---

## 安全规范

参考：`.claude-rules/common/security.md`

### 必查项

- [ ] 无硬编码密钥
- [ ] 所有用户输入已验证
- [ ] 使用参数化查询（防 SQL 注入）
- [ ] HTML 输出已转义（防 XSS）
- [ ] 启用 CSRF 保护
- [ ] 认证/授权已验证
- [ ] API 限流已配置
- [ ] 错误信息不泄露敏感数据

### 密钥管理

- ❌ 禁止：硬编码到代码
- ✅ 推荐：环境变量或密钥管理服务

---

## 性能规范

参考：`.claude-rules/common/performance.md`

### 后端性能

- API 响应时间: < 100ms (P95)
- 数据库查询: 使用索引
- 缓存策略: Redis for hot data
- 连接池: 合理配置

### 前端性能

- **Core Web Vitals**:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

- **Bundle 大小**:
  - Landing page: < 150kb (gzipped)
  - App page: < 300kb (gzipped)

---

## Code Review 规范

参考：`.claude-rules/common/code-review.md`

### 何时 Review

- ✅ 写完代码后
- ✅ 提交前
- ✅ 合并 PR 前
- ✅ 安全敏感代码

### Review Checklist

- [ ] 代码可读性好
- [ ] 函数 < 50 行
- [ ] 文件 < 800 行
- [ ] 无深层嵌套 (< 4 层)
- [ ] 错误处理完整
- [ ] 无硬编码值
- [ ] 测试覆盖率 > 80%

---

## 项目特定规范

### TZBlog 后端规范

1. **Repository 模式**: 所有数据访问通过 Repository
2. **Clean Architecture**: Handler → Service → Repository
3. **GORM 最佳实践**: 使用 Preload 避免 N+1
4. **JWT 过期时间**: 7 天 (168h)
5. **密码加密**: bcrypt cost 10

### TZBlog 前端规范

1. **Next.js 15**: App Router only
2. **状态管理**: Zustand for client state
3. **数据获取**: TanStack Query for server state
4. **UI 组件**: shadcn/ui + Radix UI
5. **样式**: Tailwind CSS v4

---

## 参考文档

- [Go Coding Style](./.claude-rules/go/coding-style.md)
- [Web Coding Style](./.claude-rules/web/coding-style.md)
- [Testing Standards](./.claude-rules/common/testing.md)
- [Security Guidelines](./.claude-rules/common/security.md)
- [Git Workflow](./.claude-rules/common/git-workflow.md)
- [Code Review](./.claude-rules/common/code-review.md)

---

**最后更新**: 2026-06-14
