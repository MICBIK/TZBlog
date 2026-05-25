export interface TerminalEntryDetailProps {
  channelSlug: string;
  entrySlug: string;
  title: string;
  html: string;
  sourceLines: string[];
}

export function TerminalEntryDetail({
  channelSlug,
  entrySlug,
  title,
  html,
  sourceLines,
}: TerminalEntryDetailProps) {
  void title;

  return (
    <article data-testid="terminal-entry-detail" className="space-y-4">
      <header
        data-testid="terminal-vim-header"
        className="font-mono text-sm text-muted-fg"
      >
        ~/{channelSlug}/{entrySlug}.md
      </header>
      <div className="flex gap-4">
        <pre
          data-testid="terminal-line-numbers"
          aria-hidden
          className="hidden select-none text-right font-mono text-xs leading-6 text-muted-fg md:block"
        >
          {sourceLines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </pre>
        <div
          data-testid="terminal-entry-body"
          className="min-w-0 flex-1 markdown-body max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </article>
  );
}
