type LegacyEditorBlock = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  content?: unknown;
  source?: string;
};

export type EditorBlock = LegacyEditorBlock;

const UNSAFE_URL_PREFIXES = ["blob:", "data:", "javascript:"];

export async function parseMarkdownToEditorBlocks(
  markdown: string,
): Promise<EditorBlock[]> {
  const detected = detectBlockTypes(markdown);
  return [
    {
      id: "source",
      type: "source",
      source: markdown,
    },
    ...buildLineBlocks(markdown),
    ...Array.from(detected).map((type, index) => ({ id: `${type}-${index}`, type })),
  ];
}

export async function serializeEditorBlocksToMarkdown(
  blocks: EditorBlock[],
): Promise<string> {
  const source = blocks.find((block) => typeof block.source === "string")?.source;
  if (typeof source === "string") return normalizeBlockNoteOutput(source);

  return blocks.map(blockToMarkdown).filter(Boolean).join("\n\n");
}

export function normalizeBlockNoteOutput(markdown: string): string {
  const figureNormalized = collapseImageFigures(degradeLegacyInlineLosses(markdown));
  const lines = figureNormalized.split("\n");
  const out: string[] = [];
  for (const original of lines) {
    let line = original;
    if (line.startsWith(">")) {
      if (line.endsWith("\\")) {
        line = line.slice(0, -1).replace(/\s+$/, "");
      }
      line = line.replace(/^>\s\s+/, "> ");
    }
    out.push(line);
  }
  return out.join("\n");
}

function buildLineBlocks(markdown: string): EditorBlock[] {
  return markdown
    .split("\n")
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim().length > 0)
    .map(({ line, index }) => ({
      id: `line-${index}`,
      type: detectLineType(line),
      content: line,
    }));
}

function detectLineType(line: string): string {
  if (/^#{1,6}\s+/.test(line)) return "heading";
  if (/^>\s?/.test(line)) return "quote";
  if (/^\s*[-*+]\s+/.test(line)) return "bulletListItem";
  if (/^\s*\d+\.\s+/.test(line)) return "numberedListItem";
  if (/^\|.*\|$/.test(line)) return "table";
  if (/!\[[^\]]*]\([^)]+\)/.test(line)) return "image";
  if (/^```/.test(line)) return "codeBlock";
  return "paragraph";
}

function degradeLegacyInlineLosses(markdown: string): string {
  return markdown
    .replace(/<\/?(?:kbd|sup)>/g, "")
    .replace(/\[([^\]]+)]\(([^)\s]+)\s+"[^"]+"\)/g, "[$1]($2)");
}

export function isSafeMediaUrl(url: string): boolean {
  if (typeof url !== "string" || url.length === 0) return false;
  const lowered = url.toLowerCase().trim();
  return !UNSAFE_URL_PREFIXES.some((prefix) => lowered.startsWith(prefix));
}

function detectBlockTypes(markdown: string): Set<string> {
  const types = new Set<string>();
  const lines = markdown.split("\n");
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line)) {
      types.add("codeBlock");
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^#{1,6}\s+/.test(line)) types.add("heading");
    else if (/^>\s?/.test(line)) types.add("quote");
    else if (/^\s*[-*+]\s+/.test(line)) types.add("bulletListItem");
    else if (/^\s*\d+\.\s+/.test(line)) types.add("numberedListItem");
    else if (/^\|.*\|$/.test(line)) types.add("table");
    else if (/!\[[^\]]*]\([^)]+\)/.test(line)) types.add("image");
    else if (line.trim().length > 0) types.add("paragraph");
  }

  return types;
}

function blockToMarkdown(block: EditorBlock): string {
  if (typeof block.source === "string") return block.source;

  if (block.type === "heading") {
    const level = readNumberProp(block, "level", 2);
    return `${"#".repeat(level)} ${readText(block)}`;
  }

  if (block.type === "image") {
    const props = block.props ?? {};
    const src = typeof props.url === "string" ? props.url : "";
    const alt = typeof props.caption === "string" ? props.caption : "";
    return src ? `![${alt}](${src})` : "";
  }

  return readText(block);
}

function readNumberProp(block: EditorBlock, key: string, fallback: number): number {
  const value = block.props?.[key];
  return typeof value === "number" ? value : fallback;
}

function readText(block: EditorBlock): string {
  if (typeof block.content === "string") return block.content;
  if (Array.isArray(block.content)) {
    return block.content
      .map((part) =>
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
          ? part.text
          : "",
      )
      .join("");
  }
  return "";
}

const FIGURE_IMAGE_PATTERN =
  /<figure>\s*<img\b([^>]*)>\s*(?:<figcaption>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/g;

function collapseImageFigures(markdown: string): string {
  return markdown.replace(
    FIGURE_IMAGE_PATTERN,
    (_match, attrs: string, caption: string | undefined) => {
      const srcMatch = /\bsrc="([^"]+)"/.exec(attrs);
      const altMatch = /\balt="([^"]*)"/.exec(attrs);
      if (!srcMatch) return _match;
      const src = srcMatch[1];
      const altLabel = (caption ?? altMatch?.[1] ?? "").trim();
      return `![${altLabel}](${src})`;
    },
  );
}
