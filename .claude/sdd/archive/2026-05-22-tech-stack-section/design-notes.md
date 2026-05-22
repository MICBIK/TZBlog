# design-notes — tech-stack-section

## Locked techStack data

```ts
interface TechItem {
  name: string
  note?: string
}

interface TechCategory {
  label: string
  items: TechItem[]
}

const techStack: TechCategory[] = [
  {
    label: "Frontend",
    items: [
      { name: "Next.js 15", note: "App Router + RSC + Server Actions" },
      { name: "React 19", note: "with strict mode" },
      { name: "TypeScript 5", note: "strict everywhere" },
      { name: "Tailwind CSS v4", note: "CSS-vars driven theming" },
      { name: "shadcn/ui", note: "primitives + Radix under the hood" },
    ],
  },
  {
    label: "Content & Editor",
    items: [
      { name: "Tiptap v2", note: "WYSIWYG ↔ Markdown" },
      { name: "remark + rehype", note: "server-side MD pipeline" },
      { name: "Shiki", note: "syntax highlighting" },
    ],
  },
  {
    label: "Backend & Data",
    items: [
      { name: "PostgreSQL 16", note: "single source of truth" },
      { name: "Prisma 7", note: "with @prisma/adapter-pg driver" },
      { name: "Auth.js v5", note: "Credentials provider, Edge-safe" },
      { name: "Zod", note: "shared client/server schemas" },
      { name: "MinIO", note: "S3-compatible media storage" },
    ],
  },
  {
    label: "Infra",
    items: [
      { name: "Docker Compose", note: "app + Postgres + MinIO + Caddy" },
      { name: "Caddy", note: "automatic HTTPS + reverse proxy" },
      { name: "Self-hosted VPS", note: "no platform lock-in" },
    ],
  },
  {
    label: "Tooling",
    items: [
      { name: "pnpm", note: "fast, disk-efficient" },
      { name: "Vitest", note: "unit + integration" },
      { name: "ESLint", note: "+ TypeScript-aware rules" },
      { name: "Playwright", note: "planned for E2E + visual regression" },
    ],
  },
]
```

## ASCII mockup

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  WHAT POWERS THIS                                                │
│  Tech Stack                  (h2, font-serif, --text-h2)         │
│                                                                  │
│  ──                                                              │
│                                                                  │
│  FRONTEND                                                        │
│  ─────────                                                       │
│                                                                  │
│  Next.js 15           React 19              TypeScript 5         │
│  App Router + RSC     with strict mode      strict everywhere    │
│                                                                  │
│  Tailwind CSS v4      shadcn/ui                                  │
│  CSS-vars driven      primitives + Radix                         │
│                                                                  │
│  ──                                                              │
│                                                                  │
│  CONTENT & EDITOR                                                │
│  ─────────────                                                   │
│                                                                  │
│  Tiptap v2            remark + rehype       Shiki                │
│  WYSIWYG ↔ Markdown   server-side MD        syntax highlighting  │
│                                                                  │
│  ──                                                              │
│                                                                  │
│  ... (BACKEND & DATA / INFRA / TOOLING follow same pattern)      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Mobile (< sm):  1-col grid, items stack
Tablet (sm-lg): 2-col grid
Desktop (lg+):  3-col grid
```

## TechStack.tsx 骨架

```tsx
interface TechItem {
  name: string
  note?: string
}

interface TechCategory {
  label: string
  items: TechItem[]
}

const techStack: TechCategory[] = [
  /* ... locked data above ... */
]

export function TechStack() {
  return (
    <section aria-labelledby="tech-stack-heading" className="space-y-[var(--space-stack-lg)]">
      <header className="space-y-2">
        <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
          What powers this
        </p>
        <h2
          id="tech-stack-heading"
          className="font-serif text-[var(--text-h2)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg"
        >
          Tech Stack
        </h2>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
      </header>

      <div className="space-y-[var(--space-stack-lg)]">
        {techStack.map((category, i) => (
          <section
            key={category.label}
            aria-labelledby={`ts-${category.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            className="space-y-4"
          >
            <h3
              id={`ts-${category.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg"
            >
              {category.label.toUpperCase()}
            </h3>

            <div className="grid gap-x-6 gap-y-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <div key={item.name} className="space-y-1">
                  <p className="font-serif text-fg text-[var(--text-base)]">
                    {item.name}
                  </p>
                  {item.note && (
                    <p className="text-muted-fg text-sm leading-[var(--leading-body)]">
                      {item.note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {i < techStack.length - 1 && (
              <div className="h-px w-full border-t border-border pt-4" aria-hidden="true" />
            )}
          </section>
        ))}
      </div>
    </section>
  )
}
```

## Decisions log (R1-R8 详）

详 proposal.md。补充：

- **R8 final**: `Tech Stack` 不改名（与 Recent Posts / Site Stats / 现有导航一致）；hairline label 上方加 `WHAT POWERS THIS` Editorial 编排
- **R4 final**: hairline label 用 `font-mono` 而非 sans，与 hero-editorial 的 `001 / NOTES` marginalia 风格一致
- **R5 final**: 3-col grid at lg+ 对 5 类 × 3-5 item 视觉舒展

## Anti-template checklist 验证

- [x] **类目化**（非平铺 list）
- [x] **Editorial 字体配对**（serif name + sans note）
- [x] **Hairline labels** 每类
- [x] **Rule lines** 分类间
- [x] **info hierarchy**（label → h3 → name → note）
- [x] **CSS vars only**（无硬色）

## 改 page.tsx 的精确清单

```diff
- const techStack = [
-   "TypeScript",
-   "React",
-   "Next.js",
-   "Node.js",
-   "PostgreSQL",
-   "Docker",
- ];

  export default async function HomePage() {
    // ...
+   import { TechStack } from "@/components/site/TechStack"

    return (
      <div className="space-y-24">
        <HeroEditorial />

-       {/* Tech Stack */}
-       <section className="space-y-6">
-         <h2 className="text-2xl font-semibold tracking-tight">Tech Stack</h2>
-         <div className="rounded-lg border border-border bg-muted/40 p-6 font-mono text-sm">
-           <p className="text-muted-fg">
-             <span className="text-accent">$</span> whoami
-           </p>
-           <ul className="mt-3 space-y-1">
-             {techStack.map((tech) => (
-               <li key={tech} className="text-fg">
-                 <span className="text-muted-fg">-</span> {tech}
-               </li>
-             ))}
-           </ul>
-         </div>
-       </section>
+       <TechStack />

        {/* Recent Posts ... */}
      </div>
    )
  }
```

## 不要做的事

- 不加 link 到 tech 官网（YAGNI）
- 不加 icon / logo（增加 bundle + 与 Editorial 纯 typography 风不一致）
- 不引入"现在用 / 以前用"分类（YAGNI）
- 不抽 `<Category>` `<Item>` 子组件（单文件 ≈ 100 行可读，不需）
