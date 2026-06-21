'use client';

import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface CodeBlockProps {
  language: string;
  code: string;
}

/**
 * 代码块（1:1 还原设计稿 .codeblock，第 77-86 行）。
 * Client component（useState for copy button）。
 */
export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-line my-6 overflow-hidden rounded-[8px] border bg-[#080c11]">
      {/* code-head */}
      <div className="border-line bg-panel2 flex items-center gap-2.5 border-b px-[13px] py-2 font-mono text-[12px]">
        <span className="text-acc font-semibold">{language}</span>
        <span className="text-dim">snippet</span>
        <button
          onClick={handleCopy}
          className="border-line2 text-muted hover:border-acc-dim hover:text-acc data-[copied=true]:border-acc-dim data-[copied=true]:text-acc ml-auto rounded-[5px] border px-2.5 py-1 font-mono text-[11.5px] transition-[.15s]"
          data-copied={copied}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      {/* code-body */}
      <Highlight code={code} language={language} theme={themes.vsDark}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <div className="flex overflow-x-auto font-mono text-[13.5px] leading-[1.75]">
            <div className="border-line text-dim select-none border-r px-3.5 py-3.5 text-right">
              {tokens.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre
              className={`${className} text-fg overflow-x-auto px-4 py-3.5`}
              style={style}
            >
              <code>
                {tokens.map((line, i) => {
                  const { key: lineKey, ...lineProps } = getLineProps({
                    line,
                    key: i,
                  });
                  const resolvedLineKey =
                    typeof lineKey === 'string' || typeof lineKey === 'number'
                      ? lineKey
                      : i;
                  return (
                    <div key={resolvedLineKey} {...lineProps}>
                      {line.map((token, tokenIndex) => {
                        const { key: tokenKey, ...tokenProps } = getTokenProps({
                          token,
                          key: tokenIndex,
                        });
                        const resolvedTokenKey =
                          typeof tokenKey === 'string' ||
                          typeof tokenKey === 'number'
                            ? tokenKey
                            : tokenIndex;
                        return <span key={resolvedTokenKey} {...tokenProps} />;
                      })}
                    </div>
                  );
                })}
              </code>
            </pre>
          </div>
        )}
      </Highlight>
    </div>
  );
}
