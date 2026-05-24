import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";

import { getColumnBySlug } from "@/lib/services/columns";
import { getCurrentLocale } from "@/lib/i18n";
import { listPosts } from "@/lib/services/posts";

type Props = { params: Promise<{ slug: string }> };

type AnyTranslation = {
  locale: string;
  name?: string;
  description?: string | null;
  title?: string;
  excerpt?: string | null;
};

function pickTranslation<T extends AnyTranslation>(
  translations: T[] | undefined,
  locale: string,
): T | undefined {
  if (!translations || translations.length === 0) return undefined;
  return translations.find((t) => t.locale === locale) ?? translations[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const col = await getColumnBySlug(slug);
  if (!col) return {};
  const locale = getCurrentLocale();
  const tr = pickTranslation(
    (col as { translations?: AnyTranslation[] }).translations,
    locale,
  );
  return {
    title: `${tr?.name ?? slug} — TZBlog`,
    description: tr?.description ?? undefined,
  };
}

export default async function ColumnDetailPage({ params }: Props) {
  const { slug } = await params;
  const col = await getColumnBySlug(slug);
  if (!col) notFound();

  const locale = getCurrentLocale();
  const tr = pickTranslation(
    (col as { translations?: AnyTranslation[] }).translations,
    locale,
  );
  const name = tr?.name ?? slug;
  const description = tr?.description ?? null;

  const { items: posts } = await listPosts(
    {
      columnId: col.id,
      page: 1,
      pageSize: 100,
      status: "PUBLISHED",
    },
    locale,
  );

  return (
    <article className="space-y-12">
      <Link
        href="/columns"
        className="inline-block text-xs text-muted-fg transition hover:text-fg"
      >
        ← 所有专栏
      </Link>

      <header className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {name}
        </h1>
        {description && (
          <p className="text-lg text-muted-fg">{description}</p>
        )}
        <p className="font-mono text-xs text-muted-fg">
          {posts.length} 篇文章
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-fg">
          这个专栏还没有发布文章。
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {posts.map((p) => {
            return (
              <li key={p.id} className="py-6">
                <Link href={`/posts/${p.slug}`} className="group block">
                  <h3 className="text-xl font-semibold tracking-tight text-fg group-hover:underline">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-fg">
                      {p.excerpt}
                    </p>
                  )}
                  {p.publishedAt && (
                    <time className="mt-2 inline-block font-mono text-xs text-muted-fg">
                      {format(new Date(p.publishedAt), "yyyy-MM-dd")}
                    </time>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
