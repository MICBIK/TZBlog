import {
  listColumnsForLocale,
} from "@/lib/services/columns";
import { listTags } from "@/lib/services/tags";
import { getCurrentLocale } from "@/lib/i18n";

import { PostEditor } from "@/components/admin/posts/PostEditor";

export default async function NewPostPage() {
  const locale = getCurrentLocale();
  const [columns, tags] = await Promise.all([
    listColumnsForLocale(locale),
    listTags(),
  ]);

  return (
    <PostEditor
      mode="create"
      columns={columns.map((c) => ({ id: c.id, name: c.name }))}
      allTags={tags.map((t) => ({ slug: t.slug, name: t.name }))}
    />
  );
}
