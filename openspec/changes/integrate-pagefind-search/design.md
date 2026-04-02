# Design: integrate-pagefind-search

## 1. 安装方式

推荐使用 Astro 构建后手动运行 Pagefind CLI（最简单可控）：

```bash
pnpm add -D pagefind
```

在 `apps/web/package.json` 的 build 脚本改为：
```json
"build": "astro build && pagefind --site dist"
```

或者使用 `astro-pagefind` 集成（自动注入）：
```bash
pnpm add astro-pagefind
```

在 `astro.config.mjs` 中注册。两种方式二选一，优先选择更简单的。

## 2. 内容标记

在所有详情页的**主内容区域**添加 `data-pagefind-body`，让 Pagefind 知道索引哪部分 HTML：

### posts/[slug].astro
```astro
<Fragment slot="main">
  <div data-pagefind-body>
    <ArticleBody sections={currentPost.sections} />
  </div>
</Fragment>
```

### projects/[slug].astro, docs/[slug].astro, notes/[slug].astro
同理，在 `<Fragment slot="main">` 内的主内容容器上加 `data-pagefind-body`。

### 排除导航/侧栏
Pagefind 默认只索引 `data-pagefind-body` 标记的元素。侧栏、header、footer 不需要额外排除。

### 列表页排除
列表页（posts/index.astro 等）不应被索引（它们只是导航页），添加：
```html
<body data-pagefind-ignore>
```
或者在 layout 层面控制。更好的方式是：只在详情页加 `data-pagefind-body`，列表页什么都不加，Pagefind 就不会索引它们。

## 3. 搜索页改造

### 保留的部分
- 页面壳层结构（eyebrow、标题、描述）
- 搜索输入框的视觉样式
- 建议词按钮

### 替换的部分
- 移除 `searchIndex` 内存数组和 `script is:inline` 中的过滤逻辑
- 替换为 Pagefind JS API 或 Pagefind Default UI

### 方案 A：使用 Pagefind Default UI（推荐，最快）

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro'
---
<SiteLayout title="搜索 | TZBlog" description="搜索作为一级导航存在，帮助用户快速定位内容。">
  <section class="page-intro panel search-shell">
    <div class="search-layout">
      <div class="flow-md">
        <p class="eyebrow">Search</p>
        <h1>Signal Search Relay</h1>
        <p class="section-copy">全文搜索所有文章、项目、文档和笔记内容。</p>
      </div>
    </div>
  </section>

  <section class="page-section">
    <div id="pagefind-search"></div>
  </section>

  <link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
  <script>
    import '/pagefind/pagefind-ui.js'
    new PagefindUI({
      element: '#pagefind-search',
      showSubResults: true,
      showImages: false,
    })
  </script>
</SiteLayout>
```

### 方案 B：使用 Pagefind JS API（更灵活，保持自定义卡片样式）

```astro
<script>
  const pagefind = await import('/pagefind/pagefind.js')
  await pagefind.init()

  input.addEventListener('input', async (e) => {
    const query = e.target.value
    if (!query) { renderEmpty(); return }
    const results = await pagefind.search(query)
    const items = await Promise.all(results.results.slice(0, 10).map(r => r.data()))
    renderResults(items)
  })
</script>
```

这种方式可以保持现有的 `search-card` 卡片样式，但需要更多代码。

**建议先用方案 A 跑通，后续根据视觉需求决定是否切换到方案 B。**

## 4. Pagefind UI 样式覆盖

Pagefind Default UI 有自己的样式，需要覆盖以匹配 TZBlog 暗色主题：

```css
/* 在 global.css 或搜索页 <style> 中 */
:root {
  --pagefind-ui-scale: 1;
  --pagefind-ui-primary: var(--text);
  --pagefind-ui-text: var(--text);
  --pagefind-ui-background: transparent;
  --pagefind-ui-border: var(--border);
  --pagefind-ui-tag: var(--tag-bg);
  --pagefind-ui-border-width: 1px;
  --pagefind-ui-border-radius: var(--radius-sm);
  --pagefind-ui-font: inherit;
}
```

## 5. 构建验证

```bash
cd apps/web
pnpm build
# 检查 dist/pagefind/ 目录是否生成
ls dist/pagefind/
# 应看到 pagefind.js, pagefind-ui.js, pagefind-ui.css, pagefind-entry.json 等文件
```

## 6. 注意事项

- Pagefind 索引在 `astro build` **之后**生成，开发模式（`astro dev`）下搜索不可用，这是正常的
- 如果使用 `pnpm preview` 可以测试搜索功能
- Pagefind 会索引所有带 `data-pagefind-body` 的页面，如果不加这个属性则索引整个 `<body>`
- 索引文件在 `dist/pagefind/` 下，部署时会自动跟随 dist 一起上传
