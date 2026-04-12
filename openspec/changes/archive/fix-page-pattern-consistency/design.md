# Design: fix-page-pattern-consistency

## 1. Posts 列表页 count badge

`posts/index.astro` CollectionHeader 添加 count 和 unit：
```astro
<CollectionHeader ... count={posts.length} unit="篇文章" />
```

## 2. Projects 详情页 tags

`projects/[slug].astro` DetailSidebar 添加 tags：
```astro
<DetailSidebar ... tags={currentProject.tags}>
```

## 3. 三栏布局响应式

在 `global.css` 的 980px 和 720px 断点中添加：

```css
@media (max-width: 980px) {
  .layout-firefly {
    grid-template-columns: 1fr;
  }
  .layout-firefly .left-rail,
  .layout-firefly .right-rail {
    display: none;
  }
}
```

移动端隐藏侧栏，仅保留主内容流。

## 4. 外部链接可访问性

ProjectCard 外部链接添加 aria-label：
```astro
<a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${name} (在新窗口中打开)`}>
```
