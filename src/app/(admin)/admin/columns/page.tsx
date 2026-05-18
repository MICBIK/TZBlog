import {
  listColumnsForLocale,
  countPostsInColumn,
} from "@/lib/services/columns";
import { getCurrentLocale } from "@/lib/i18n";
import { ColumnsTable } from "@/components/admin/columns/ColumnsTable";

// Server Component。"新建" 触发器与所有交互逻辑都在客户端组件 ColumnsTable 内部，
// 因为 server component 不能持有 dialog 等客户端状态。
export default async function ColumnsAdminPage() {
  const locale = getCurrentLocale();
  const columns = await listColumnsForLocale(locale);
  const withCounts = await Promise.all(
    columns.map(async (c) => ({
      ...c,
      postCount: await countPostsInColumn(c.id),
    })),
  );

  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">专栏管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理博客的内容分类。共 {withCounts.length} 个专栏。
          </p>
        </div>
      </header>
      <ColumnsTable initialColumns={withCounts} />
    </div>
  );
}
