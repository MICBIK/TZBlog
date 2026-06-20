import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '媒体库 - 后台管理',
  description: 'TZBlog 后台媒体库',
  robots: { index: false, follow: false },
};

export default function MediaPage() {
  return (
    <main className="mx-auto max-w-[920px] px-6 py-12">
      <div className="rounded-lg border border-line bg-panel p-6">
        <div className="font-mono text-xs text-muted-foreground">
          admin / media
        </div>
        <h1 className="mt-3 text-2xl font-bold text-fg-strong">媒体库</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          后端目前只提供图片上传接口 `/uploads/images`，尚未提供媒体文件列表、
          删除、用量统计或分类管理接口。因此本页不再展示模拟文件网格。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/articles/new"
            className="rounded-md border border-acc-dim bg-acc/10 px-4 py-2 font-mono text-sm text-acc hover:bg-acc/[0.16]"
          >
            在编辑器中上传图片
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-line px-4 py-2 font-mono text-sm text-muted-foreground hover:text-acc"
          >
            返回控制台
          </Link>
        </div>
      </div>
    </main>
  );
}
