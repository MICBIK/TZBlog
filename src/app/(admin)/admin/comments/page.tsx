import Link from "next/link"

import { CommentsTable } from "@/components/admin/comments/CommentsTable"
import { commentFilterSchema } from "@/lib/schemas/comment"
import { listCommentsForAdmin } from "@/lib/services/comments"

/**
 * Admin 评论审核页 — 4 status tab + 列表 + URL 同步。
 *
 * - tab 是 `<Link>` 元素，href 含 `?status=...`，靠 URL 状态切换（默认 PENDING）
 * - 4 个 status 各自的总数并行查询（pageSize=1 拿 total 字段，浪费的 1 行数据可接受）
 * - 列表展示当前 filter（status / q / page）匹配的 items
 */

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const STATUS_TABS = [
  { value: "PENDING" as const, label: "待审核" },
  { value: "APPROVED" as const, label: "已通过" },
  { value: "SPAM" as const, label: "垃圾" },
  { value: "REJECTED" as const, label: "已拒" },
]

export default async function CommentsAdminPage({ searchParams }: Props) {
  const sp = await searchParams
  const filter = commentFilterSchema.parse(
    Object.fromEntries(
      Object.entries(sp)
        .map(
          ([k, v]) =>
            [k, Array.isArray(v) ? v[0] : (v ?? "")] as [string, string],
        )
        .filter(([, v]) => v !== ""),
    ),
  )

  const activeStatus = filter.status

  const [result, pendingCount, approvedCount, spamCount, rejectedCount] =
    await Promise.all([
      listCommentsForAdmin(filter),
      listCommentsForAdmin({ status: "PENDING", pageSize: 1 }).then(
        (r) => r.total,
      ),
      listCommentsForAdmin({ status: "APPROVED", pageSize: 1 }).then(
        (r) => r.total,
      ),
      listCommentsForAdmin({ status: "SPAM", pageSize: 1 }).then((r) => r.total),
      listCommentsForAdmin({ status: "REJECTED", pageSize: 1 }).then(
        (r) => r.total,
      ),
    ])

  const counts: Record<(typeof STATUS_TABS)[number]["value"], number> = {
    PENDING: pendingCount,
    APPROVED: approvedCount,
    SPAM: spamCount,
    REJECTED: rejectedCount,
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">评论审核</h1>
        <p className="mt-1 text-sm text-muted-fg">
          当前 {activeStatus ? STATUS_TABS.find((t) => t.value === activeStatus)?.label : "全部"} 共 {result.total} 条。
        </p>
      </header>

      <nav className="flex gap-2 border-b border-border">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value
          return (
            <Link
              key={tab.value}
              href={`/admin/comments?status=${tab.value}`}
              className={`px-4 py-2 text-sm transition ${
                isActive
                  ? "border-b-2 border-fg font-medium text-fg"
                  : "text-muted-fg hover:text-fg"
              }`}
            >
              {tab.label} ({counts[tab.value]})
            </Link>
          )
        })}
      </nav>

      <CommentsTable
        initialItems={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  )
}
