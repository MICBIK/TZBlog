import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '板块与置顶 · tzblog',
  robots: { index: false, follow: false },
};

export default function AdminSectionsPage() {
  return (
    <main className="mx-auto max-w-[920px] px-6 py-12">
      <div className="rounded-lg border border-line bg-panel p-6">
        <div className="font-mono text-xs text-muted-foreground">
          admin / sections
        </div>
        <h1 className="mt-3 text-2xl font-bold text-fg-strong">板块与置顶</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          后端当前仅提供分类和标签的创建/读取接口，尚未提供导航板块排序、
          显示开关、首页置顶文章或保存站点布局的接口。因此本页不再展示原型态的保存成功交互。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/articles"
            className="rounded-md border border-acc-dim bg-acc/10 px-4 py-2 font-mono text-sm text-acc hover:bg-acc/[0.16]"
          >
            管理文章
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-md border border-line px-4 py-2 font-mono text-sm text-muted-foreground hover:text-acc"
          >
            查看设置
          </Link>
        </div>
      </div>
    </main>
  );
}
