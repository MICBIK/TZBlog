import { notFound } from "next/navigation";

import { getPostById } from "@/lib/services/posts";
import { listColumnsForLocale } from "@/lib/services/columns";
import { listTags } from "@/lib/services/tags";
import { getCurrentLocale } from "@/lib/i18n";

import { PostEditor } from "@/components/admin/posts/PostEditor";

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const locale = getCurrentLocale();
  const [post, columns, tags] = await Promise.all([
    getPostById(id),
    listColumnsForLocale(locale),
    listTags(),
  ]);

  if (!post) notFound();

  const localised =
    post.translations.find((t) => t.locale === locale) ??
    post.translations[0];

  return (
    <PostEditor
      mode="edit"
      initial={{
        id: post.id,
        slug: post.slug,
        cover: post.cover,
        status: post.status,
        publishedAt: post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : null,
        columnId: post.columnId,
        tags: post.tags.map((t) => t.tag.slug),
        title: localised?.title ?? "",
        excerpt: localised?.excerpt ?? "",
        content: localised?.content ?? "",
      }}
      columns={columns.map((c) => ({ id: c.id, name: c.name }))}
      allTags={tags.map((t) => ({ slug: t.slug, name: t.name }))}
    />
  );
}
