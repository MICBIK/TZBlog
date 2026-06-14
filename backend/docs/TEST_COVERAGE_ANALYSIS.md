# 测试覆盖率分析报告

**日期**: 2026-06-14  
**当前总体覆盖率**: 61.3% (核心代码)  
**目标覆盖率**: 70%+  
**差距**: +8.7%

---

## 📊 当前覆盖率统计

### 优秀 (≥80%)

| 包 | 覆盖率 | 状态 |
|----|--------|------|
| `internal/domain/category` | 100.0% | ✅ 完美 |
| `internal/domain/follow` | 100.0% | ✅ 完美 |
| `internal/domain/like` | 100.0% | ✅ 完美 |
| `internal/domain/payment` | 100.0% | ✅ 完美 |
| `internal/domain/progress` | 100.0% | ✅ 完美 |
| `internal/domain/subscription` | 100.0% | ✅ 完美 |
| `internal/domain/tag` | 100.0% | ✅ 完美 |
| `internal/domain/view` | 100.0% | ✅ 完美 |
| `pkg/sanitizer` | 100.0% | ✅ 完美 |
| `pkg/validator` | 100.0% | ✅ 完美 |
| `internal/domain/apikey` | 94.7% | ✅ 优秀 |
| `pkg/logger` | 86.2% | ✅ 优秀 |
| `pkg/apikey` | 81.1% | ✅ 优秀 |

### 良好 (60-79%)

| 包 | 覆盖率 | 状态 |
|----|--------|------|
| `internal/api/response` | 76.7% | ✅ 良好 |
| `internal/domain/comment` | 75.0% | ✅ 良好 |
| `internal/domain/article` | 73.3% | ✅ 良好 |
| `pkg/auth` | 70.6% | ✅ 良好 |
| `internal/service` | 62.3% | ⚠️ 接近目标 |
| `pkg/storage` | 61.6% | ⚠️ 接近目标 |

### 需改进 (40-59%)

| 包 | 覆盖率 | 状态 | 优先级 |
|----|--------|------|--------|
| `internal/api/middleware` | 46.6% | ⚠️ 需改进 | P1 |
| `internal/cache` | 45.9% | ⚠️ 需改进 | P1 |
| `pkg/errors` | 35.3% | ⚠️ 需改进 | P2 |

### 严重不足 (<40%)

| 包 | 覆盖率 | 状态 | 优先级 |
|----|--------|------|--------|
| `internal/api/handlers` | 9.4% | ❌ 严重不足 | P0 |
| `internal/repository/postgres` | 3.1% | ❌ 严重不足 | P0 |

### 无测试 (0%)

| 包 | 状态 | 备注 |
|----|------|------|
| `internal/audit` | 🔴 无测试 | 可选模块 |
| `internal/email` | 🔴 无测试 | 可选模块 |
| `internal/monitoring` | 🔴 无测试 | 可选模块 |
| `internal/search` | 🔴 无测试 | 可选模块 |
| `internal/seo` | 🔴 无测试 | 可选模块 |
| `internal/seo/sitemap` | 🔴 无测试 | 可选模块 |

---

## 🎯 改进优先级

### P0: 关键路径（handlers + repository）

**目标**: 从 9.4% / 3.1% 提升到 60%+

#### 1. `internal/api/handlers` (9.4% → 60%+)

**当前问题**:
- 大部分 handler 没有测试
- 只有 like_handler 和 storage_handler 有基础测试

**改进计划**:
1. **文章 Handler** (article_handler.go)
   - CreateArticle
   - GetArticle (by slug)
   - ListArticles
   - UpdateArticle
   - DeleteArticle
   - PublishArticle

2. **认证 Handler** (auth_handler.go)
   - Register
   - Login
   - Logout
   - RefreshToken

3. **评论 Handler** (comment_handler.go)
   - CreateComment
   - ListComments
   - UpdateComment
   - DeleteComment

4. **用户 Handler** (user_handler.go)
   - GetProfile
   - UpdateProfile
   - ChangePassword

5. **关注 Handler** (follow_handler.go)
   - Follow
   - Unfollow
   - GetFollowers
   - GetFollowing

**预计提升**: +50%

#### 2. `internal/repository/postgres` (3.1% → 60%+)

**当前问题**:
- 只有 apikey_repo_test.go 有测试（且跳过了）
- 所有其他 repository 都没有测试

**改进计划**:
1. **Article Repository**
   - Create
   - GetByID
   - GetBySlug
   - Update
   - Delete
   - List (with pagination)

2. **Comment Repository**
   - Create
   - GetByID
   - ListByArticle
   - Update
   - Delete

3. **User Repository**
   - Create
   - GetByID
   - GetByEmail
   - Update

4. **Like Repository**
   - Create
   - Delete
   - IsLiked
   - CountByTarget

5. **Follow Repository**
   - Create
   - Delete
   - IsFollowing
   - GetFollowers
   - GetFollowing

**测试策略**:
- 使用 testcontainers 运行真实 PostgreSQL
- 或者使用 go-sqlmock 模拟数据库

**预计提升**: +55%

---

### P1: 中间层（middleware + cache）

**目标**: 从 46% 提升到 70%+

#### 1. `internal/api/middleware` (46.6% → 70%+)

**改进计划**:
1. **AuthMiddleware** - 补充边界测试
   - 无 token
   - 过期 token
   - 无效 token
   - 撤销 token

2. **RateLimitMiddleware** - 补充限流测试
   - 正常请求
   - 超过限制
   - 重置窗口

3. **CORSMiddleware** - 补充跨域测试
   - 白名单域名
   - 非白名单域名
   - Preflight 请求

**预计提升**: +25%

#### 2. `internal/cache` (45.9% → 70%+)

**改进计划**:
1. **Redis Cache** - 补充缓存测试
   - Set/Get
   - Delete
   - TTL 过期
   - Redis 连接失败

**预计提升**: +25%

---

### P2: 辅助模块（errors）

**目标**: 从 35% 提升到 60%+

#### `pkg/errors` (35.3% → 60%+)

**改进计划**:
1. 补充所有错误类型测试
2. 补充错误包装测试
3. 补充错误格式化测试

**预计提升**: +25%

---

## 📋 测试补充计划

### 第 1 阶段: Handlers 测试（P0）

**预计时间**: 3-4 小时  
**目标覆盖率**: handlers 9.4% → 60%+

**任务**:
1. ✅ 修复现有测试（like_handler, storage_handler）
2. ⬜ 补充 article_handler 测试（6 个方法）
3. ⬜ 补充 auth_handler 测试（4 个方法）
4. ⬜ 补充 comment_handler 测试（4 个方法）
5. ⬜ 补充 user_handler 测试（3 个方法）
6. ⬜ 补充 follow_handler 测试（4 个方法）

### 第 2 阶段: Repository 测试（P0）

**预计时间**: 4-5 小时  
**目标覆盖率**: repository 3.1% → 60%+

**任务**:
1. ⬜ 设置 testcontainers PostgreSQL
2. ⬜ 补充 article_repo 测试
3. ⬜ 补充 comment_repo 测试
4. ⬜ 补充 user_repo 测试
5. ⬜ 补充 like_repo 测试
6. ⬜ 补充 follow_repo 测试

### 第 3 阶段: Middleware 测试（P1）

**预计时间**: 2-3 小时  
**目标覆盖率**: middleware 46.6% → 70%+

**任务**:
1. ⬜ 补充 auth_middleware 边界测试
2. ⬜ 补充 rate_limit_middleware 测试
3. ⬜ 补充 cors_middleware 测试

### 第 4 阶段: Cache 测试（P1）

**预计时间**: 1-2 小时  
**目标覆盖率**: cache 45.9% → 70%+

**任务**:
1. ⬜ 补充 redis cache 测试
2. ⬜ 补充缓存失败场景测试

---

## 📊 预期成果

### 覆盖率提升预测

| 阶段 | 模块 | 当前 | 目标 | 提升 |
|------|------|------|------|------|
| 阶段 1 | handlers | 9.4% | 60% | +50.6% |
| 阶段 2 | repository | 3.1% | 60% | +56.9% |
| 阶段 3 | middleware | 46.6% | 70% | +23.4% |
| 阶段 4 | cache | 45.9% | 70% | +24.1% |

### 总体覆盖率预测

**当前**: 61.3%  
**预计完成后**: 72-75%  
**目标**: 70%+ ✅

---

## 🔧 测试工具和策略

### 单元测试
- **框架**: Go 标准 testing + testify
- **Mock**: testify/mock
- **断言**: testify/assert, testify/require

### 集成测试
- **数据库**: testcontainers + PostgreSQL
- **HTTP**: httptest.NewRecorder
- **Redis**: miniredis (内存 Redis)

### 测试策略
1. **AAA 模式**: Arrange → Act → Assert
2. **表驱动测试**: 使用 []struct 覆盖多种场景
3. **边界测试**: 空值、nil、零值、超长、负数
4. **错误场景**: 数据库错误、网络错误、验证错误

---

## 📝 测试编写规范

### 测试文件命名
```
<file>_test.go
```

### 测试函数命名
```go
func Test<Struct>_<Method>(t *testing.T) {
    // ...
}
```

### 测试用例结构
```go
tests := []struct {
    name           string
    input          Type
    expectedOutput Type
    expectedError  error
}{
    {
        name:           "successful case",
        input:          validInput,
        expectedOutput: expectedOutput,
        expectedError:  nil,
    },
    {
        name:           "error case",
        input:          invalidInput,
        expectedOutput: nil,
        expectedError:  ErrExpected,
    },
}

for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        // Arrange
        // Act
        // Assert
    })
}
```

---

**报告生成日期**: 2026-06-14  
**下次更新**: 完成阶段 1-2 后
