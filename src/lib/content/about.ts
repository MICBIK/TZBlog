// TODO[pre-launch]: replace placeholder strings before deploy
// sections: hero.headline, hero.lead, now.items, story.paragraphs, contact.email

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
    headline: "Building things people read.",
    lead:
      "Placeholder: I'm ha1den. I ship full-stack software and write about what I learn along the way.",
  },
  now: {
    intro: "Placeholder: As of May 2026.",
    items: [
      {
        label: "Shipping",
        detail: "TZBlog from scratch (Next.js 15 + Prisma + MinIO).",
      },
      {
        label: "Reading",
        detail: "Designing Data-Intensive Applications (re-read).",
      },
      {
        label: "Building",
        detail: "Small CLI experiments.",
      },
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
