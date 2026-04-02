import type { DocEntry, NoteEntry, PostEntry, ProjectEntry, SectionBlock } from '../data/content'

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

const flattenArray = (arr: PayloadTextItem[] | undefined, key: string): string[] =>
  (arr || []).map((item) => item[key]).filter((item): item is string => Boolean(item))

const flattenSections = (sections: PayloadSection[] | undefined): SectionBlock[] =>
  (sections || []).map((section) => ({
    id: section.id,
    title: section.title,
    paragraphs: flattenArray(section.paragraphs, 'text'),
    bullets: section.bullets && section.bullets.length > 0 ? flattenArray(section.bullets, 'text') : undefined,
  }))

const normalizePost = (doc: PayloadPostDoc): PostEntry => ({
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

const normalizeProject = (doc: PayloadProjectDoc): ProjectEntry => ({
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

const normalizeDoc = (doc: PayloadDocDoc): DocEntry => ({
  slug: doc.slug,
  title: doc.title,
  summary: doc.summary,
  version: doc.version,
  orbit: doc.orbit,
  updatedAt: doc.updatedAt?.split('T')[0] ?? '',
  tags: flattenArray(doc.tags, 'tag'),
  sections: flattenSections(doc.sections),
})

const normalizeNote = (doc: PayloadNoteDoc): NoteEntry => ({
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
