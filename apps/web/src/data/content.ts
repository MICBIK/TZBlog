export type NavItem = {
  label: string
  href: string
  badge?: string
}

export type AboutProfile = {
  name: string
  role: string
  avatar?: string
  summary: string
  techStack: {
    frontend: string[]
    backend: string[]
    devops: string[]
    tools: string[]
  }
}

export type PinnedRepo = {
  owner: string
  repo: string
}

export type SocialLink = {
  label: string
  href: string
  icon: 'github' | 'mail' | 'rss'
}

export type SectionBlock = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export type PostEntry = {
  slug: string
  title: string
  summary: string
  category: string
  orbit: string
  publishedAt: string
  readTime: string
  tags: string[]
  featured?: boolean
  sections: SectionBlock[]
}

export type ProjectEntry = {
  slug: string
  title: string
  summary: string
  stage: string
  orbit: string
  updatedAt: string
  stack: string[]
  tags: string[]
  featured?: boolean
  links: { label: string; href: string }[]
  highlights: string[]
  sections: SectionBlock[]
}

export type DocEntry = {
  slug: string
  title: string
  summary: string
  version: string
  orbit: string
  updatedAt: string
  tags: string[]
  sections: SectionBlock[]
}

export type NoteEntry = {
  slug: string
  title: string
  summary: string
  publishedAt: string
  mood: string
  tags: string[]
  sections: SectionBlock[]
}

export type LabEntry = {
  title: string
  summary: string
  status: string
  href: string
  tag: string
}

export const siteMeta = {
  title: 'TZBlog',
  description: '以深空观测站为视觉母题、以内容检索和长期写作为核心的技术博客系统。',
  location: 'Orbital Observatory / Shanghai',
  currentStatus: 'Phase 2 · Frontend Interface Build',
}

export const navItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/posts' },
  { label: '项目', href: '/projects' },
  { label: '文档', href: '/docs' },
  { label: '实验室', href: '/lab', badge: 'Beta' },
  { label: '关于', href: '/about' },
]

export const socialLinks: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/MICBIK', icon: 'github' },
  { label: 'Email', href: 'mailto:haiden@example.com', icon: 'mail' },
  { label: 'RSS', href: '/rss.xml', icon: 'rss' },
]

export const pinnedRepos: PinnedRepo[] = [
  { owner: 'MICBIK', repo: 'TZBlog' },
  { owner: 'MICBIK', repo: 'HD-Warp' },
  { owner: 'MICBIK', repo: 'TZServeHUB' },
]

export const posts: PostEntry[] = [
  {
    slug: 'observatory-layout-system',
    title: '把博客首页改造成可长期维护的观测站布局系统',
    summary: '从单页宇宙秀场切回内容分发首页,核心是把世界观压缩进清晰的信息架构。',
    category: 'Architecture Notes',
    orbit: 'Deep Space Observatory',
    publishedAt: '2026-03-29',
    readTime: '8 min',
    featured: true,
    tags: ['Astro', 'IA', 'Layout'],
    sections: [
      {
        id: 'problem',
        title: '为什么先改布局系统',
        paragraphs: [
          '如果首页只是视觉首屏,那么内容增长之后一切都会重新崩掉。布局系统先稳定,Hero 才不会变成一次性效果图。',
          'TZBlog 的目标不是"看起来像宇宙",而是让宇宙主题变成识别度,再让文章、项目和文档都能顺利进站。',
        ],
      },
      {
        id: 'principles',
        title: '这套布局遵守的原则',
        paragraphs: ['首页必须兼顾身份表达、内容入口和更新流。'],
        bullets: ['首屏给出身份、状态与主 CTA', '中段承担最新内容和主入口分发', '底部保留更新轨迹与站点说明'],
      },
      {
        id: 'result',
        title: '现在得到的结果',
        paragraphs: [
          '首页被拆成 Hero、Focus Stream、Mission Panels、Selected Works、Timeline、Footer Dock 六段,后续接 Payload 只需要替换数据源。',
        ],
      },
    ],
  },
  {
    slug: 'payload-to-astro-contract',
    title: '先写内容契约,再接 Payload 到 Astro 的数据流',
    summary: '前后台分层不是各写各的,真正稳定的是字段契约和页面职责的分界线。',
    category: 'Content Pipeline',
    orbit: 'Signal Relay',
    publishedAt: '2026-03-27',
    readTime: '6 min',
    tags: ['Payload', 'Contract', 'CMS'],
    sections: [
      {
        id: 'contract',
        title: '为什么先写契约',
        paragraphs: [
          '前台如果直接绑死硬编码内容,后面一接 CMS 就会开始大面积返工。',
          '所以这轮虽然还没接 Payload API,但页面字段、元信息和区块结构已经先按真实内容系统设计好了。',
        ],
      },
      {
        id: 'scope',
        title: '契约覆盖范围',
        paragraphs: ['契约最少覆盖标题、摘要、标签、状态、时间、关联入口和 SEO 元信息。'],
      },
    ],
  },
  {
    slug: 'motion-should-serve-reading',
    title: '所有动效都必须给阅读让路',
    summary: '轻量页面过渡、卡片抬升、导航航迹线,这些都可以有,但不能抢正文。',
    category: 'Design System',
    orbit: 'UI Motion',
    publishedAt: '2026-03-24',
    readTime: '5 min',
    tags: ['Motion', 'UX', 'Design'],
    sections: [
      {
        id: 'baseline',
        title: '动效边界',
        paragraphs: [
          'TZBlog 的动态应该集中在导航反馈、状态感知和首页氛围层,不该出现在每一屏滚动里。',
        ],
        bullets: ['页面切换 140ms - 220ms', '移动端明显降低动效密度', '支持 reduced-motion'],
      },
    ],
  },
]

export const projects: ProjectEntry[] = [
  {
    slug: 'tzblog',
    title: 'TZBlog',
    summary: '一套内容优先、观测站气质、前后端分层的个人博客系统。',
    stage: 'In Progress',
    orbit: 'Main Station',
    updatedAt: '2026-03-29',
    featured: true,
    stack: ['Astro', 'Payload CMS', 'PostgreSQL', 'Pagefind', 'Umami'],
    tags: ['Blog', 'Monorepo', 'Design System'],
    links: [
      { label: '仓库', href: 'https://github.com/MICBIK/TZBlog' },
      { label: 'CMS Admin', href: 'http://localhost:3000/admin' },
    ],
    highlights: ['内容优先的首页结构', '多内容模型路由', '未来接 Payload 的前端契约已经预留'],
    sections: [
      {
        id: 'overview',
        title: '项目概述',
        paragraphs: [
          'TZBlog 是从单页宇宙展示方案重构出来的长期写作平台。它不是要把视觉效果堆满,而是要把内容发布、项目归档、文档沉淀和实验入口统一起来。',
        ],
      },
      {
        id: 'architecture',
        title: '架构策略',
        paragraphs: ['前台由 Astro 负责表现层,Payload 负责后台和内容模型,PostgreSQL 承担主数据。'],
        bullets: ['Monorepo 管理 web / cms / infra', 'Pagefind 负责搜索', 'Umami 负责统计'],
      },
      {
        id: 'milestones',
        title: '当前里程碑',
        paragraphs: ['已经完成工程骨架与前台界面系统落地,下一步是接入真实内容模型与 API 数据链路。'],
      },
    ],
  },
  {
    slug: 'payload-content-bridge',
    title: 'Payload Content Bridge',
    summary: '为 Astro 前台准备的内容交付桥,目标是让所有列表页和详情页都只替换数据源。',
    stage: 'Planned',
    orbit: 'Relay Channel',
    updatedAt: '2026-03-30',
    stack: ['Payload', 'REST/GraphQL', 'TypeScript'],
    tags: ['CMS', 'API', 'Contract'],
    links: [{ label: '设计说明', href: '/docs/content-delivery-blueprint' }],
    highlights: ['统一文章/项目/文档字段', '为静态构建与 webhook 留钩子'],
    sections: [
      {
        id: 'goal',
        title: '目标',
        paragraphs: ['把前台示例数据替换成真实 Payload 输出,但不推翻页面结构。'],
      },
      {
        id: 'delivery',
        title: '交付方式',
        paragraphs: ['优先从 homepage、posts、docs 三条链路开始,再扩展到 projects 与 notes。'],
      },
    ],
  },
  {
    slug: 'observatory-motion-kit',
    title: 'Observatory Motion Kit',
    summary: '一组克制的卡片反馈、标题显现与轨道线状态过渡,不破坏阅读体验。',
    stage: 'Concept',
    orbit: 'Visual Layer',
    updatedAt: '2026-04-02',
    stack: ['CSS', 'Progressive Enhancement'],
    tags: ['Motion', 'UI'],
    links: [{ label: '实验室', href: '/lab' }],
    highlights: ['可降级', '支持 reduced-motion', '不强依赖 JS'],
    sections: [
      {
        id: 'scope',
        title: '边界',
        paragraphs: ['这组动效只服务导航、状态和 Hero 氛围,不干预正文阅读。'],
      },
    ],
  },
]

export const docsCollection: DocEntry[] = [
  {
    slug: 'content-delivery-blueprint',
    title: '内容交付蓝图',
    summary: '描述 Astro 前台如何逐步切换到 Payload 真实数据源,并保持页面结构稳定。',
    version: 'v0.2',
    orbit: 'Delivery Blueprint',
    updatedAt: '2026-03-29',
    tags: ['Docs', 'Pipeline', 'Frontend'],
    sections: [
      {
        id: 'layers',
        title: '四层结构',
        paragraphs: [
          '推荐维持 config、layout、feature、content 四层结构,让页面模板与内容来源彼此解耦。',
        ],
        bullets: ['config 管导航和站点信息', 'layout 管框架与栅格', 'feature 管搜索、目录、卡片系统', 'content 管真实内容契约'],
      },
      {
        id: 'migration',
        title: '迁移策略',
        paragraphs: ['先替换首页、文章列表、文章详情;等契约稳定后再推进项目与文档页。'],
      },
    ],
  },
  {
    slug: 'observatory-visual-language',
    title: '观测站视觉语言说明',
    summary: '统一背景层、轨道线、卡片边框、强调色和字体节奏,让整个站点看起来像一套系统。',
    version: 'v0.1',
    orbit: 'Visual Manual',
    updatedAt: '2026-03-28',
    tags: ['Design', 'Token', 'UI'],
    sections: [
      {
        id: 'tokens',
        title: '视觉 token',
        paragraphs: ['主背景、面板色、强调色、弱边框和文本层级全部固定为深空观测站风格。'],
      },
      {
        id: 'usage',
        title: '使用约束',
        paragraphs: ['重点内容通过亮边、航迹线和标签高亮表达,不使用大量强噪点粒子。'],
      },
    ],
  },
  {
    slug: 'pagefind-integration-plan',
    title: 'Pagefind 接入计划',
    summary: '搜索作为一级入口存在,后续通过构建后的索引替换当前演示检索界面。',
    version: 'draft',
    orbit: 'Search Relay',
    updatedAt: '2026-03-30',
    tags: ['Search', 'Pagefind'],
    sections: [
      {
        id: 'goal',
        title: '目标',
        paragraphs: ['让搜索从隐藏功能变成主入口,并支持跨文章、项目、文档、笔记的统一检索。'],
      },
    ],
  },
]

export const notes: NoteEntry[] = [
  {
    slug: 'ui-shell-audit-log',
    title: '前台界面壳层审计记录',
    summary: '记录本轮前台界面从占位页升级为完整页面系统时的检查项与修复动作。',
    publishedAt: '2026-03-29',
    mood: 'Ship Log',
    tags: ['Audit', 'Frontend'],
    sections: [
      {
        id: 'checks',
        title: '这轮重点看什么',
        paragraphs: ['主要审路由完整性、布局层级、移动端栅格折叠、按钮语义以及页面元信息。'],
      },
    ],
  },
  {
    slug: 'why-search-is-primary-nav',
    title: '为什么搜索必须是一级导航',
    summary: '对长期内容站来说,搜索不是附属品,而是检索效率的中心入口。',
    publishedAt: '2026-03-28',
    mood: 'Short Note',
    tags: ['Search', 'IA'],
    sections: [
      {
        id: 'point',
        title: '理由',
        paragraphs: ['文章、项目、文档并存的时候,单靠一级导航并不能解决直达问题,搜索应该被抬到台前。'],
      },
    ],
  },
  {
    slug: 'hero-is-identity-not-business',
    title: 'Hero 负责身份,不负责主业务',
    summary: 'Hero 可以强,但不该掩盖内容分发层。首页真正的业务是把人送到正确的内容轨道里。',
    publishedAt: '2026-03-26',
    mood: 'Field Memo',
    tags: ['Hero', 'Homepage'],
    sections: [
      {
        id: 'summary',
        title: '结论',
        paragraphs: ['主行星是气质符号,内容面板才是首页主任务。'],
      },
    ],
  },
]

export const labExperiments: LabEntry[] = [
  {
    title: 'Orbit Hover Prototype',
    summary: '验证 mission panel hover 时的扫描动画与可访问性边界。',
    status: 'Ready for Review',
    href: '/projects/observatory-motion-kit',
    tag: 'UI Motion',
  },
  {
    title: 'Search Relay Mock',
    summary: '在接 Pagefind 前先提供可用的站内检索壳层与关键词推荐。',
    status: 'Running',
    href: '/search',
    tag: 'Search',
  },
  {
    title: 'Content Contract Dry Run',
    summary: '用示例数据模拟 Payload 输出,验证列表页与详情页的字段稳定性。',
    status: 'Stable',
    href: '/docs/content-delivery-blueprint',
    tag: 'Content Model',
  },
]

export const timeline = [
  {
    date: '2026-03-29',
    title: '完成前台完整界面系统',
    summary: '首页、列表页、详情页、搜索、关于、实验室全部落地为可浏览界面。',
  },
  {
    date: '2026-03-28',
    title: '引入 OpenSpec 作为默认治理流程',
    summary: '正式变更需要 proposal、tasks、validate 和 archive。',
  },
  {
    date: '2026-03-28',
    title: '搭起 monorepo 与 Astro / Payload 基础骨架',
    summary: '仓库从纯文档阶段进入可运行开发阶段。',
  },
]

export const aboutProfile: AboutProfile = {
  name: 'Haiden',
  role: '开发者 / 技术写作者',
  avatar: 'https://github.com/MICBIK.png',
  summary: '以深空观测站为视觉母题，构建内容优先的技术博客系统。专注于工程实践、界面信息架构和长期写作。',
  techStack: {
    frontend: ['Astro', 'TypeScript', 'Vue', 'TailwindCSS'],
    backend: ['Node.js', 'Payload CMS', 'PostgreSQL'],
    devops: ['Docker', 'GitHub Actions', 'Cloudflare R2'],
    tools: ['VS Code', 'Figma', 'Linear'],
  },
}

export const collectionStats = {
  posts: posts.length,
  projects: projects.length,
  docs: docsCollection.length,
  notes: notes.length,
}

export const searchIndex = [
  ...posts.map((item) => ({ type: '文章', title: item.title, summary: item.summary, href: `/posts/${item.slug}`, meta: `${item.publishedAt} · ${item.readTime}` })),
  ...projects.map((item) => ({ type: '项目', title: item.title, summary: item.summary, href: `/projects/${item.slug}`, meta: `${item.stage} · ${item.updatedAt}` })),
  ...docsCollection.map((item) => ({ type: '文档', title: item.title, summary: item.summary, href: `/docs/${item.slug}`, meta: `${item.version} · ${item.updatedAt}` })),
  ...notes.map((item) => ({ type: '笔记', title: item.title, summary: item.summary, href: `/notes/${item.slug}`, meta: `${item.mood} · ${item.publishedAt}` })),
]

export const mainContentNavItems = navItems.filter(
  (item) => ['/posts', '/projects', '/docs', '/notes'].includes(item.href),
)

export const footerNavItems = navItems.filter(
  (item) => item.href !== '/' && item.href !== '/search',
)
