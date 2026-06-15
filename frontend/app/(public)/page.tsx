import Link from 'next/link';

import { getArticles } from '@/lib/api/article';
import { getTags } from '@/lib/api/tag';
import { TerminalWindow } from '@/components/shared/TerminalWindow';
import { ArticlePost } from '@/components/article/ArticlePost';
import { SidebarWidget } from '@/components/article/SidebarWidget';

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
  const total = latestResult.metadata?.total ?? articles.length;

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-12">
      {/* HERO — 终端窗口（设计稿第 220-244 行）*/}
      <section className="pb-[30px] pt-[46px]">
        <TerminalWindow title="~/welcome.md — pinned">
          {/* cmd 命令行 */}
          <p className="text-muted mb-[18px] font-mono text-[13.5px]">
            <span className="text-acc">$</span> cat{' '}
            <span className="text-amber">welcome.md</span>{' '}
            <span className="text-acc">--render</span>
          </p>

          {/* 置顶标记 */}
          <span className="text-amber mb-3.5 inline-flex items-center gap-1.5 font-mono text-[11.5px] uppercase tracking-[.12em]">
            ★ 置顶 · 全栈工程
          </span>

          {/* 标题 */}
          <h1 className="text-fg-strong max-w-[18ch] font-sans text-[clamp(28px,4.4vw,46px)] font-bold leading-[1.18] tracking-[-.01em]">
            在终端里书写<span className="text-acc">代码</span>与思考
          </h1>

          {/* lead */}
          <p className="text-fg mt-4 max-w-[62ch] font-sans text-[clamp(15px,1.4vw,17px)] leading-[1.75] opacity-85">
            TZBlog — 一个开发者的工作台，记录前端、后端与全栈的实践笔记。 从
            Next.js 到 Go，从 TypeScript 到 PostgreSQL，分享真实的项目经验。
          </p>

          {/* byline */}
          <div className="text-muted mt-6 flex items-center gap-[11px] font-mono text-[13px]">
            <span className="border-acc-dim bg-acc/10 text-acc grid size-[34px] place-items-center rounded-[7px] border text-[12px] font-bold">
              H
            </span>
            <b className="text-fg-strong font-semibold">haiden</b>
            <span className="text-dim">·</span>
            <span>全栈开发</span>
            <span className="text-dim">·</span>
            <span>{new Date().getFullYear()}</span>
          </div>

          {/* CTA */}
          <div className="mt-[26px] flex flex-wrap gap-2.5">
            <Link
              href="/articles"
              className="bg-acc relative overflow-hidden rounded-[6px] px-[18px] py-2.5 font-mono text-[13.5px] font-bold text-[#06120b] transition-shadow duration-[.16s] hover:shadow-[0_0_0_3px_rgba(63,224,143,0.18)]"
            >
              <span className="opacity-60">$ </span>
              ls articles/
            </Link>
            <Link
              href="/about"
              className="border-line2 text-fg hover:border-acc-dim hover:text-acc rounded-[6px] border px-[18px] py-2.5 font-mono text-[13.5px] transition-colors duration-[.16s]"
            >
              cat about.md
            </Link>
          </div>
        </TerminalWindow>
      </section>

      {/* grid — 文章流 + 侧边栏（设计稿第 246-345 行）*/}
      <div className="grid grid-cols-1 items-start gap-11 pb-[70px] pt-3.5 sm:grid-cols-[1fr_300px]">
        {/* 文章流 */}
        <div>
          {/* section-cmd */}
          <div className="text-muted mb-4 mt-[30px] flex items-center gap-2 font-mono text-[13px] first:mt-1.5">
            <span className="text-acc">$</span> ls -lt posts/
            <span className="text-dim ml-auto text-[12px]">
              # 按时间倒序 · 最近更新
            </span>
          </div>

          {/* 精选文章（第一个用大卡片或直接 post）*/}
          {featured && <ArticlePost article={featured} />}

          {/* 其余文章 */}
          {rest.map((article) => (
            <ArticlePost key={article.id} article={article} />
          ))}

          {articles.length === 0 && (
            <div className="border-line text-muted rounded-[8px] border border-dashed py-12 text-center font-mono text-sm">
              <span className="text-acc">haiden@tzblog</span>:~$ ls posts/
              <p className="mt-2">目录为空，等待第一篇文章…</p>
            </div>
          )}
        </div>

        {/* 侧边栏 — sticky（设计稿第 303-345 行）*/}
        <aside className="flex flex-col gap-[18px] max-sm:static sm:sticky sm:top-[78px]">
          {/* stat widget */}
          <SidebarWidget command="stat ./site">
            <SidebarWidget.StatRow label="文章总数" value={total} />
            <SidebarWidget.StatRow label="建站天数" value={412} />
            <SidebarWidget.StatRow label="本月访客" value="1.2k" />
            <SidebarWidget.StatRow label="最近更新" value="今天" />
          </SidebarWidget>

          {/* friends widget */}
          <SidebarWidget command="cat friends.txt">
            <SidebarWidget.FriendLink name="阮一峰" tag="周刊" />
            <SidebarWidget.FriendLink name="云游君" tag="设计" />
            <SidebarWidget.FriendLink name="张洪 Heo" tag="折腾" />
            <SidebarWidget.FriendLink name="Innei" tag="全栈" />
          </SidebarWidget>

          {/* tags widget */}
          {tags.length > 0 && (
            <SidebarWidget command="ls tags/">
              <div className="flex flex-wrap gap-[7px]">
                {tags.slice(0, 8).map((tag) => (
                  <SidebarWidget.TagCloudItem
                    key={tag.id}
                    name={tag.name}
                    href={`/articles?tag=${tag.slug}`}
                  />
                ))}
              </div>
            </SidebarWidget>
          )}
        </aside>
      </div>
    </main>
  );
}
