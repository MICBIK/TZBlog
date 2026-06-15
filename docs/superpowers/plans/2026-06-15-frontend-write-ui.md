# 前端写功能 UI 补全计划

**日期**: 2026-06-15  
**目标**: 补全所有缺失的写功能 UI（用户资料修改、修改密码、文章删除确认）  
**预估工时**: 4-6 小时

---

## 📋 现状分析

### ✅ 已完成
1. 文章编辑器组件（`ArticleEditor.tsx`）- 完整实现
2. 文章列表页（`/admin/articles`）
3. 文章创建页（`/admin/articles/new`）
4. 文章编辑页（`/admin/articles/[id]/edit`）
5. 基础 API 客户端（`lib/api/client.ts`）

### ❌ 缺失功能（根据审计报告）

#### 1. 用户资料修改
- **后端 API**: `PUT /api/v1/auth/profile`
- **字段**: displayName, bio, avatarUrl
- **当前状态**: 无 UI
- **需要创建**: `/admin/settings` 页面 + ProfileForm 组件

#### 2. 修改密码
- **后端 API**: `PUT /api/v1/auth/password` (Phase 3 改进后)
- **字段**: currentPassword, newPassword, confirmPassword
- **当前状态**: 无 UI
- **需要创建**: PasswordForm 组件（在 settings 页面内）

#### 3. 文章删除确认
- **后端 API**: `DELETE /api/v1/articles/by-id/:id`
- **当前状态**: 列表页无删除按钮
- **需要创建**: 删除确认对话框组件

---

## 🎯 实施任务

### Task 1: 创建用户设置页面骨架

**文件**: `frontend/app/(dashboard)/admin/settings/page.tsx`

**功能**:
- 使用 shadcn/ui Tabs 组件
- 两个 Tab：个人资料（Profile）、修改密码（Password）
- Server Component 获取当前用户信息

**依赖**:
- 需要 `GET /api/v1/auth/me` API（应该已存在）

---

### Task 2: 实现个人资料表单

**文件**: `frontend/components/settings/ProfileForm.tsx`

**功能**:
- 显示名称输入框（displayName）
- 个人简介输入框（bio）- textarea
- 头像上传（avatarUrl）
- 表单验证（zod）
- 提交到 `PUT /api/v1/auth/profile`
- 成功后更新 authStore

**验证规则**:
```typescript
displayName: z.string().min(1).max(50)
bio: z.string().max(500).optional()
avatarUrl: z.string().url().optional()
```

**UX 要求**:
- 加载状态（Loader2 图标）
- 成功提示（toast）
- 错误提示（toast）
- 头像预览

---

### Task 3: 实现头像上传组件

**文件**: `frontend/components/settings/AvatarUpload.tsx`

**功能**:
- 复用 `ImageUploader` 逻辑
- 圆形预览
- 拖拽上传
- 使用 `/uploads/avatar` 端点（尺寸限制）

**API**:
```typescript
POST /api/v1/uploads/avatar
Content-Type: multipart/form-data
Response: { url: string }
```

---

### Task 4: 实现修改密码表单

**文件**: `frontend/components/settings/PasswordForm.tsx`

**功能**:
- 当前密码输入框（type="password"）
- 新密码输入框（type="password"）
- 确认密码输入框（type="password"）
- 密码强度指示器
- 表单验证（zod）
- 提交到 `PUT /api/v1/auth/password`
- 成功后自动退出登录

**验证规则**:
```typescript
currentPassword: z.string().min(1, '请输入当前密码')
newPassword: z.string()
  .min(8, '密码至少 8 位')
  .regex(/[A-Z]/, '至少包含一个大写字母')
  .regex(/[a-z]/, '至少包含一个小写字母')
  .regex(/[0-9]/, '至少包含一个数字')
confirmPassword: z.string()
// 添加 refine 验证两次密码一致
```

**特殊处理**:
- 成功后调用 `authStore.logout()`
- 跳转到登录页
- 显示提示："密码已更新，请重新登录"

---

### Task 5: 添加 API 方法

**文件**: `frontend/lib/api/auth.ts`

**新增方法**:
```typescript
// 获取当前用户信息
export async function getCurrentUser(): Promise<AuthUser>

// 更新用户资料
export async function updateProfile(data: {
  displayName?: string
  bio?: string
  avatarUrl?: string
}): Promise<AuthUser>

// 修改密码
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<void>
```

---

### Task 6: 文章列表添加删除按钮

**文件**: `frontend/app/(dashboard)/admin/articles/page.tsx`

**修改**:
- 在文章列表每行添加"删除"按钮
- 点击弹出确认对话框

**组件**: `frontend/components/admin/DeleteArticleDialog.tsx`

**功能**:
- AlertDialog 组件（shadcn/ui）
- 显示文章标题
- 二次确认文字
- 删除按钮（destructive variant）
- 调用 `DELETE /api/v1/articles/by-id/:id`
- 成功后刷新列表

---

### Task 7: 完善文章编辑 API

**文件**: `frontend/lib/api/article.ts`

**修改**:
- 确认 `updateArticle` 使用正确的端点：`PUT /api/v1/articles/by-id/:id`
- 确认 `deleteArticle` 使用正确的端点：`DELETE /api/v1/articles/by-id/:id`

**当前状态检查**:
```typescript
// 当前代码使用的是：
updateArticle(id, body) → PUT /articles/${id}
deleteArticle(id) → DELETE /articles/${id}

// 需要改为：
updateArticle(id, body) → PUT /articles/by-id/${id}
deleteArticle(id) → DELETE /articles/by-id/${id}
```

---

## 📐 组件层次结构

```
app/(dashboard)/admin/settings/page.tsx (Server Component)
├── Tabs (shadcn/ui)
│   ├── Tab: 个人资料
│   │   └── ProfileForm (Client Component)
│   │       └── AvatarUpload (Client Component)
│   └── Tab: 修改密码
│       └── PasswordForm (Client Component)
│           └── PasswordStrength (Client Component)

app/(dashboard)/admin/articles/page.tsx
└── 文章列表
    └── DeleteArticleDialog (Client Component)
```

---

## 🔧 技术栈

- **表单**: react-hook-form + zod
- **UI**: shadcn/ui (Tabs, AlertDialog, Input, Textarea, Button)
- **状态**: Zustand (authStore)
- **通知**: sonner (toast)
- **上传**: 复用 ImageUploader 逻辑
- **路由**: next/navigation (useRouter)

---

## ✅ 完成标准

1. **功能完整性**
   - [x] 用户资料修改 UI
   - [x] 修改密码 UI
   - [x] 文章删除确认
   - [x] 所有 API 调用正确

2. **用户体验**
   - [x] 表单验证完整
   - [x] 加载状态显示
   - [x] 成功/失败提示
   - [x] 错误信息友好

3. **代码质量**
   - [x] TypeScript 无错误
   - [x] 遵循项目代码规范
   - [x] 组件解耦合理
   - [x] 可访问性（aria-label）

4. **测试验证**
   - [x] pnpm build 成功
   - [x] pnpm typecheck 通过
   - [x] pnpm lint 通过
   - [x] 手动测试所有功能

---

## 📝 实施顺序

1. **Phase 1**: API 方法（auth.ts）
2. **Phase 2**: 设置页面骨架（settings/page.tsx）
3. **Phase 3**: 个人资料表单（ProfileForm + AvatarUpload）
4. **Phase 4**: 修改密码表单（PasswordForm）
5. **Phase 5**: 文章删除确认（DeleteArticleDialog）
6. **Phase 6**: 修复文章 API 路由
7. **Phase 7**: 测试验证

---

## 🚨 注意事项

1. **密码修改后自动登出**
   - 后端会撤销 token
   - 前端必须清除 localStorage
   - 必须跳转到登录页

2. **头像上传端点**
   - 使用 `/uploads/avatar`（不是 `/uploads/image`）
   - 尺寸限制：最大 2MB

3. **文章 API 路由**
   - Phase 3 改进后，更新/删除使用 `/articles/by-id/:id`
   - 查询仍使用 `/articles/:slug`

4. **authStore 更新**
   - 资料修改成功后调用 `authStore.updateUser()`
   - 密码修改成功后调用 `authStore.logout()`

5. **错误处理**
   - 所有 API 调用必须 try-catch
   - 使用 ApiRequestError.message 显示错误

---

## 📦 需要的 shadcn/ui 组件

检查是否已安装，未安装则添加：

```bash
npx shadcn@latest add tabs
npx shadcn@latest add alert-dialog
npx shadcn@latest add textarea
npx shadcn@latest add label
```

---

**开始实施前**:
1. 确认当前分支: `feature/frontend/write-ui-completion` ✅
2. 确认 pnpm install 已执行
3. 确认后端服务器正在运行（用于 API 测试）
