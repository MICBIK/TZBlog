import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于',
  description: '了解 TZBlog 及作者。',
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">关于 TZBlog</h1>
      <div className="prose text-muted-foreground">
        <p>
          TZBlog 是一个基于 Next.js 16 + React 19 前端与 Go
          后端的个人技术博客平台。
        </p>
        <p>本页面内容将在后续迭代中完善。</p>
      </div>
    </main>
  );
}
