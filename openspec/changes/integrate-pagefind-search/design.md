# Design: integrate-pagefind-search

> **关键约束**：
> - **锁定使用 Pagefind JS API**（不使用 Pagefind Default UI，因为 Default UI 自带白色背景，与 TZBlog 纯黑 + Three.js 星空主题严重冲突）
> - **保持现有搜索卡片样式**（`.search-card .panel` 暗色玻璃态卡片）
> - **不引入亮色/白色主题**，整站视觉基调是深空观测站——纯黑背景、白色文字、半透明玻璃面板
> - **不运行 `pnpm build` 或 `pnpm install`**，执行环境资源有限，代码变更完成后由项目负责人本地验证

---

## 1. 安装与构建配置

### 1.1 添加依赖

在 `apps/web/package.json` 的 `devDependencies` 中添加：
```json
"pagefind": "^1.3.0"
```

### 1.2 修改 build 脚本

```json
"build": "astro build && pagefind --site dist"
```

Pagefind CLI 在 `astro build` 产出静态 HTML 后扫描 `dist/` 目录，生成索引到 `dist/pagefind/`。

---

## 2. 标记内容页面

只在 **详情页的主内容区域** 添加 `data-pagefind-body`。列表页、首页等不加，Pagefind 就不会索引它们。

### 2.1 `pages/posts/[slug].astro`

在 `<Fragment slot="main">` 内，给 ArticleBody 包一层 div：
```astro
<Fragment slot="main">
  <div data-pagefind-body>
    <ArticleBody sections={currentPost.sections} />
  </div>
  <!-- 上一篇/下一篇导航保持不变，在 data-pagefind-body 外面 -->
  <section class="page-section article-footer-nav" ...>
    ...
  </section>
</Fragment>
```

### 2.2 `pages/projects/[slug].astro`

```astro
<Fragment slot="main">
  <div data-pagefind-body>
    <ArticleBody sections={currentProject.sections} />
  </div>
</Fragment>
```

### 2.3 `pages/docs/[slug].astro`

```astro
<Fragment slot="main">
  <div data-pagefind-body>
    <ArticleBody sections={currentDoc.sections} />
  </div>
</Fragment>
```

### 2.4 `pages/notes/[slug].astro`

```astro
<Fragment slot="main">
  <div data-pagefind-body>
    <ArticleBody sections={currentNote.sections} />
  </div>
</Fragment>
```

---

## 3. 搜索页改造

### 设计原则

- **保留**：页面壳层（eyebrow "Search"、标题 "Signal Search Relay"）、搜索输入框样式（`.search-input`）、暗色卡片样式（`.search-card .panel`）
- **替换**：内存数组过滤 → Pagefind JS API 异步搜索
- **移除**：构建时 `getPosts/getProjects/getDocs/getNotes` 调用（搜索页不再需要拉取全部内容）、`searchIndex` 数组、`<template>` 模板、旧的 `script is:inline` 代码
- **保留建议词**：改为静态配置（不再从 searchIndex 动态提取，因为 searchIndex 被移除了）

### 3.1 新的搜索页 frontmatter

```astro
---
import SiteLayout from '../../layouts/SiteLayout.astro'

const suggestedQueries = ['Payload', 'Astro', '搜索', '内容']
---
```

不再导入 `getPosts` 等函数，不再构建 `searchIndex`。

### 3.2 新的页面 HTML 结构

保留搜索壳层，移除 `<template>` 和旧的初始结果：

```astro
<SiteLayout title="搜索 | TZBlog" description="全文搜索所有文章、项目、文档和笔记。">
  <section class="page-intro panel search-shell">
    <div class="search-layout">
      <div class="flow-md">
        <p class="eyebrow">Search</p>
        <h1>Signal Search Relay</h1>
        <p class="section-copy">全文搜索所有文章、项目、文档和笔记内容。</p>
        <label class="search-label" for="search-input">输入关键词</label>
        <input
          id="search-input"
          class="search-input"
          type="search"
          placeholder="搜索文章正文、项目描述、文档内容…"
          autocomplete="off"
          data-search-input
        />
      </div>
      <aside class="side-panel flow-sm">
        <p class="eyebrow">Suggested Queries</p>
        <div class="tag-list">
          {suggestedQueries.map((word) => (
            <button type="button" class="button button-ghost" data-suggest={word}>{word}</button>
          ))}
        </div>
      </aside>
    </div>
  </section>

  <section class="page-section">
    <div class="search-results" aria-live="polite" data-search-results>
      <div class="empty-state panel">输入关键词开始搜索。</div>
    </div>
  </section>

  <script>
    // Pagefind JS API 搜索逻辑
    // 注意：开发模式下 pagefind 索引不存在，搜索不可用是正常的
    let pagefind: any = null

    async function initPagefind() {
      try {
        pagefind = await import('/pagefind/pagefind.js')
        await pagefind.init()
      } catch {
        console.warn('Pagefind index not available (normal in dev mode)')
      }
    }

    const input = document.querySelector('[data-search-input]') as HTMLInputElement | null
    const resultRoot = document.querySelector('[data-search-results]')
    const suggestButtons = document.querySelectorAll('[data-suggest]')

    function renderResults(items: Array<{ url: string; meta: { title: string }; excerpt: string }>) {
      if (!resultRoot) return
      if (!items.length) {
        resultRoot.innerHTML = '<div class="empty-state panel">没搜到匹配信号，换个关键词试试。</div>'
        return
      }
      resultRoot.innerHTML = items.map((item) => `
        <article class="search-card panel flow-sm">
          <h3><a href="${item.url}">${item.meta?.title || '无标题'}</a></h3>
          <p class="muted">${item.excerpt || ''}</p>
        </article>
      `).join('')
    }

    function renderEmpty() {
      if (!resultRoot) return
      resultRoot.innerHTML = '<div class="empty-state panel">输入关键词开始搜索。</div>'
    }

    async function runSearch(query: string) {
      const normalized = query.trim()
      if (!normalized) { renderEmpty(); return }
      if (!pagefind) {
        if (resultRoot) resultRoot.innerHTML = '<div class="empty-state panel">搜索索引加载中，请稍候…</div>'
        return
      }
      const search = await pagefind.search(normalized)
      const results = await Promise.all(search.results.slice(0, 10).map((r: any) => r.data()))
      renderResults(results)
    }

    // debounce 搜索
    let timer: ReturnType<typeof setTimeout>
    input?.addEventListener('input', () => {
      clearTimeout(timer)
      timer = setTimeout(() => runSearch(input.value), 200)
    })

    suggestButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.getAttribute('data-suggest') || ''
        if (input) input.value = value
        runSearch(value)
      })
    })

    initPagefind()
  </script>
</SiteLayout>
```

### 3.3 Pagefind excerpt 样式处理

Pagefind 返回的 `excerpt` 包含 `<mark>` 标签高亮匹配词。需要在 CSS 中添加样式：

```css
/* 在 global.css 中添加 */
.search-card mark {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text);
  padding: 0.1em 0.2em;
  border-radius: 2px;
}
```

**注意**：因为 excerpt 包含 HTML，`renderResults` 中用 `innerHTML` 赋值 excerpt 是安全的——Pagefind 生成的 excerpt 只包含 `<mark>` 标签，不存在 XSS 风险。

---

## 4. 关于开发模式

Pagefind 索引只在 `astro build` 之后存在。在 `astro dev` 开发模式下：
- `/pagefind/pagefind.js` 不存在
- `import('/pagefind/pagefind.js')` 会失败
- `initPagefind()` 的 try-catch 会捕获错误并打印 warn

这是 **预期行为**，不是 bug。要测试搜索功能需要用 `pnpm build && pnpm preview`。

---

## 5. 不需要改动的文件

- `apps/cms/` — 完全不碰
- `apps/web/src/lib/payload.ts` — 搜索页不再调用 Payload API
- `apps/web/src/layouts/` — 不改
- `apps/web/src/components/` — 不改
- 其他列表页（`posts/index.astro` 等）— 不改
