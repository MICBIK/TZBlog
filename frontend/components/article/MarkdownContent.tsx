import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

import { CodeBlock } from '@/components/article/CodeBlock';

interface MarkdownContentProps {
  content: string;
}

/** callout 块（设计稿第 73-74 行）*/
function Callout({ children }: { children?: ReactNode }) {
  return (
    <div className="my-6 rounded-r-[8px] border border-l-[3px] border-acc-dim bg-acc/[0.05] p-4 text-[15px]">
      {children}
    </div>
  );
}

/** prose 组件映射（1:1 还原设计稿 .prose，第 62-75 行）*/
const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children ?? '').replace(/\n$/, '');
    if (match && match[1]) {
      return <CodeBlock language={match[1]} code={code} />;
    }
    return (
      <code
        className="rounded-[4px] border border-line bg-panel2 px-1.5 py-px font-mono text-[14px] text-acc"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
  h2({ children }) {
    const id =
      typeof children === 'string'
        ? children.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        : undefined;
    return (
      <h2
        id={id}
        className="mt-[42px] flex items-baseline gap-2.5 font-sans text-[24px] font-bold text-fg-strong [scroll-margin-top:72px]"
      >
        <span className="font-mono text-[18px] font-bold text-acc-dim">##</span>
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="mt-7 font-sans text-[18px] font-semibold text-fg-strong">
        {children}
      </h3>
    );
  },
  p({ children }) {
    return <p className="my-[18px] opacity-90">{children}</p>;
  },
  strong({ children }) {
    return <strong className="text-fg-strong">{children}</strong>;
  },
  em({ children }) {
    return <em className="not-italic text-amber">{children}</em>;
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-acc underline decoration-acc/40 underline-offset-2 transition-colors hover:decoration-acc"
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="my-4 list-none pl-1">{children}</ul>;
  },
  li({ children }) {
    return (
      <li className="relative my-[9px] pl-6">
        <span className="absolute left-1 text-acc-dim">▸</span>
        {children}
      </li>
    );
  },
  blockquote({ children }) {
    return <Callout>{children}</Callout>;
  },
  table({ children }) {
    return (
      <div className="my-4 overflow-x-auto rounded-[8px] border border-line">
        <table className="w-full font-mono text-sm">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border-b border-line bg-panel2 px-4 py-2 text-left font-normal text-muted">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="border-b border-line/50 px-4 py-2">{children}</td>;
  },
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="max-w-none font-sans text-[16.5px] leading-[1.85] text-fg">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
