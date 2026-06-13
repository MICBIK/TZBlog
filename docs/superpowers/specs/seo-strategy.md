# SEO完整优化策略

## 技术SEO实现

### 1. Next.js SEO配置
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://tzblog.com'),
  title: {
    default: 'TZBlog - 技术博客',
    template: '%s | TZBlog'
  },
  description: '专注前端、后端、DevOps的技术博客',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'TZBlog'
  }
}
```

### 2. 动态Meta生成
```typescript
// app/articles/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const article = await fetchArticle(params.slug);
  
  return {
    title: article.title,
    description: article.summary,
    keywords: article.tags.join(', '),
    openGraph: {
      title: article.title,
      description: article.summary,
      images: [article.coverImage],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author.name]
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: [article.coverImage]
    }
  }
}
```

### 3. 结构化数据 (JSON-LD)
```typescript
// components/ArticleSchema.tsx
export function ArticleSchema({ article }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    image: article.coverImage,
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: `https://tzblog.com/users/${article.author.username}`
    },
    publisher: {
      '@type': 'Organization',
      name: 'TZBlog',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tzblog.com/logo.png'
      }
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tzblog.com/articles/${article.slug}`
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 4. Sitemap自动生成
```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await fetchAllArticles();
  const categories = await fetchAllCategories();
  
  return [
    {
      url: 'https://tzblog.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: 'https://tzblog.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    },
    ...articles.map(article => ({
      url: `https://tzblog.com/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8
    })),
    ...categories.map(category => ({
      url: `https://tzblog.com/categories/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6
    }))
  ]
}
```

### 5. robots.txt配置
```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/']
      }
    ],
    sitemap: 'https://tzblog.com/sitemap.xml'
  }
}
```

---

## 内容SEO策略

### 1. 关键词研究
**工具推荐**：
- Google Keyword Planner (关键词挖掘)
- Ahrefs (竞品分析)
- 5118 (国内SEO数据)
- Answer The Public (用户问题挖掘)

**策略**：
- 长尾关键词定位（竞争小、转化高）
- 主题聚类（围绕核心主题建立内容矩阵）
- 竞争度分析（选择KD<30的关键词）

### 2. 内容优化清单
每篇文章发布前检查：
- [ ] 标题包含目标关键词（前60字符）
- [ ] Meta描述吸引人（120-160字符）
- [ ] H1标签唯一且包含关键词
- [ ] 内部链接建设（3-5个相关文章）
- [ ] 外部权威链接引用（提升可信度）
- [ ] 图片Alt文本优化（描述+关键词）
- [ ] URL结构清晰（使用slug，避免中文）
- [ ] 内容长度适中（技术文章建议1500-3000字）

### 3. 内部链接策略
```typescript
// 相关文章推荐算法
function getRelatedArticles(article: Article): Article[] {
  // 1. 相同标签的文章
  // 2. 相同分类的文章
  // 3. 按发布时间排序
  // 返回5篇相关文章
}
```

---

## 性能优化 (Core Web Vitals)

### 目标指标
| 指标 | 目标值 | 说明 |
|-----|--------|-----|
| LCP | < 2.5s | 最大内容绘制 |
| FID | < 100ms | 首次输入延迟 |
| CLS | < 0.1 | 累积布局偏移 |
| FCP | < 1.5s | 首次内容绘制 |
| TTI | < 3.5s | 可交互时间 |

### 实现策略

#### 1. 图片优化
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.tzblog.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  }
}
```

```tsx
// 使用Next.js Image组件
import Image from 'next/image';

<Image
  src={article.coverImage}
  alt={article.title}
  width={1200}
  height={630}
  priority={isAboveFold} // 首屏图片
  loading={isAboveFold ? 'eager' : 'lazy'}
/>
```

#### 2. 代码分割
```typescript
// 动态导入大组件
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <p>Loading...</p>,
  ssr: false // 客户端渲染
});

const MarkdownEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);
```

#### 3. 字体优化
```tsx
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

#### 4. 预加载关键资源
```tsx
// app/layout.tsx
export default function RootLayout() {
  return (
    <html>
      <head>
        <link
          rel="preconnect"
          href="https://cdn.tzblog.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://cdn.tzblog.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 技术细节实现

### 1. 预渲染策略
```typescript
// 静态生成 (SSG) - 适用于文章详情
export async function generateStaticParams() {
  const articles = await fetchArticles({ limit: 100 });
  
  return articles.map((article) => ({
    slug: article.slug
  }));
}

// 增量静态再生 (ISR)
export const revalidate = 3600; // 1小时更新一次
```

### 2. 缓存策略
```typescript
// 利用Next.js内置缓存
export async function fetchArticle(slug: string) {
  const res = await fetch(`/api/articles/${slug}`, {
    next: {
      revalidate: 3600, // ISR缓存1小时
      tags: ['article', `article-${slug}`]
    }
  });
  return res.json();
}

// 手动重新验证
import { revalidateTag } from 'next/cache';

// 文章更新后
revalidateTag(`article-${slug}`);
```

---

## SEO监控与分析

### 关键指标监控
1. **Google Search Console**
   - 搜索曝光量
   - 点击率 (CTR)
   - 平均排名
   - 索引覆盖率

2. **Google Analytics 4**
   - 自然流量占比
   - 用户停留时间
   - 跳出率
   - 转化率

3. **Lighthouse CI**
   - 自动化性能测试
   - SEO分数监控
   - 可访问性检测

### 监控实现
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://tzblog.com
            https://tzblog.com/articles/example
          uploadArtifacts: true
```

---

## 外链建设策略

### 1. 高质量内容营销
- 发布原创深度技术文章
- 投稿到技术社区（掘金、思否、Dev.to）
- 参与开源项目，在README中链接博客

### 2. 社交媒体推广
- Twitter技术账号运营
- 微信公众号同步
- 知乎专栏关联

### 3. 技术社区互动
- Stack Overflow回答问题并引用博客
- GitHub Discussions参与讨论
- Reddit技术子版块分享

---

## SEO最佳实践清单

### 上线前
- [ ] 配置Google Search Console
- [ ] 提交sitemap.xml
- [ ] 设置Google Analytics
- [ ] 验证robots.txt
- [ ] 测试结构化数据（Google Rich Results Test）
- [ ] 移动端适配测试
- [ ] HTTPS配置
- [ ] 404页面优化

### 运营期
- [ ] 每周发布1-2篇高质量文章
- [ ] 每月更新旧文章（保持内容新鲜度）
- [ ] 监控GSC错误和警告
- [ ] 分析热门关键词，优化相关内容
- [ ] 建立内部链接网络
- [ ] 获取高质量外链

### 优化迭代
- [ ] 每月分析Core Web Vitals数据
- [ ] A/B测试标题和描述
- [ ] 优化低CTR页面
- [ ] 修复404和重定向链
- [ ] 提升低排名页面
