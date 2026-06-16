import Link from 'next/link';

/**
 * Canonical 页脚 — 全站单一数据源（single source of truth）。
 * 1:1 还原原型 assets/site-chrome.js 的 FOOTER 常量 + site-chrome.css 的 .sf-* 样式。
 * 结构：.sf-main（品牌 + 社交 4 链 + 导航/账户/分类/友情链接 4 列）+ .sf-bottom（版权 · 备案 · Powered by）。
 * 历史上各页手写 footer 漂移成 7 种格式；这里是唯一来源，禁止各页再写 <footer>。
 */

/** 社交链接 — 对照原型 .sf-soc（生产替换为真实 href）*/
const SOCIAL = [
  { icon: '⌨', title: 'GitHub', msg: 'GitHub: github.com/haiden' },
  { icon: '✕', title: 'X', msg: 'X: @haiden_dev' },
  { icon: '⟳', title: 'RSS', msg: 'RSS: tzcode.top/rss.xml' },
  { icon: '✉', title: 'Email', msg: '邮箱：hi@tzcode.top' },
] as const;

/** 导航列 — 对照原型 FOOTER「导航」*/
const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/search', label: '搜索' },
  { href: '/pathways', label: '学习路径' },
  { href: '/works', label: '作品' },
  { href: '/library', label: '归档书架' },
  { href: '/about', label: '关于' },
] as const;

/** 账户列 — 对照原型 FOOTER「账户」*/
const ACCOUNT_LINKS = [
  { href: '/login', label: '登录 / 注册' },
  { href: '/account', label: '个人中心' },
  { href: '/landing', label: '项目主页' },
] as const;

/** 分类列 — 对照原型 FOOTER「分类」(指向 search) */
const CATEGORY_LINKS = [
  'AI Coding',
  '全栈工程',
  '工具效率',
  '随笔思考',
  '作品项目',
] as const;

/** 友情链接 — 对照原型 FOOTER「友情链接」(生产替换为真实外链) */
const FRIEND_LINKS = [
  '阮一峰的网络日志',
  '云游君',
  '张洪 Heo',
  '纸鹿摸鱼处',
] as const;

const colHead = 'mb-3.5 font-mono text-[11.5px] uppercase tracking-[.14em] text-dim';
const colLink =
  'block py-1 font-sans text-[13.5px] text-muted transition-[.14s] hover:translate-x-[3px] hover:text-acc';

export function Footer() {
  return (
    <footer
      data-site-footer
      className="border-line relative z-[1] mt-10 border-t bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.25))] font-mono"
    >
      {/* sf-main — 5 列：品牌 1.6fr + 导航/账户/分类/友链 各 1fr */}
      <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-[30px] px-[clamp(24px,3.4vw,64px)] pb-[30px] pt-[46px] sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
        {/* 品牌区 */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="text-acc font-bold">
            haiden@tzblog:<span className="text-fg-strong">~</span> $
          </div>
          <p className="text-muted mt-3 max-w-[40ch] font-sans text-[13.5px] leading-[1.7]">
            中文优先的技术与生活博客，记录 AI Coding、全栈工程、工具效率、随笔与作品。由热爱驱动，记录即复利。
          </p>
          <div className="mt-4 flex gap-2.5">
            {SOCIAL.map((s) => (
              <a
                key={s.title}
                href="#"
                title={s.title}
                aria-label={s.title}
                className="border-line2 text-muted hover:border-acc-dim hover:text-acc grid size-[34px] place-items-center rounded-[6px] border text-[15px] transition-[.16s] hover:-translate-y-0.5"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* 导航 */}
        <div>
          <h5 className={colHead}>导航</h5>
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className={colLink}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* 账户 */}
        <div>
          <h5 className={colHead}>账户</h5>
          {ACCOUNT_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className={colLink}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* 分类 */}
        <div>
          <h5 className={colHead}>分类</h5>
          {CATEGORY_LINKS.map((c) => (
            <Link
              key={c}
              href={`/search?cat=${encodeURIComponent(c)}`}
              className={colLink}
            >
              {c}
            </Link>
          ))}
        </div>

        {/* 友情链接 */}
        <div>
          <h5 className={colHead}>友情链接</h5>
          {FRIEND_LINKS.map((f) => (
            <a key={f} href="#" className={colLink}>
              {f}
            </a>
          ))}
        </div>
      </div>

      {/* sf-bottom — 版权 · 备案 · Powered by */}
      <div className="border-line text-dim border-t text-[12px]">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-[clamp(24px,3.4vw,64px)] py-4">
          <span>© 2026 tzblog · haiden · 保留所有权利</span>
          <span>
            <a href="#" className="text-muted hover:text-acc">
              浙ICP备2026000000号-1
            </a>
          </span>
          <span>
            Powered by <b className="text-fg font-normal">Next.js</b> ·{' '}
            <b className="text-fg font-normal">Go</b> · 部署于{' '}
            <b className="text-fg font-normal">Vercel</b>
          </span>
        </div>
      </div>
    </footer>
  );
}
