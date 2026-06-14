import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Highlight, themes } from 'prism-react-renderer';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

/** 代码块渲染（终端窗口风格 + prism 高亮 + 行号） */
const CodeBlock = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children ?? '').replace(/\n$/, '');
  const language = match?.[1] ?? 'text';

  return (
    <div className="border-border my-4 overflow-hidden rounded-[10px] border">
      {/* 终端标题栏 */}
      <div className="border-border bg-secondary flex items-center gap-2 border-b px-4 py-2">
        <span className="size-[10px] rounded-full bg-[#ff5f57]" />
        <span className="size-[10px] rounded-full bg-[#febc2e]" />
        <span className="size-[10px] rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[11px] text-[var(--dim)]">
          {language} — {code.split('\n').length} lines
        </span>
      </div>
      <Highlight code={code} language={language} theme={themes.vsDark}>
        {({ className: cls, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${cls} overflow-x-auto bg-[#0d1219] p-4 text-sm`}
            style={style}
          >
            <code>
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                return (
                  <div key={i} {...lineProps}>
                    <span className="text-muted/30 mr-4 inline-block w-8 select-none text-right">
                      {i + 1}
                    </span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
};

const components: Components = {
  code({ className, children, ...props }) {
    if (className) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    return (
      <code
        className="bg-muted text-primary rounded px-1.5 py-0.5 font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary decoration-primary/40 hover:decoration-primary underline underline-offset-2 transition-colors"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-primary/40 text-muted my-4 border-l-2 pl-4 italic">
        {children}
      </blockquote>
    );
  },
  h1: ({ children }) => (
    <h1 className="animate-reveal mb-4 mt-8 font-sans text-2xl font-bold">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="animate-reveal mb-3 mt-8 font-sans text-xl font-bold"
      id={
        typeof children === 'string'
          ? children.toLowerCase().replace(/\s+/g, '-')
          : undefined
      }
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="animate-reveal mb-2 mt-6 font-sans text-lg font-semibold">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="animate-reveal my-3 font-sans leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 ml-6 list-disc space-y-1 font-sans">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 ml-6 list-decimal space-y-1 font-sans">{children}</ol>
  ),
  table: ({ children }) => (
    <div className="border-border my-4 overflow-x-auto rounded-lg border">
      <table className="w-full font-mono text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-border bg-secondary text-muted border-b px-4 py-2 text-left font-normal">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-border/50 border-b px-4 py-2">{children}</td>
  ),
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <article className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
