# specs/content — About 静态内容

> spec-id 前缀：`SPEC-AB-D`

## SPEC-AB-D-1 — aboutContent 结构和类型

```gherkin
GIVEN src/lib/content/about.ts exports `aboutContent` const

WHEN imported

THEN type matches:
  {
    hero: { headline: string; lead: string }
    now: { intro: string; items: Array<{ label: string; detail: string }> }
    story: { paragraphs: Array<string> }
    contact: {
      email: string
      links: Array<{ label: string; href: string; kind: "github" | "x" | "rss" | "other" }>
    }
  }

AND aboutContent satisfies the type
```

## SPEC-AB-D-2 — 文件含 placeholder 警告

```gherkin
GIVEN src/lib/content/about.ts

WHEN file is read

THEN file contains a comment block at top:
  // TODO[pre-launch]: replace placeholder strings before deploy
  // sections: hero.headline, hero.lead, now.items, story.paragraphs, contact.email

AND first paragraph in story.paragraphs starts with "Placeholder:" prefix (so reviewer can grep)
```

Test:
```ts
import { readFile } from "fs/promises"
import { join } from "path"

it("has TODO[pre-launch] warning", async () => {
  const content = await readFile(join(process.cwd(), "src/lib/content/about.ts"), "utf-8")
  expect(content).toMatch(/TODO\[pre-launch\]/)
})
```

## SPEC-AB-D-3 — content 不为空

```gherkin
GIVEN aboutContent

THEN:
  - hero.headline.length > 0
  - hero.lead.length > 0
  - now.items.length >= 2
  - story.paragraphs.length >= 2
  - contact.email matches /.+@.+\..+/
  - contact.links.length >= 1
```
