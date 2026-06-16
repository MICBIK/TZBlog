# 快速修复清单

**基于修正审计报告**: 2026-06-16  
**总问题数**: 26 个（6 BLOCKER + 8 HIGH + 12 MEDIUM）

---

## ✅ P0 - 立即修复（预计 30 分钟）

### 1. 删除 git 中的二进制文件 (5 分钟)

```bash
cd /Users/baihaibin/Documents/WorkSpares/TZBlog

# 删除 backend/server
git rm backend/server

# 添加到 .gitignore
echo "server" >> backend/.gitignore
echo ".next" >> frontend/.gitignore
echo "out" >> frontend/.gitignore

# 提交
git commit -m "chore: remove binary from git and ignore build artifacts"
```

---

### 2. 修复 go build 失败 (10 分钟)

**方案 A: 添加 build tag（推荐）**

编辑 `backend/examples/performance_optimization_example.go`:

```go
//go:build ignore
// +build ignore

package main
// ... 其余代码保持不变
```

**方案 B: 改包名**

```go
package examples  // 改这一行

// 删除或注释 func Example
```

**方案 C: 添加 main 函数**

```go
package main

func main() {
    // Example usage - requires real DB and Redis
    fmt.Println("This is an example. Run with proper DB/Redis setup.")
}

func Example(db *gorm.DB, redisClient *redis.Client) {
    // 保持原有代码
}
```

验证:
```bash
cd backend
go build ./...
# 应该成功无错误
```

---

### 3. 修复 postgres 测试失败 (15 分钟)

编辑 `backend/internal/repository/postgres/article_repo_test.go`:

找到测试 setup 部分（类似 `setupTestDB()` 或 `BeforeEach`），在 `AutoMigrate` 调用中添加：

```go
// 原来可能是
db.AutoMigrate(&article.Article{})

// 改为
db.AutoMigrate(
    &article.Article{},
    &user.User{},      // 新增
    &tag.Tag{},        // 新增
    &category.Category{}, // 如果测试用到
)
```

验证:
```bash
cd backend
go test ./internal/repository/postgres/
# 应该全部 PASS
```

---

## 🟠 P1 - 本周修复（预计 3-5 天）

### 4. 前端测试基础设施（2 天）

**4.1 安装依赖**

```bash
cd frontend
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

**4.2 配置 vitest**

创建 `frontend/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**4.3 添加测试脚本**

编辑 `frontend/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**4.4 编写第一个测试**

创建 `frontend/lib/utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
})
```

**目标**: 核心组件/hooks/utils 达到 60% 覆盖率

---

### 5. 实现 TOC 组件（1 天）

**5.1 创建组件**

创建 `frontend/components/article/TOC.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TOC({ content }: { content: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 解析 markdown headings (简化版)
    const regex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(regex));
    
    const parsed = matches.map((match, index) => ({
      id: `heading-${index}`,
      text: match[2],
      level: match[1].length,
    }));
    
    setHeadings(parsed);
  }, [content]);

  return (
    <nav className="toc">
      <div className="text-sm font-bold mb-2">目录</div>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
          >
            <a
              href={`#${h.id}`}
              className={activeId === h.id ? 'active' : ''}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

**5.2 集成到文章详情页**

编辑 `frontend/app/(public)/articles/[slug]/page.tsx`，添加 TOC 组件到侧边栏。

---

### 6. 代码复制按钮（0.5 天）

**6.1 创建复制按钮组件**

创建 `frontend/components/article/CodeCopyButton.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-2 p-2 rounded hover:bg-white/10"
      aria-label="Copy code"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}
```

**6.2 集成到 markdown 渲染**

在 markdown 代码块渲染逻辑中添加复制按钮（具体位置取决于使用的 markdown 库）。

---

### 7. 添加数据库索引（0.5 天）

**7.1 创建 migration**

创建 `backend/migrations/add_article_indexes.sql`:

```sql
-- 复合索引：状态 + 创建时间（用于列表查询）
CREATE INDEX IF NOT EXISTS idx_articles_status_created 
ON articles(status, created_at DESC);

-- 单独的创建时间索引（用于排序）
CREATE INDEX IF NOT EXISTS idx_articles_created_at 
ON articles(created_at DESC);
```

**7.2 执行 migration**

```bash
cd backend
psql -h localhost -U tzblog -d tzblog_dev -f migrations/add_article_indexes.sql
```

**7.3 验证**

```sql
-- 检查索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'articles';
```

---

### 8. 生产环境配置（1 天）

**8.1 创建生产 .env**

复制模板:
```bash
cd backend
cp .env.prod.example .env.production
```

编辑 `.env.production`，设置强密码:

```bash
# 生成强密码（示例）
openssl rand -base64 32  # 用于 JWT_SECRET
openssl rand -base64 24  # 用于 DB_PASSWORD
```

**8.2 添加密钥验证**

编辑 `backend/config/config.go`，添加生产环境校验:

```go
func (c *Config) Validate() error {
    if c.Server.Mode == "production" {
        if len(c.JWT.Secret) < 32 {
            return errors.New("JWT_SECRET must be at least 32 characters in production")
        }
        if c.DB.Password == "postgres" || c.DB.Password == "password" {
            return errors.New("DB_PASSWORD is too weak for production")
        }
    }
    return nil
}
```

**8.3 在启动时调用**

编辑 `backend/cmd/server/main.go`:

```go
cfg := config.Load()
if err := cfg.Validate(); err != nil {
    log.Fatal("Invalid configuration:", err)
}
```

---

## 🟡 P2 - 下周修复（预计 5-7 天）

### 9-12: 前端优化

- **M-1**: TanStack Query 配置 staleTime
- **M-2**: 管理后台动态导入
- **M-3**: 安装 Playwright for E2E
- **M-4**: 优化打包体积

### 13-16: 后端优化

- **M-5**: 显式配置数据库连接池
- **M-6**: 配置 Redis 缓存策略
- **M-7**: 结构化日志 (zerolog/zap)
- **M-8**: 请求追踪 (trace ID)

### 17-20: 部署相关

- **M-9**: 编写 Dockerfile
- **M-10**: 完善 CI/CD workflow
- **M-11**: 配置 cron 定时备份
- **M-12**: 编写部署文档

---

## 📋 验证清单

修复完成后，逐一验证：

### P0 验证

```bash
# 1. 构建成功
cd backend && go build ./...

# 2. 测试通过
go test ./...

# 3. 二进制不在 git
git ls-files | grep "server$"  # 应该无结果

# 4. .gitignore 生效
echo "test" > backend/server
git status  # 不应显示 server
rm backend/server
```

### P1 验证

```bash
# 5. 前端测试运行
cd frontend && pnpm test

# 6. TOC 显示
pnpm dev
# 访问 http://localhost:3000/articles/xxx
# 检查侧边栏是否有目录

# 7. 复制按钮
# 鼠标悬停代码块，应显示复制按钮

# 8. 索引存在
psql -U tzblog -d tzblog_dev -c "\d articles"
# 检查 idx_articles_status_created
```

---

## 🎯 预期结果

完成 P0 + P1 后：

| 指标 | 当前 | 预期 |
|------|------|------|
| go build | ❌ 失败 | ✅ 成功 |
| go test | ❌ 6 失败 | ✅ 全通过 |
| 前端测试 | 0% | 60%+ |
| 功能完整性 | 缺 TOC/复制 | ✅ 完整 |
| 生产就绪 | 45/100 | 70/100 |
| **综合评分** | **63/100** | **75-80/100** |

---

## 📞 需要帮助？

如需协助修复，请告知：
1. 需要从哪个优先级开始
2. 遇到的具体问题
3. 是否需要详细代码示例

---

**清单创建**: 2026-06-16  
**预计总工时**: P0(0.5h) + P1(3-5d) + P2(5-7d) = **10-13 天**
