'use client';

import { useEffect, useState } from 'react';

/**
 * hero 终端打字机 —— 1:1 还原 front-about.html 内联 JS 的 #typed 逐字输出。
 * 原型：每 38ms 追加一个字符，尾随磷光绿光标（border-right 闪烁）。
 * prefers-reduced-motion 下直接显示全文，光标不闪（globals 的 blink 工具类已守卫，
 * 这里额外用 motion-reduce 关掉 border 闪烁动画）。
 */
export function TypedLine({ text }: { text: string }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    let timer: ReturnType<typeof setTimeout>;
    if (reduce) {
      // 异步置入，避免 effect 体内同步 setState
      timer = setTimeout(() => setShown(text), 0);
      return () => clearTimeout(timer);
    }
    let i = 0;
    const step = () => {
      if (i <= text.length) {
        setShown(text.slice(0, i));
        i += 1;
        timer = setTimeout(step, 38);
      }
    };
    timer = setTimeout(step, 38);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <p className="min-h-[1.7em] font-mono text-fg">
      {shown}
      <span className="ml-0.5 inline-block animate-[blink_1.1s_steps(1)_infinite] border-r-2 border-acc align-text-bottom motion-reduce:animate-none">
        &nbsp;
      </span>
    </p>
  );
}
