interface AboutContactLink {
  label: string;
  href: string;
  kind: "github" | "x" | "rss" | "other";
}

interface AboutContactProps {
  email: string;
  links: AboutContactLink[];
}

export function AboutContact({ email, links }: AboutContactProps) {
  return (
    <section aria-labelledby="about-contact-heading" className="space-y-6">
      <header className="space-y-3">
        <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
          CONTACT
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h2
          id="about-contact-heading"
          className="font-serif text-[var(--text-h2)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg"
        >
          Contact
        </h2>
      </header>

      <a
        href={`mailto:${email}`}
        className="inline-block font-serif text-[var(--text-lead)] leading-[var(--leading-body)] text-fg transition-colors hover:text-accent"
      >
        {email}
      </a>

      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-[var(--text-base)] leading-[var(--leading-body)] text-fg transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
