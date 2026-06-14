import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';

import { getArticles } from '@/lib/api/article';
import { getTags } from '@/lib/api/tag';
import { Button } from '@/components/ui/button';
import { ArticleCard } from '@/components/article/ArticleCard';

export const revalidate = 60;

export default async function HomePage() {
  const [latestResult, tags] = await Promise.all([
    getArticles({ limit: 6, sort: 'latest' }).catch(() => ({
      items: [],
      metadata: undefined,
    })),
    getTags().catch(() => []),
  ]);

  const articles = latestResult.items;
  const featured = articles[0];
  const rest = articles.slice(1, 6);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      {/* Hero */}
      <section className="mb-16 text-center">
        <div className="border-border bg-card text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-xs">
          <Terminal className="text-primary size-3" />
          <span className="text-primary">haiden@tzblog</span>
          <span>:~$</span>
          <span>cat welcome.md</span>
        </div>
        <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          在终端里
          <span className="text-primary">书写</span>
          代码与思考
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl">
          TZBlog — 一个开发者的工作台，记录前端、后端与全栈的实践笔记。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/articles">
              浏览文章
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/about">关于</Link>
          </Button>
        </div>
      </section>

      {articles.length > 0 ? (
        <section>
          <div className="mb-6 flex items-center gap-2">
            <h2 className="text-primary font-mono text-sm">{'// '}latest</h2>
            <div className="bg-border h-px flex-1" />
            <Link
              href="/articles"
              className="text-muted-foreground hover:text-primary font-mono text-xs"
            >
              查看全部 →
            </Link>
          </div>
          {featured && (
            <div className="mb-4">
              <ArticleCard article={featured} featured />
            </div>
          )}
          {rest.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i + 2} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="border-border rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground font-mono text-sm">
            <span className="text-primary">haiden@tzblog</span>:~$ ls articles/
          </p>
          <p className="text-muted-foreground mt-2">
            目录为空，等待第一篇文章…
          </p>
        </section>
      )}

      {tags.length > 0 && (
        <section className="mt-16">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-primary font-mono text-sm">{'// '}tags</h2>
            <div className="bg-border h-px flex-1" />
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/articles?tag=${tag.slug}`}
                className="border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary rounded border px-3 py-1 font-mono text-xs transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
