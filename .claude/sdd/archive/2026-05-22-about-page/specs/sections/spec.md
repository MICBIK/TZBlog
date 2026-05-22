# specs/sections — 4 个 About section component

> spec-id 前缀：`SPEC-AB-S`

## SPEC-AB-S-1 — AboutHero renders Editorial hero

```gherkin
GIVEN AboutHero receives { headline, lead } props

WHEN render

THEN:
  - headline shown as serif h1 using --text-hero or --text-h1 (smaller than HomeHero, h1)
  - lead shown as larger serif paragraph (--text-lead) below
  - hairline label "ABOUT" above headline
  - rule line below hairline
  - no animation on this hero (about page is static / non-marketing)

Test:
  render(<AboutHero headline="hello" lead="world" />)
  expect(screen.getByText("ABOUT")).toBeInTheDocument()
  expect(screen.getByRole("heading", { level: 1, name: "hello" })).toBeInTheDocument()
  expect(screen.getByText("world")).toBeInTheDocument()
```

## SPEC-AB-S-2 — AboutNow renders intro + items list

```gherkin
GIVEN AboutNow receives { intro, items: [{ label, detail }, ...] }

WHEN render

THEN:
  - hairline label "NOW" + rule line
  - h2 "Now" (serif)
  - intro paragraph (serif body)
  - <dl> definition list: each item as <dt>label</dt><dd>detail</dd>
  - or <ul> with semantic structure

Test:
  const items = [{ label: "Shipping", detail: "TZBlog" }]
  render(<AboutNow intro="2026" items={items} />)
  expect(screen.getByText("NOW")).toBeInTheDocument()
  expect(screen.getByText("Shipping")).toBeInTheDocument()
  expect(screen.getByText("TZBlog")).toBeInTheDocument()
```

## SPEC-AB-S-3 — AboutStory renders prose paragraphs

```gherkin
GIVEN AboutStory receives { paragraphs: string[] }

WHEN render

THEN:
  - hairline label "STORY" + rule line
  - h2 "Story" (serif)
  - each paragraph rendered as `<p>` with serif body styling
  - vertical rhythm via --space-md between paragraphs
  - max-width readable measure (~65ch)

Test:
  render(<AboutStory paragraphs={["one", "two"]} />)
  expect(screen.getByText("STORY")).toBeInTheDocument()
  expect(screen.getByText("one")).toBeInTheDocument()
  expect(screen.getByText("two")).toBeInTheDocument()
```

## SPEC-AB-S-4 — AboutContact renders email + links

```gherkin
GIVEN AboutContact receives { email, links: [{ label, href, kind }] }

WHEN render

THEN:
  - hairline label "CONTACT" + rule line
  - h2 "Contact" (serif)
  - email shown as `<a href="mailto:{email}">{email}</a>`
  - each link rendered as `<a target="_blank" rel="noopener noreferrer">{label}</a>`
  - links list semantic <ul>

Test:
  render(<AboutContact email="me@x.com" links={[{ label: "GitHub", href: "https://...", kind: "github" }]} />)
  expect(screen.getByRole("link", { name: "me@x.com" })).toHaveAttribute("href", "mailto:me@x.com")
  expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("target", "_blank")
```

## Shared Editorial styling expected (assertion not strict)

每个 section：
- hairline label：`font-mono uppercase text-[var(--text-label)] tracking-[var(--tracking-label)] text-muted-fg`
- h2：`font-serif text-[var(--text-h2)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)]`
- body：`font-serif text-[var(--text-base)] leading-[var(--leading-body)] text-fg`
