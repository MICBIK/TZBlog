'use client';

import { useEffect, useRef } from 'react';

const skills = [
  { name: 'TypeScript / React / Next.js', percentage: 92 },
  { name: 'Go / 后端服务', percentage: 85 },
  { name: 'AI Coding / Prompt 工程', percentage: 88 },
  { name: 'PostgreSQL / 数据建模', percentage: 78 },
  { name: 'Docker / 部署运维', percentage: 80 },
  { name: 'UI / 交互设计', percentage: 72 },
];

const timeline = [
  {
    year: '2026 · 至今',
    title: 'tzblog 上线 & 持续写作',
    description:
      '从 0 用 Next.js + Go 自建技术博客，全文搜索、代码/公式渲染、分级权限全部自研，把 AI Coding 工作流写成系列教程。',
  },
  {
    year: '2025',
    title: '后端性能重构',
    description:
      '把核心服务从 Node 迁到 Go，P99 延迟从 120ms 砍到 18ms，Docker 镜像多阶段构建压到 40MB，沉淀成 3 篇实测复盘。',
  },
  {
    year: '2024',
    title: '全面转向 AI 辅助开发',
    description:
      '形成 spec-first 工作流：先写规格再让 AI 落地，单次连续写对 3000 行成为常态，效率与质量双升。',
  },
  {
    year: '2023',
    title: '全栈工程深耕',
    description:
      '主导多个 Next.js App Router 项目，建立组件库与设计系统规范，开始系统性记录工程笔记。',
  },
];

const projects = [
  {
    type: 'open-source',
    status: 'active',
    title: 'tzblog',
    description:
      '自建技术博客系统，Next.js + Go + Postgres，全文搜索与分级权限。',
    tags: 'Next.js · Go · Meilisearch',
  },
  {
    type: 'tool',
    status: 'active',
    title: 'spec-kit',
    description:
      '把需求规格转成 AI 可执行任务清单的 CLI，配合 Claude 连续编码。',
    tags: 'TypeScript · CLI',
  },
  {
    type: 'library',
    status: 'stable',
    title: 'md-render',
    description:
      '轻量 Markdown 渲染器，集成 Shiki 高亮与 KaTeX 公式，零运行时依赖。',
    tags: 'TypeScript · Shiki',
  },
];

export default function AboutPage() {
  const rvRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    rvRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1080px] px-6">
      {/* Hero 终端窗口 */}
      <section
        ref={(el) => {
          rvRefs.current[0] = el;
        }}
        className="rv py-[54px]"
      >
        <div className="border-line overflow-hidden rounded-[10px] border bg-gradient-to-b from-panel to-bg-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
          {/* 终端标题栏 */}
          <div className="border-line bg-panel2 flex items-center gap-2 border-b px-[15px] py-[11px]">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
            <span className="text-dim ml-2 font-mono text-[12.5px]">
              ~/about/haiden.md
            </span>
          </div>

          {/* 终端内容 */}
          <div className="px-[34px] pb-[34px] pt-[30px]">
            <p className="text-muted mb-[6px] font-mono text-[13.5px]">
              <span className="text-acc">$</span> whoami --verbose
            </p>
            <p className="text-fg min-h-[1.7em] font-mono">
              haiden — 全栈工程师，记录 AI Coding 与全栈工程的真实踩坑。
            </p>

            {/* 个人信息 */}
            <div className="mt-6 grid grid-cols-[84px_1fr] items-center gap-[22px]">
              <div className="border-acc-dim bg-acc/10 text-acc grid h-[84px] w-[84px] place-items-center rounded-[14px] border font-mono text-[34px] font-bold shadow-[0_0_40px_-10px_rgba(63,224,143,0.5)]">
                H
              </div>
              <div>
                <h1 className="text-fg-strong font-sans text-[clamp(26px,3.6vw,38px)] font-bold leading-tight tracking-[-0.01em]">
                  haiden
                </h1>
                <div className="text-acc mt-1 font-mono text-[14px]">
                  全栈工程师 · AI Coding 实践者 · 独立博主
                </div>
                <p className="text-muted mt-[10px] max-w-[60ch] font-sans text-[14.5px] leading-[1.75]">
                  写 Next.js 与 Go，把每天用 AI
                  写代码踩的坑、重构后端的实测数据、配置工具的折腾，沉淀成能反复查的笔记。相信
                  spec-first 的工作流，相信记录本身就是复利。tzblog
                  是我自己的实验场，也是知识的归档地。
                </p>
              </div>
            </div>

            {/* 统计数据 */}
            <div className="mt-7 grid grid-cols-4 gap-[14px]">
              {[
                { value: 128, label: '已发布文章' },
                { value: '386k', label: '累计字数' },
                { value: 412, label: '建站天数' },
                { value: 6, label: '开源项目' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="border-line rounded-[8px] border bg-panel px-[18px] py-4 text-center"
                >
                  <b className="text-acc block font-mono text-[26px] font-bold tabular-nums">
                    {stat.value}
                  </b>
                  <span className="text-muted mt-[3px] block font-sans text-[12px]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 技能栈 */}
      <p
        ref={(el) => {
          rvRefs.current[1] = el;
        }}
        className="text-muted rv mb-[18px] mt-12 flex items-center gap-2 font-mono text-[13px]"
      >
        <span className="text-acc">$</span> cat skills.json — 技术栈与熟练度
        <span className="text-dim ml-auto text-[12px]">
          {/* 自评，持续更新 */}
        </span>
      </p>
      <section
        ref={(el) => {
          rvRefs.current[2] = el;
        }}
        className="rv grid grid-cols-2 gap-x-[34px] gap-y-[14px]"
      >
        {skills.map((skill, idx) => (
          <div key={idx} className="skill">
            <div className="mb-[6px] flex justify-between font-sans text-[13px]">
              <b className="text-fg-strong font-semibold">{skill.name}</b>
              <span className="text-muted font-mono text-[12px]">
                {skill.percentage}%
              </span>
            </div>
            <div className="border-line h-[6px] overflow-hidden rounded-[4px] border bg-panel2">
              <div
                className="h-full rounded-[4px] bg-gradient-to-r from-acc-dim to-acc shadow-[0_0_10px_rgba(63,224,143,0.4)] transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${skill.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      {/* 技术栈标签 */}
      <div
        ref={(el) => {
          rvRefs.current[3] = el;
        }}
        className="rv mt-[22px] flex flex-wrap gap-2"
      >
        {[
          'Next.js 15',
          'React 19',
          'Go',
          'PostgreSQL',
          'Prisma',
          'Docker',
          'Meilisearch',
          'Tailwind',
          'Shiki',
          'KaTeX',
          'Vercel',
          'Claude / Cursor',
        ].map((tech, idx) => (
          <span
            key={idx}
            className="border-line text-fg rounded-r border bg-panel px-[11px] py-[5px] font-mono text-[12px] transition-[.16s] before:mr-[7px] before:inline-block before:h-[6px] before:w-[6px] before:align-[1px] before:rounded-full before:bg-acc-dim hover:-translate-y-[2px] hover:border-acc-dim hover:text-acc"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* 时间线 */}
      <p
        ref={(el) => {
          rvRefs.current[4] = el;
        }}
        className="text-muted rv mb-[18px] mt-12 font-mono text-[13px]"
      >
        <span className="text-acc">$</span> git log --author=haiden — 经历时间线
      </p>
      <section
        ref={(el) => {
          rvRefs.current[5] = el;
        }}
        className="rv border-line ml-2 border-l pl-[26px]"
      >
        {timeline.map((item, idx) => (
          <div key={idx} className="relative pb-[26px]">
            <div className="border-acc-dim absolute left-[-31px] top-1 h-[9px] w-[9px] rounded-full border-2 bg-bg transition-[.18s] hover:border-acc hover:bg-acc hover:shadow-[0_0_10px_var(--acc)]" />
            <div className="text-acc font-mono text-[12px]">{item.year}</div>
            <h4 className="text-fg-strong my-[3px] font-sans text-[16px] font-semibold">
              {item.title}
            </h4>
            <p className="text-muted max-w-[64ch] font-sans text-[13.5px]">
              {item.description}
            </p>
          </div>
        ))}
      </section>

      {/* 代表作 */}
      <p
        ref={(el) => {
          rvRefs.current[6] = el;
        }}
        className="text-muted rv mb-[18px] mt-12 flex items-center gap-2 font-mono text-[13px]"
      >
        <span className="text-acc">$</span> ls ~/projects --featured — 代表作
        <span className="text-dim ml-auto text-[12px]">
          {/* 点击查看 */}
        </span>
      </p>
      <section
        ref={(el) => {
          rvRefs.current[7] = el;
        }}
        className="rv grid grid-cols-3 gap-[14px]"
      >
        {projects.map((project, idx) => (
          <a
            key={idx}
            href="#"
            className="border-line block rounded-[9px] border bg-panel p-[18px] transition-[.18s] hover:-translate-y-[3px] hover:border-acc-dim hover:bg-panel2"
          >
            <div className="text-dim mb-[10px] flex items-center justify-between font-mono text-[11.5px]">
              <span>{project.type}</span>
              <span className="text-acc">● {project.status}</span>
            </div>
            <h4 className="text-fg-strong font-sans text-[16px] font-semibold">
              {project.title}
            </h4>
            <p className="text-muted mt-[6px] font-sans text-[13px] leading-[1.6]">
              {project.description}
            </p>
            <div className="text-muted mt-3 font-mono text-[11px]">
              {project.tags}
            </div>
          </a>
        ))}
      </section>

      {/* 联系方式 */}
      <p
        ref={(el) => {
          rvRefs.current[8] = el;
        }}
        className="text-muted rv mb-[18px] mt-12 font-mono text-[13px]"
      >
        <span className="text-acc">$</span> cat contact.txt — 联系方式
      </p>
      <section
        ref={(el) => {
          rvRefs.current[9] = el;
        }}
        className="rv mb-[60px] grid grid-cols-4 gap-3"
      >
        {[
          { icon: '⌨', label: 'GitHub', value: 'github.com/haiden' },
          { icon: '✉', label: 'Email', value: 'hi@tzcode.top' },
          { icon: '⟳', label: 'RSS', value: 'tzcode.top/rss.xml' },
          { icon: '✕', label: 'X', value: '@haiden_dev' },
        ].map((contact, idx) => (
          <div
            key={idx}
            className="border-line cursor-pointer rounded-[8px] border bg-panel p-4 text-center transition-[.16s] hover:border-acc-dim hover:bg-panel2"
          >
            <div className="text-acc text-[18px]">{contact.icon}</div>
            <div className="text-fg-strong mt-2 font-sans text-[13px]">
              {contact.label}
            </div>
            <div className="text-muted mt-[2px] break-all font-mono text-[11.5px]">
              {contact.value}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
