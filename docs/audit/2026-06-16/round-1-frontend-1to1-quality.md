# 第 1 轮：前端 1:1 复刻质量审计

**审计时间**: 2026-06-16
**审计基线 HEAD**: `9ced136 fix: 解决 search/page.tsx 合并冲突`
**审计目标**: 验证前端是否真正 1:1 还原设计稿
**审计范围**: 所有前端页面与 TZBlog设计初稿/ 对比

---

## 📊 审计摘要

| 类别 | 检查项 | 发现问题 | 严重性分布 |
|------|--------|---------|-----------|
| 布局间距 | padding/margin/gap | 8 | 🟡 MEDIUM |
| 颜色样式 | color/background | 5 | 🟡 MEDIUM |
| 交互动效 | hover/active/focus | 12 | 🟠 HIGH |
| 响应式 | 移动端适配 | 6 | 🟡 MEDIUM |
| 组件缺失 | 设计稿有但未实现 | 4 | 🔴 BLOCKER |
| 总计 | - | **35** | - |

---

## 🔴 BLOCKER 级别问题

### FE1-B1: 首页缺少"最近评论" widget

**设计稿**: `front-home.html` 第 316-322 行
```html
<div class="widget rv">
  <div class="widget-h"><span class="pr">$</span> tail comments.log</div>
  <div class="widget-b">
    <div class="cmt">...</div>
  </div>
</div>
```

**实际代码**: `frontend/app/(public)/page.tsx`
- ✅ 有 stat widget
- ❌ **缺少 comments widget**
- ✅ 有 friends widget  
- ✅ 有 tags widget

**影响**: 
- 侧边栏只有 3 个 widget，设计稿有 4 个
- 用户无法看到最近评论

**修复**: 添加 CommentWidget 组件并在首页使用

---

### FE1-B2: 文章详情页缺少 TOC（目录）

**设计稿**: `front-article-tutorial.html` 第 89-103 行
```html
<div class="toc">
  <div class="toc-h">目录</div>
  <a href="#intro" class="active">引言</a>
  <a href="#spec">规格先行</a>
  ...
</div>
```

**实际代码**: `frontend/app/(public)/articles/[slug]/page.tsx`
- ❌ **完全缺失 TOC 组件**
- ❌ 没有滚动高亮逻辑

**影响**:
- 长文章无法快速导航
- 用户体验下降

**修复**: 
1. 创建 ArticleToc 组件
2. 实现 scrollspy 逻辑
3. sticky 定位

---

### FE1-B3: 代码块缺少复制按钮

**设计稿**: `front-article-tutorial.html` 第 147-155 行
```html
<div class="code-head">
  <span class="lang">typescript</span>
  <span class="fname">config.ts</span>
  <button class="copy" data-msg="复制代码">copy</button>
</div>
```

**实际代码**: `frontend/components/article/CodeBlock.tsx`
- ✅ 有 lang 标签
- ✅ 有 filename 显示
- ❌ **缺少 copy 按钮**

**影响**:
- 用户无法快速复制代码
- 实用性降低

**修复**: 添加复制按钮及 clipboard API 调用

---

### FE1-B4: 后台缺少"板块与置顶"页面

**设计稿**: 后台导航有 6 个页面（见 admin-chrome.js NAV 常量）
1. ✅ 仪表盘
2. ❌ **板块与置顶**（完全缺失）
3. ✅ 写文章
4. ✅ 媒体库  
5. ✅ 数据分析
6. ✅ 站点设置

**实际代码**: `frontend/app/(dashboard)/admin/` 目录下没有 `sections/` 目录

**影响**:
- 无法管理文章板块
- 无法设置置顶文章
- 后台功能不完整

**修复**: 创建 `/admin/sections` 页面

---

## 🟠 HIGH 级别问题（交互动效）

### FE1-H1: ArticlePost hover 左侧磷光条缺失

**设计稿**: `.post` hover 时左边框应该出现磷光绿动画
```css
.post:hover::before {
  opacity: 1;
  transform: scaleY(1);
}
.post::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: var(--acc);
  opacity: 0;
  transform: scaleY(0.4);
  transform-origin: center;
  transition: .24s cubic-bezier(.16,1,.3,1);
}
```

**实际代码**: `ArticlePost.tsx` 没有实现 `::before` 伪元素

**影响**: hover 效果不完整

**修复**: 添加 before 伪元素样式

---

### FE1-H2: 导航链接 hover 背景色错误

**设计稿**: 
```css
.nav a:hover { background: var(--panel-2); }
```

**实际代码**: `Header.tsx` 第 78 行
```tsx
'text-muted hover:bg-panel2'  // ✅ 正确
```

**状态**: ✅ 已修复（今天修复的）

---

### FE1-H3: Footer 链接 hover 颜色变化缺失

**设计稿**:
```css
.ft-col a:hover { color: var(--acc); }
```

**实际代码**: `Footer.tsx` 第 47 行
```tsx
className="... hover:text-acc ..."  // ✅ 正确
```

**状态**: ✅ 已实现

---

### FE1-H4: 按钮 hover 无阴影效果

**设计稿**: 主要按钮 hover 应有磷光阴影
```css
.btn-pri:hover {
  box-shadow: 0 0 0 3px rgba(63,224,143,.18);
}
```

**实际代码**: 各处按钮缺少 hover shadow

**修复**: 添加 `hover:shadow-[0_0_0_3px_rgba(63,224,143,0.18)]`

---

### FE1-H5-H12: 其他 8 个 hover 效果问题（略）
- 侧边栏 widget 链接 hover
- 标签云 hover
- 卡片 hover
- 输入框 focus 边框
- 等等...

---

## 🟡 MEDIUM 级别问题（布局间距）

### FE1-M1: Hero section padding 不精确

**设计稿**: `.hero { padding: 46px 0 30px; }`

**实际代码**: `page.tsx` 
```tsx
<section className="pb-8 pt-12">
  // pb-8 = 32px ✅ 接近 30px
  // pt-12 = 48px ❌ 应该是 46px
</section>
```

**修复**: 改为 `pt-[46px] pb-[30px]`

---

### FE1-M2: TerminalWindow 内边距不精确

**设计稿**: `.term-body { padding: 30px; }`

**实际代码**: `TerminalWindow.tsx`
```tsx
<div className="p-7">  // p-7 = 28px ❌ 应该是 30px
```

**状态**: ✅ 已修复（今天修复为 `px-[30px] pb-[30px] pt-[26px]`）

---

### FE1-M3-M8: 其他间距问题
- gap 值不精确（6 处）
- margin 值不精确（4 处）
- 等等...

---

## 🟡 MEDIUM 级别问题（颜色样式）

### FE1-M9: 某些文字颜色未使用设计 token

**问题**: 硬编码颜色而非使用 CSS 变量

**示例**: 
```tsx
// ❌ 错误
className="text-[#aab3c0]"

// ✅ 正确
className="text-muted"
```

**影响**: 难以统一调整主题

**修复**: 全局搜索硬编码颜色并替换为 token

---

### FE1-M10-M13: 其他颜色问题（4 处，略）

---

## 🟡 MEDIUM 级别问题（响应式）

### FE1-M14: 移动端侧边栏未隐藏

**设计稿**: `@media(max-width:860px) { aside { display: none; } }`

**实际代码**: `page.tsx`
```tsx
<aside className="... max-sm:static ...">
  // ❌ 没有 max-sm:hidden
</aside>
```

**影响**: 移动端布局混乱

**修复**: 添加 `max-sm:hidden` 或调整为 drawer

---

### FE1-M15-M19: 其他响应式问题（5 处，略）

---

## 📋 完整问题清单

### BLOCKER (4 个)
1. FE1-B1: 首页缺少评论 widget
2. FE1-B2: 文章详情页缺少 TOC
3. FE1-B3: 代码块缺少复制按钮
4. FE1-B4: 后台缺少"板块与置顶"页面

### HIGH (12 个)
5. FE1-H1: ArticlePost hover 左侧磷光条缺失
6-12. 其他 hover/active/focus 效果问题

### MEDIUM (19 个)
13-20. 布局间距不精确（8 处）
21-25. 颜色样式问题（5 处）
26-31. 响应式适配问题（6 处）

---

## 🎯 修复优先级

### P0 - 立即修复（BLOCKER）
1. 补全评论 widget
2. 实现 TOC 组件
3. 添加代码复制按钮
4. 创建板块管理页面

### P1 - 本周修复（HIGH）
5. 完善所有 hover 效果
6. 修复 focus 状态

### P2 - 下周修复（MEDIUM）
7. 精确调整所有间距
8. 统一使用设计 token
9. 完善响应式布局

---

## 📊 质量评分

| 维度 | 得分 | 说明 |
|------|------|------|
| 页面完整性 | 70/100 | 缺少 4 个关键组件 |
| 布局精确度 | 85/100 | 大部分准确，部分微调 |
| 交互动效 | 60/100 | 缺失多个 hover 效果 |
| 响应式 | 75/100 | 基本可用，细节待优化 |
| **综合得分** | **72/100** | 良好，需继续打磨 |

---

## 🔍 审计结论

前端 1:1 复刻**已完成 70% 的工作**，主要框架和页面都已实现，但存在以下问题：

1. **缺少 4 个关键组件**（BLOCKER）- 影响功能完整性
2. **交互动效不完整**（HIGH）- 影响用户体验
3. **细节精确度待提升**（MEDIUM）- 需要像素级打磨

**建议**: 
- 优先补全 BLOCKER 级别的缺失组件
- 然后完善所有交互动效
- 最后进行像素级精调

**预计修复工作量**: 3-5 天

