# specs/page — About page composition + metadata

> spec-id 前缀：`SPEC-AB-P`

## SPEC-AB-P-1 — page renders 4 sections in order

```gherkin
GIVEN src/app/(site)/about/page.tsx

WHEN render

THEN page renders, in order:
  1. <AboutHero ... />
  2. <AboutNow ... />
  3. <AboutStory ... />
  4. <AboutContact ... />

AND all props come from aboutContent

AND sections are separated by --space-section vertical gap
```

## SPEC-AB-P-2 — page exports metadata

```gherkin
GIVEN about/page.tsx

THEN exports `metadata: Metadata = { title: "About", description: <非空 string>, openGraph: { title, description } }`

Test (via Next.js metadata-as-export pattern):
  import * as page from "./page"
  expect(page.metadata.title).toBe("About")
  expect(page.metadata.description).toBeTruthy()
```

## SPEC-AB-P-3 — page uses semantic main + section landmarks

```gherkin
GIVEN page renders

THEN:
  - Top-level wrapper is <main> (or inherits from layout — if layout owns main, page uses <article>)
  - Each section wrapped in <section aria-labelledby={...}> or aria-label
  - Headings hierarchy correct: 1 h1 (in AboutHero), 3 h2 (Now/Story/Contact)

Test:
  render(<AboutPage />)
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3)
```

## Page skeleton

```tsx
import type { Metadata } from "next"
import { aboutContent } from "@/lib/content/about"
import { AboutHero } from "@/components/site/about/AboutHero"
import { AboutNow } from "@/components/site/about/AboutNow"
import { AboutStory } from "@/components/site/about/AboutStory"
import { AboutContact } from "@/components/site/about/AboutContact"

export const metadata: Metadata = {
  title: "About",
  description: aboutContent.hero.lead,
  openGraph: {
    title: "About — TZBlog",
    description: aboutContent.hero.lead,
  },
}

export default function AboutPage() {
  return (
    <article className="space-y-[var(--space-section)]">
      <AboutHero {...aboutContent.hero} />
      <AboutNow {...aboutContent.now} />
      <AboutStory {...aboutContent.story} />
      <AboutContact {...aboutContent.contact} />
    </article>
  )
}
```
