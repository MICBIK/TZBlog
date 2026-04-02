import type { AboutProfile, DocEntry, LabEntry, NoteEntry, PostEntry, ProjectEntry, SectionBlock } from '../data/content'
import { aboutProfile as aboutProfileFallback, labExperiments as labExperimentsFallback, timeline as timelineFallback } from '../data/content'

const API_URL = import.meta.env.PAYLOAD_API_URL || `${import.meta.env.PAYLOAD_PUBLIC_URL || 'http://localhost:3000'}/api`

type PayloadListResponse<T = Record<string, unknown>> = {
  docs: T[]
}

type PayloadTextItem = {
  [key: string]: string | undefined
}

type PayloadSection = {
  id: string
  title: string
  paragraphs?: PayloadTextItem[]
  bullets?: PayloadTextItem[]
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
  tags?: PayloadTextItem[]
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
  stack?: PayloadTextItem[]
  tags?: PayloadTextItem[]
  links?: Array<{ label: string; href: string }>
  highlights?: PayloadTextItem[]
  sections?: PayloadSection[]
}

interface PayloadDocDoc {
  slug: string
  title: string
  summary: string
  version: string
  orbit: string
  updatedAt: string
  tags?: PayloadTextItem[]
  sections?: PayloadSection[]
}

interface PayloadNoteDoc {
  slug: string
  title: string
  summary: string
  publishedAt: string
  mood: string
  tags?: PayloadTextItem[]
  sections?: PayloadSection[]
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

export const flattenArray = (arr: PayloadTextItem[] | undefined, key: string): string[] =>
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

export async function getPostBySlug(slug: string): Promise<PostEntry | null> {
  const data = await fetchPayload<PayloadListResponse<PayloadPostDoc>>(`/posts?where[slug][equals]=${encodeURIComponent(slug)}&where[_status][equals]=published`)
  return data.docs[0] ? normalizePost(data.docs[0]) : null
}

export async function getProjects(): Promise<ProjectEntry[]> {
  const data = await fetchPayload<PayloadListResponse<PayloadProjectDoc>>('/projects?limit=100&sort=-updatedAt&where[_status][equals]=published')
  return data.docs.map(normalizeProject)
}

export async function getProjectBySlug(slug: string): Promise<ProjectEntry | null> {
  const data = await fetchPayload<PayloadListResponse<PayloadProjectDoc>>(`/projects?where[slug][equals]=${encodeURIComponent(slug)}&where[_status][equals]=published`)
  return data.docs[0] ? normalizeProject(data.docs[0]) : null
}

export async function getDocs(): Promise<DocEntry[]> {
  const data = await fetchPayload<PayloadListResponse<PayloadDocDoc>>('/docs?limit=100&sort=-updatedAt&where[_status][equals]=published')
  return data.docs.map(normalizeDoc)
}

export async function getDocBySlug(slug: string): Promise<DocEntry | null> {
  const data = await fetchPayload<PayloadListResponse<PayloadDocDoc>>(`/docs?where[slug][equals]=${encodeURIComponent(slug)}&where[_status][equals]=published`)
  return data.docs[0] ? normalizeDoc(data.docs[0]) : null
}

export async function getNotes(): Promise<NoteEntry[]> {
  const data = await fetchPayload<PayloadListResponse<PayloadNoteDoc>>('/notes?limit=100&sort=-publishedAt&where[_status][equals]=published')
  return data.docs.map(normalizeNote)
}

export async function getNoteBySlug(slug: string): Promise<NoteEntry | null> {
  const data = await fetchPayload<PayloadListResponse<PayloadNoteDoc>>(`/notes?where[slug][equals]=${encodeURIComponent(slug)}&where[_status][equals]=published`)
  return data.docs[0] ? normalizeNote(data.docs[0]) : null
}

export async function getSiteProfile(): Promise<AboutProfile> {
  try {
    const data = await fetchPayload<Record<string, any>>('/globals/site-profile')
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
    const data = await fetchPayload<Record<string, any>>('/globals/site-profile')
    const items = data.timeline
    if (!Array.isArray(items) || items.length === 0) return timelineFallback
    return items.map((item: Record<string, string>) => ({
      date: item.date,
      title: item.title,
      summary: item.summary,
    }))
  } catch {
    return timelineFallback
  }
}

export async function getLabExperiments(): Promise<LabEntry[]> {
  const data = await fetchPayload<PayloadListResponse<Record<string, any>>>('/lab-experiments?limit=100')
  if (data.docs.length === 0) return labExperimentsFallback
  return data.docs.map((doc) => ({
    title: doc.title,
    summary: doc.summary,
    status: doc.status,
    href: doc.href,
    tag: doc.tag,
  }))
}
