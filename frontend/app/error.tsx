'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * 根级路由错误边界（500）。
 * 1:1 还原原型 500.html：终端窗口卡片 + node 报错 trace + 恢复 CTA。
 * Next.js 在子树抛出未捕获错误时渲染此组件，reset() 重新渲染该段（对应原型「retry 重试」）。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[RouteError]', error);
    }
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-[60px]">
      <div className="border-line w-full max-w-[640px] overflow-hidden rounded-[10px] border bg-gradient-to-b from-panel to-bg-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
        {/* 终端标题栏 - 红黄绿圆点 */}
        <div className="border-line bg-panel2 flex items-center gap-2 border-b px-[15px] py-[11px]">
          <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
          <span className="text-dim ml-2 font-mono text-[12.5px]">
            ~ — node — error
          </span>
        </div>

        {/* 终端内容 */}
        <div className="px-[30px] py-[30px]">
          {/* 500 大标题 — 中间 0 为 amber（草稿/警示态），非品牌绿 */}
          <div className="text-fg-strong font-sans text-[clamp(64px,14vw,120px)] font-bold leading-none tracking-[-0.02em]">
            5<span className="text-amber">0</span>0
          </div>

          {/* 命令行 */}
          <p className="text-muted mb-1 mt-[18px] font-mono text-[13.5px]">
            <span className="text-acc">$</span> tzblog serve --prod
          </p>

          {/* node 报错 trace（深色块，保留缩进与换行）*/}
          <pre className="border-line text-dim my-[14px] mb-[18px] whitespace-pre-wrap rounded-[6px] border bg-[#080c11] px-[14px] py-[12px] font-mono text-[12.5px] leading-[1.65]">
            <span className="text-[#ff7b9c]">Error:</span>
            {' Internal Server Error\n'}
            {'    at handleRequest (server.js:142:11)\n'}
            {'    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n'}
            <span className="text-dim">
              — 服务暂时无法处理这个请求，错误已记录。
            </span>
          </pre>

          {/* 引导文字 */}
          <p className="text-fg mb-6 max-w-[50ch] font-sans text-[15px] opacity-85">
            这不是你的问题，是后端在喘口气。稍等片刻刷新，或先去别处逛逛。
          </p>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-[10px]">
            <button
              type="button"
              onClick={reset}
              className="bg-acc rounded-r border border-transparent px-[18px] py-[10px] font-mono text-[13.5px] font-bold text-[#06120b] transition-shadow duration-[.16s] before:opacity-60 before:content-['$_'] hover:shadow-[0_0_0_3px_rgba(63,224,143,0.18)]"
            >
              retry 重试
            </button>
            <Link
              href="/"
              className="border-line2 text-fg rounded-r border px-[18px] py-[10px] font-mono text-[13.5px] transition-colors duration-[.16s] hover:border-acc-dim hover:text-acc"
            >
              cd ~/home
            </Link>
            <Link
              href="/search"
              className="border-line2 text-fg rounded-r border px-[18px] py-[10px] font-mono text-[13.5px] transition-colors duration-[.16s] hover:border-acc-dim hover:text-acc"
            >
              grep 搜索
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
