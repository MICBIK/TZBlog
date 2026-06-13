# 迁移进度（Loop 断点续作）

> 生产工程根：`/Users/baihaibin/Documents/WorkSpares/TZBlog`
> 每轮先读本表定位未完项。完成一项勾一项，做完继续下一项，不停顿。

## 地基（先建，禁逐页复制）
- [x] Next.js 15 工程脚手架（手写：package.json/tsconfig/next.config/postcss/eslint/next-env/.gitignore）
- [x] `pnpm install`（全部依赖，exit 0）
- [x] `globals.css`：`@theme` token 映射 + 1:1 移植 site-chrome 特效（aurora/ember/光标/滚动条/glyphfall/boot/skeleton/err toast/footer/reduced-motion + skip-link/focus-visible）
- [x] 根 `app/layout.tsx`（JetBrains Mono via next/font + metadataBase）
- [x] `lib/types.ts`（ApiResponse/Post/Category/Tag/Comment/Pathway/Media/User/Book/Work/SiteStats/Settings/Toc）
- [x] `lib/utils.ts`（cn）
- [x] `lib/data.ts`（POSTS/CATEGORIES/TAGS/PATHWAYS/COMMENTS/SITE_STATS/BOOKS/WORKS/MEDIA/SETTINGS fixtures）
- [x] `lib/api.ts`（`{success,data,error,meta}` 信封，指向 mock）
- [x] `lib/markdown.ts`（unified: remark-parse/gfm/math → rehype → sanitize → katex → tocPlugin → pretty-code(shiki) → stringify；预览=发布同管线，tsc 通过）
- [x] shadcn/ui 基础控件：button/card/badge 独立建（cva+Radix Slot）；input/textarea/select/checkbox 等按页随 token 内联（最终采纳，handoff 注明可后续抽取为独立 primitive）
- [x] 前台 chrome 组件：TerminalBg / GlyphDrop / BootLoader / ErrorToast / ClickToast / SiteFooter / TopNav（单一数据源，tsc 通过）
- [x] `(site)/layout.tsx`（SiteChrome 装配 + skip-link，tsc 通过）
- [x] 后台 chrome：AdminSidebar（NAV 单一数据源 + usePathname 高亮 + 移动抽屉）+ `admin/layout.tsx`（app-shell 锁，admin.css 路由内 import，tsc 通过）
- [x] `not-found.tsx`（client + usePathname 回显）+ `error.tsx`（'use client' + reset）

## 20 页迁移（路由 × 观感/交互/响应式/空态骨架/SEO/a11y）
前台 8：
- [x] `(site)/page.tsx` ← front-home（置顶大卡 + 三 tab 文章流 + 五内容线 + 侧栏 6 模块 + metadata/canonical，tsc 通过）
- [x] `(site)/posts/[slug]/page.tsx` ← front-article（SSG + renderMarkdown 真实管线 + 进度条/TOC scroll-spy/代码复制/分享/点赞收藏/上下篇/评论嵌套 + JSON-LD/canonical + loading 骨架，tsc 通过）
- [x] `(site)/search/page.tsx` ← front-search（实时过滤 + chip + mark 高亮 + `/`聚焦 Esc 失焦 + aria-pressed + 空态 + metadata/canonical，tsc 通过）
- [x] `(site)/library/page.tsx` ← front-library（LibraryView 客户端 tab：年份时间线 + 书架；tsc 通过）
- [x] `(site)/works/page.tsx` ← front-works（项目卡网格 + stack badge + repo/demo；tsc 通过）
- [x] `(site)/pathways/page.tsx` ← front-pathways（PathwaysView 三路径切换 + done/now/locked + 进度条 a11y；tsc 通过）
- [x] `(site)/about/page.tsx` ← front-about（whoami hero + 技能网格 + 经历时间线 + 代表作 + 联系；tsc 通过）
- [x] `(marketing)/landing/page.tsx` ← landing（framer-motion hero + 渐变文字 + NumberTicker 数据条 + hover-glow 特性卡 + 订阅校验；Aceternity/Magic 风仅此页；tsc 通过）
后台 6：
- [x] `admin/page.tsx` ← admin-dashboard（4 卡 + sparkline + 最近文章表 + PendingQueue 待审队列；tsc 通过）
- [x] `admin/editor/page.tsx` ← admin-editor（CodeMirror 6 + 实时预览经 server action 走 lib/markdown 同管线 + frontmatter 侧栏；tsc 通过）
- [x] `admin/sections/page.tsx` ← admin-sections（SectionsManager 板块 CRUD + 置顶选择器；tsc 通过）
- [x] `admin/analytics/page.tsx` ← admin-analytics（SVG 趋势曲线 + 来源条 + 热门词云 + 分类分布；tsc 通过）
- [x] `admin/media/page.tsx` ← admin-media（MediaManager 网格 + 上传 + 删除 + next/image；tsc 通过）
- [x] `admin/settings/page.tsx` ← admin-settings（SettingsForm 分组 fieldset + zod/RHF 校验；tsc 通过）
其余 6：
- [x] `(site)/archive/page.tsx` ← archive（tag/category/year 三合一 ?type=&value= + 年份分组时间线 + 空态 + canonical；tsc 通过）
- [x] `(site)/account/page.tsx` ← account（AccountView 登录态 mock：资料/统计/收藏/点赞/评论/历史 tabs + noindex；tsc 通过）
- [x] `(auth)/login/page.tsx` ← auth（LoginForm：GitHub 优先 + Google + 邮箱/magic-link 切换 + zod/RHF 校验；tsc 通过）
- [x] `not-found.tsx` ← 404（command not found + usePathname 回显路径；tsc 通过）
- [x] `error.tsx` ← 500（'use client' + stack 风 + reset retry；tsc 通过）
- [x] index.html 启动器：生产由 `/`(home) + `/landing` 取代，按设计不单建路由

## 缺口项（横切全站）
- [x] 空态（archive/search/works/media/comments 空态卡）/ 骨架（posts/[slug]/loading.tsx）/ 分页（api.ts meta:{total,page,limit}）/ 评论嵌套 UI（CommentThread buildTree）/ 表单校验（login + settings + landing 订阅，zod+RHF）
- [x] SEO：每页 metadata（title/desc/canonical；article+landing 带 OG）+ 文章页 JSON-LD（Article）+ 站点 metadataBase/title 模板；account/admin 系 noindex
- [x] a11y：skip-link/focus-visible/aria（role=tablist/tab/progressbar/status、aria-pressed/current/label/invalid）/ 键盘（/聚焦 Esc）/ 语义标签
- [x] 响应式：全页 clamp() + grid 断点（sm/lg）实现完成；逐设备像素级核对（360/390/768/1024/1440/1920）属浏览器 QA，沙箱外
- [x] reduced-motion：globals 全局 @media 收敛；JS 特效（embers/ticker）已判 prefers-reduced-motion 起步

## 工程门禁（§7，每轮收尾跑）
- [x] `tsc --noEmit` 零错误（直接跑 ./node_modules/.bin/tsc，全绿）
- [x] `next lint` 零错误（✔ No ESLint warnings or errors）
- [x] `next build` 成功（✓ Compiled + 24/24 静态页；/archive 为 ƒ 动态因读 searchParams；/posts/[slug] SSG 5 篇）
- [x] 运行时冒烟（next start + curl）：18 路由全 200 / `/nope` 404 / 文章页含 data-rehype-pretty-code+katex+标题锚点（lib/markdown 运行时跑通，非仅编译）/ site-fx·site-fall·site-load·阅读进度 chrome 在位
- [x] a11y 实现（role/aria/skip-link/focus-visible/键盘）+ SEO 落地（每页 metadata/canonical、文章 JSON-LD、landing OG、metadataBase/title 模板）；唯 Lighthouse Perf/SEO 评分需浏览器+联网环境，沙箱外无法跑分

## 收尾
- [x] 三门禁全绿（tsc / lint / build）后产出 `TZBlog/docs/backend-handoff.md`（§9）
