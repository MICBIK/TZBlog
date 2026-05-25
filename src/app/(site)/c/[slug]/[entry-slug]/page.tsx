import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EntryDetail } from "@/components/site/EntryDetail";
import { NextEntry } from "@/components/site/NextEntry";
import { TerminalEntryDetail } from "@/components/terminal/TerminalEntryDetail";
import { TerminalShell } from "@/components/terminal/TerminalShell";
import { getCurrentLocale, type Locale } from "@/lib/i18n";
import { renderMarkdown } from "@/lib/markdown";
import {
  getPublishedEntryInChannel,
  pickEntryTranslation,
  type PublicEntry,
} from "@/lib/services/entryPublic";

type Props = {
  params: Promise<{ slug: string; "entry-slug": string }>;
};

function pickTranslation(entry: PublicEntry, locale: Locale) {
  return pickEntryTranslation(entry, locale);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, "entry-slug": entrySlug } = await params;
  const entry = await getPublishedEntryInChannel(slug, entrySlug);
  if (!entry || entry.kind === "GUESTBOOK_THREAD") return {};

  const tr = pickTranslation(entry, getCurrentLocale());
  return {
    title: `${tr?.title ?? entrySlug} — TZBlog`,
    description: tr?.excerpt ?? undefined,
  };
}

export default async function ChannelEntryDetailPage({ params }: Props) {
  const { slug, "entry-slug": entrySlug } = await params;
  const entry = await getPublishedEntryInChannel(slug, entrySlug);
  if (!entry) notFound();

  if (entry.kind === "GUESTBOOK_THREAD") notFound();

  if (entry.kind === "ARTICLE") {
    redirect(`/posts/${entry.slug}`);
  }

  const locale = getCurrentLocale();
  const tr = pickTranslation(entry, locale);
  if (!tr) notFound();

  const isStream = entry.channel.kind === "STREAM" && entry.kind !== "LINK";
  const markdown = tr.content?.trim() ? tr.content : entry.body;
  const sourceLines = markdown.split("\n");

  const detail = isStream ? (
    <TerminalEntryDetail
      channelSlug={slug}
      entrySlug={entrySlug}
      title={tr.title}
      html={await renderMarkdown(markdown)}
      sourceLines={sourceLines.length > 0 ? sourceLines : [""]}
    />
  ) : (
    <EntryDetail entry={entry} />
  );

  const body = (
    <>
      {isStream ? (
        <Link
          href={`/c/${slug}`}
          className="mb-6 inline-block font-mono text-xs text-muted-fg transition hover:text-fg terminal-link"
        >
          ← {slug}
        </Link>
      ) : null}
      {detail}
      <NextEntry entry={entry} />
    </>
  );

  if (isStream) {
    return <TerminalShell slug={slug}>{body}</TerminalShell>;
  }

  return body;
}
