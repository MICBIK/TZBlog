import type { Metadata } from 'next';
import Link from 'next/link';

import { ArticleProgress } from './_components/ArticleProgress';
import { ArticleSidebar } from './_components/ArticleSidebar';
import { CodeBlock } from './_components/CodeBlock';
import { CommentBox } from './_components/CommentBox';

export const metadata: Metadata = {
  title: 'spec-first 工作流 · tzblog',
  description:
    'spec-first 工作流：让 Claude 连续写对 3000 行代码。规格驱动的 AI Coding 实战教程，含完整方法与代码示例。',
  alternates: { canonical: 'https://tzcode.top/p/spec-first-claude-3000-lines' },
  openGraph: {
    type: 'article',
    siteName: 'tzblog',
    locale: 'zh_CN',
    title: 'spec-first 工作流：让 Claude 连续写对 3000 行',
    description: '规格驱动的 AI Coding 实战教程，含完整方法与代码示例。',
    url: 'https://tzcode.top/p/spec-first-claude-3000-lines',
  },
  twitter: { card: 'summary' },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'spec-first 工作流：让 Claude 连续写对 3000 行代码',
  inLanguage: 'zh-CN',
  author: { '@type': 'Person', name: 'haiden' },
  publisher: { '@type': 'Organization', name: 'tzblog' },
  mainEntityOfPage: 'https://tzcode.top/p/spec-first-claude-3000-lines',
  articleSection: 'AI Coding',
  keywords: 'AI Coding,Claude,spec-first,规格驱动开发',
};

const CODE_RAW = `# 验收脚本先于实现存在——agent 的唯一目标是让它全绿
set -euo pipefail

pnpm tsc --noEmit     # 类型先过
pnpm vitest run spec/checkout  # 行为契约
node scripts/replay.js "last-failure"  # 回放上次失败轨迹
echo "✓ spec satisfied"`;

const TAGS = ['AI Coding', 'prompt', 'agent', '工作流'];

// 代码高亮 token 颜色（还原原型 .k/.s/.c/.f/.n）
const K = { color: '#ff7b9c' };
const S = { color: 'var(--acc)' };
const C = { color: 'var(--dim)', fontStyle: 'italic' };
const F = { color: 'var(--amber)' };

export default function ArticleTutorialPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <ArticleProgress />

      <main className="relative z-[1] mx-auto max-w-[1080px] px-6">
        <div className="grid grid-cols-1 items-start gap-7 py-[38px] pb-[70px] md:grid-cols-[1fr_240px] md:gap-[50px]">
          {/* 正文 */}
          <article className="min-w-0">
            <p className="text-dim mb-[22px] font-mono text-[12.5px]">
              <span className="text-acc">$</span> cat{' '}
              <b className="text-muted-foreground font-normal">
                ~/posts/2026/spec-first-workflow.md
              </b>
            </p>

            <h1 className="text-fg-strong max-w-[20ch] font-sans text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] tracking-[-.01em]">
              我用 spec-first 工作流让 Claude 连续写对 3000 行代码
            </h1>

            <div className="text-muted-foreground mb-1 mt-5 flex flex-wrap items-center gap-[11px] text-[13px]">
              <span className="border-[var(--acc-dim)] text-acc grid size-8 place-items-center rounded-[7px] border bg-[rgba(63,224,143,.1)] text-xs font-bold">
                HA
              </span>
              <b className="text-fg-strong font-semibold">haiden</b>
              <span className="text-dim">·</span>
              <span>2026-05-28</span>
              <span className="text-dim">·</span>
              <span>22 min</span>
              <span className="text-dim">·</span>
              <span>3.2k 阅读</span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-[7px]">
              {TAGS.map((tag) => (
                <Link
                  key={tag}
                  href="/search"
                  className="border-[var(--line-2)] text-muted-foreground hover:text-acc rounded-[5px] border px-2.5 py-1 text-xs transition-colors duration-150 before:text-[var(--dim)] before:content-['#'] hover:border-[var(--acc-dim)]"
                >
                  {tag}
                </Link>
              ))}
            </div>

            <div className="border-line relative my-7 grid h-[200px] place-items-center overflow-hidden rounded-[10px] border bg-[linear-gradient(135deg,#0d1822,#0a0f15)] text-[13px] before:absolute before:inset-0 before:bg-[radial-gradient(rgba(63,224,143,.08)_1px,transparent_1px)] before:bg-[length:16px_16px]">
              <span className="text-muted-foreground relative">
                spec → verify → replay · 一个能回放的失败轨迹
              </span>
            </div>

            {/* prose */}
            <div className="text-fg font-sans text-[16.5px] leading-[1.85]">
              <ProseContent />

              {/* prev / next */}
              <div className="mt-12 grid grid-cols-1 gap-3.5 md:grid-cols-2">
                <Link
                  href="/articles/nextjs-15-rsc-cache"
                  className="border-line bg-panel hover:bg-panel2 rounded-lg border px-4 py-3.5 transition-colors duration-150 hover:border-[var(--acc-dim)]"
                >
                  <div className="text-[var(--acc-dim)] font-mono text-[11.5px]">
                    ← prev
                  </div>
                  <div className="text-fg-strong mt-[5px] font-sans text-sm leading-[1.4]">
                    Next.js 15 RSC 缓存的 7 个坑
                  </div>
                </Link>
                <Link
                  href="/articles/rewrite-backend-node-to-go"
                  className="border-line bg-panel hover:bg-panel2 rounded-lg border px-4 py-3.5 text-right transition-colors duration-150 hover:border-[var(--acc-dim)]"
                >
                  <div className="text-[var(--acc-dim)] font-mono text-[11.5px]">
                    next →
                  </div>
                  <div className="text-fg-strong mt-[5px] font-sans text-sm leading-[1.4]">
                    把后端从 Node 重写成 Go
                  </div>
                </Link>
              </div>

              {/* comments */}
              <section className="border-line mt-12 border-t pt-7">
                <div className="text-muted-foreground mb-[18px] font-mono text-[13px]">
                  <span className="text-acc">$</span> tail comments.log — 12
                  条评论
                </div>
                <CommentBox />
                <Comment
                  who="@林深"
                  when="2 天前"
                  text="spec 那段直接照搬到我们 CI 里了，agent 返工率肉眼可见下降。请问 replay 的 trace 格式方便开源一下吗？"
                />
                <Comment
                  who="@coderwang"
                  when="4 天前"
                  text="“把最快的反馈给 agent”——这句点醒我了，之前一直只靠 e2e 兜底，循环慢得要死。"
                />
                <Comment
                  who="@阿吉"
                  when="5 天前"
                  text="3000 行一次跑通有点夸张，但顺序倒过来这个思路确实成立，已经在小功能上验证了。"
                />
              </section>
            </div>
          </article>

          <ArticleSidebar />
        </div>
      </main>
    </>
  );

  function ProseContent() {
    return (
      <>
        <p className="my-[18px] opacity-[.92]">
          过去半年我让 agent 写过最长的一次，是一个 3000
          行的支付对账模块——一次性跑通、过了全部契约测试、上了生产。很多人以为关键是“更聪明的模型”或“更长的
          prompt”。
          <strong className="text-fg-strong">都不是。</strong>
          真正起作用的，是我把功能开工的顺序倒过来了：先写验证，再写实现，让 agent
          的唯一目标变成“让验证全绿”。
        </p>

        <H2 id="s1">为什么 prompt 越写越长反而越糟</H2>
        <p className="my-[18px] opacity-[.92]">
          越长的 prompt 越像“许愿”——你在描述一个你脑子里的成品，但 agent
          没有办法判断它有没有命中。它会很自信地写出一坨看起来对、跑起来错的代码。问题不在它的能力，在于
          <strong className="text-fg-strong">
            没有一个客观的、它够得到的成功信号
          </strong>
          。
        </p>
        <ul className="my-4 list-none pl-1">
          <Li>需求在你脑子里是模糊的，写成 prompt 时被迫具体化，但具体得不够</Li>
          <Li>agent 把“看起来合理”当成“正确”，因为没有更硬的标准</Li>
          <Li>你在 review 时才发现偏差，返工成本被推到了最后</Li>
        </ul>

        <H2 id="s2">spec-first：先写验收脚本</H2>
        <p className="my-[18px] opacity-[.92]">
          我现在每个功能开工前先落的，不是 prompt，而是一段
          <strong className="text-fg-strong">验收脚本</strong>。它先于实现存在，agent
          的任务就是让它从红变绿：
        </p>
        <CodeBlock lang="bash" fname="verify.sh" lines={7} raw={CODE_RAW}>
          <span style={C}># 验收脚本先于实现存在——agent 的唯一目标是让它全绿</span>
          {'\n'}
          <span style={K}>set</span> -euo pipefail{'\n'}
          {'\n'}
          pnpm tsc --noEmit     <span style={C}># 类型先过</span>
          {'\n'}
          pnpm vitest run spec/<span style={F}>checkout</span>{'  '}
          <span style={C}># 行为契约</span>
          {'\n'}
          node scripts/replay.js <span style={S}>&quot;last-failure&quot;</span>
          {'  '}
          <span style={C}># 回放上次失败轨迹</span>
          {'\n'}
          <span style={K}>echo</span> <span style={S}>&quot;✓ spec satisfied&quot;</span>
        </CodeBlock>
        <p className="my-[18px] opacity-[.92]">
          这三行分别对应三个闸门：
          <strong className="text-fg-strong">类型</strong>挡掉一半的低级错误，
          <strong className="text-fg-strong">契约测试</strong>
          把“我以为它懂了”变成“它必须通过”，
          <strong className="text-fg-strong">失败回放</strong>
          让上次踩过的坑不会重复掉进去。
        </p>

        <div className="my-6 rounded-r-lg border border-l-[3px] border-[var(--acc-dim)] bg-[rgba(63,224,143,.05)] px-5 py-4 text-[15px]">
          <div className="text-acc mb-1.5 font-mono text-[11.5px] uppercase tracking-[.1em]">
            核心洞察
          </div>
          关键不是脚本写得多漂亮，而是它在 agent 动手
          <strong className="text-fg-strong">之前</strong>就存在。验证层是 agent
          的“目标函数”——没有它，再聪明的模型也只是在猜你想要什么。
        </div>

        <H2 id="s3">最便宜的验证层放在哪</H2>
        <p className="my-[18px] opacity-[.92]">
          不是所有验证都值得写。我的排序是：
          <strong className="text-fg-strong">
            类型 &gt; 纯函数单测 &gt; 契约测试 &gt; e2e
          </strong>
          。越靠左越便宜、反馈越快，越应该让 agent 频繁撞它。e2e
          留到最后做兜底，而不是开发循环里的主力。
        </p>
        <H3>一个反直觉的点</H3>
        <p className="my-[18px] opacity-[.92]">
          很多人省略类型检查，觉得“反正测试会兜住”。但类型是{' '}
          <em className="text-amber not-italic">agent 写代码时</em>
          就能拿到的反馈，测试要跑起来才知道。把最快的反馈给 agent，它的收敛速度会肉眼可见地提升。
        </p>

        <H2 id="s4">失败轨迹回放</H2>
        <p className="my-[18px] opacity-[.92]">
          这是最被低估的一环。每次 agent
          失败，我把它的输入、输出、报错存成一条 trace。下次开工先{' '}
          <code className="border-line bg-panel2 text-acc rounded border px-1.5 py-px font-mono text-[14px]">
            replay
          </code>{' '}
          一遍历史失败——等于给 agent
          装了“长期记忆”，同一个坑不会掉第二次。半年下来，这个 trace
          库本身成了团队最值钱的资产。
        </p>
      </>
    );
  }
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-fg-strong mb-1 mt-[42px] flex scroll-mt-[72px] items-baseline gap-2.5 font-sans text-[24px] font-bold"
    >
      <span className="text-[var(--acc-dim)] font-mono text-[18px] font-bold">
        ##
      </span>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-fg-strong mb-1 mt-7 font-sans text-[18px] font-semibold">
      {children}
    </h3>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative my-[9px] pl-6 before:absolute before:left-1 before:text-[var(--acc-dim)] before:content-['▸']">
      {children}
    </li>
  );
}

function Comment({
  who,
  when,
  text,
}: {
  who: string;
  when: string;
  text: string;
}) {
  return (
    <div className="border-line border-b border-dashed py-3.5">
      <span className="text-acc font-mono text-[13px]">{who}</span>
      <span className="text-dim ml-2 text-[11.5px]">{when}</span>
      <p className="text-fg mt-1.5 font-sans text-sm leading-[1.6]">{text}</p>
    </div>
  );
}
