interface AboutStoryProps {
  paragraphs: string[];
}

export function AboutStory({ paragraphs }: AboutStoryProps) {
  return (
    <section aria-labelledby="about-story-heading" className="space-y-6">
      <header className="space-y-3">
        <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
          STORY
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h2
          id="about-story-heading"
          className="font-serif text-[var(--text-h2)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg"
        >
          Story
        </h2>
      </header>

      <div className="space-y-[var(--space-paragraph)]">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            className="max-w-[65ch] font-serif text-[var(--text-base)] leading-[var(--leading-body)] text-fg"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
