import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-muted-foreground text-6xl font-bold">404</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">页面未找到</h1>
        <p className="text-muted-foreground text-sm">
          你访问的页面不存在或已被移动。
        </p>
      </div>
      <Button asChild>
        <Link href="/">返回首页</Link>
      </Button>
    </main>
  );
}
