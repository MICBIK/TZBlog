import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '搜索',
  description: '搜索 TZBlog 的文章内容。',
};

export default function SearchPage() {
  return (
    <main className="mx-auto w-full max-w-[1080px] flex-1 px-6 pb-[60px] pt-10">
      {/* 搜索框 — grep 命令行风格（设计稿 front-search.html）*/}
      <div className="border-line rounded-[8px] border bg-panel p-6">
        <div className="text-muted mb-4 font-mono text-[13px]">
          <span className="text-acc">$</span> grep -ri{' '}
          <span className="text-amber">&quot;关键词&quot;</span> ./posts
        </div>

        {/* 搜索输入框 */}
        <div className="relative">
          <input
            type="search"
            placeholder="输入关键词搜索文章..."
            className="placeholder:text-dim border-line2 bg-panel2 text-fg w-full rounded-[6px] border px-4 py-3 font-mono text-[14px] transition-colors duration-[.16s] focus:border-acc-dim focus:outline-none"
          />
          <kbd className="border-line text-dim absolute right-3 top-1/2 -translate-y-1/2 rounded-[4px] border px-2 py-1 font-mono text-[11px]">
            ⏎
          </kbd>
        </div>
      </div>

      {/* 搜索结果区（占位）*/}
      <div className="mt-8">
        <div className="text-dim mb-4 flex items-center gap-2 font-mono text-[13px]">
          <span className="text-acc">$</span> ls -lt search_results/
          <span className="text-dim ml-auto text-[12px]"># 匹配 0 项</span>
        </div>

        {/* 空状态 */}
        <div className="border-line text-muted flex flex-col items-center justify-center rounded-[8px] border bg-panel py-16 text-center">
          <p className="text-acc mb-2 font-mono text-[13px]">
            grep: no matches found
          </p>
          <p className="font-sans text-[13px]">
            输入关键词开始搜索，或尝试更换搜索词。
          </p>
        </div>
      </div>
    </main>
  );
}
