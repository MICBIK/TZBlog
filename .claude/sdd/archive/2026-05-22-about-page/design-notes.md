# design-notes — about-page

## ASCII mockup

```
─────────────────────────────────────────
                                          
  ABOUT                                   
  ──                                      
                                          
  Building things people read.            ← AboutHero serif h1
                                          
  I'm ha1den. I ship full-stack            ← lead (--text-lead serif)
  software and write about what            
  I learn along the way.                   
                                          
─────────────────────────────────────────
                                          
  NOW                                     
  ──                                      
                                          
  Now                                     ← serif h2
                                          
  As of May 2026.                          ← intro
                                          
  Shipping     TZBlog from scratch        ← <dl>
  Reading      "Designing Data-Intensive..." 
  Building     A small CLI for ...        
                                          
─────────────────────────────────────────
                                          
  STORY                                   
  ──                                      
                                          
  Story                                   
                                          
  Placeholder: I started building          ← paragraphs
  things on the web in ...                 
                                          
  These days I focus on ...                
                                          
─────────────────────────────────────────
                                          
  CONTACT                                 
  ──                                      
                                          
  Contact                                 
                                          
  hello@example.com                       ← mailto link
                                          
  GitHub   ↗                              ← external links
  X        ↗                              
  RSS      ↗                              
                                          
─────────────────────────────────────────
```

## Content placeholder（ha1den 替换前）

```ts
// TODO[pre-launch]: replace placeholder strings before deploy
// sections: hero.headline, hero.lead, now.items, story.paragraphs, contact.email/links

export const aboutContent = {
  hero: {
    headline: "Building things people read.",
    lead: "Placeholder: I'm ha1den. I ship full-stack software and write about what I learn along the way.",
  },
  now: {
    intro: "Placeholder: As of May 2026.",
    items: [
      { label: "Shipping", detail: "TZBlog from scratch (Next.js 15 + Prisma + MinIO)." },
      { label: "Reading", detail: "Designing Data-Intensive Applications (re-read)." },
      { label: "Building", detail: "Small CLI experiments." },
    ],
  },
  story: {
    paragraphs: [
      "Placeholder: I started building things on the web in [year]. The first deploy taught me [lesson].",
      "Placeholder: These days I focus on shipping small, well-made things and writing them up here.",
    ],
  },
  contact: {
    email: "hello@example.com",
    links: [
      { label: "GitHub", href: "https://github.com/ha1den", kind: "github" as const },
      { label: "X", href: "https://x.com/ha1den", kind: "x" as const },
      { label: "RSS", href: "/rss.xml", kind: "rss" as const },
    ],
  },
} as const
```

## Section skeleton 共用 pattern

```tsx
function SectionHeader({ label, heading }: { label: string; heading: string }) {
  return (
    <header className="space-y-3">
      <p className="font-mono uppercase text-[var(--text-label)] tracking-[var(--tracking-label)] text-muted-fg">
        {label}
      </p>
      <div className="h-px w-12 border-t border-border" aria-hidden="true" />
      <h2 className="font-serif text-[var(--text-h2)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg">
        {heading}
      </h2>
    </header>
  )
}
```

（虽 R7 决策"不抽 AboutSection"，但可在单 section 内重用一个 `SectionHeader` 私有组件，3 个 h2 段共享）

## AboutHero skeleton

```tsx
export function AboutHero({ headline, lead }: { headline: string; lead: string }) {
  return (
    <section aria-labelledby="about-hero-heading" className="space-y-6">
      <header className="space-y-3">
        <p className="font-mono uppercase text-[var(--text-label)] tracking-[var(--tracking-label)] text-muted-fg">
          About
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
      </header>
      <h1
        id="about-hero-heading"
        className="font-serif text-[var(--text-h1)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg"
      >
        {headline}
      </h1>
      <p className="font-serif text-[var(--text-lead)] leading-[var(--leading-body)] text-muted-fg max-w-[65ch]">
        {lead}
      </p>
    </section>
  )
}
```

## Anti-template checklist

- [x] hairline label per section
- [x] rule line
- [x] serif hierarchy
- [x] semantic <dl> for Now
- [x] mailto + external link rel
- [x] readable measure (max-w-[65ch])
- [x] no card / no shadow / no gradient blob

## 不要做的事

- 不接 DB
- 不抽 `<AboutSection>` 共用 wrapper (R7)
- 不加头像 / portrait（MVP）
- 不加 i18n
- 不用 dangerouslySetInnerHTML for paragraphs（纯 string array）

## 关键提示给 ha1den

`completion-report.md` 必须明显警告：
> ⚠️ Pre-launch ACTION REQUIRED: edit `src/lib/content/about.ts` to replace all "Placeholder:" strings with real content.
