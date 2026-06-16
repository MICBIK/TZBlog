import type { Metadata } from 'next';
import Link from 'next/link';

import { HomeClientBehaviors } from '@/components/front-home/HomeClientBehaviors';

export const metadata: Metadata = {
  title: 'tzblog · haiden 的技术博客',
  description:
    'haiden 的中文技术博客 tzblog：记录 AI Coding、全栈工程、工具效率与随笔思考。浏览最新文章、热门标签与学习路径。',
  alternates: { canonical: 'https://tzcode.top/' },
  openGraph: {
    type: 'website',
    siteName: 'tzblog',
    locale: 'zh_CN',
    title: 'tzblog · haiden 的技术博客',
    description: '记录 AI Coding、全栈工程、工具效率与随笔思考的中文技术博客。',
    url: 'https://tzcode.top/',
  },
  twitter: { card: 'summary' },
};

/**
 * 前台首页 — 1:1 还原 front-home.html。
 * 终端暗色：近黑画布 + 单磷光绿 accent + 命令行语义。结构/样式/中文文案照搬原型。
 * 共享外壳层（Header/Footer/背景动效/光标）由 (public)/layout.tsx + RootLayout 注入。
 * 交互（代码复制 / data-msg toast / 滚动入场）由 HomeClientBehaviors 复刻原型内联 JS。
 */
export default function HomePage() {
  return (
    <main className="relative z-[1] mx-auto max-w-[1080px] px-6">
      {/* ── HERO：置顶大卡（终端会话）── */}
      <section className="rv pb-[30px] pt-[46px] max-[860px]:pb-[18px] max-[860px]:pt-[30px]">
        <div className="from-panel to-bg2 overflow-hidden rounded-[10px] border border-[var(--line)] bg-gradient-to-b shadow-[0_30px_80px_-40px_rgba(0,0,0,.8)]">
          <div className="bg-panel2 flex items-center gap-2 border-b border-[var(--line)] px-[15px] py-[11px]">
            <span className="size-[11px] rounded-full bg-[#ff5f57]" />
            <span className="size-[11px] rounded-full bg-[#febc2e]" />
            <span className="size-[11px] rounded-full bg-[#28c840]" />
            <span className="text-dim ml-2 text-[12.5px]">
              ~/posts/2026/spec-first-workflow.md — pinned
            </span>
          </div>
          <div className="px-[30px] pb-[30px] pt-[26px]">
            <p className="text-muted mb-[18px] text-[13.5px]">
              <span className="text-acc">$</span> cat{' '}
              <span className="text-amber">pinned.md</span> --render
            </p>
            <span className="text-amber mb-3.5 inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[.12em] before:content-['★']">
              {' '}
              置顶 · AI Coding
            </span>
            <h1 className="text-fg-strong max-w-[18ch] font-sans text-[clamp(28px,4.4vw,46px)] font-bold leading-[1.18] tracking-[-.01em]">
              我用 spec-first 工作流让 Claude 连续写对 3000 行代码
            </h1>
            <p className="text-fg mt-4 max-w-[62ch] font-sans text-[clamp(15px,1.4vw,17px)] leading-[1.75] opacity-85">
              把“我想做个功能”翻译成 agent
              能稳定执行的输入，靠的不是更长的 prompt，而是写在前面的 spec、最便宜的验证层，和一份能回放的失败轨迹。这是我半年来真实跑通、并且敢交给生产的循环。
            </p>
            <div className="text-muted mt-6 flex items-center gap-[11px] text-[13px]">
              <span className="border-acc-dim bg-acc/10 text-acc grid size-[34px] place-items-center rounded-[7px] border text-[12px] font-bold">
                HA
              </span>
              <span>
                <b className="text-fg-strong font-semibold">haiden</b>
              </span>
              <span className="text-dim">·</span>
              <span>2026-05-28</span>
              <span className="text-dim">·</span>
              <span>22 min</span>
              <span className="text-dim">·</span>
              <span>3.2k 阅读</span>
            </div>
            <div className="mt-[26px] flex flex-wrap gap-2.5">
              <Link
                href="/articles/spec-first-workflow"
                className="bg-acc relative overflow-hidden rounded-[6px] px-[18px] py-2.5 text-[13.5px] font-bold text-[#06120b] transition-[.16s] before:opacity-60 before:content-['$_'] hover:shadow-[0_0_0_3px_rgba(63,224,143,.18)]"
              >
                read
              </Link>
              <button
                type="button"
                data-msg="已加入稍后阅读队列"
                className="border-line2 text-fg hover:border-acc-dim hover:text-acc rounded-[6px] border px-[18px] py-2.5 text-[13.5px] transition-[.16s]"
              >
                稍后读
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* ── 文章流 + 侧栏 ── */}
      <div className="grid grid-cols-1 items-start gap-11 pb-[70px] pt-3.5 min-[861px]:grid-cols-[1fr_300px] max-[860px]:gap-[30px]">
        {/* ARTICLE STREAM */}
        <div>
          <div className="text-muted mb-4 mt-1.5 flex items-center gap-2 text-[13px]">
            <span className="text-acc">$</span> ls -lt posts/
            <span className="text-dim ml-auto text-[12px]"># 按时间倒序 · 最近更新</span>
          </div>

          <Link
            href="/articles/rsc-cache-7-traps"
            className="post rv border-line bg-panel hover:border-acc-dim hover:bg-panel2 relative mb-3 block overflow-hidden rounded-[8px] border px-5 py-[18px] transition-[.18s] hover:translate-x-[3px]"
          >
            <span className="bg-acc absolute bottom-0 left-0 top-0 w-0.5 origin-top scale-y-0 transition-[.22s] group-hover:scale-y-100" />
            <div className="text-dim mb-2 flex flex-wrap gap-3 text-[11.5px]">
              <span className="text-acc-dim">-rw-r--r--</span>
              <span>2026-05-22</span>
              <span className="text-muted before:text-dim before:content-['#']">Next.js</span>
              <span className="text-muted before:text-dim before:content-['#']">RSC</span>
            </div>
            <h3 className="text-fg-strong font-sans text-[18px] font-semibold leading-[1.4]">
              Next.js 15 RSC 缓存的 7 个坑，以及我后来怎么排的
            </h3>
            <p className="text-muted mt-[7px] font-sans text-[14px] leading-[1.65] opacity-90">
              从 <code>fetch</code> 默认缓存、<code>revalidatePath</code>{' '}
              不生效、到 Server Action
              的隐式缓存边界——每个坑都附了最小复现和我最终用的 mental model。
            </p>
            <div className="text-dim mt-3 flex gap-4 text-[11.5px]">
              <span><b className="text-fg font-semibold">14</b> min</span>
              <span><b className="text-fg font-semibold">1.8k</b> 阅读</span>
              <span><b className="text-fg font-semibold">96</b> 赞</span>
              <span><b className="text-fg font-semibold">53</b> 收藏</span>
            </div>
          </Link>

          <Link
            href="/articles/go-rewrite-p99"
            className="post rv border-line bg-panel hover:border-acc-dim hover:bg-panel2 relative mb-3 block overflow-hidden rounded-[8px] border px-5 py-[18px] transition-[.18s] hover:translate-x-[3px]"
          >
            <span className="bg-acc absolute bottom-0 left-0 top-0 w-0.5 origin-top scale-y-0 transition-[.22s] group-hover:scale-y-100" />
            <div className="text-dim mb-2 flex flex-wrap gap-3 text-[11.5px]">
              <span className="text-acc-dim">-rw-r--r--</span>
              <span>2026-05-14</span>
              <span className="text-muted before:text-dim before:content-['#']">Go</span>
              <span className="text-muted before:text-dim before:content-['#']">性能</span>
            </div>
            <h3 className="text-fg-strong font-sans text-[18px] font-semibold leading-[1.4]">
              把后端从 Node 重写成 Go：p99 从 120ms 压到 18ms 的全过程
            </h3>
            <p className="text-muted mt-[7px] font-sans text-[14px] leading-[1.65] opacity-90">
              不是语言玄学。真正的提升来自连接池复用、零拷贝序列化和把热路径上的反射干掉——附 pprof 火焰图前后对比。
            </p>
            <div className="text-dim mt-3 flex gap-4 text-[11.5px]">
              <span><b className="text-fg font-semibold">18</b> min</span>
              <span><b className="text-fg font-semibold">2.4k</b> 阅读</span>
              <span><b className="text-fg font-semibold">141</b> 赞</span>
              <span><b className="text-fg font-semibold">88</b> 收藏</span>
            </div>
          </Link>

          <div className="text-muted mb-4 mt-[30px] flex items-center gap-2 text-[13px]">
            <span className="text-acc">$</span> grep -l &quot;AI Coding&quot; posts/
            <span className="text-dim ml-auto text-[12px]"># 这条线最常被收藏</span>
          </div>

          {/* 代码块文章（非链接，cursor:default）*/}
          <article className="post rv border-line bg-panel relative mb-3 block overflow-hidden rounded-[8px] border px-5 py-[18px] transition-[.18s] [cursor:default]">
            <div className="text-dim mb-2 flex flex-wrap gap-3 text-[11.5px]">
              <span className="text-acc-dim">-rw-r--r--</span>
              <span>2026-05-28</span>
              <span className="text-muted before:text-dim before:content-['#']">prompt</span>
              <span className="text-muted before:text-dim before:content-['#']">agent</span>
            </div>
            <h3 className="text-fg-strong font-sans text-[18px] font-semibold leading-[1.4]">
              spec-first 的核心：先写「验收脚本」，再让 agent 去满足它
            </h3>
            <p className="text-muted mt-[7px] font-sans text-[14px] leading-[1.65] opacity-90">
              下面是我每个功能开工前都会先落的最小验证层——它比任何 prompt 技巧都更能让 agent 一次写对：
            </p>
            <div className="codeblock border-line my-[18px] overflow-hidden rounded-[8px] border bg-[#080c11]">
              <div className="bg-panel2 border-line flex items-center gap-2.5 border-b px-[13px] py-2 text-[12px]">
                <span className="text-acc font-semibold">bash</span>
                <span className="text-dim">verify.sh</span>
                <button
                  type="button"
                  data-copy
                  className="copy border-line2 text-muted hover:border-acc-dim hover:text-acc ml-auto rounded-[5px] border px-2.5 py-1 text-[11.5px] transition-[.15s]"
                >
                  copy
                </button>
              </div>
              <div className="flex overflow-x-auto text-[13px] leading-[1.7]">
                <div className="text-dim border-line select-none border-r py-3.5 pl-3.5 text-right [&>span]:block">
                  <span>1</span><span>2</span><span>3</span><span>4</span>
                  <span>5</span><span>6</span><span>7</span>
                </div>
                <pre data-code className="text-fg overflow-x-auto whitespace-pre px-4 py-3.5">
                  <span className="italic text-[var(--dim)]"># 验收脚本先于实现存在——agent 的唯一目标是让它全绿</span>{'\n'}
                  <span className="text-[#ff7b9c]">set</span> -euo pipefail{'\n'}
                  {'\n'}
                  pnpm tsc --noEmit              <span className="italic text-[var(--dim)]"># 类型先过</span>{'\n'}
                  pnpm vitest run spec/<span className="text-amber">checkout</span>  <span className="italic text-[var(--dim)]"># 行为契约</span>{'\n'}
                  node scripts/replay.js <span className="text-acc">&quot;last-failure&quot;</span>  <span className="italic text-[var(--dim)]"># 回放上次失败轨迹</span>{'\n'}
                  <span className="text-[#ff7b9c]">echo</span> <span className="text-acc">&quot;✓ spec satisfied&quot;</span>
                </pre>
              </div>
            </div>
            <p className="text-muted mt-[7px] font-sans text-[14px] leading-[1.65] opacity-90">
              关键不是脚本写得多漂亮，而是它
              <b className="text-fg">在 agent 动手之前就存在</b>
              ——这把“我以为它懂了”变成“它必须通过的闸门”。
            </p>
          </article>

          <Link
            href="/articles/terminal-setup-2026"
            className="post rv border-line bg-panel hover:border-acc-dim hover:bg-panel2 relative mb-3 block overflow-hidden rounded-[8px] border px-5 py-[18px] transition-[.18s] hover:translate-x-[3px]"
          >
            <span className="bg-acc absolute bottom-0 left-0 top-0 w-0.5 origin-top scale-y-0 transition-[.22s] group-hover:scale-y-100" />
            <div className="text-dim mb-2 flex flex-wrap gap-3 text-[11.5px]">
              <span className="text-acc-dim">-rw-r--r--</span>
              <span>2026-04-30</span>
              <span className="text-muted before:text-dim before:content-['#']">terminal</span>
              <span className="text-muted before:text-dim before:content-['#']">dotfiles</span>
            </div>
            <h3 className="text-fg-strong font-sans text-[18px] font-semibold leading-[1.4]">
              2026 我的终端配置：zsh + 一套自己写的 git 别名
            </h3>
            <p className="text-muted mt-[7px] font-sans text-[14px] leading-[1.65] opacity-90">
              不堆插件。只留真正每天在用的：fzf 驱动的分支切换、一个把 commit 信息写规范的 hook、和让 ssh 多机同步 dotfiles 的脚本。
            </p>
            <div className="text-dim mt-3 flex gap-4 text-[11.5px]">
              <span><b className="text-fg font-semibold">9</b> min</span>
              <span><b className="text-fg font-semibold">1.1k</b> 阅读</span>
              <span><b className="text-fg font-semibold">67</b> 赞</span>
              <span><b className="text-fg font-semibold">40</b> 收藏</span>
            </div>
          </Link>

          <Link
            href="/articles/100-posts-reflection"
            className="post rv border-line bg-panel hover:border-acc-dim hover:bg-panel2 relative mb-3 block overflow-hidden rounded-[8px] border px-5 py-[18px] transition-[.18s] hover:translate-x-[3px]"
          >
            <span className="bg-acc absolute bottom-0 left-0 top-0 w-0.5 origin-top scale-y-0 transition-[.22s] group-hover:scale-y-100" />
            <div className="text-dim mb-2 flex flex-wrap gap-3 text-[11.5px]">
              <span className="text-acc-dim">-rw-r--r--</span>
              <span>2026-04-12</span>
              <span className="text-muted before:text-dim before:content-['#']">随笔</span>
            </div>
            <h3 className="text-fg-strong font-sans text-[18px] font-semibold leading-[1.4]">
              写了 100 篇博客之后，我对“输出”这件事的几点反思
            </h3>
            <p className="text-muted mt-[7px] font-sans text-[14px] leading-[1.65] opacity-90">
              最有价值的不是流量，是被迫把模糊的直觉写到能跑通——以及那些因为一篇旧文找上门的真实合作。
            </p>
            <div className="text-dim mt-3 flex gap-4 text-[11.5px]">
              <span><b className="text-fg font-semibold">11</b> min</span>
              <span><b className="text-fg font-semibold">3.0k</b> 阅读</span>
              <span><b className="text-fg font-semibold">208</b> 赞</span>
              <span><b className="text-fg font-semibold">74</b> 收藏</span>
            </div>
          </Link>
        </div>

        {/* SIDEBAR */}
        <aside className="flex flex-col gap-[18px] min-[861px]:sticky min-[861px]:top-[78px] max-[860px]:static">
          {/* 站点统计 */}
          <div className="widget rv border-line bg-panel overflow-hidden rounded-[8px] border">
            <div className="widget-h bg-panel2 text-muted border-line border-b px-[15px] py-[11px] text-[12.5px]">
              <span className="text-acc">$</span> stat ./site
            </div>
            <div className="p-[15px]">
              {[
                ['文章总数', '128'],
                ['累计字数', '38.6 万'],
                ['建站天数', '412'],
                ['本月访客', '1.2k'],
                ['最近更新', '3 天前'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-[5px] text-[13px]">
                  <span className="text-muted">{l}</span>
                  <span className="text-acc font-semibold tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 最新评论 */}
          <div className="widget rv border-line bg-panel overflow-hidden rounded-[8px] border">
            <div className="widget-h bg-panel2 text-muted border-line border-b px-[15px] py-[11px] text-[12.5px]">
              <span className="text-acc">$</span> tail comments.log
            </div>
            <div className="p-[15px]">
              {[
                ['@林深', 'spec 那段直接照搬到我们 CI 里了，agent 返工率肉眼可见下降。', 'on / spec-first-workflow'],
                ['@coderwang', '第 4 个缓存坑踩了一周，看完才懂 revalidate 的边界。', 'on / rsc-cache-7-traps'],
                ['@阿吉', '火焰图前后对比太有说服力了，求 pprof 配置。', 'on / go-rewrite-p99'],
              ].map(([who, body, on]) => (
                <div
                  key={who}
                  className="border-line text-fg border-b border-dashed py-[9px] font-sans text-[13px] last:border-0"
                >
                  <span className="text-acc font-mono text-[12px]">{who}</span>：{body}
                  <div className="text-dim mt-[3px] text-[11.5px]">{on}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 友情链接 */}
          <div className="widget rv border-line bg-panel overflow-hidden rounded-[8px] border">
            <div className="widget-h bg-panel2 text-muted border-line border-b px-[15px] py-[11px] text-[12.5px]">
              <span className="text-acc">$</span> cat friends.txt
            </div>
            <div className="p-[15px]">
              {[
                ['阮一峰', '周刊', '跳转外链：阮一峰的网络日志'],
                ['云游君', '设计', '跳转外链：云游君'],
                ['张洪 Heo', '折腾', '跳转外链：张洪 Heo'],
                ['Innei', '全栈', '跳转外链：Innei'],
                ['纸鹿摸鱼处', '独立', '跳转外链：纸鹿摸鱼处'],
              ].map(([name, tag, msg]) => (
                <a
                  key={name}
                  href="#"
                  data-msg={msg}
                  className="text-fg hover:text-acc flex items-center gap-2 py-[7px] text-[13px] transition-[.15s] before:text-[var(--acc-dim)] before:content-['→']"
                >
                  {' '}
                  {name}
                  <span className="text-dim ml-auto font-sans text-[11.5px]">{tag}</span>
                </a>
              ))}
            </div>
          </div>

          {/* 热门标签 */}
          <div className="widget rv border-line bg-panel overflow-hidden rounded-[8px] border">
            <div className="widget-h bg-panel2 text-muted border-line border-b px-[15px] py-[11px] text-[12.5px]">
              <span className="text-acc">$</span> ls tags/
            </div>
            <div className="flex flex-wrap gap-[7px] p-[15px]">
              {[
                ['AI Coding', '31'],
                ['Next.js', '24'],
                ['Go', '18'],
                ['工具', '22'],
                ['随笔', '16'],
                ['Postgres', '9'],
              ].map(([name, ct]) => (
                <Link
                  key={name}
                  href="/search"
                  className="border-line2 text-muted hover:border-acc-dim hover:text-acc rounded-[5px] border px-[9px] py-1 text-[12px] transition-[.15s]"
                >
                  {name}
                  <span className="text-dim ml-1">{ct}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <HomeClientBehaviors />
    </main>
  );
}
