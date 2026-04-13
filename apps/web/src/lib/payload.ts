import type { AboutProfile, DocEntry, LabEntry, NoteEntry, PinnedRepo, PostEntry, ProjectEntry, SectionBlock, SocialLink } from '../data/content'
import { aboutProfile as aboutProfileFallback, labExperiments as labExperimentsFallback, pinnedRepos as pinnedReposFallback, siteMeta as siteMetaFallback, socialLinks as socialLinksFallback, timeline as timelineFallback } from '../data/content'

const API_URL = import.meta.env.PAYLOAD_API_URL || 'http://localhost:3000/api'

type PayloadListResponse<T = Record<string, unknown>> = {
  docs: T[]
}

type TagItem = { tag: string }
type TextItem = { text: string }
type StackItem = { item: string }

type PayloadSection = {
  id: string
  title: string
  paragraphs?: TextItem[]
  bullets?: TextItem[]
}

interface PayloadPostDoc {
  slug: string
  title: string
  summary: string
  category: string
  orbit: string
  publishedAt: string
  readTime: string
  featured?: boolean
  tags?: TagItem[]
  sections?: PayloadSection[]
}

interface PayloadProjectDoc {
  slug: string
  title: string
  summary: string
  stage: string
  orbit: string
  updatedAt: string
  featured?: boolean
  stack?: StackItem[]
  tags?: TagItem[]
  links?: Array<{ label: string; href: string }>
  highlights?: TextItem[]
  sections?: PayloadSection[]
}

interface PayloadDocDoc {
  slug: string
  title: string
  summary: string
  version: string
  orbit: string
  updatedAt: string
  tags?: TagItem[]
  sections?: PayloadSection[]
}

interface PayloadNoteDoc {
  slug: string
  title: string
  summary: string
  publishedAt: string
  mood: string
  tags?: TagItem[]
  sections?: PayloadSection[]
}

interface PayloadSiteProfileDoc {
  name?: string
  role?: string
  avatar?: string
  summary?: string
  siteMeta?: {
    title?: string
    description?: string
    location?: string
  }
  socialLinks?: Array<{ label: string; href: string; icon: 'github' | 'mail' | 'rss' }>
  pinnedRepos?: Array<{ owner: string; repo: string }>
  techStack?: {
    frontend?: StackItem[]
    backend?: StackItem[]
    devops?: StackItem[]
    tools?: StackItem[]
  }
  timeline?: Array<{ date: string; title: string; summary: string }>
}

interface PayloadLabExperimentDoc {
  title: string
  summary: string
  status: string
  href: string
  tag: string
}

async function fetchPayload<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`)

    if (!res.ok) {
      throw new Error(`Payload API error: ${res.status} ${path}`)
    }

    return await res.json() as T
  } catch (error) {
    console.warn(`[payload] API unavailable: ${path}`, error)
    return { docs: [] } as T
  }
}

export const flattenArray = (arr: Record<string, string | undefined>[] | undefined, key: string): string[] =>
  (arr || []).map((item) => item[key]).filter((item): item is string => Boolean(item))

export const flattenSections = (sections: PayloadSection[] | undefined): SectionBlock[] =>
  (sections || []).map((section) => ({
    id: section.id,
    title: section.title,
    paragraphs: flattenArray(section.paragraphs, 'text'),
    bullets: section.bullets && section.bullets.length > 0 ? flattenArray(section.bullets, 'text') : undefined,
  }))

export const normalizePost = (doc: PayloadPostDoc): PostEntry => ({
  slug: doc.slug,
  title: doc.title,
  summary: doc.summary,
  category: doc.category,
  orbit: doc.orbit,
  publishedAt: doc.publishedAt?.split('T')[0] ?? '',
  readTime: doc.readTime,
  featured: doc.featured ?? false,
  tags: flattenArray(doc.tags, 'tag'),
  sections: flattenSections(doc.sections),
})

export const normalizeProject = (doc: PayloadProjectDoc): ProjectEntry => ({
  slug: doc.slug,
  title: doc.title,
  summary: doc.summary,
  stage: doc.stage,
  orbit: doc.orbit,
  updatedAt: doc.updatedAt?.split('T')[0] ?? '',
  stack: flattenArray(doc.stack, 'item'),
  tags: flattenArray(doc.tags, 'tag'),
  featured: doc.featured ?? false,
  links: (doc.links || []).map((link) => ({
    label: link.label,
    href: link.href,
  })),
  highlights: flattenArray(doc.highlights, 'text'),
  sections: flattenSections(doc.sections),
})

export const normalizeDoc = (doc: PayloadDocDoc): DocEntry => ({
  slug: doc.slug,
  title: doc.title,
  summary: doc.summary,
  version: doc.version,
  orbit: doc.orbit,
  updatedAt: doc.updatedAt?.split('T')[0] ?? '',
  tags: flattenArray(doc.tags, 'tag'),
  sections: flattenSections(doc.sections),
})

export const normalizeNote = (doc: PayloadNoteDoc): NoteEntry => ({
  slug: doc.slug,
  title: doc.title,
  summary: doc.summary,
  publishedAt: doc.publishedAt?.split('T')[0] ?? '',
  mood: doc.mood,
  tags: flattenArray(doc.tags, 'tag'),
  sections: flattenSections(doc.sections),
})

export async function getPosts(): Promise<PostEntry[]> {
  const data = await fetchPayload<PayloadListResponse<PayloadPostDoc>>('/posts?limit=100&sort=-publishedAt&where[_status][equals]=published')
  return data.docs.map(normalizePost)
}

export async function getProjects(): Promise<ProjectEntry[]> {
  const data = await fetchPayload<PayloadListResponse<PayloadProjectDoc>>('/projects?limit=100&sort=-updatedAt&where[_status][equals]=published')
  return data.docs.map(normalizeProject)
}

export async function getDocs(): Promise<DocEntry[]> {
  const data = await fetchPayload<PayloadListResponse<PayloadDocDoc>>('/docs?limit=100&sort=-updatedAt&where[_status][equals]=published')
  return data.docs.map(normalizeDoc)
}

export async function getNotes(): Promise<NoteEntry[]> {
  const data = await fetchPayload<PayloadListResponse<PayloadNoteDoc>>('/notes?limit=100&sort=-publishedAt&where[_status][equals]=published')
  return data.docs.map(normalizeNote)
}

export async function getSiteProfile(): Promise<AboutProfile> {
  try {
    const data = await fetchPayload<PayloadSiteProfileDoc>('/globals/site-profile')
    if (!data.name) return aboutProfileFallback
    return {
      name: data.name,
      role: data.role || aboutProfileFallback.role,
      avatar: data.avatar || aboutProfileFallback.avatar,
      summary: data.summary || aboutProfileFallback.summary,
      techStack: {
        frontend: flattenArray(data.techStack?.frontend, 'item'),
        backend: flattenArray(data.techStack?.backend, 'item'),
        devops: flattenArray(data.techStack?.devops, 'item'),
        tools: flattenArray(data.techStack?.tools, 'item'),
      },
    }
  } catch {
    return aboutProfileFallback
  }
}

export async function getTimeline(): Promise<Array<{ date: string; title: string; summary: string }>> {
  try {
    const data = await fetchPayload<PayloadSiteProfileDoc>('/globals/site-profile')
    const items = data.timeline
    if (!Array.isArray(items) || items.length === 0) return timelineFallback
    return items.map((item) => ({
      date: item.date,
      title: item.title,
      summary: item.summary,
    }))
  } catch {
    return timelineFallback
  }
}

export type TagInfo = {
  name: string
  count: number
}

export type TaggedContent = {
  posts: PostEntry[]
  projects: ProjectEntry[]
  docs: DocEntry[]
  notes: NoteEntry[]
}

export async function getAllTags(): Promise<TagInfo[]> {
  const [posts, projects, docs, notes] = await Promise.all([
    getPosts(), getProjects(), getDocs(), getNotes(),
  ])

  const tagCounts = new Map<string, number>()
  ;[
    ...posts.flatMap((p) => p.tags || []),
    ...projects.flatMap((p) => p.tags || []),
    ...docs.flatMap((d) => d.tags || []),
    ...notes.flatMap((n) => n.tags || []),
  ]
    .filter((t) => t.trim())
    .forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1))

  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
}

export async function getContentByTag(tag: string): Promise<TaggedContent> {
  const [posts, projects, docs, notes] = await Promise.all([
    getPosts(), getProjects(), getDocs(), getNotes(),
  ])

  return {
    posts: posts.filter((p) => (p.tags || []).includes(tag)),
    projects: projects.filter((p) => (p.tags || []).includes(tag)),
    docs: docs.filter((d) => (d.tags || []).includes(tag)),
    notes: notes.filter((n) => (n.tags || []).includes(tag)),
  }
}

export async function getLabExperiments(): Promise<LabEntry[]> {
  const data = await fetchPayload<PayloadListResponse<PayloadLabExperimentDoc>>('/lab-experiments?limit=100')
  if (data.docs.length === 0) return labExperimentsFallback
  return data.docs.map((doc) => ({
    title: doc.title,
    summary: doc.summary,
    status: doc.status,
    href: doc.href,
    tag: doc.tag,
  }))
}

export type SiteSettings = {
  siteMeta: { title: string; description: string; location: string }
  aboutProfile: AboutProfile
  socialLinks: SocialLink[]
  pinnedRepos: PinnedRepo[]
  timeline: Array<{ date: string; title: string; summary: string }>
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const data = await fetchPayload<PayloadSiteProfileDoc>('/globals/site-profile')

    const siteMeta = {
      title: data.siteMeta?.title || siteMetaFallback.title,
      description: data.siteMeta?.description || siteMetaFallback.description,
      location: data.siteMeta?.location || siteMetaFallback.location,
    }

    const aboutProfile: AboutProfile = data.name
      ? {
          name: data.name,
          role: data.role || aboutProfileFallback.role,
          avatar: data.avatar || aboutProfileFallback.avatar,
          summary: data.summary || aboutProfileFallback.summary,
          techStack: {
            frontend: flattenArray(data.techStack?.frontend, 'item'),
            backend: flattenArray(data.techStack?.backend, 'item'),
            devops: flattenArray(data.techStack?.devops, 'item'),
            tools: flattenArray(data.techStack?.tools, 'item'),
          },
        }
      : aboutProfileFallback

    const socialLinks: SocialLink[] =
      data.socialLinks && data.socialLinks.length > 0
        ? data.socialLinks.map((link) => ({ label: link.label, href: link.href, icon: link.icon }))
        : socialLinksFallback

    const pinnedRepos: PinnedRepo[] =
      data.pinnedRepos && data.pinnedRepos.length > 0
        ? data.pinnedRepos.map((r) => ({ owner: r.owner, repo: r.repo }))
        : pinnedReposFallback

    const timeline =
      Array.isArray(data.timeline) && data.timeline.length > 0
        ? data.timeline.map((item) => ({ date: item.date, title: item.title, summary: item.summary }))
        : timelineFallback

    return { siteMeta, aboutProfile, socialLinks, pinnedRepos, timeline }
  } catch {
    return {
      siteMeta: siteMetaFallback,
      aboutProfile: aboutProfileFallback,
      socialLinks: socialLinksFallback,
      pinnedRepos: pinnedReposFallback,
      timeline: timelineFallback,
    }
  }
}
