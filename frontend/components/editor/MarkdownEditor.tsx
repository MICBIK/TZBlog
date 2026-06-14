'use client';

import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// 动态导入避免 SSR 问题（编辑器依赖 window/document）
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="animate-skeleton bg-muted h-[400px] rounded-md" />
  ),
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
}

/**
 * Markdown 编辑器组件。
 * 封装 @uiw/react-md-editor，动态导入避免 SSR。
 * 支持实时预览、代码高亮。
 */
export function MarkdownEditor({
  value,
  onChange,
  height = 400,
  placeholder = '开始撰写你的文章…',
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        height={height}
        preview="live"
        textareaProps={{ placeholder }}
      />
    </div>
  );
}
