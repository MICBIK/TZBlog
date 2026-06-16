# E2E 测试文档

本目录包含使用 Playwright 编写的端到端测试。

## 📁 目录结构

```
e2e/
├── fixtures/          # 测试数据
│   ├── articles.json  # 文章数据
│   └── users.json     # 用户数据
├── mocks/             # API Mock
│   └── handlers.ts    # API 拦截和模拟
├── pages/             # Page Object Model
│   ├── HomePage.ts
│   ├── ArticlePage.ts
│   ├── SearchPage.ts
│   └── LoginPage.ts
└── tests/             # 测试用例
    ├── home.spec.ts
    ├── article.spec.ts
    ├── search.spec.ts
    ├── auth.spec.ts
    ├── error.spec.ts
    └── visual.spec.ts
```

## 🚀 运行测试

### 前置条件

确保已安装依赖：

```bash
pnpm install
```

### 运行所有测试

```bash
pnpm test:e2e
```

### 运行测试（带 UI）

```bash
pnpm test:e2e:ui
```

### Debug 模式

```bash
pnpm test:e2e:debug
```

### 运行特定浏览器

```bash
# Chromium
pnpm test:e2e:chromium

# Firefox
pnpm test:e2e:firefox

# WebKit (Safari)
pnpm test:e2e:webkit

# 移动端
pnpm test:e2e:mobile
```

### 查看测试报告

```bash
pnpm test:e2e:report
```

## 📝 测试覆盖

### 首页测试 (`home.spec.ts`)
- ✅ 页面加载
- ✅ Hero section 渲染
- ✅ 文章列表显示
- ✅ 导航功能
- ✅ 主题切换
- ✅ 响应式布局

### 文章详情页测试 (`article.spec.ts`)
- ✅ 文章内容渲染
- ✅ TOC 目录生成和点击
- ✅ 代码块语法高亮
- ✅ 代码复制按钮
- ✅ 作者信息和标签
- ✅ 相关文章推荐
- ✅ 404 处理

### 搜索功能测试 (`search.spec.ts`)
- ✅ 搜索输入和提交
- ✅ 搜索结果显示
- ✅ 空结果处理
- ✅ 关键词高亮
- ✅ 大小写不敏感

### 认证流程测试 (`auth.spec.ts`)
- ✅ 登录表单验证
- ✅ 登录成功/失败
- ✅ 注册表单验证
- ✅ 注册成功/失败
- ✅ 已登录状态处理

### 错误页面测试 (`error.spec.ts`)
- ✅ 404 页面渲染
- ✅ 返回首页链接
- ✅ 导航栏可用性

### 视觉回归测试 (`visual.spec.ts`)
- ✅ 首页截图（亮色/暗黑）
- ✅ 文章页截图（亮色/暗黑）
- ✅ 移动端/平板截图
- ✅ 组件截图（导航栏、Hero、卡片）

## 🎯 Page Object Model

测试使用 Page Object Model 模式，将页面交互封装到独立的类中：

- `HomePage`: 首页交互
- `ArticlePage`: 文章详情页交互
- `SearchPage`: 搜索页交互
- `LoginPage`: 登录/注册页交互

示例：

```typescript
import { HomePage } from '../pages/HomePage';

test('首页加载', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.verifyPageLoaded();
});
```

## 🔧 API Mocking

所有测试使用 Mock API，不依赖真实后端：

```typescript
import { MockAPI } from '../mocks/handlers';

test.beforeEach(async ({ page }) => {
  const mockAPI = new MockAPI({ page });
  await mockAPI.setupAll();
});
```

Mock 数据位于 `fixtures/` 目录。

## 📊 测试配置

测试配置文件：`playwright.config.ts`

### 浏览器支持

- ✅ Chromium (Chrome, Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

### 视口配置

- Desktop: 1280x800
- Tablet: iPad Pro
- Mobile: Pixel 5, iPhone 12

### 自动化功能

- 失败时自动截图
- 失败时录制视频
- 自动生成 HTML 报告
- 自动启动开发服务器

## 🐛 调试技巧

### 1. 使用 Debug 模式

```bash
pnpm test:e2e:debug
```

### 2. 使用 UI 模式

```bash
pnpm test:e2e:ui
```

### 3. 查看失败截图

失败的测试会自动保存截图到 `test-results/` 目录。

### 4. 查看 trace

```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### 5. Headed 模式（显示浏览器）

```bash
pnpm test:e2e:headed
```

## ✅ CI/CD 集成

在 CI 环境中运行测试：

```bash
CI=true pnpm test:e2e
```

CI 环境会：
- 自动重试失败测试 2 次
- 使用单线程运行（避免资源竞争）
- 自动生成测试报告

## 📈 测试统计

- 测试用例总数：80+
- 覆盖页面：5 个主要页面
- 浏览器覆盖：3 个浏览器
- 视口覆盖：6 种视口

## 🔄 更新测试

### 添加新测试

1. 在 `tests/` 目录创建 `.spec.ts` 文件
2. 使用 Page Object Model
3. 设置 API mocks
4. 编写测试用例

### 更新 Page Objects

当页面结构变化时，只需更新对应的 Page Object，无需修改所有测试。

### 更新 Mock 数据

修改 `fixtures/` 目录中的 JSON 文件。

## 📚 参考资料

- [Playwright 官方文档](https://playwright.dev/)
- [Page Object Model](https://playwright.dev/docs/pom)
- [测试最佳实践](https://playwright.dev/docs/best-practices)

## 🤝 贡献指南

编写新测试时请遵循：

1. 使用 Page Object Model
2. 使用有意义的测试描述
3. 添加适当的等待和断言
4. 处理异步操作
5. 添加注释说明复杂逻辑

---

**最后更新**: 2026-06-17
