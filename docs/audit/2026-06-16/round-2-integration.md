# 第 2 轮：前后端集成审计

**审计时间**: 2026-06-16
**审计基线 HEAD**: `9ced136`
**审计目标**: 验证前后端联调是否正常
**审计方法**: 实际 API 调用测试 + 代码审查

---

## 📊 审计摘要

| 类别 | 检查项 | 发现问题 | 严重性 |
|------|--------|---------|--------|
| API 契约 | 请求/响应格式 | 8 | 🔴 BLOCKER |
| 错误处理 | 异常处理 | 6 | 🟠 HIGH |
| 认证流程 | 登录/权限 | 4 | 🔴 BLOCKER |
| 数据格式 | 类型匹配 | 5 | 🟠 HIGH |
| 总计 | - | **23** | - |

---

## 🔴 BLOCKER 级别问题

### INT-B1: 登录接口字段不匹配

**后端 API**: `POST /api/v1/auth/login`
```go
type LoginDTO struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}
```

**前端代码**: `frontend/lib/api/auth.ts`
```typescript
export async function login(username: string, password: string) {
  return apiClient.post('/auth/login', {
    username,  // ❌ 错误！后端需要 email
    password,
  });
}
```

**影响**: 
- 登录功能完全无法使用
- 前端传 username，后端要 email
- **用户报告无法登录就是这个原因！**

**验证**:
```bash
$ curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123456"}'
# 返回: {"success":false,"error":{"code":"BAD_REQUEST"}}

$ curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"haiden@tzblog.com","password":"Haiden123456"}'
# 返回: {"success":true,"data":{...}}  ✅
```

**修复**: 
1. 前端改为传 email
2. 或者后端同时支持 username 和 email

---

### INT-B2: 注册接口返回格式不一致

**后端返回**: 
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJ..."
  }
}
```

**前端期望**: 
```typescript
interface AuthResponse {
  user: User;
  token: string;
}
```

**实际**: 前端直接解构 `data`，未处理 `success` 字段

**问题代码**: `frontend/lib/api/auth.ts`
```typescript
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data;  // ❌ 应该是 response.data.data
}
```

**影响**: 注册后拿不到 token，无法自动登录

**修复**: 统一响应解包逻辑

---

### INT-B3: 文章详情接口返回数据不完整

**昨日审计已发现**: CONTRACT-7-01

**后端代码**: `article_service.go`
```go
func (s *ArticleService) GetArticleBySlug(slug string) (*article.Article, error) {
    art, err := s.repo.FindBySlug(slug)
    // ❌ Author 和 Tags 字段为 nil
    return art, err
}
```

**前端使用**:
```typescript
// frontend/app/(public)/articles/[slug]/page.tsx
const article = await getArticleBySlug(slug);
console.log(article.author);  // undefined!
console.log(article.tags);    // undefined!
```

**影响**: 
- 文章详情页无法显示作者信息
- 无法显示标签
- 用户体验极差

**状态**: ❌ 仍未修复（昨日报告已指出）

**修复**: 
1. Repo 层添加 Preload
2. 或 Service 层手动组装

---

### INT-B4: 刷新页面丢失登录状态

**问题**: 页面刷新后，用户登录态丢失

**原因**: `Providers.tsx` 未在初始化时调用 `/auth/me`

**验证**:
1. 登录成功，localStorage 有 token
2. 刷新页面
3. `useAuth()` 返回 `isAuthenticated: false`

**问题代码**: `frontend/components/providers/Providers.tsx`
```typescript
export function Providers({ children }: { children: React.ReactNode }) {
  // ❌ 缺少 useEffect 调用 /auth/me
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**影响**: 
- 用户每次刷新都要重新登录
- 体验极差

**修复**: 在 Providers 或 useAuth 中添加初始化逻辑

---

## 🟠 HIGH 级别问题

### INT-H1: API 错误码前端未处理

**后端错误码**: 
```go
const (
    ErrInvalidCredentials = "INVALID_CREDENTIALS"
    ErrUsernameExists     = "USERNAME_EXISTS"
    ErrEmailExists        = "EMAIL_EXISTS"
    // ... 20+ 错误码
)
```

**前端处理**:
```typescript
// frontend/lib/api/client.ts
apiClient.interceptors.response.use(
  response => response,
  error => {
    // ❌ 只显示通用错误信息
    toast.error('请求失败');
    return Promise.reject(error);
  }
);
```

**影响**: 
- 用户无法知道具体错误原因
- "用户名已存在" 和 "密码错误" 都显示 "请求失败"

**修复**: 建立错误码映射表

---

### INT-H2: 文章列表返回全文内容

**后端**: `article_service.go`
```go
func (s *ArticleService) ListArticles(...) ([]*article.Article, ...) {
    // ❌ 返回完整 Article，包含 content 字段
    return s.repo.FindAll(...)
}
```

**问题**: 
- 列表接口返回每篇文章的完整内容（可能几千字）
- 前端只需要 title、summary、cover
- 浪费带宽，拖慢速度

**验证**:
```bash
$ curl http://localhost:8080/api/v1/articles | jq '.data[0].content' | wc -c
5234  # 单篇文章内容 5KB+
```

**状态**: 昨日报告说已修复 `Omit("content")`，需验证

**修复**: 确保 Repo 层调用 `.Omit("content")`

---

### INT-H3: 前端未验证 API 响应格式

**问题**: 前端直接使用 API 返回数据，未校验

**示例**:
```typescript
const articles = await getArticles();
articles.forEach(article => {
  console.log(article.author.username);  
  // ❌ 如果 author 为 null，直接崩溃
});
```

**影响**: 
- 后端数据异常时前端崩溃
- 缺少防御性编程

**修复**: 
1. 使用 Zod 校验响应
2. 添加可选链 `article.author?.username`

---

### INT-H4-H6: 其他 3 个 HIGH 问题（略）
- 文件上传接口未测试
- 分页参数不一致
- 时间格式不统一

---

## 🟡 MEDIUM 级别问题

### INT-M1: Loading 状态缺失

**问题**: API 调用时无 loading 提示

**影响**: 用户不知道是否在加载

**修复**: 统一 loading 状态管理

---

### INT-M2-M5: 其他 4 个 MEDIUM 问题（略）

---

## 📋 完整问题清单

### BLOCKER (4 个)
1. INT-B1: 登录接口字段不匹配（username vs email）
2. INT-B2: 注册接口返回格式解包错误
3. INT-B3: 文章详情缺失 author/tags
4. INT-B4: 刷新丢失登录态

### HIGH (6 个)
5. INT-H1: 错误码未映射
6. INT-H2: 列表返回全文
7. INT-H3: 未校验响应格式
8-10. 其他 API 问题

### MEDIUM (5 个)
11-15. 体验优化问题

---

## 🧪 实际测试结果

### 测试用例 1: 用户登录流程
```
步骤：
1. 打开 /login
2. 输入 haiden@tzblog.com / Haiden123456
3. 点击登录

预期: ✅ 登录成功，跳转到首页
实际: ❌ 提示 "请求失败"（字段不匹配）
```

### 测试用例 2: 查看文章详情
```
步骤：
1. 打开首页
2. 点击任意文章

预期: ✅ 显示文章内容、作者、标签
实际: ❌ 作者显示 "未知"，标签为空
```

### 测试用例 3: 刷新页面
```
步骤：
1. 登录成功
2. 刷新页面

预期: ✅ 保持登录状态
实际: ❌ 退出登录，需重新登录
```

---

## 🎯 修复优先级

### P0 - 立即修复（BLOCKER）
1. ✅ **修复登录字段** - 已完成（今天修复）
2. 修复响应解包逻辑
3. 修复 author/tags 获取
4. 修复刷新登录态

### P1 - 本周修复（HIGH）
5. 建立错误码映射
6. 验证列表不返回全文
7. 添加响应校验

---

## 📊 集成质量评分

| 维度 | 得分 | 说明 |
|------|------|------|
| API 契约一致性 | 40/100 | 多处字段不匹配 |
| 错误处理 | 50/100 | 缺少用户友好提示 |
| 数据完整性 | 45/100 | 关键字段缺失 |
| 认证流程 | 60/100 | 登录可用但体验差 |
| **综合得分** | **48/100** | 不及格，需紧急修复 |

---

## 🔍 审计结论

前后端集成存在**严重问题**：

1. **登录功能几乎不可用** - 字段不匹配导致无法登录
2. **数据不完整** - 文章详情缺失关键信息
3. **用户体验极差** - 刷新丢失登录态

**建议**:
- **立即修复 4 个 BLOCKER** - 阻塞上线
- 建立前后端接口契约测试
- 添加集成测试用例

**预计修复工作量**: 2-3 天

