import Link from "next/link";

import { MediaCard } from "@/components/admin/media/MediaCard";
import { MediaUploadDropzone } from "@/components/admin/media/MediaUploadDropzone";
import { Button } from "@/components/ui/button";
import { mediaFilterSchema } from "@/lib/schemas/media";
import { listMedia } from "@/lib/services/media";

type MediaAdminPageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function MediaAdminPage({
  searchParams,
}: MediaAdminPageProps) {
  const params = (await searchParams) ?? {};
  const filter = mediaFilterSchema.parse({
    page: params.page ?? "1",
    pageSize: 12,
  });
  const { items, total, page, pageSize } = await listMedia(filter);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">媒体库</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 个文件。当前第 {page} 页。
          </p>
        </div>
      </header>

      <MediaUploadDropzone />

      {items.length === 0 ? (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-[hsl(var(--fg))]">
            {total === 0 ? "还没有媒体" : "这一页没有媒体"}
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted))]">
            {total === 0
              ? "从文章封面或编辑器里上传图片后，会自动出现在这里。"
              : "可以返回上一页继续查看。"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {items.map((media) => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          共 {total} 张 · 第 {page} / {totalPages} 页
        </div>
        <div className="flex items-center gap-2">
          {canPrev ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageHref(page - 1)}>上一页</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              上一页
            </Button>
          )}
          {canNext ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageHref(page + 1)}>下一页</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              下一页
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function pageHref(page: number): string {
  if (page <= 1) {
    return "/admin/media";
  }

  return `/admin/media?page=${page}`;
}
