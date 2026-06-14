import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Highlight, themes } from 'prism-react-renderer';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

/** 代码块渲染（prism-react-renderer 高亮） */
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
    <Highlight code={code} language={language} theme={themes.vsDark}>
      {({ className: cls, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${cls} border-border overflow-x-auto rounded-lg border bg-[#0d1219] p-4 text-sm`}
          style={style}
        >
          <code>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i });
              return (
                <div key={i} {...lineProps}>
                  <span className="text-muted-foreground/40 mr-4 inline-block w-8 select-none text-right">
                    {i + 1}
                  </span>
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token, key });
                    return <span key={key} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </code>
        </pre>
      )}
    </Highlight>
  );
};

/** 自定义组件映射（终端暗色风格） */
const components: Components = {
  code({ className, children, ...props }) {
    // 行内代码 vs 代码块（react-markdown v10: 有 className 的是代码块）
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
    // pre 由 code 组件内部处理（避免双层 pre）
    return <>{children}</>;
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary decoration-primary/40 hover:decoration-primary underline underline-offset-2"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-primary/40 text-muted-foreground my-4 border-l-2 pl-4 italic">
        {children}
      </blockquote>
    );
  },
  h1: ({ children }) => (
    <h1 className="mb-4 mt-8 text-2xl font-bold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2
      className="mb-3 mt-8 text-xl font-bold"
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
    <h3 className="mb-2 mt-6 text-lg font-semibold">{children}</h3>
  ),
  p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-3 ml-6 list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 ml-6 list-decimal space-y-1">{children}</ol>
  ),
};

/**
 * Markdown 内容渲染器。
 * react-markdown + remark-gfm + prism 代码高亮。
 * 注意：react-markdown 默认不执行 HTML（安全），无需额外 sanitize。
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <article className="prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
