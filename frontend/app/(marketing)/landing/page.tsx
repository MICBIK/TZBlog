import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/lib/constants';
import { HeroTerminal } from './_components/HeroTerminal';
import { LandingClientBehaviors } from './_components/LandingClientBehaviors';

export const metadata: Metadata = {
  title: 'tzblog · 中文优先的技术与生活博客',
  description:
    'tzblog——把 AI Coding 与全栈工程的真实踩坑写成能反复查阅的笔记。中文优先的技术博客，by haiden。',
  alternates: { canonical: 'https://tzcode.top/landing' },
  openGraph: {
    type: 'website',
    siteName: 'tzblog',
    locale: 'zh_CN',
    title: 'tzblog · 中文优先的技术与生活博客',
    description:
      '把 AI Coding 与全栈工程的真实踩坑写成能反复查阅的笔记。by haiden。',
    url: 'https://tzcode.top/landing',
  },
  twitter: { card: 'summary' },
};

// 五条内容线（1:1 还原原型 .lines）
const LINES: ReadonlyArray<{
  no: string;
  nm: string;
  ds: string;
  href: string;
}> = [
  {
    no: '01',
    nm: 'AI Coding',
    ds: 'spec-first 工作流、模型协作、提示工程的真实实践',
    href: ROUTES.SEARCH,
  },
  {
    no: '02',
    nm: '全栈工程',
    ds: 'Next.js / Go / Postgres / Docker 的性能与架构踩坑',
    href: ROUTES.SEARCH,
  },
  {
    no: '03',
    nm: '工具效率',
    ds: '终端配置、开发流、把重复劳动自动化掉',
    href: ROUTES.SEARCH,
  },
  {
    no: '04',
    nm: '随笔思考',
    ds: '写博客这件事本身、技术人的长期主义',
    href: ROUTES.SEARCH,
  },
  {
    no: '05',
    nm: '作品项目',
    ds: '开源仓库与个人项目，附复盘',
    href: ROUTES.WORKS,
  },
];

// 六张特性卡（1:1 还原原型 .feat）
const FEATURES: ReadonlyArray<{ ic: string; h: string; p: string }> = [
  {
    ic: '❯_',
    h: '真实而非二手',
    p: 'spec-first 工作流、RSC 缓存 7 个坑、Go 重写 120ms→18ms —— 全是自己项目里验证过的，不是翻译搬运。',
  },
  {
    ic: '⌕',
    h: '全文秒搜',
    p: 'Meilisearch 驱动，输入即过滤、关键词高亮、分类叠加，找回三个月前那篇笔记只要两秒。',
  },
  {
    ic: '⊟',
    h: '成体系成路径',
    p: '散落的文章串成 AI Coding / 全栈工程 / 从 0 搭博客三条学习路径，带进度，知道下一步读什么。',
  },
  {
    ic: '{ }',
    h: '代码与公式一等公民',
    p: 'Shiki 语法高亮 + KaTeX 公式渲染，技术内容该有的呈现，复制即用。',
  },
  {
    ic: '∿',
    h: '开放可读',
    p: '匿名即可读全文（SEO 友好），登录解锁点赞、收藏、跨设备同步阅读进度。',
  },
  {
    ic: '↗',
    h: '作品与思考并存',
    p: '不只技术 —— 工具效率、随笔思考、开源作品，一个完整的 haiden。',
  },
];

// 数据条（1:1 还原原型 .stats）
const STATS: ReadonlyArray<{ v: string; l: string }> = [
  { v: '128', l: '已发布文章' },
  { v: '38.6万', l: '累计字数' },
  { v: '412', l: '持续更新天数' },
  { v: '1.2k', l: '本月读者' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── NAV ── */}
      <nav className="border-line sticky top-0 z-20 border-b bg-[rgba(10,14,20,.78)] backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-[26px] py-[14px]">
          <div className="flex items-center gap-[9px] font-mono text-[15px] font-semibold">
            <i className="bg-acc size-[9px] rounded-full not-italic shadow-[0_0_8px_var(--acc)]" />
            tzblog
          </div>
          <div className="text-fg/85 flex items-center gap-[22px] text-[13.5px]">
            <a href="#features" className="hover:text-acc max-[680px]:hidden">
              特性
            </a>
            <a href="#lines" className="hover:text-acc max-[680px]:hidden">
              内容
            </a>
            <Link
              href={ROUTES.HOME}
              className="hover:text-acc max-[680px]:hidden"
            >
              进入博客
            </Link>
            <Link
              href={ROUTES.HOME}
              className="border-acc-dim bg-acc/12 text-acc rounded-[7px] border px-[14px] py-[7px] font-mono text-[12.5px]"
            >
              查看原型 ↗
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="mx-auto grid w-full max-w-[1080px] grid-cols-2 items-center gap-[44px] px-[26px] pb-[52px] pt-[74px] max-[820px]:grid-cols-1 max-[820px]:gap-[32px]">
        <div>
          <span className="text-acc border-acc-dim bg-acc/8 mb-[20px] inline-flex items-center gap-2 rounded-[20px] border px-[11px] py-[5px] font-mono text-[12px]">
            <i className="bg-acc inline-block size-[6px] rounded-full" />
            中文优先 · 技术与生活
          </span>
          <h1 className="text-fg-strong mb-[18px] text-[clamp(30px,4.4vw,46px)] font-bold leading-[1.12] tracking-[-.015em]">
            把<span className="text-acc"> AI Coding 与全栈工程</span>
            的真实踩坑，写成能反复查的笔记。
          </h1>
          <p className="text-fg/85 mb-[26px] max-w-[480px] font-sans text-[16px] max-[820px]:max-w-none">
            tzblog 是 haiden 的个人技术博客 ——
            不堆教程八股，只记真实项目里验证过的方法、性能数字和反直觉结论。五条内容线，全文可搜，成体系成路径。
          </p>
          <div className="flex flex-wrap gap-[12px]">
            <Link
              href={ROUTES.HOME}
              data-ripple
              className="border-acc-dim bg-acc/14 text-acc hover:bg-acc/20 relative inline-flex items-center gap-2 overflow-hidden rounded-[9px] border px-[20px] py-[11px] font-mono text-[13.5px] transition-[.15s]"
            >
              开始阅读 →
            </Link>
            <Link
              href={ROUTES.SEARCH}
              data-ripple
              className="border-line bg-panel text-fg hover:border-dim relative inline-flex items-center gap-2 overflow-hidden rounded-[9px] border px-[20px] py-[11px] font-mono text-[13.5px] transition-[.15s]"
            >
              ⌕ 全文搜索
            </Link>
          </div>
        </div>
        <HeroTerminal />
      </header>

      {/* ── STATS ── */}
      <div className="mx-auto w-full max-w-[1080px] px-[26px]">
        <div className="grid grid-cols-4 gap-[14px] py-[8px] max-[680px]:grid-cols-2">
          {STATS.map((s) => (
            <div
              key={s.l}
              className="border-line bg-panel rounded-[11px] border px-[16px] py-[18px] text-center"
            >
              <div className="text-acc font-mono text-[26px] font-semibold tabular-nums">
                {s.v}
              </div>
              <div className="text-muted mt-[4px] text-[12.5px]">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section
        id="features"
        className="mx-auto w-full max-w-[1080px] px-[26px] py-[58px]"
      >
        <div className="mx-auto mb-[38px] max-w-[560px] text-center">
          <span className="text-acc font-mono text-[11px] uppercase tracking-[.12em]">
            why tzblog
          </span>
          <h2 className="text-fg-strong my-[10px] text-[clamp(24px,3vw,32px)] font-bold tracking-[-.01em]">
            不是又一个搬运教程的博客
          </h2>
          <p className="text-fg/85">
            每篇都来自真实项目，带可复现的代码、性能数字和踩过的坑。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-[16px] max-[820px]:grid-cols-1">
          {FEATURES.map((f) => (
            <div
              key={f.h}
              className="border-line bg-panel hover:border-acc-dim group rounded-[12px] border px-[20px] py-[22px] transition-[.16s] hover:-translate-y-[3px]"
            >
              <div className="text-acc border-acc-dim bg-acc/10 mb-[14px] grid size-[42px] place-items-center rounded-[10px] border font-mono text-[18px]">
                {f.ic}
              </div>
              <h3 className="text-fg-strong mb-[7px] text-[16px] font-semibold">
                {f.h}
              </h3>
              <p className="text-muted text-[13.5px] leading-[1.6]">{f.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FIVE LINES ── */}
      <section
        id="lines"
        className="mx-auto w-full max-w-[1080px] px-[26px] py-[58px]"
      >
        <div className="mx-auto mb-[38px] max-w-[560px] text-center">
          <span className="text-acc font-mono text-[11px] uppercase tracking-[.12em]">
            five lines
          </span>
          <h2 className="text-fg-strong my-[10px] text-[clamp(24px,3vw,32px)] font-bold tracking-[-.01em]">
            五条内容线
          </h2>
          <p className="text-fg/85">
            从工程实战到生活思考，覆盖一个技术人的完整表达。
          </p>
        </div>
        <div className="border-line flex flex-col gap-px overflow-hidden rounded-[12px] border">
          {LINES.map((ln) => (
            <Link
              key={ln.no}
              href={ln.href}
              className="bg-panel hover:bg-bg2 flex items-center gap-[16px] px-[20px] py-[16px] transition-[.15s]"
            >
              <span className="text-acc shrink-0 font-mono text-[13px]">
                {ln.no}
              </span>
              <span className="min-w-[96px] shrink-0 font-semibold">
                {ln.nm}
              </span>
              <span className="text-muted text-[13.5px]">{ln.ds}</span>
              <span className="text-dim ml-auto font-mono">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SUBSCRIBE CTA ── */}
      <section className="mx-auto w-full max-w-[1080px] px-[26px] py-[58px]">
        <div className="border-acc-dim from-acc/8 to-panel relative overflow-hidden rounded-[16px] border bg-gradient-to-b px-[28px] py-[44px] text-center after:absolute after:left-1/2 after:top-[-60px] after:size-[240px] after:-translate-x-1/2 after:rounded-full after:bg-[radial-gradient(circle,rgba(63,224,143,.12),transparent_70%)] after:content-['']">
          <h2 className="text-fg-strong relative mb-[12px] text-[clamp(24px,3vw,32px)] font-bold">
            订阅 tzblog
          </h2>
          <p className="text-fg/85 relative mb-[24px]">
            新文章发布时收到一封邮件，不发广告，随时退订。
          </p>
          <form
            data-subscribe
            className="relative mx-auto flex max-w-[420px] gap-[10px] max-[560px]:flex-col"
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="border-line text-fg focus:border-acc-dim flex-1 rounded-[9px] border bg-[#0d1219] px-[14px] py-[11px] font-mono text-[13px] focus:shadow-[0_0_0_3px_rgba(63,224,143,.08)] focus:outline-none"
            />
            <button
              type="submit"
              data-ripple
              className="border-acc-dim bg-acc/14 text-acc hover:bg-acc/20 relative overflow-hidden rounded-[9px] border px-[20px] py-[11px] font-mono text-[13.5px] transition-[.15s]"
            >
              订阅 →
            </button>
          </form>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-line mt-[20px] border-t py-[26px]">
        <div className="text-muted mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-[12px] px-[26px] font-mono text-[12px]">
          <span>tzblog · haiden · tzcode.top</span>
          <div className="flex gap-[18px]">
            <Link href={ROUTES.HOME} className="hover:text-acc">
              博客
            </Link>
            <Link href={ROUTES.WORKS} className="hover:text-acc">
              作品
            </Link>
            <Link href={ROUTES.HOME} className="hover:text-acc">
              原型入口
            </Link>
            <span>© 2026</span>
          </div>
        </div>
      </footer>

      <LandingClientBehaviors />
    </div>
  );
}
