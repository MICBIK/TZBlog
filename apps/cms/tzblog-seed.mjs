import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })
const { default: config } = await import(path.resolve(__dirname, 'src/payload.config.ts'))
const payload = await getPayload({ config })

const sec = (id, title, paragraphs, bullets) => ({ id, title, paragraphs: paragraphs.map((text) => ({ text })), ...(bullets ? { bullets: bullets.map((text) => ({ text })) } : {}) })
const tags = (...xs) => xs.map((tag) => ({ tag }))
const items = (...xs) => xs.map((item) => ({ item }))
const texts = (...xs) => xs.map((text) => ({ text }))
const links = (...xs) => xs.map(([label, href]) => ({ label, href }))

const data = {
  posts: [
    { title: '从静态内容到 Payload：TZBlog 内容链路改造记录', slug: 'payload-content-pipeline-overview', summary: '记录 TZBlog 如何从前端静态 mock 迁移到 Payload CMS，重点梳理 schema、前台消费和构建期容错。', category: 'Engineering', orbit: 'Content Delivery Orbit', publishedAt: '2026-04-01T00:00:00.000Z', readTime: '8 min', featured: true, tags: tags('Payload', 'Astro', 'CMS'), sections: [sec('context', '改造背景', ['原始版本使用静态示例内容，适合搭界面，不适合长期维护。', '这次目标是让 Payload CMS 成为真实内容源，同时保证 Astro 构建稳定。']), sec('pipeline', '链路设计', ['CMS 新增四个 collection，字段与前台组件结构一一对应。', 'Web 端通过统一 payload.ts 做 fetch 与 normalize。'], ['列表页消费摘要字段', '详情页消费 sections 数组', 'search 聚合四类已发布内容'])] },
    { title: '观测站首页重构：把 GitHub 活跃度变成首页信号源', slug: 'homepage-github-signal-redesign', summary: '首页改造围绕贡献热力图、精选仓库与站点统计展开，目标是让第一页就体现作者的长期输出。', category: 'Product', orbit: 'Observatory Frontline', publishedAt: '2026-03-31T00:00:00.000Z', readTime: '6 min', featured: true, tags: tags('GitHub API', 'UX', 'Homepage'), sections: [sec('signal', '为什么要改首页', ['首页不该只是导航入口，它应该展示作者持续在做什么、最近产出什么。']), sec('modules', '首页模块拆分', ['新版首页分成 Hero、GitHub Activity、Recent Posts、About、Site Stats 五个模块。'], ['Contribution Graph 展示 12 个月活跃度', 'Recent Posts 读取最新已发布文章', 'Site Stats 显示访问量与访客数'])] },
    { title: '搜索页壳层设计：在 Pagefind 接入前先把体验跑通', slug: 'search-shell-before-pagefind', summary: '先用聚合后的 Payload 数据做轻量搜索壳层，验证导航、关键词建议与结果卡片结构。', category: 'Architecture', orbit: 'Search Relay', publishedAt: '2026-03-30T00:00:00.000Z', readTime: '5 min', tags: tags('Search', 'Pagefind', 'Information Architecture'), sections: [sec('shell', '为什么先做壳层', ['在真正接入全文索引前，先把页面信息架构和结果卡片样式定下来。']), sec('aggregation', '聚合策略', ['当前 search 同时聚合文章、项目、文档、笔记四类内容。'])] },
  ],
  projects: [
    { title: 'TZBlog 内容平台化升级', slug: 'tzblog-content-platform-upgrade', summary: '将 TZBlog 从静态演示站升级为由 Payload 驱动的长期内容平台，统一管理文章、项目、文档与笔记。', stage: 'In Progress', orbit: 'Platform Foundation', updatedAt: '2026-04-02T00:00:00.000Z', featured: true, stack: items('Astro', 'Payload CMS', 'PostgreSQL', 'TypeScript'), tags: tags('Monorepo', 'CMS', 'Content Platform'), links: links(['Repository', 'https://github.com/MICBIK/TZBlog'], ['Search Entry', '/search']), highlights: texts('四类内容模型统一接入 CMS', '前台静态构建支持 Payload API 容错', '搜索页已消费聚合内容数据'), sections: [sec('scope', '项目范围', ['本项目覆盖内容建模、CMS 配置、前台页面消费、搜索聚合以及本地开发链路整理。']), sec('roadmap', '下一步路线', ['接下来会补充 seed、鉴权策略、媒体资源和更真实的运营数据。'], ['补齐后台初始化与演示数据脚本', '接入更完整的文章富文本能力', '把搜索升级到实际索引'])] },
    { title: 'Observatory Motion Kit', slug: 'observatory-motion-kit', summary: '围绕观测站主题提炼一套可复用的 UI motion 方案，用于页面切换、扫描线和悬浮态反馈。', stage: 'Stable', orbit: 'Interface Lab', updatedAt: '2026-03-29T00:00:00.000Z', featured: true, stack: items('CSS Animation', 'Three.js', 'Astro'), tags: tags('Motion', 'Design System'), links: links(['Homepage', '/']), highlights: texts('统一 hover 与 section reveal 动效节奏', '把观测站视觉语义沉淀成组件规范'), sections: [sec('principles', '设计原则', ['所有动效都服务于信息呈现，而不是抢走用户对内容本身的注意力。'])] },
    { title: 'Signal Search Relay', slug: 'signal-search-relay', summary: '为 TZBlog 设计一个显式可见的一号位搜索入口，让用户能够快速穿梭不同内容类型。', stage: 'Planned', orbit: 'Discovery Layer', updatedAt: '2026-03-30T00:00:00.000Z', stack: items('Pagefind', 'Astro', 'Payload API'), tags: tags('Search', 'Discovery'), links: links(['Search Page', '/search']), highlights: texts('跨内容类型统一检索体验'), sections: [sec('goal', '目标', ['搜索页将成为博客中的一级能力，而不是藏在页脚的附属功能。'])] },
  ],
  docs: [
    { title: 'TZBlog 内容交付蓝图', slug: 'content-delivery-blueprint', summary: '总结内容模型、API 查询与页面消费之间的关系，作为前后端协作时的统一参考文档。', version: 'v0.3', orbit: 'Docs Orbit', updatedAt: '2026-04-02T00:00:00.000Z', tags: tags('Architecture', 'Payload', 'Astro'), sections: [sec('contract', '字段契约', ['每个 collection 的字段设计都与前台组件直接对齐。'], ['列表页读 title/summary/meta', '详情页读 sections', '搜索页读四类内容的聚合摘要']), sec('fetching', '获取策略', ['Web 端通过统一 payload.ts 查询 API，并在 API 不可达时返回空数组。'])] },
    { title: '本地联调指南', slug: 'local-dev-runbook', summary: '描述 DB、CMS、Web 的本地启动顺序、端口约定与常见故障排查方式。', version: 'v0.2', orbit: 'Operations Deck', updatedAt: '2026-04-01T00:00:00.000Z', tags: tags('Runbook', 'Docker'), sections: [sec('startup', '启动顺序', ['推荐使用 scripts/local-dev.sh 统一拉起 PostgreSQL、Payload CMS 与 Astro Web。']), sec('troubleshooting', '常见问题', ['如果 web build 报依赖无法解析，先执行 pnpm install --frozen-lockfile。'])] },
    { title: '搜索体验设计说明', slug: 'search-experience-spec', summary: '梳理搜索页作为一级导航的目标、交互和后续演进方向。', version: 'draft', orbit: 'Discovery Layer', updatedAt: '2026-03-30T00:00:00.000Z', tags: tags('Search', 'UX'), sections: [sec('vision', '设计愿景', ['搜索页要像控制台，而不是一个简陋的输入框。'])] },
  ],
  notes: [
    { title: '今天把本地联调链路彻底打通了', slug: 'local-integration-now-working', summary: '修完依赖同步问题后，本地 DB、CMS 和 Web 已能完整联动，后续只需要补充更多真实内容。', publishedAt: '2026-04-02T00:00:00.000Z', mood: 'Ship Log', tags: tags('Dev Log', 'Integration'), sections: [sec('milestone', '阶段记录', ['最初 web build 失败并不是代码本身出错，而是本地缺了 cal-heatmap。', '同步依赖并启动 Docker 后，前台已经能消费真实数据库数据。'])] },
    { title: '关于内容 schema 的一个判断', slug: 'content-schema-decision-note', summary: 'sections 数组是目前最合适的内容结构，既能喂给详情页，也能在未来扩展 richer blocks。', publishedAt: '2026-04-01T00:00:00.000Z', mood: 'Field Memo', tags: tags('Schema', 'Payload'), sections: [sec('decision', '判断依据', ['当前项目需要的是足够结构化、方便前台渲染且便于未来迁移的中间模型。'])] },
    { title: '搜索页应该是一级导航', slug: 'search-should-be-primary-nav', summary: '如果站点的核心价值是内容沉淀，那么搜索就应该被放在足够显眼的位置，而不是埋起来。', publishedAt: '2026-03-30T00:00:00.000Z', mood: 'Short Note', tags: tags('Search', 'Product Thinking'), sections: [sec('why', '为什么这样做', ['搜索能把离散的文章、项目、笔记重新组织成问题导向的访问入口。'])] },
  ],
}

for (const [collection, docs] of Object.entries(data)) {
  for (const doc of docs) {
    const existing = await payload.find({ collection, where: { slug: { equals: doc.slug } }, limit: 1, pagination: false })
    if (existing.docs[0]) {
      await payload.update({ collection, id: existing.docs[0].id, data: doc, draft: false })
      console.log(`updated ${collection}:${doc.slug}`)
    } else {
      await payload.create({ collection, data: doc, draft: false })
      console.log(`created ${collection}:${doc.slug}`)
    }
  }
}

console.log('seed completed')
