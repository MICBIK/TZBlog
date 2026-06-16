'use client';

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import styles from './editor.module.css';

/* ── 初始 Markdown（1:1 照搬原型 #md 内容，含全部中文文案）── */
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

const STATUS = [
  { key: 'draft', label: '草稿' },
  { key: 'pub', label: '已发布' },
] as const;
type StatusKey = (typeof STATUS)[number]['key'];

const CATEGORIES = [
  '全栈工程',
  'AI Coding',
  '工具效率',
  '思考随笔',
  '作品项目',
];

/* ── Markdown → HTML（1:1 照搬原型 render/inline/esc）── */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
      out +=
        '<blockquote>' + inline(esc(b.replace(/^> ?/gm, ''))) + '</blockquote>';
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
          (l) => '<li>' + inline(esc(l.replace(/^(\d+\.|-)\s*/, ''))) + '</li>'
        )
        .join('');
      out += '<ul>' + items + '</ul>';
      continue;
    }
    out += '<p>' + inline(esc(b)).replace(/\n/g, '<br>') + '</p>';
  }
  return out;
}

/* 工具栏插入包裹符（1:1 照搬原型 wraps）*/
const WRAPS: Record<string, [string, string]> = {
  bold: ['**', '**'],
  code: ['`', '`'],
  link: ['[', '](https://)'],
  h2: ['## ', ''],
  ul: ['- ', ''],
  quote: ['> ', ''],
  pre: ['```js\n', '\n```'],
};

const TOOLS: { md: string; title: string; label: React.ReactNode }[] = [
  { md: 'h2', title: '标题', label: 'H' },
  { md: 'bold', title: '加粗', label: <b>B</b> },
  { md: 'code', title: '行内代码', label: '</>' },
  { md: 'link', title: '链接', label: '↗' },
  { md: 'ul', title: '列表', label: '•' },
  { md: 'quote', title: '引用', label: '"' },
  { md: 'pre', title: '代码块', label: '{ }' },
];
const TOOL_SEP_AFTER = 'code'; // code 之后插一根分隔线

export default function EditorWorkspace() {
  const [title, setTitle] = useState('用 Meilisearch 给博客加全文搜索');
  const [md, setMd] = useState(INITIAL_MD);
  const [status, setStatus] = useState<StatusKey>('draft');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState(['Meilisearch', '搜索', 'Rust']);
  const [tagInput, setTagInput] = useState('');
  const [slug, setSlug] = useState('meilisearch-blog-search');
  const [excerpt, setExcerpt] = useState(
    '个人博客站内搜索选型实录：为什么放弃 Postgres FTS 和 Elasticsearch，最终用 Meilisearch 三步接入。'
  );
  const [coverDone, setCoverDone] = useState(false);
  const [line, setLine] = useState(1);
  const [saveState, setSaveState] = useState('草稿 · 2 分钟前自动保存');
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({
    msg: '',
    show: false,
  });

  const mdRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 字数 / 阅读时长（1:1 照搬原型 stats）*/
  const { wordCount, readTime } = useMemo(() => {
    const cn = (md.match(/[一-龥]/g) || []).length;
    const en = (md.match(/[a-zA-Z]+/g) || []).length;
    const total = cn + en;
    return {
      wordCount: total,
      readTime: Math.max(1, Math.ceil(total / 350)),
    };
  }, [md]);

  const previewHtml = useMemo(() => render(md), [md]);

  /* 当前行号：读 textarea selectionStart 到光标前的换行数 */
  const syncLine = useCallback(() => {
    const el = mdRef.current;
    if (!el) return;
    setLine(el.value.substr(0, el.selectionStart).split('\n').length);
  }, []);

  /* 工具栏插入后恢复光标位置 */
  useLayoutEffect(() => {
    if (pendingCaret.current !== null && mdRef.current) {
      const pos = pendingCaret.current;
      mdRef.current.focus();
      mdRef.current.selectionStart = mdRef.current.selectionEnd = pos;
      pendingCaret.current = null;
      syncLine();
    }
  }, [md, syncLine]);

  const flash = useCallback((m: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg: m, show: true });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      1800
    );
  }, []);

  /* 输入：更新内容 + 行号 + 自动保存指示（1:1 还原原型 autosave）*/
  const onMdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMd(e.target.value);
    setLine(
      e.target.value.substr(0, e.target.selectionStart).split('\n').length
    );
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(
      () => setSaveState('草稿 · 刚刚自动保存'),
      1500
    );
  };

  /* 工具栏插入（1:1 照搬原型 toolbar insert）*/
  const insert = (mdKey: string) => {
    const el = mdRef.current;
    if (!el) return;
    const wrap = WRAPS[mdKey];
    if (!wrap) return;
    const [l, r] = wrap;
    const s = el.selectionStart;
    const en = el.selectionEnd;
    const sel = el.value.slice(s, en) || (mdKey === 'link' ? '链接文字' : '');
    const next = el.value.slice(0, s) + l + sel + r + el.value.slice(en);
    pendingCaret.current = s + l.length + sel.length;
    setMd(next);
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setTags((t) => [...t, tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTag = (idx: number) =>
    setTags((t) => t.filter((_, i) => i !== idx));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* ── 顶栏 ── */}
      <div className="flex h-[54px] flex-shrink-0 items-center gap-3 border-b border-line bg-panel px-[18px]">
        <div className="font-mono text-[12px] text-muted">
          <b className="text-[#9fb0c0]">内容</b> / 写文章 /{' '}
          <span className="text-acc">draft</span>
        </div>
        <div className="flex-1" />
        <span className="flex items-center gap-[6px] font-mono text-[11px] text-amber">
          <span className="h-[6px] w-[6px] rounded-full bg-amber shadow-[0_0_6px_var(--amber)]" />
          <span>{saveState}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            flash('✓ 草稿已保存');
            setSaveState('草稿 · 刚刚保存');
          }}
          className="cursor-pointer rounded-lg border border-line bg-panel-2 px-[14px] py-[7px] text-[13px] text-[#9fb0c0] transition-[.16s] hover:border-[#3a4654] hover:text-fg"
        >
          存草稿
        </button>
        <button
          type="button"
          onClick={() => flash('✓ 已发布到 tzcode.top')}
          className="cursor-pointer rounded-lg border border-acc bg-acc px-[14px] py-[7px] text-[13px] font-semibold text-[#06140d] transition-[.16s] hover:bg-[#5ff0a8]"
        >
          发布
        </button>
      </div>

      {/* ── 工具栏 ── */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-1 border-b border-line bg-panel-2 px-[14px] py-[7px]">
        {TOOLS.map((t) => (
          <span key={t.md} className="flex items-center">
            <button
              type="button"
              title={t.title}
              onClick={() => insert(t.md)}
              className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-md border border-transparent bg-transparent font-mono text-[12px] text-[#9fb0c0] transition-[.14s] hover:border-line hover:bg-panel hover:text-acc"
            >
              {t.label}
            </button>
            {t.md === TOOL_SEP_AFTER && (
              <span className="mx-[5px] h-[18px] w-px bg-line" />
            )}
          </span>
        ))}
      </div>

      {/* ── 三栏工作区 ── */}
      <div className="grid flex-1 overflow-hidden grid-cols-1 md:grid-cols-[1fr_1fr_268px]">
        {/* 编辑列 */}
        <div className={`${styles.col} overflow-auto border-r border-line`}>
          <div className="sticky top-0 z-[2] bg-background px-[22px] pb-[6px] pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#46505e]">
            $ vim draft.md
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题…"
            className="w-full border-none bg-transparent px-[22px] pb-[10px] pt-[6px] font-sans text-[24px] font-bold leading-[1.3] text-fg outline-none placeholder:text-[#46505e]"
          />
          <textarea
            ref={mdRef}
            value={md}
            spellCheck={false}
            onChange={onMdChange}
            onKeyUp={syncLine}
            onClick={syncLine}
            className="min-h-[calc(100%-96px)] w-full resize-none border-none bg-transparent px-[22px] pb-[60px] pt-1 font-mono text-[13.5px] leading-[1.85] text-[#9fb0c0] outline-none"
          />
        </div>

        {/* 预览列 */}
        <div
          className={`${styles.col} hidden overflow-auto border-r border-line md:block`}
        >
          <div className="sticky top-0 z-[2] bg-background px-[22px] pb-[6px] pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#46505e]">
            {'// 实时预览'}
          </div>
          <div
            className={styles.prev}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        {/* 元信息侧栏 */}
        <div className="hidden overflow-auto bg-panel md:block">
          {/* 发布状态 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#46505e]">
              发布状态
            </div>
            <div className="flex gap-[6px]">
              {STATUS.map((s) => {
                const on = status === s.key;
                const pub = s.key === 'pub';
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStatus(s.key)}
                    className={`flex-1 cursor-pointer rounded-[7px] border py-[7px] text-center font-mono text-[12px] transition-[.14s] ${
                      on && pub
                        ? 'border-acc bg-acc/10 text-acc'
                        : on
                          ? 'border-amber bg-amber/10 text-amber'
                          : 'border-line text-muted hover:text-[#9fb0c0]'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 分类 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#46505e]">
              分类
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-[7px] border border-line bg-panel-2 px-[11px] py-2 font-sans text-[13px] text-fg outline-none transition-[.14s] focus:border-acc-dim"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 标签 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#46505e]">
              标签
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="输入后回车添加…"
              className="w-full rounded-[7px] border border-line bg-panel-2 px-[11px] py-2 font-sans text-[13px] text-fg outline-none transition-[.14s] placeholder:text-[#46505e] focus:border-acc-dim"
            />
            <div className="mt-[9px] flex flex-wrap gap-[6px]">
              {tags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="inline-flex items-center gap-[6px] rounded-[20px] border border-acc-dim bg-acc/10 px-[9px] py-[3px] font-mono text-[11px] text-acc"
                >
                  {tag}
                  <b
                    onClick={() => removeTag(i)}
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
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#46505e]">
              URL Slug
            </div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-[7px] border border-line bg-panel-2 px-[11px] py-2 font-sans text-[13px] text-fg outline-none transition-[.14s] focus:border-acc-dim"
            />
          </div>

          {/* 摘要 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#46505e]">
              摘要
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-[7px] border border-line bg-panel-2 px-[11px] py-2 font-sans text-[13px] text-fg outline-none transition-[.14s] focus:border-acc-dim"
            />
          </div>

          {/* 封面图 */}
          <div className="border-b border-line px-[18px] py-4">
            <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#46505e]">
              封面图
            </div>
            <button
              type="button"
              onClick={() => setCoverDone(true)}
              className={`mt-1 grid aspect-video w-full place-items-center rounded-lg border border-dashed border-line bg-[repeating-linear-gradient(45deg,transparent_0,transparent_9px,rgba(255,255,255,.015)_9px,rgba(255,255,255,.015)_18px)] font-mono text-[12px] transition-[.14s] hover:border-acc-dim ${
                coverDone ? 'text-acc' : 'text-muted hover:text-[#9fb0c0]'
              }`}
            >
              {coverDone ? 'cover-meilisearch.png ✓' : '＋ 上传 / 拖拽'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 状态栏 ── */}
      <div className="flex h-[34px] flex-shrink-0 items-center gap-5 border-t border-line bg-panel px-[22px] font-mono text-[11px] text-muted">
        <span>UTF-8</span>
        <span>Markdown</span>
        <span className="flex-1" />
        <span>{wordCount} 字</span>
        <span className="text-acc-dim">约 {readTime} 分钟</span>
        <span>
          行 <span>{line}</span>
        </span>
      </div>

      {/* ── Toast ── */}
      <div
        className={`pointer-events-none fixed bottom-[26px] left-1/2 z-[200] -translate-x-1/2 rounded-[9px] border border-acc-dim bg-panel px-5 py-[10px] font-mono text-[13px] text-acc shadow-[0_8px_30px_rgba(0,0,0,.5)] transition-[.3s] ${
          toast.show
            ? 'translate-y-0 opacity-100'
            : 'translate-y-5 opacity-0'
        }`}
      >
        {toast.msg}
      </div>
    </div>
  );
}
