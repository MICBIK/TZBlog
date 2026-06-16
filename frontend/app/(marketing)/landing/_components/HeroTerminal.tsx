'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 自播终端 — landing 决定性签名时刻（1:1 还原 landing.html 内联 IIFE，第 222-271 行）。
 * 逐字打字轮播三幕真实命令演示产品：
 *   tz search "RSC 缓存" → tz read spec-first → tz stats --all，循环。
 * 每幕：逐字打字 (42+random*46ms) + 输出逐行淡入 (200ms 间隔) + 2.7s 停顿后切下一幕。
 * prefers-reduced-motion 下退化为静态第二幕（与原型一致，勿降级回截图）。
 */

interface Scene {
  readonly tt: string;
  readonly cmd: string;
  readonly out: readonly string[];
}

// 输出行用结构化片段还原原型内联 <span class>（cm=注释/灰，st=序号/蓝，hl=高亮/正文）
const SCENES: readonly Scene[] = [
  {
    tt: 'tz search',
    cmd: 'tz search "RSC 缓存"',
    out: [
      '<span class="text-muted">命中 3 篇 · 0.4ms</span>',
      '<span class="text-info">01</span> <span class="text-fg">Next.js 15 RSC 缓存踩过的 7 个坑</span>',
      '<span class="text-info">02</span> <span class="text-fg">把 Go 后端从 120ms 优化到 18ms</span>',
      '<span class="text-info">03</span> <span class="text-fg">用 Meilisearch 给博客加全文搜索</span>',
    ],
  },
  {
    tt: '~/posts/spec-first.md',
    cmd: 'tz read spec-first',
    out: [
      '<span class="text-muted"># spec-first：让 Claude 连续写对 3000 行</span>',
      '<span class="text-fg">先写规格，再让模型实现，</span>',
      '<span class="text-fg">返工率从 60% 降到 </span><span class="text-info">8%</span><span class="text-fg">。</span>',
    ],
  },
  {
    tt: 'tz stats',
    cmd: 'tz stats --all',
    out: [
      '<span class="text-fg">文章 </span><span class="text-info">128</span><span class="text-muted">   累计 </span><span class="text-info">38.6万</span><span class="text-muted"> 字</span>',
      '<span class="text-fg">更新 </span><span class="text-info">412</span><span class="text-muted"> 天   本月读者 </span><span class="text-info">1.2k</span>',
      '<span class="text-muted">五条内容线 · 全文可搜 · 成体系成路径</span>',
    ],
  },
];

export function HeroTerminal() {
  const [title, setTitle] = useState('tz search');
  const [typed, setTyped] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [outLines, setOutLines] = useState<string[]>([]);
  const [staticScene, setStaticScene] = useState<Scene | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const push = (t: ReturnType<typeof setTimeout>) => {
      timers.current.push(t);
    };
    let si = 0;

    const reveal = (s: Scene) => {
      let oi = 0;
      const next = () => {
        const line = s.out[oi];
        if (line !== undefined) {
          setOutLines((prev) => [...prev, line]);
          oi += 1;
          push(setTimeout(next, 200));
        } else {
          push(
            setTimeout(() => {
              si = (si + 1) % SCENES.length;
              play();
            }, 2700),
          );
        }
      };
      next();
    };

    const play = () => {
      const s = SCENES[si];
      if (!s) return;
      setTitle(s.tt);
      setTyped('');
      setOutLines([]);
      setShowCursor(true);
      let ci = 0;
      const type = () => {
        if (ci <= s.cmd.length) {
          setTyped(s.cmd.slice(0, ci));
          ci += 1;
          push(setTimeout(type, 42 + Math.random() * 46));
        } else {
          setShowCursor(false);
          reveal(s);
        }
      };
      type();
    };

    // reduced-motion：静态第二幕（经函数间接调用，避免 effect 体同步 setState）
    const showStatic = () => {
      const s = SCENES[1];
      if (!s) return;
      setTitle(s.tt);
      setStaticScene(s);
    };

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      showStatic();
    } else {
      play();
    }

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  return (
    <div className="border-line overflow-hidden rounded-[12px] border bg-[#0d1219] shadow-[0_20px_50px_rgba(0,0,0,.45)]">
      {/* 标题栏：三个交通灯 + 动态标题 */}
      <div className="border-line bg-panel flex items-center gap-[7px] border-b px-[14px] py-[11px]">
        <span className="bg-destructive size-[11px] rounded-full" />
        <span className="size-[11px] rounded-full bg-amber" />
        <span className="bg-acc size-[11px] rounded-full" />
        <span className="text-muted ml-2 font-mono text-[11.5px]">{title}</span>
      </div>
      {/* 终端正文 */}
      <div className="min-h-[184px] px-[18px] py-[16px] font-mono text-[12.5px] leading-[1.9]">
        {staticScene ? (
          <>
            <div>
              <span className="text-acc">❯</span> {staticScene.cmd}
            </div>
            {staticScene.out.map((line, i) => (
              <div
                key={i}
                dangerouslySetInnerHTML={{ __html: line }}
              />
            ))}
          </>
        ) : (
          <>
            <div>
              <span className="text-acc">❯</span> {typed}
              {showCursor && (
                <span className="bg-acc inline-block h-[15px] w-[8px] align-text-bottom motion-safe:animate-[blink_1.1s_steps(1)_infinite]" />
              )}
            </div>
            {outLines.map((line, i) => (
              <RevealLine key={i} html={line} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/** 单行输出淡入（还原 .o { animation: fadein .26s }）：挂载后下一帧切到可见态。 */
function RevealLine({ html }: { html: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="transition-[opacity,transform] duration-[260ms] ease-out"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(3px)',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
