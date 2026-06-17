# Round 1 — 前端 1:1 复刻质量

**评分**: 82/100（昨天 78） · **基线**: `main @ 9853c2a`

## 历史问题核实
| ID | 问题 | 状态 | 证据 |
|----|------|------|------|
| B-5 | 缺 TOC 组件 | ✅ FIXED | `articles/[slug]/page.tsx:164` 渲染 `<ArticleSidebar/>`；`_components/ArticleSidebar.tsx:12-17` TOC 列表，`:26-39` IntersectionObserver scroll-spy，`:55-67` 锚点高亮。注：`components/article/ArticleToc.tsx` 是等价但**无人 import** 的冗余实现 |
| B-6 | 代码块无复制 | ✅ FIXED | `_components/CodeBlock.tsx:24-29` `navigator.clipboard.writeText`，`:43` `copied ✓` 反馈 1.6s 复位（`page.tsx:203` 调用） |
| H-4 | 缺最近评论 widget | ✅ FIXED | `(public)/page.tsx:278-298` `$ tail comments.log` 只读评论列表，区别于文章页 CommentBox |
| H-2 | 打包体积 145KB>100KB | ⚠️ PARTIAL | `next.config.ts:3-8` 未配 optimizePackageImports；21 处 lucide 均按需具名导入；prism-react-renderer + react-markdown + 6 插件是死代码；未实测 <100KB |
| H-3 | 图片未用 next/image | ⚠️ PARTIAL | 全站仅 2 处裸 `<img>`：`settings/AvatarUpload.tsx:78`、`editor/ImageUploader.tsx:78`，均为本地 blob 预览且带 alt。公开阅读页零图片（终端风格 CSS 渐变 + emoji） |
| H-5 | 板块 CRUD 完整性 | ⚠️ PARTIAL | `sections/_components/SectionsClient.tsx` 增`:77-93`/删`:95-99`/可见性`:101-104`/置顶`:106-110` 均本地 useState mock；**编辑 `:218` 仅占位 toast**；save `:68-71` 无网络请求 |

## 新发现
- **MEDIUM** 两套重复 TOC/CodeBlock，重依赖版本为死代码 — `components/article/ArticleToc.tsx`、`CodeBlock.tsx`、`MarkdownContent.tsx` 无人 import，却把 prism + react-markdown + rehype/remark 拉进依赖树。建议删除或改为文章页真正消费。
- **MEDIUM** 板块管理无后端持久化、编辑占位、模块级 `let nextId=100` 反模式 — `SectionsClient.tsx:54,68-110,218`。
- **LOW** 文章详情页正文/元数据硬编码单篇 — `articles/[slug]/page.tsx:9-43,170-266` 任何 slug 渲染同一篇 spec-first，prev/next 写死，未接数据层。
- **LOW** 大量 `href="#"` 占位链接 — `(public)/page.tsx:313-323` 友情链接，影响键盘/读屏导航。

## 小结
B-5/B-6/H-4 确实修复；视觉 1:1 复刻质量高、暗色终端风统一、html lang 与 font-display 到位。主要欠账是**数据层未接入**（文章页硬编码、后台 mock）与重复死代码组件。
