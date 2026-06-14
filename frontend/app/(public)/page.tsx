import Link from 'next/link';

import { Button } from '@/components/ui/button';

/**
 * 首页（占位）。
 * Phase 2 将接入文章列表流。
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          TZBlog
        </h1>
        <p className="text-lg text-muted-foreground">
          个人技术博客平台 · 分享前端、后端与全栈开发实践
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/articles">浏览文章</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/about">关于</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        技术栈：Next.js 16 · React 19 · TypeScript · Tailwind CSS v4
      </p>
    </main>
  );
}
