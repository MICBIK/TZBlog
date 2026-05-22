interface AboutContent {
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
        detail: "TZBlog from scratch with Next.js 16, Prisma 7, PostgreSQL, MinIO, and Caddy.",
      },
      {
        label: "Writing",
        detail: "Implementation notes on CMS architecture, self-hosted deployment, observability, and product polish.",
      },
      {
        label: "Hardening",
        detail: "Pre-launch quality gates, backups, Lighthouse fixes, and a practical V2/V3 roadmap.",
      },
    ],
  },
  story: {
    paragraphs: [
      "TZBlog is intentionally built as a single, inspectable system: public pages, admin CMS, comments, analytics, media storage, and deployment all live in one Next.js codebase.",
      "The goal is not just to publish posts. It is to keep enough ownership over the stack that performance, data, privacy, and editorial workflow can be tuned without waiting on a hosted platform.",
    ],
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
