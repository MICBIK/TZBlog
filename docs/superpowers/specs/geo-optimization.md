# 国际化与地理优化 (GEO)

## 多地域访问优化

### 1. CDN策略
**推荐方案**: Cloudflare (免费计划)
- ✅ 全球300+节点
- ✅ 自动智能路由
- ✅ DDoS防护
- ✅ 免费SSL证书
- ✅ 支持中国大陆加速（需备案）

**配置示例**:
```
DNS设置:
tzblog.com        A    Cloudflare代理IP
www.tzblog.com    CNAME tzblog.com
api.tzblog.com    A    后端服务器IP (橙色云朵)
```

### 2. 静态资源优化
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.tzblog.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  }
}
```

### 3. 字体优化
```css
/* 使用本地字体优先，CDN备用 */
@font-face {
  font-family: 'Inter';
  src: local('Inter'), 
       url('https://cdn.tzblog.com/fonts/inter.woff2') format('woff2');
  font-display: swap;
}
```

## 国际化(i18n)支持

### 阶段一实现: 中文为主
暂不考虑多语言，专注中文内容

### 阶段二扩展: 双语支持
如果后期需要英文版本：
```typescript
// next.config.js
module.exports = {
  i18n: {
    locales: ['zh-CN', 'en-US'],
    defaultLocale: 'zh-CN'
  }
}
```

## 性能优化目标

### Core Web Vitals目标
- **LCP** (最大内容绘制): < 2.5s
- **FID** (首次输入延迟): < 100ms  
- **CLS** (累积布局偏移): < 0.1

### 具体优化措施
1. **图片优化**
   - 使用Next.js Image组件
   - 自动格式转换(WebP/AVIF)
   - 懒加载
   
2. **代码分割**
   - 路由级别自动分割
   - 动态导入大组件
   ```typescript
   const AdminPanel = dynamic(() => import('@/components/AdminPanel'))
   ```

3. **预加载策略**
   ```typescript
   <Link href="/articles/nextjs-15" prefetch={true}>
   ```

4. **数据预取**
   ```typescript
   // 服务端获取数据
   export async function generateStaticParams() {
     const articles = await fetchArticles()
     return articles.map(a => ({ slug: a.slug }))
   }
   ```
