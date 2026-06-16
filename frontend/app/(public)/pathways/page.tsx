'use client';

import { useState } from 'react';
import Link from 'next/link';

import { ROUTES } from '@/lib/constants';

/** 步骤状态：已读 / 当前 / 未开始 —— 对照原型 .step.done / .step.now / .step */
type StepState = 'done' | 'now' | 'todo';

interface PathStep {
  readonly title: string;
  readonly desc: string;
  readonly meta: string;
  readonly state: StepState;
}

interface Pathway {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly level: string;
  readonly progress: number;
  readonly steps: readonly PathStep[];
}

/** 三条学习路径 —— 1:1 照搬原型 front-pathways.html 文案与状态 */
const PATHWAYS: readonly Pathway[] = [
  {
    id: 'ai',
    label: 'AI Coding 上手',
    title: 'AI Coding 上手',
    level: '入门 → 进阶 · 约 2.5h · 4 篇',
    progress: 50,
    steps: [
      {
        title: '第一次用 LLM 写代码的踩坑记录',
        desc: '先看别人怎么翻车，再决定自己怎么开始。',
        meta: '入门 · 12 min',
        state: 'done',
      },
      {
        title: 'spec-first 让 Claude 连续写对 3000 行',
        desc: '本路径的核心方法论：先写规格，再让模型落地。',
        meta: '核心 · 18 min',
        state: 'now',
      },
      {
        title: '把验收回归固化进 CLI 工具',
        desc: '让每次生成都跑一遍验收，质量不靠运气。',
        meta: '进阶 · 15 min',
        state: 'todo',
      },
      {
        title: '上下文工程：喂给模型什么决定它写出什么',
        desc: '收尾的进阶篇，决定产出上限。',
        meta: '进阶 · 20 min',
        state: 'todo',
      },
    ],
  },
  {
    id: 'stack',
    label: '全栈工程实战',
    title: '全栈工程实战',
    level: '进阶 · 约 3h · 4 篇',
    progress: 25,
    steps: [
      {
        title: 'Next.js 15 RSC 缓存的 7 个坑',
        desc: '前端这层先把缓存模型搞明白。',
        meta: '进阶 · 16 min',
        state: 'done',
      },
      {
        title: 'Go 重写后端：P99 从 120ms 到 18ms',
        desc: '后端选型与性能，重写的真实收益。',
        meta: '核心 · 19 min',
        state: 'now',
      },
      {
        title: '用 Meilisearch 给博客加全文搜索',
        desc: '检索能力，给内容站补上最后一块。',
        meta: '进阶 · 14 min',
        state: 'todo',
      },
      {
        title: 'Docker 多阶段构建把镜像砍到 40MB',
        desc: '部署收尾，把整套东西打包上线。',
        meta: '进阶 · 13 min',
        state: 'todo',
      },
    ],
  },
  {
    id: 'blog',
    label: '从 0 搭个人博客',
    title: '从 0 搭个人博客',
    level: '入门 → 进阶 · 约 4h · 4 篇',
    progress: 0,
    steps: [
      {
        title: '从 0 搭一个能用三年的个人博客架构',
        desc: '先定架构，少走弯路。',
        meta: '入门 · 17 min',
        state: 'now',
      },
      {
        title: 'Shiki + KaTeX：代码与公式渲染管线',
        desc: '技术博客必备的内容渲染层。',
        meta: '进阶 · 15 min',
        state: 'todo',
      },
      {
        title: '为什么我把笔记从 Notion 搬回纯文本',
        desc: '内容源的取舍，影响长期维护成本。',
        meta: '随笔 · 10 min',
        state: 'todo',
      },
      {
        title: '写完 100 篇博客后的一些反思',
        desc: '收尾：坚持下来之后的回看。',
        meta: '随笔 · 14 min',
        state: 'todo',
      },
    ],
  },
] as const;

export default function PathwaysPage() {
  const [active, setActive] = useState<string>('ai');

  return (
    <main className="mx-auto w-full max-w-[820px] px-6">
      {/* hero —— 原型 .hero */}
      <header className="pb-[22px] pt-[52px] font-mono">
        <div className="text-muted mb-[14px] text-[13px]">
          <span className="text-acc">$</span> cat ~/learning-paths/*.md
        </div>
        <h1 className="mb-[10px] text-[clamp(28px,5vw,40px)] font-semibold tracking-[-0.01em]">
          跟着<span className="text-acc">路径</span>读，不是随便翻
        </h1>
        <p className="text-secondary-foreground max-w-[58ch] font-sans text-[15px]">
          把散落的文章按学习顺序串成几条路。每条路标了难度、预计时长和你读到哪了——照着走，不用自己拼。
        </p>
      </header>

      {/* 路径切换按钮 —— 原型 .switch / .pbtn */}
      <div className="flex flex-wrap gap-[6px] pb-[28px] pt-[8px] font-mono">
        {PATHWAYS.map((p) => {
          const on = p.id === active;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              aria-pressed={on}
              className={
                on
                  ? 'border-acc bg-acc cursor-pointer rounded-[6px] border px-[15px] py-[8px] text-left text-[13px] font-semibold text-[#06140c] transition-[0.16s]'
                  : 'border-line text-secondary-foreground hover:border-acc-dim hover:text-fg cursor-pointer rounded-[6px] border bg-panel px-[15px] py-[8px] text-left text-[13px] transition-[0.16s]'
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 路径详情 —— 原型 .path */}
      {PATHWAYS.map((p) => (
        <PathSection key={p.id} pathway={p} active={p.id === active} />
      ))}
    </main>
  );
}

function PathSection({
  pathway,
  active,
}: {
  pathway: Pathway;
  active: boolean;
}) {
  if (!active) return null;

  return (
    <section className="block pb-[60px]">
      {/* phead */}
      <div className="flex flex-wrap items-center justify-between gap-[16px] pb-[6px] pt-[18px]">
        <h2 className="text-fg font-mono text-[18px]">{pathway.title}</h2>
        <span className="text-muted font-mono text-[12px]">{pathway.level}</span>
      </div>

      {/* 进度条 —— 原型 .prog */}
      <div className="bg-panel2 my-[10px] mb-[24px] h-[6px] overflow-hidden rounded-[6px]">
        <i
          className="from-acc-dim to-acc block h-full bg-gradient-to-r shadow-[0_0_8px_rgba(63,224,143,0.5)]"
          style={{ width: `${pathway.progress}%` }}
        />
      </div>

      {/* 步骤时间线 —— 原型 .step */}
      {pathway.steps.map((step, idx) => {
        const isLast = idx === pathway.steps.length - 1;
        return (
          <div key={idx} className="flex gap-[16px] pb-[4px]">
            {/* rail：节点圆点 + 连接线 */}
            <div className="flex flex-[0_0_22px] flex-col items-center">
              <Dot state={step.state} />
              {!isLast && (
                <span
                  className={
                    step.state === 'done'
                      ? 'bg-acc-dim my-[2px] w-[2px] flex-1'
                      : 'bg-line my-[2px] w-[2px] flex-1'
                  }
                />
              )}
            </div>

            {/* scard：步骤卡片 */}
            <Link
              href={ROUTES.ARTICLES}
              className="border-line hover:border-acc-dim mb-[14px] block flex-1 rounded-[9px] border bg-panel px-[16px] py-[14px] transition-[0.16s] hover:translate-x-[3px]"
            >
              <div className="text-fg mb-[3px] flex items-center gap-[8px] text-[15px] font-semibold">
                {step.title}
                {step.state === 'done' && (
                  <span className="text-acc border-acc-dim rounded-[20px] border px-[6px] py-[1px] font-mono text-[10.5px]">
                    ✓ 读过
                  </span>
                )}
                {step.state === 'now' && (
                  <span className="text-amber rounded-[20px] border border-[#5a4a1f] px-[6px] py-[1px] font-mono text-[10.5px]">
                    在这里
                  </span>
                )}
              </div>
              <div className="text-secondary-foreground text-[13.5px]">
                {step.desc}
              </div>
              <div className="text-muted mt-[7px] font-mono text-[11.5px]">
                {step.meta}
              </div>
            </Link>
          </div>
        );
      })}
    </section>
  );
}

/** 时间线节点圆点 —— 原型 .dot / .step.done .dot / .step.now .dot */
function Dot({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span className="border-acc bg-acc relative z-[1] mt-[14px] h-[16px] w-[16px] flex-[0_0_auto] rounded-full border-2" />
    );
  }
  if (state === 'now') {
    return (
      <span className="border-acc bg-bg relative z-[1] mt-[14px] h-[16px] w-[16px] flex-[0_0_auto] rounded-full border-2 shadow-[0_0_0_4px_rgba(63,224,143,0.15)]" />
    );
  }
  return (
    <span className="border-line bg-bg relative z-[1] mt-[14px] h-[16px] w-[16px] flex-[0_0_auto] rounded-full border-2" />
  );
}
