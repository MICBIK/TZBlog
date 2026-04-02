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
  currentStatus: 'Phase 3 · CMS Content Integration',
}

export const navItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/posts' },
  { label: '项目', href: '/projects' },
  { label: '文档', href: '/docs' },
  { label: '笔记', href: '/notes' },
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

export const footerNavItems = navItems.filter(
  (item) => item.href !== '/' && item.href !== '/search',
)
