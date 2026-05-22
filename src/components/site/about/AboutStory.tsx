interface AboutStoryProps {
  paragraphs: string[];
}

export function AboutStory({ paragraphs }: AboutStoryProps) {
  return (
    <section aria-labelledby="about-story-heading" className="space-y-6">
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          STORY
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h2
          id="about-story-heading"
          className="font-serif text-h2 leading-display tracking-tight text-fg"
        >
          Story
        </h2>
      </header>

      <div className="space-y-[var(--space-paragraph)]">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            className="max-w-[65ch] font-serif text-base leading-body text-fg"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
