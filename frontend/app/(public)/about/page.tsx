'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { SITE_URL } from '@/lib/constants';
import { TypedLine } from './_components/TypedLine';

/** hero 统计 —— [data-count] 计数上滚（含 386k 的 data-suffix） */
const STATS = [
  { count: 128, suffix: '', label: '已发布文章' },
  { count: 386, suffix: 'k', label: '累计字数' },
  { count: 412, suffix: '', label: '建站天数' },
  { count: 6, suffix: '', label: '开源项目' },
] as const;

/** 技能栈与自评熟练度 —— [data-w] 进度条入场填充 */
const SKILLS = [
  { name: 'TypeScript / React / Next.js', percentage: 92 },
  { name: 'Go / 后端服务', percentage: 85 },
  { name: 'AI Coding / Prompt 工程', percentage: 88 },
  { name: 'PostgreSQL / 数据建模', percentage: 78 },
  { name: 'Docker / 部署运维', percentage: 80 },
  { name: 'UI / 交互设计', percentage: 72 },
] as const;

const STACK = [
  'Next.js 15', 'React 19', 'Go', 'PostgreSQL', 'Prisma', 'Docker',
  'Meilisearch', 'Tailwind', 'Shiki', 'KaTeX', 'Vercel', 'Claude / Cursor',
] as const;

const TIMELINE = [
  { year: '2026 · 至今', title: 'tzblog 上线 & 持续写作', desc: '从 0 用 Next.js + Go 自建技术博客，全文搜索、代码/公式渲染、分级权限全部自研，把 AI Coding 工作流写成系列教程。' },
  { year: '2025', title: '后端性能重构', desc: '把核心服务从 Node 迁到 Go，P99 延迟从 120ms 砍到 18ms，Docker 镜像多阶段构建压到 40MB，沉淀成 3 篇实测复盘。' },
  { year: '2024', title: '全面转向 AI 辅助开发', desc: '形成 spec-first 工作流：先写规格再让 AI 落地，单次连续写对 3000 行成为常态，效率与质量双升。' },
  { year: '2023', title: '全栈工程深耕', desc: '主导多个 Next.js App Router 项目，建立组件库与设计系统规范，开始系统性记录工程笔记。' },
] as const;

const PROJECTS = [
  { type: 'open-source', status: 'active', title: 'tzblog', desc: '自建技术博客系统，Next.js + Go + Postgres，全文搜索与分级权限。', tags: 'Next.js · Go · Meilisearch' },
  { type: 'tool', status: 'active', title: 'spec-kit', desc: '把需求规格转成 AI 可执行任务清单的 CLI，配合 Claude 连续编码。', tags: 'TypeScript · CLI' },
  { type: 'library', status: 'stable', title: 'md-render', desc: '轻量 Markdown 渲染器，集成 Shiki 高亮与 KaTeX 公式，零运行时依赖。', tags: 'TypeScript · Shiki' },
] as const;

const CONTACTS = [
  { icon: '⌨', label: 'GitHub', value: 'github.com/haiden', msg: 'GitHub: github.com/haiden' },
  { icon: '✉', label: 'Email', value: 'hi@tzblog.dev', msg: '邮箱已复制：hi@tzblog.dev' },
  { icon: '⟳', label: 'RSS', value: `${SITE_URL.replace(/^https?:\/\//, '')}/rss.xml`, msg: `RSS: ${SITE_URL}/rss.xml` },
  { icon: '✕', label: 'X', value: '@haiden_dev', msg: 'X / Twitter: @haiden_dev' },
] as const;

/** 计数上滚：0 → to（40 帧 rAF，还原原型 animateCount） */
function animateCount(el: HTMLElement) {
  const to = Number(el.dataset.count);
  const suffix = el.dataset.suffix ?? '';
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (reduce) {
    el.textContent = `${to}${suffix}`;
    return;
  }
  let s = 0;
  const step = to / 40;
  const tick = () => {
    s += step;
    if (s >= to) {
      el.textContent = `${to}${suffix}`;
    } else {
      el.textContent = `${Math.floor(s)}${suffix}`;
      requestAnimationFrame(tick);
    }
  };
  tick();
}

export default function AboutPage() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // 滚动入场：.rv → .rv.in，错峰 40ms；入场时触发计数与进度条
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add('in');
          el.querySelectorAll<HTMLElement>('[data-count]').forEach(animateCount);
          el.querySelectorAll<HTMLElement>('.bar i').forEach((bar) => {
            bar.style.width = `${bar.dataset.w}%`;
          });
          io.unobserve(el);
        });
      },
      { threshold: 0.12 },
    );

    const reveals = root.querySelectorAll<HTMLElement>('.rv');
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 5) * 40}ms`;
      io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  const sectionCmd =
    'rv mt-12 mb-[18px] flex items-center gap-2 font-mono text-[13px] text-muted-foreground';

  return (
    <main ref={rootRef} className="relative z-[1] mx-auto w-full max-w-[1080px] px-6">
      {/* ===== hero 终端窗口 ===== */}
      <section className="rv pb-9 pt-[54px]">
        <div className="overflow-hidden rounded-[10px] border border-line bg-gradient-to-b from-panel to-bg2 shadow-[0_30px_80px_-40px_rgba(0,0,0,.8)]">
          <div className="flex items-center gap-2 border-b border-line bg-panel2 px-[15px] py-[11px]">
            <span className="size-[11px] rounded-full bg-[#ff5f57]" />
            <span className="size-[11px] rounded-full bg-[#febc2e]" />
            <span className="size-[11px] rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[12.5px] text-dim">~/about/haiden.md</span>
          </div>
          <div className="px-[34px] pb-[34px] pt-[30px]">
            <p className="mb-[6px] font-mono text-[13.5px] text-muted-foreground">
              <span className="text-acc">$</span> whoami --verbose
            </p>
            <TypedLine text="haiden — 全栈工程师，记录 AI Coding 与全栈工程的真实踩坑。" />

            <div className="mt-6 grid grid-cols-1 items-center gap-[22px] sm:grid-cols-[84px_1fr]">
              <div className="grid size-[84px] place-items-center rounded-[14px] border border-acc-dim bg-acc/10 font-mono text-[34px] font-bold text-acc shadow-[0_0_40px_-10px_rgba(63,224,143,.5)]">
                H
              </div>
              <div>
                <h1 className="font-sans text-[clamp(26px,3.6vw,38px)] font-bold tracking-[-0.01em] text-fg-strong">
                  haiden
                </h1>
                <div className="mt-1 font-mono text-[14px] text-acc">
                  全栈工程师 · AI Coding 实践者 · 独立博主
                </div>
                <p className="mt-[10px] max-w-[60ch] font-sans text-[14.5px] leading-[1.75] text-muted-foreground">
                  写 Next.js 与 Go，把每天用 AI 写代码踩的坑、重构后端的实测数据、配置工具的折腾，沉淀成能反复查的笔记。相信 spec-first 的工作流，相信记录本身就是复利。tzblog 是我自己的实验场，也是知识的归档地。
                </p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-[14px] sm:grid-cols-4">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[8px] border border-line bg-panel px-[18px] py-4 text-center"
                >
                  <b
                    data-count={stat.count}
                    data-suffix={stat.suffix || undefined}
                    className="block font-mono text-[26px] font-bold tabular-nums text-acc"
                  >
                    0
                  </b>
                  <span className="mt-[3px] block font-sans text-[12px] text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 技能栈 ===== */}
      <p className={sectionCmd}>
        <span className="text-acc">$</span> cat skills.json — 技术栈与熟练度
        <span className="ml-auto text-[12px] text-dim">{'// 自评，持续更新'}</span>
      </p>
      <section className="rv grid grid-cols-1 gap-x-[34px] gap-y-[14px] sm:grid-cols-2">
        {SKILLS.map((skill) => (
          <div key={skill.name}>
            <div className="mb-[6px] flex justify-between font-sans text-[13px]">
              <b className="font-semibold text-fg-strong">{skill.name}</b>
              <span className="font-mono text-[12px] text-muted-foreground">{skill.percentage}%</span>
            </div>
            <div className="bar h-[6px] overflow-hidden rounded-[4px] border border-line bg-panel2">
              <i
                data-w={skill.percentage}
                className="block h-full w-0 rounded-[4px] bg-gradient-to-r from-acc-dim to-acc shadow-[0_0_10px_rgba(63,224,143,.4)] transition-[width] duration-1000 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
              />
            </div>
          </div>
        ))}
      </section>

      {/* ===== 技术栈 chips ===== */}
      <div className="rv mt-[22px] flex flex-wrap gap-2">
        {STACK.map((tech) => (
          <span
            key={tech}
            className="rounded-[6px] border border-line bg-panel px-[11px] py-[5px] font-mono text-[12px] text-fg transition-[transform,color,border-color] duration-150 before:mr-[7px] before:inline-block before:size-[6px] before:translate-y-px before:rounded-full before:bg-acc-dim before:align-middle hover:-translate-y-0.5 hover:border-acc-dim hover:text-acc"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* ===== 经历时间线 ===== */}
      <p className={sectionCmd}>
        <span className="text-acc">$</span> git log --author=haiden — 经历时间线
      </p>
      <section className="rv ml-2 border-l border-line pl-[26px]">
        {TIMELINE.map((item) => (
          <div key={item.year} className="group relative pb-[26px]">
            <span className="absolute left-[-31px] top-1 size-[9px] rounded-full border-2 border-acc-dim bg-bg transition-[background-color,border-color,box-shadow] duration-150 group-hover:border-acc group-hover:bg-acc group-hover:shadow-[0_0_10px_var(--acc)]" />
            <div className="font-mono text-[12px] text-acc">{item.year}</div>
            <h4 className="my-[3px] font-sans text-[16px] font-semibold text-fg-strong">{item.title}</h4>
            <p className="max-w-[64ch] font-sans text-[13.5px] text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* ===== 代表作 ===== */}
      <p className={sectionCmd}>
        <span className="text-acc">$</span> ls ~/projects --featured — 代表作
        <span className="ml-auto text-[12px] text-dim">{'// 点击查看'}</span>
      </p>
      <section className="rv grid grid-cols-1 gap-[14px] md:grid-cols-3">
        {PROJECTS.map((p) => (
          <Link
            key={p.title}
            href="/works"
            className="block rounded-[9px] border border-line bg-panel p-[18px] transition-[transform,background-color,border-color] duration-200 hover:-translate-y-[3px] hover:border-acc-dim hover:bg-panel2"
          >
            <div className="mb-[10px] flex items-center justify-between font-mono text-[11.5px] text-dim">
              <span>{p.type}</span>
              <span className="text-acc">● {p.status}</span>
            </div>
            <h4 className="font-sans text-[16px] font-semibold text-fg-strong">{p.title}</h4>
            <p className="mt-[6px] font-sans text-[13px] leading-[1.6] text-muted-foreground">{p.desc}</p>
            <div className="mt-3 font-mono text-[11px] text-muted-foreground">{p.tags}</div>
          </Link>
        ))}
      </section>

      {/* ===== 联系方式 ===== */}
      <p className={sectionCmd}>
        <span className="text-acc">$</span> cat contact.txt — 联系方式
      </p>
      <section className="rv mb-[60px] grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CONTACTS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => toast(c.msg)}
            className="rounded-[8px] border border-line bg-panel p-4 text-center font-mono transition-[background-color,border-color] duration-150 hover:border-acc-dim hover:bg-panel2"
          >
            <div className="text-[18px] text-acc">{c.icon}</div>
            <div className="mt-2 font-sans text-[13px] text-fg-strong">{c.label}</div>
            <div className="mt-[2px] break-all text-[11.5px] text-muted-foreground">{c.value}</div>
          </button>
        ))}
      </section>
    </main>
  );
}
