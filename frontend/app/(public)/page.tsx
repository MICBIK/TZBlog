import Link from 'next/link';

import { getArticles } from '@/lib/api/article';
import { getTags } from '@/lib/api/tag';
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
    <main className="mx-auto max-w-[1080px] px-6 py-12">
      {/* Hero — 终端窗口风格（还原设计稿 .term）*/}
      <section className="mb-12">
        <div className="border-border from-card overflow-hidden rounded-[10px] border bg-gradient-to-b to-[#0d1219] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
          {/* 终端标题栏 — 红黄绿圆点 */}
          <div className="border-border bg-secondary flex items-center gap-2 border-b px-4 py-[11px]">
            <span className="size-[11px] rounded-full bg-[#ff5f57]" />
            <span className="size-[11px] rounded-full bg-[#febc2e]" />
            <span className="size-[11px] rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[12.5px] text-[var(--dim)]">
              haiden@tzblog: ~/welcome — zsh
            </span>
          </div>

          {/* 终端正文 */}
          <div className="px-8 py-7">
            {/* 命令行 */}
            <p className="text-muted mb-5 font-mono text-[13.5px]">
              <span className="text-primary">haiden@tzblog</span>
              <span className="text-[var(--dim)]"> ~ $ </span>
              cat <span className="text-[var(--amber)]">README.md</span>
              <span className="cursor-blink" />
            </p>

            {/* Hero 标题 */}
            <h1 className="max-w-[18ch] font-sans text-[clamp(28px,4.4vw,46px)] font-bold leading-[1.18] tracking-tight text-[var(--fg-strong)]">
              在终端里书写<span className="text-primary">代码</span>与思考
            </h1>

            <p className="text-foreground mt-4 max-w-[62ch] font-sans text-[clamp(15px,1.4vw,17px)] leading-[1.75] opacity-85">
              TZBlog — 一个开发者的工作台，记录前端、后端与全栈的实践笔记。 从
              Next.js 到 Go，从 TypeScript 到 PostgreSQL，分享真实的项目经验。
            </p>

            {/* 作者署名 */}
            <div className="text-muted mt-6 flex items-center gap-[11px] font-mono text-[13px]">
              <span className="bg-primary/10 text-primary grid size-[34px] place-items-center rounded-[7px] border border-[var(--acc-dim)] text-[12px] font-bold">
                H
              </span>
              <b className="font-semibold text-[var(--fg-strong)]">haiden</b>
              <span className="text-[var(--dim)]">·</span>
              <span>全栈开发</span>
              <span className="text-[var(--dim)]">·</span>
              <span>{new Date().getFullYear()}</span>
            </div>

            {/* CTA */}
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href="/articles"
                className="bg-primary relative overflow-hidden rounded px-[18px] py-2.5 font-mono text-[13.5px] font-bold text-[#06120b] transition-shadow before:pr-1 before:opacity-60 before:content-['$_'] hover:shadow-[0_0_0_3px_rgba(63,224,143,0.18)]"
              >
                ls articles/
              </Link>
              <Link
                href="/about"
                className="text-foreground hover:text-primary rounded border border-[var(--line-2)] px-[18px] py-2.5 font-mono text-[13.5px] transition-colors hover:border-[var(--acc-dim)]"
              >
                cat about.md
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 最新文章流 */}
      {articles.length > 0 ? (
        <section>
          {/* section 命令行标题 */}
          <div className="text-muted mb-4 mt-8 flex items-center gap-2 font-mono text-[13px]">
            <span className="text-primary">$</span>
            <span>ls -lt</span>
            <span className="text-[var(--dim)]">./articles/</span>
            <span className="ml-auto text-[12px] text-[var(--dim)]">
              {articles.length} posts
            </span>
          </div>

          {/* 精选（大卡片） */}
          {featured && (
            <div className="mb-4">
              <ArticleCard article={featured} featured />
            </div>
          )}

          {/* 其余（网格） */}
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
          <p className="text-muted font-mono text-sm">
            <span className="text-primary">haiden@tzblog</span>:~$ ls articles/
          </p>
          <p className="text-muted mt-2">目录为空，等待第一篇文章…</p>
        </section>
      )}

      {/* 标签云 */}
      {tags.length > 0 && (
        <section className="mt-12">
          <div className="text-muted mb-4 flex items-center gap-2 font-mono text-[13px]">
            <span className="text-primary">$</span>
            <span>tags</span>
            <span className="text-[var(--dim)]">--list</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/articles?tag=${tag.slug}`}
                className="border-border bg-card text-muted hover:text-primary rounded border px-3 py-1 font-mono text-xs transition-colors hover:border-[var(--acc-dim)]"
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
