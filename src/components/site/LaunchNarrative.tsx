const launchCards = [
  {
    label: "ARCHITECTURE",
    title: "One inspectable Next.js system",
    detail:
      "Next.js App Router keeps the public site, admin CMS, analytics, comments, and APIs in one deployable codebase.",
  },
  {
    label: "EDITORIAL PIPELINE",
    title: "Markdown source, reliable output",
    detail:
      "The authoring flow stays source-first while remark/rehype, Shiki, TOC extraction, and callouts shape the published reading experience.",
  },
  {
    label: "OPERATIONS",
    title: "Self-hosted by design",
    detail:
      "PostgreSQL, MinIO, and Caddy make the data path visible enough to tune backups, media storage, HTTPS, and deployment behavior.",
  },
];

export function LaunchNarrative() {
  return (
    <section
      aria-labelledby="launch-narrative-heading"
      className="launch-surface relative overflow-hidden rounded-[2rem] px-5 py-8 sm:px-8 lg:px-10"
    >
      <div data-launch-orbit aria-hidden="true" />
      <div className="relative grid gap-10 lg:grid-cols-[5fr_7fr] lg:items-end">
        <header className="space-y-4">
          <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
            BUILD LOG · PRODUCT SYSTEM
          </p>
          <div className="h-px w-12 border-t border-border" aria-hidden="true" />
          <h2
            id="launch-narrative-heading"
            className="font-serif text-[var(--text-h2)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg"
          >
            A self-hosted publishing system, built in public.
          </h2>
          <p className="max-w-[54ch] text-sm leading-[var(--leading-body)] text-muted-fg md:text-base">
            TZBlog is the site and the case study: a source-first editor, a
            PostgreSQL-backed CMS, a small analytics stack, and launch notes
            about the tradeoffs behind each layer.
          </p>
        </header>

        <div className="launch-grid grid gap-4 md:grid-cols-3">
          {launchCards.map((card, index) => (
            <article
              key={card.label}
              data-reveal
              style={{ "--reveal-delay": `${index * 80}ms` } as React.CSSProperties}
              className="launch-panel space-y-4 p-5"
            >
              <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
                {card.label}
              </p>
              <h3 className="font-serif text-[var(--text-lead)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg">
                {card.title}
              </h3>
              <p className="text-sm leading-[var(--leading-body)] text-muted-fg">
                {card.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
