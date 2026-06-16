'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { adminToast } from '../../_components/adminToast';

/* ─────────────────────────────────────────────────────────────
   轻量 Markdown 解析 —— 1:1 还原原型 admin-editor.html 内联 JS
   esc / inline / render 与原型逐字符等价。
   ───────────────────────────────────────────────────────────── */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function render(src: string): string {
  const blocks = src.split(/\n{2,}/);
  let out = '';
  for (let b of blocks) {
    b = b.trim();
    if (!b) continue;
    if (/^```/.test(b)) {
      const body = b.replace(/^```\w*\n?/, '').replace(/```$/, '');
      out += '<pre><code>' + esc(body) + '</code></pre>';
      continue;
    }
    if (/^> /.test(b)) {
      out += '<blockquote>' + inline(esc(b.replace(/^> ?/gm, ''))) + '</blockquote>';
      continue;
    }
    if (/^### /.test(b)) {
      out += '<h3>' + inline(esc(b.slice(4))) + '</h3>';
      continue;
    }
    if (/^## /.test(b)) {
      out += '<h2>' + inline(esc(b.slice(3))) + '</h2>';
      continue;
    }
    if (/^# /.test(b)) {
      out += '<h1>' + inline(esc(b.slice(2))) + '</h1>';
      continue;
    }
    if (/^(\d+\.|- )/.test(b)) {
      const items = b
        .split('\n')
        .map(
          (l) =>
            '<li>' + inline(esc(l.replace(/^(\d+\.|-)\s*/, ''))) + '</li>',
        )
        .join('');
      out += '<ul>' + items + '</ul>';
      continue;
    }
    out += '<p>' + inline(esc(b)).replace(/\n/g, '<br>') + '</p>';
  }
  return out;
}

/* 初始正文 —— 照搬原型 textarea#md 内容 */
const INITIAL_MD = `博客做大之后，站内搜索是绕不开的需求。我试过直接上 Postgres 全文检索，中文分词体验一般；最后选了 **Meilisearch**——开箱即用、毫秒级响应、对中文友好。

## 为什么不是 Elasticsearch

Elasticsearch 很强，但对个人博客是**杀鸡用牛刀**：JVM 内存占用动辄 1G 起，运维成本高。Meilisearch 用 Rust 写的，单二进制、内存占用小，\`docker run\` 一条命令就跑起来。

> 选型原则：个人项目优先选「运维负担最小」而不是「功能上限最高」的方案。

## 接入只要三步

1. 起服务，建索引
2. 把文章 push 进去
3. 前端调搜索接口

\`\`\`js
import { MeiliSearch } from 'meilisearch'
const client = new MeiliSearch({ host: 'http://127.0.0.1:7700' })
await client.index('posts').addDocuments(posts)
\`\`\`

搜索时直接 \`index.search(query)\`，返回结果已经带好高亮片段，前端几乎不用处理。

## 中文分词的坑

默认分词对中文支持一般，需要在设置里调整 \`separatorTokens\`，并把标题、标签的搜索权重调高。调完之后，搜「缓存」能同时命中标题含「缓存」和正文提到缓存的文章。`;

/* 工具栏插入包裹符 —— 照搬原型 wraps */
const WRAPS: Record<string, [string, string]> = {
  bold: ['**', '**'],
  code: ['`', '`'],
  link: ['[', '](https://)'],
  h2: ['## ', ''],
  ul: ['- ', ''],
  quote: ['> ', ''],
  pre: ['```js\n', '\n```'],
};

const TOOLBAR: { md: string; title: string; label: React.ReactNode }[] = [
  { md: 'h2', title: '标题', label: 'H' },
  { md: 'bold', title: '加粗', label: <b>B</b> },
  { md: 'code', title: '行内代码', label: '</>' },
  { md: 'link', title: '链接', label: '↗' },
  { md: 'ul', title: '列表', label: '•' },
  { md: 'quote', title: '引用', label: '"' },
  { md: 'pre', title: '代码块', label: '{ }' },
];

type Status = 'draft' | 'pub';

export function EditorClient() {
  const mdRef = useRef<HTMLTextAreaElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [title, setTitle] = useState('用 Meilisearch 给博客加全文搜索');
  const [md, setMd] = useState(INITIAL_MD);
  const [status, setStatus] = useState<Status>('draft');
  const [cat, setCat] = useState('全栈工程');
  const [slug, setSlug] = useState('meilisearch-blog-search');
  const [excerpt, setExcerpt] = useState(
    '个人博客站内搜索选型实录：为什么放弃 Postgres FTS 和 Elasticsearch，最终用 Meilisearch 三步接入。',
  );
  const [tags, setTags] = useState<string[]>(['Meilisearch', '搜索', 'Rust']);
  const [tagIn, setTagIn] = useState('');
  const [cover, setCover] = useState<{ text: string; done: boolean }>({
    text: '＋ 上传 / 拖拽',
    done: false,
  });
  const [line, setLine] = useState(1);
  const [saveState, setSaveState] = useState('草稿 · 2 分钟前自动保存');

  /* 字数 / 时长 —— 照搬原型 stats() */
  const cn = (md.match(/[一-龥]/g) || []).length;
  const en = (md.match(/[a-zA-Z]+/g) || []).length;
  const total = cn + en;
  const readMin = Math.max(1, Math.ceil(total / 350));

  /* 行号：光标前文本的换行数 */
  const updateLine = useCallback(() => {
    const ta = mdRef.current;
    if (!ta) return;
    setLine(ta.value.substr(0, ta.selectionStart).split('\n').length);
  }, []);

  useEffect(() => {
    updateLine();
  }, [updateLine]);

  /* 工具栏插入 —— 照搬原型 tools 点击逻辑 */
  function applyTool(mdKey: string) {
    const ta = mdRef.current;
    if (!ta) return;
    const wrap = WRAPS[mdKey];
    if (!wrap) return;
    const [l, r] = wrap;
    const s = ta.selectionStart;
    const en2 = ta.selectionEnd;
    const sel = ta.value.slice(s, en2) || (mdKey === 'link' ? '链接文字' : '');
    const next = ta.value.slice(0, s) + l + sel + r + ta.value.slice(en2);
    setMd(next);
    const caret = s + l.length + sel.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = caret;
      setLine(next.substr(0, caret).split('\n').length);
    });
  }

  /* 正文输入 + 自动保存指示 —— 照搬原型 autosave */
  function onMdChange(v: string) {
    setMd(v);
    updateLine();
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(
      () => setSaveState('草稿 · 刚刚自动保存'),
      1500,
    );
  }

  /* 标签 —— 回车添加 / 点 × 删除 */
  function onTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && tagIn.trim()) {
      setTags((prev) => [...prev, tagIn.trim()]);
      setTagIn('');
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* 预览区排版样式 —— 照搬原型 .prev 规则，局部 scope 到 .prev-body */}
      <style>{`
        .prev-body h1{font-size:26px;font-weight:700;margin:22px 0 12px;color:var(--fg-strong)}
        .prev-body h2{font-size:20px;font-weight:700;margin:26px 0 10px;color:var(--fg-strong);padding-left:12px;border-left:3px solid var(--acc)}
        .prev-body h3{font-size:16px;font-weight:600;margin:18px 0 8px;color:#9fb0c0}
        .prev-body p{margin:12px 0;color:#9fb0c0}
        .prev-body strong{color:var(--fg-strong);font-weight:600}
        .prev-body a{color:var(--acc);border-bottom:1px solid var(--acc-dim)}
        .prev-body ul{margin:12px 0;padding-left:22px}
        .prev-body li{margin:5px 0;color:#9fb0c0}
        .prev-body li::marker{color:var(--acc)}
        .prev-body code{font-family:var(--font-mono);font-size:.86em;background:var(--panel-2);color:var(--acc);padding:2px 6px;border-radius:4px;border:1px solid var(--line)}
        .prev-body pre{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin:14px 0;overflow:auto}
        .prev-body pre code{background:none;border:none;color:#9fb0c0;padding:0}
        .prev-body blockquote{border-left:3px solid var(--acc-dim);background:rgba(63,224,143,.05);padding:8px 16px;margin:14px 0;color:#9fb0c0;border-radius:0 6px 6px 0}
      `}</style>

      {/* ── 顶栏 .bar ── */}
      <div className="flex h-[54px] flex-shrink-0 items-center gap-3 border-b border-line bg-panel px-[18px]">
        <div className="font-mono text-[12px] text-muted">
          <b className="text-[#9fb0c0]">内容</b> / 写文章 /{' '}
          <span className="text-acc">{status === 'draft' ? 'draft' : 'published'}</span>
        </div>
        <div className="flex-1" />
        <span className="flex items-center gap-[6px] font-mono text-[11px] text-amber">
          <span className="h-[6px] w-[6px] rounded-full bg-amber shadow-[0_0_6px_var(--color-amber)]" />
          <span>{saveState}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            adminToast('✓ 草稿已保存');
            setSaveState('草稿 · 刚刚保存');
          }}
          className="rounded-[8px] border border-line bg-panel2 px-[14px] py-[7px] text-[13px] text-[#9fb0c0] transition-[.16s] hover:border-[#3a4654] hover:text-fg"
        >
          存草稿
        </button>
        <button
          type="button"
          onClick={() => adminToast('✓ 已发布到 tzcode.top')}
          className="rounded-[8px] border border-acc bg-acc px-[14px] py-[7px] text-[13px] font-semibold text-[#06140d] transition-[.16s] hover:bg-[#5ff0a8]"
        >
          发布
        </button>
      </div>

      {/* ── 工具栏 .tools ── */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-1 border-b border-line bg-panel2 px-[14px] py-[7px]">
        {TOOLBAR.map((t, i) => (
          <span key={t.md} className="flex items-center">
            {(i === 3) && (
              <span className="mx-[5px] h-[18px] w-px bg-line" />
            )}
            <button
              type="button"
              title={t.title}
              onClick={() => applyTool(t.md)}
              className="grid h-[30px] w-[30px] place-items-center rounded-[6px] border border-transparent bg-transparent font-mono text-[12px] text-[#9fb0c0] transition-[.14s] hover:border-line hover:bg-panel hover:text-acc"
            >
              {t.label}
            </button>
          </span>
        ))}
      </div>

      {/* ── 编辑区 .work ── */}
      <div className="grid flex-1 overflow-hidden grid-cols-1 lg:grid-cols-[1fr_1fr_268px]">
        {/* 列 1：源码 */}
        <div className="overflow-auto border-r border-line">
          <div className="sticky top-0 z-[2] bg-bg px-[22px] pb-[6px] pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#3a4654]">
            $ vim draft.md
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题…"
            className="w-full border-none bg-transparent px-[22px] pb-[10px] pt-[6px] font-sans text-[24px] font-bold leading-[1.3] text-fg outline-none placeholder:text-[#3a4654]"
          />
          <textarea
            ref={mdRef}
            value={md}
            spellCheck={false}
            onChange={(e) => onMdChange(e.target.value)}
            onKeyUp={updateLine}
            onClick={updateLine}
            className="block min-h-[calc(100%-96px)] w-full resize-none border-none bg-transparent px-[22px] pb-[60px] pt-1 font-mono text-[13.5px] leading-[1.85] text-[#9fb0c0] outline-none"
          />
        </div>

        {/* 列 2：实时预览 */}
        <div className="hidden overflow-auto border-r border-line lg:block">
          <div className="sticky top-0 z-[2] bg-bg px-[22px] pb-[6px] pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#3a4654]">
            {'// 实时预览'}
          </div>
          <div
            className="prev-body px-[26px] pb-[60px] pt-[6px] text-[15px] leading-[1.8] text-fg"
            dangerouslySetInnerHTML={{ __html: render(md) }}
          />
        </div>

        {/* 列 3：元信息侧栏 .meta */}
        <div className="hidden overflow-auto bg-panel lg:block">
          {/* 发布状态 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#3a4654]">
              发布状态
            </div>
            <div className="flex gap-[6px]">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`flex-1 rounded-[7px] border py-[7px] text-center font-mono text-[12px] transition-[.14s] ${
                  status === 'draft'
                    ? 'border-amber bg-[rgba(227,184,78,0.1)] text-amber'
                    : 'border-line text-muted hover:text-[#9fb0c0]'
                }`}
              >
                草稿
              </button>
              <button
                type="button"
                onClick={() => setStatus('pub')}
                className={`flex-1 rounded-[7px] border py-[7px] text-center font-mono text-[12px] transition-[.14s] ${
                  status === 'pub'
                    ? 'border-acc bg-acc/10 text-acc'
                    : 'border-line text-muted hover:text-[#9fb0c0]'
                }`}
              >
                已发布
              </button>
            </div>
          </div>

          {/* 分类 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#3a4654]">
              分类
            </div>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full rounded-[7px] border border-line bg-panel2 px-[11px] py-2 font-sans text-[13px] text-fg outline-none transition-[.14s] focus:border-acc-dim"
            >
              <option>全栈工程</option>
              <option>AI Coding</option>
              <option>工具效率</option>
              <option>思考随笔</option>
              <option>作品项目</option>
            </select>
          </div>

          {/* 标签 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#3a4654]">
              标签
            </div>
            <input
              value={tagIn}
              onChange={(e) => setTagIn(e.target.value)}
              onKeyDown={onTagKey}
              placeholder="输入后回车添加…"
              className="w-full rounded-[7px] border border-line bg-panel2 px-[11px] py-2 font-sans text-[13px] text-fg outline-none transition-[.14s] placeholder:text-[#3a4654] focus:border-acc-dim"
            />
            <div className="mt-[9px] flex flex-wrap gap-[6px]">
              {tags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="inline-flex items-center gap-[6px] rounded-[20px] border border-acc-dim bg-acc/8 px-[9px] py-[3px] font-mono text-[11px] text-acc"
                >
                  {tag}
                  <b
                    onClick={() =>
                      setTags((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="cursor-pointer text-muted hover:text-[#e36a6a]"
                  >
                    ×
                  </b>
                </span>
              ))}
            </div>
          </div>

          {/* URL Slug */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#3a4654]">
              URL Slug
            </div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-[7px] border border-line bg-panel2 px-[11px] py-2 font-sans text-[13px] text-fg outline-none transition-[.14s] focus:border-acc-dim"
            />
          </div>

          {/* 摘要 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#3a4654]">
              摘要
            </div>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full resize-y rounded-[7px] border border-line bg-panel2 px-[11px] py-2 font-sans text-[13px] text-fg outline-none transition-[.14s] focus:border-acc-dim"
            />
          </div>

          {/* 封面图 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#3a4654]">
              封面图
            </div>
            <div
              onClick={() =>
                setCover({ text: 'cover-meilisearch.png ✓', done: true })
              }
              className={`mt-1 grid aspect-video place-items-center rounded-[8px] border border-dashed border-line bg-[repeating-linear-gradient(45deg,transparent_0,transparent_9px,rgba(255,255,255,0.015)_9px,rgba(255,255,255,0.015)_18px)] font-mono text-[12px] transition-[.14s] hover:border-acc-dim hover:text-[#9fb0c0] ${
                cover.done ? 'text-acc' : 'text-muted'
              }`}
            >
              {cover.text}
            </div>
          </div>
        </div>
      </div>

      {/* ── 状态栏 .stbar ── */}
      <div className="flex h-[34px] flex-shrink-0 items-center gap-5 border-t border-line bg-panel px-[22px] font-mono text-[11px] text-muted">
        <span>UTF-8</span>
        <span>Markdown</span>
        <span className="flex-1" />
        <span>{total} 字</span>
        <span className="text-acc-dim">约 {readMin} 分钟</span>
        <span>
          行 <span>{line}</span>
        </span>
      </div>
    </div>
  );
}
