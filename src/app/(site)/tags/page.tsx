import Link from "next/link";
import type { Metadata } from "next";

import { getCurrentLocale } from "@/lib/i18n";
import { listAllTagsWithCount } from "@/lib/services/tags-public";

export const metadata: Metadata = {
  title: "Tags",
  description: "All tags on TZBlog",
};

export default async function TagsPage() {
  const locale = getCurrentLocale();
  const tags = await listAllTagsWithCount(locale);

  return (
    <article className="space-y-[var(--space-section)]">
      <header className="space-y-3">
        <p className="font-mono text-[var(--text-label)] tracking-[var(--tracking-label)] uppercase text-muted-fg">
          TAGS · INDEX
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h1 className="font-serif text-[var(--text-h1)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg">
          Tags
        </h1>
      </header>

      {tags.length === 0 ? (
        <p className="font-serif text-[var(--text-base)] leading-[var(--leading-body)] text-muted-fg">
          No tags yet.
        </p>
      ) : (
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {tags.map((tag) => (
            <li key={tag.slug}>
              <Link
                href={`/tags/${tag.slug}`}
                className="group flex items-baseline justify-between border-b border-border py-2 transition-colors hover:border-fg"
              >
                <span className="font-serif text-[var(--text-base)] leading-[var(--leading-body)] text-fg group-hover:underline">
                  {tag.name}
                </span>
                <span className="font-mono text-sm text-muted-fg">
                  {tag.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
