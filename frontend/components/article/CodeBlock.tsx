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
    <div className="my-6 overflow-hidden rounded-[8px] border border-line bg-[#080c11]">
      {/* code-head */}
      <div className="flex items-center gap-2.5 border-b border-line bg-panel2 px-[13px] py-2 font-mono text-[12px]">
        <span className="font-semibold text-acc">{language}</span>
        <span className="text-dim">snippet</span>
        <button
          onClick={handleCopy}
          className="ml-auto rounded-[5px] border border-line2 px-2.5 py-1 font-mono text-[11.5px] text-muted transition-[.15s] hover:border-acc-dim hover:text-acc data-[copied=true]:border-acc-dim data-[copied=true]:text-acc"
          data-copied={copied}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      {/* code-body */}
      <Highlight code={code} language={language} theme={themes.vsDark}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <div className="flex overflow-x-auto font-mono text-[13.5px] leading-[1.75]">
            <div className="select-none border-r border-line px-3.5 py-3.5 text-right text-dim">
              {tokens.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre
              className={`${className} overflow-x-auto px-4 py-3.5 text-fg`}
              style={style}
            >
              <code>
                {tokens.map((line, i) => {
                  const lineProps = getLineProps({ line, key: i });
                  return (
                    <div key={i} {...lineProps}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token, key })} />
                      ))}
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
