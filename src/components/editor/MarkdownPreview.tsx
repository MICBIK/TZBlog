import { renderMarkdown } from "@/lib/markdown";

export interface MarkdownPreviewProps {
  /** Markdown source. */
  content: string;
  /** Optional shiki theme override; defaults to the pipeline default. */
  theme?: string;
  /** Extra className appended to the article wrapper. */
  className?: string;
}

/**
 * Server component that renders Markdown to sanitized, syntax-highlighted HTML.
 *
 * Uses `dangerouslySetInnerHTML` because the source has already passed through
 * `rehype-sanitize` in the pipeline (per systemPatterns §13).
 */
export async function MarkdownPreview({
  content,
  theme,
  className,
}: MarkdownPreviewProps) {
  const html = await renderMarkdown(content, theme ? { theme: theme as never } : undefined);
  return (
    <article
      className={[
        "markdown-body max-w-none",
        className ?? "",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MarkdownPreview;
