import { describe, expect, it } from 'vitest'
import {
  flattenArray,
  flattenSections,
  normalizePost,
  normalizeProject,
  normalizeDoc,
  normalizeNote,
} from '../../src/lib/payload'

describe('flattenArray', () => {
  it('extracts values by key', () => {
    const input = [{ tag: 'Astro' }, { tag: 'Payload' }]
    expect(flattenArray(input, 'tag')).toEqual(['Astro', 'Payload'])
  })

  it('returns empty array for undefined input', () => {
    expect(flattenArray(undefined, 'tag')).toEqual([])
  })

  it('filters out undefined/missing keys', () => {
    const input = [{ tag: 'Astro' }, { other: 'value' }]
    expect(flattenArray(input, 'tag')).toEqual(['Astro'])
  })
})

describe('flattenSections', () => {
  it('transforms sections with paragraphs and bullets', () => {
    const input = [{
      id: 'intro',
      title: 'Introduction',
      paragraphs: [{ text: 'Hello' }, { text: 'World' }],
      bullets: [{ text: 'Point 1' }],
    }]
    const result = flattenSections(input)
    expect(result).toEqual([{
      id: 'intro',
      title: 'Introduction',
      paragraphs: ['Hello', 'World'],
      bullets: ['Point 1'],
    }])
  })

  it('returns undefined bullets when empty', () => {
    const input = [{ id: 'a', title: 'A', paragraphs: [{ text: 'p' }], bullets: [] }]
    expect(flattenSections(input)[0].bullets).toBeUndefined()
  })

  it('returns empty array for undefined input', () => {
    expect(flattenSections(undefined)).toEqual([])
  })
})

describe('normalizePost', () => {
  it('normalizes a full post document', () => {
    const doc = {
      slug: 'test-post',
      title: 'Test',
      summary: 'A test post',
      category: 'Engineering',
      orbit: 'Test Orbit',
      publishedAt: '2026-04-01T00:00:00.000Z',
      readTime: '5 min',
      featured: true,
      tags: [{ tag: 'Astro' }],
      sections: [{ id: 's1', title: 'S1', paragraphs: [{ text: 'p1' }] }],
    }
    const result = normalizePost(doc)
    expect(result.slug).toBe('test-post')
    expect(result.publishedAt).toBe('2026-04-01')
    expect(result.featured).toBe(true)
    expect(result.tags).toEqual(['Astro'])
    expect(result.sections[0].paragraphs).toEqual(['p1'])
  })

  it('defaults featured to false', () => {
    const doc = {
      slug: 's', title: 't', summary: 's', category: 'c', orbit: 'o',
      publishedAt: '2026-01-01T00:00:00.000Z', readTime: '1 min',
    }
    expect(normalizePost(doc).featured).toBe(false)
  })
})

describe('normalizeProject', () => {
  it('maps links, stack, and highlights', () => {
    const doc = {
      slug: 'proj', title: 'P', summary: 's', stage: 'In Progress', orbit: 'o',
      updatedAt: '2026-04-01T12:00:00.000Z',
      stack: [{ item: 'Astro' }, { item: 'TS' }],
      tags: [{ tag: 'CMS' }],
      links: [{ label: 'Repo', href: 'https://github.com' }],
      highlights: [{ text: 'Fast' }],
      sections: [],
    }
    const result = normalizeProject(doc)
    expect(result.stack).toEqual(['Astro', 'TS'])
    expect(result.links).toEqual([{ label: 'Repo', href: 'https://github.com' }])
    expect(result.highlights).toEqual(['Fast'])
    expect(result.updatedAt).toBe('2026-04-01')
  })
})

describe('normalizeDoc', () => {
  it('maps version and orbit', () => {
    const doc = {
      slug: 'doc', title: 'D', summary: 's', version: 'v1.0', orbit: 'Docs',
      updatedAt: '2026-03-30T00:00:00.000Z', tags: [], sections: [],
    }
    const result = normalizeDoc(doc)
    expect(result.version).toBe('v1.0')
    expect(result.updatedAt).toBe('2026-03-30')
  })
})

describe('normalizeNote', () => {
  it('maps mood field', () => {
    const doc = {
      slug: 'note', title: 'N', summary: 's',
      publishedAt: '2026-04-02T00:00:00.000Z', mood: 'Ship Log',
      tags: [{ tag: 'Log' }], sections: [],
    }
    const result = normalizeNote(doc)
    expect(result.mood).toBe('Ship Log')
    expect(result.tags).toEqual(['Log'])
  })
})
