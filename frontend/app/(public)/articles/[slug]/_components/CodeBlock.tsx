'use client';

import { useState, type ReactNode } from 'react';

interface CodeBlockProps {
  lang: string;
  fname: string;
  /** 行号数量 */
  lines: number;
  /** 纯文本源码，用于复制 */
  raw: string;
  /** 高亮后的 JSX（含 .k/.s/.c/.f/.n token span）*/
  children: ReactNode;
}

/**
 * 终端代码块 —— 1:1 还原原型 .codeblock。
 * 头部 lang + 文件名 + copy 按钮；左侧行号 gutter；右侧高亮 pre。
 * 点击 copy 写入剪贴板，1.6s 内显示 "copied ✓"。
 */
export function CodeBlock({ lang, fname, lines, raw, children }: CodeBlockProps) {
  const [ok, setOk] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(raw).then(() => {
      setOk(true);
      setTimeout(() => setOk(false), 1600);
    });
  }

  return (
    <div className="border-line my-6 overflow-hidden rounded-lg border bg-[#080c11]">
      <div className="border-line bg-panel2 flex items-center gap-2.5 border-b px-[13px] py-2 font-mono text-xs">
        <span className="text-acc font-semibold">{lang}</span>
        <span className="text-dim">{fname}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`border-[var(--line-2)] ml-auto cursor-pointer rounded-[5px] border bg-transparent px-2.5 py-1 font-mono text-[11.5px] transition-colors duration-150 hover:border-[var(--acc-dim)] hover:text-acc ${
            ok ? 'border-[var(--acc-dim)] text-acc' : 'text-muted-foreground'
          }`}
        >
          {ok ? 'copied ✓' : 'copy'}
        </button>
      </div>
      <div className="flex overflow-x-auto font-mono text-[13.5px] leading-[1.75]">
        <div className="border-line text-dim select-none border-r py-3.5 pl-3.5 text-right">
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} className="block">
              {i + 1}
            </span>
          ))}
        </div>
        <pre className="text-fg overflow-x-auto whitespace-pre px-4 py-3.5 font-mono">
          {children}
        </pre>
      </div>
    </div>
  );
}
