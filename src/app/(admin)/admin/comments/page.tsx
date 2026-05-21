import { listCommentsForAdmin } from "@/lib/services/comments"

import { CommentsTable } from "@/components/admin/comments/CommentsTable"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Admin 评论审核页 — 4 status tab + 列表 + URL 同步。
 *
 * Stub: TDD RED 阶段，未实现 tab + URL sync。
 */
export default async function CommentsAdminPage({ searchParams }: Props) {
  const _sp = await searchParams
  void _sp
  const result = await listCommentsForAdmin({})

  return (
    <div data-stub-page="true">
      <CommentsTable
        initialItems={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  )
}
