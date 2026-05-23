export interface AboutProjectIntentSection {
  heading: string;
  body: string;
}

export interface ImplementationApproachEntry {
  label: string;
  heading: string;
  body: string;
  code?: string;
}

export interface RoadmapItem {
  label: string;
  description: string;
}

export interface RoadmapColumn {
  phase: string;
  items: RoadmapItem[];
}

export interface AboutContent {
  hero: {
    headline: string;
    lead: string;
  };
  now: {
    intro: string;
    items: Array<{
      label: string;
      detail: string;
    }>;
  };
  story: {
    paragraphs: string[];
  };
  projectIntent: {
    sections: AboutProjectIntentSection[];
  };
  implementationApproach: {
    entries: ImplementationApproachEntry[];
  };
  principles: {
    intro: string;
    items: Array<{
      label: string;
      detail: string;
    }>;
  };
  futureRoadmap: {
    columns: RoadmapColumn[];
    i18nDisclosure: string;
  };
  contact: {
    email: string;
    links: Array<{
      label: string;
      href: string;
      kind: "github" | "x" | "rss" | "other";
    }>;
  };
}

export const aboutContent = {
  hero: {
    headline: "Shipping software, then writing down the tradeoffs.",
    lead:
      "I build full-stack products, self-host the pieces that matter, and use this site to document the engineering decisions behind them.",
  },
  now: {
    intro: "As of May 2026, the focus is making TZBlog production-ready and turning the build log into durable technical notes.",
    items: [
      {
        label: "Shipping",
        detail: "TZBlog from scratch with Next.js 16, targeting a VPS launch in June 2026.",
      },
      {
        label: "Writing",
        detail: "Essays on type-driven design, Markdown-as-source, and the tradeoffs behind self-hosted tools.",
      },
      {
        label: "Reading",
        detail: "Designing Data-Intensive Apps and TLA+ Specifications, with notes folded back into TZBlog decisions.",
      },
      {
        label: "Hardening",
        detail: "Postgres pg_dump pipeline, Caddy auto-renew, quality gates, and a practical V2/V3 roadmap.",
      },
    ],
  },
  story: {
    paragraphs: [
      "TZBlog is intentionally built as a single, inspectable system: public pages, admin CMS, comments, analytics, media storage, and deployment all live in one Next.js codebase.",
      "The goal is not just to publish posts. It is to keep enough ownership over the stack that performance, data, privacy, and editorial workflow can be tuned without waiting on a hosted platform.",
    ],
  },
  projectIntent: {
    sections: [
      {
        heading: "Why this exists",
        body:
          "TZBlog avoids Substack, Ghost, and Notion because the CMS, analytics, Markdown renderer, and deployment path need to stay inspectable. The first self-built CMS pass took 8 days, which is small enough to own and write about.",
      },
      {
        heading: "Who it's for",
        body:
          "It is for engineers thinking about ownership, tradeoffs, and tools: people who care why a Next.js 16, PostgreSQL 16, MinIO, and Caddy stack is chosen over a hosted black box.",
      },
      {
        heading: "What it isn't",
        body:
          "It is not marketing, not SEO nesting, and not a paid wall. The source stays reviewable under the repository LICENSE while the site runs toward a Hetzner CX22 4GB VPS launch target.",
      },
    ],
  },
  implementationApproach: {
    entries: [
      {
        label: "01",
        heading: "SDD + TDD micro-cycles",
        body:
          "Each capability starts with a spec, a real failing test, and a matching implementation commit so behavior changes remain reviewable.",
        code: "test(about): A-6\nfeat(about): A-6",
      },
      {
        label: "02",
        heading: "Self-hosted CMS over CMS-as-a-service",
        body:
          "The CMS is intentionally narrow: posts, columns, comments, analytics, and media stay in one codebase instead of splitting ownership across hosted publishing tools.",
      },
      {
        label: "03",
        heading: "Markdown is the source of truth",
        body:
          "Editing stays as Markdown source while preview, published pages, RSS, and search summaries derive from the same stored string.",
      },
      {
        label: "04",
        heading: "Document tradeoffs in memory-bank",
        body:
          "Durable decisions live in memory-bank and SDD artifacts so future work starts from recorded constraints rather than rediscovery.",
      },
    ],
  },
  principles: {
    intro:
      "TZBlog is shaped around a practical constraint: every layer should be understandable enough to debug, replace, and write about.",
    items: [
      {
        label: "Source-first",
        detail:
          "Markdown remains the canonical authoring format, with preview and publishing treated as render targets rather than hidden editor state.",
      },
      {
        label: "Operational ownership",
        detail:
          "Next.js, PostgreSQL, MinIO, Docker Compose, and Caddy keep the deployment path small enough to audit before launch.",
      },
      {
        label: "Written tradeoffs",
        detail:
          "Implementation choices are recorded as notes: what shipped, what was deferred, and which V2/V3 work needs its own SDD.",
      },
    ],
  },
  futureRoadmap: {
    columns: [
      {
        phase: "Current",
        items: [
          {
            label: "MVP",
            description:
              "CMS, comments, analytics, RSS, sitemap, Markdown reading, and deployment documentation are being closed for launch.",
          },
          {
            label: "Pre-launch",
            description:
              "Browser audit, Lighthouse follow-up, backup scripts, and production smoke remain before public release.",
          },
        ],
      },
      {
        phase: "V2",
        items: [
          {
            label: "Theme GUI",
            description:
              "Admin-managed design tokens, visual presets, and safer theme switching.",
          },
          {
            label: "Editor enhancements",
            description:
              "Tables, footnotes, math, drag-and-drop media, and richer Markdown authoring helpers.",
          },
          {
            label: "Detailed analytics",
            description:
              "Sources, devices, regions, comparisons, and export workflows for the self-hosted analytics stack.",
          },
        ],
      },
      {
        phase: "V3",
        items: [
          {
            label: "Multilingual i18n",
            description:
              "Locale routing, dictionaries, translated content, metadata, RSS, sitemap, and canonical strategy.",
          },
          {
            label: "Language switcher",
            description:
              "A public UI for zh/en once the route tree and SEO surface are ready.",
          },
        ],
      },
    ],
    i18nDisclosure:
      "TZBlog 目前是一个中文单语言（zh-CN）个人技术博客。数据模型预留了多语言能力，但当前 UI、SEO、RSS、sitemap、后台编辑均未启用多语言路径。V3 将作为独立 SDD 处理。",
  },
  contact: {
    email: "hello@ha1den.dev",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/ha1den",
        kind: "github",
      },
      {
        label: "X",
        href: "https://x.com/ha1den",
        kind: "x",
      },
      {
        label: "RSS",
        href: "/rss.xml",
        kind: "rss",
      },
    ],
  },
} as const satisfies AboutContent;
