import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import { createHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from "shiki";

// Local minimal hast shapes — `@types/hast` is not a direct dep, and we only
// need the few fields that show up in the visitor.
interface HastElement {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  data?: Record<string, unknown>;
  children: HastNode[];
}
interface HastText {
  type: "text";
  value: string;
}
interface HastRaw {
  type: "raw";
  value: string;
  [k: string]: unknown;
}
type HastNode = HastElement | HastText | HastRaw | { type: string; [k: string]: unknown };
interface HastRoot {
  type: "root";
  children: HastNode[];
}
type HastParent = HastRoot | HastElement;

type MarkdownAlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

/**
 * Markdown rendering pipeline (per systemPatterns §13).
 *
 * remark-parse → remark-gfm → remark-rehype → rehype-slug
 * → rehype-autolink-headings → rehype-sanitize → rehype-shiki → rehype-stringify
 *
 * Note: `rehype-sanitize` runs *before* shiki because shiki injects `style` attrs
 * on tokens that the default sanitize schema strips. We extend the schema to
 * allow shiki's safe `style`, `class`, and `tabindex` markup so highlighted
 * output survives sanitization. Sanitize stays in the pipeline as a hard wall
 * against user-supplied raw HTML (XSS).
 */

type ShikiThemeSet = Record<"light" | "dark", BundledTheme>;

const DEFAULT_THEMES: ShikiThemeSet = {
  light: "github-light",
  dark: "github-dark-default",
};

const DEFAULT_LANGS: BundledLanguage[] = [
  "typescript",
  "tsx",
  "javascript",
  "json",
  "bash",
  "css",
  "html",
  "sql",
  "yaml",
  "markdown",
];

// Lazily created and shared singleton — shiki highlighter init is expensive.
const highlighterCache = new Map<string, Promise<Highlighter>>();

function getHighlighter(themes: ShikiThemeSet): Promise<Highlighter> {
  const cacheKey = `${themes.light}|${themes.dark}`;
  const cached = highlighterCache.get(cacheKey);
  if (cached) return cached;
  const themeList = Array.from(new Set(Object.values(themes)));
  const created = createHighlighter({
    themes: themeList,
    langs: DEFAULT_LANGS,
  });
  highlighterCache.set(cacheKey, created);
  return created;
}

interface RehypeShikiOptions {
  themes: ShikiThemeSet;
}

/**
 * Inline rehype plugin: syntax-highlight `<pre><code class="language-x">...</code></pre>`
 * blocks via shiki v4. The packaged `rehype-shiki@0.0.9` is incompatible with
 * shiki v4's API, so we implement the visitor here.
 *
 * Typed as a plain transformer factory (no `unified.Plugin<...>` wrapping) so
 * that strict tsc keeps the broader `unified()` chain happy across versions.
 */
function rehypeShiki(options: RehypeShikiOptions) {
  const { themes } = options;
  return async (tree: HastRoot) => {
    const highlighter = await getHighlighter(themes);
    const loadedLangs = new Set(highlighter.getLoadedLanguages());

    const codeBlocks: Array<{
      parent: HastParent;
      index: number;
      pre: HastElement;
      lang: string | null;
      filename: string | null;
      code: string;
    }> = [];

    visit(tree as never, "element", (node: unknown, index: number | undefined, parent: unknown) => {
      const el = node as HastElement;
      if (el.tagName !== "pre" || typeof index !== "number" || !isHastParent(parent)) {
        return;
      }
      const code = el.children.find(
        (child): child is HastElement =>
          (child as HastElement).type === "element" &&
          (child as HastElement).tagName === "code",
      );
      if (!code) return;

      codeBlocks.push({
        parent,
        index,
        pre: el,
        lang: codeLanguage(code),
        filename: codeFilename(code),
        code: hastToString(code as never),
      });
    });

    for (const { parent, index, pre, lang, filename, code } of codeBlocks) {
      let highlightedPre = createPlainCodePre(pre);

      if (lang && loadedLangs.has(lang)) {
        try {
          const hast = highlighter.codeToHast(code, {
            lang,
            themes,
            defaultColor: "light",
          }) as unknown as HastRoot;
          // codeToHast returns a root containing the <pre> element. Replace the
          // current <pre> in-place with shiki's <pre>.
          const shikiPre = hast.children.find(
            (c): c is HastElement => (c as HastElement).type === "element" && (c as HastElement).tagName === "pre",
          );
          if (shikiPre) {
            highlightedPre = shikiPre;
          }
        } catch {
          highlightedPre = createPlainCodePre(pre);
        }
      }

      parent.children[index] = createCodeBlockFigure(highlightedPre, lang, filename);
    }
  };
}

function isHastParent(node: unknown): node is HastParent {
  return (
    typeof node === "object" &&
    node !== null &&
    Array.isArray((node as HastParent).children)
  );
}

function createCodeBlockFigure(
  pre: HastElement,
  lang: string | null,
  filename: string | null,
): HastElement {
  const language = lang ?? "text";
  const captionChildren: HastNode[] = [
    {
      type: "element",
      tagName: "span",
      properties: { className: ["code-block-language"] },
      children: [{ type: "text", value: language.toUpperCase() }],
    },
  ];

  if (filename) {
    captionChildren.push({
      type: "element",
      tagName: "span",
      properties: { className: ["code-block-filename"] },
      children: [{ type: "text", value: filename }],
    });
  }
  captionChildren.push(createCodeCopyButton());

  return {
    type: "element",
    tagName: "figure",
    properties: {
      className: ["code-block"],
      dataLanguage: language,
    },
    children: [
      {
        type: "element",
        tagName: "figcaption",
        properties: { className: ["code-block-chrome"] },
        children: captionChildren,
      },
      pre,
    ],
  };
}

function createPlainCodePre(pre: HastElement): HastElement {
  return {
    ...pre,
    properties: {},
    children: pre.children.map((child) => {
      const el = child as HastElement;
      if (el.type !== "element" || el.tagName !== "code") return child;
      return {
        ...el,
        properties: {},
      };
    }),
  };
}

function createCodeCopyButton(): HastElement {
  return {
    type: "element",
    tagName: "button",
    properties: {
      className: ["code-block-copy"],
      dataCopy: "",
      ariaLabel: "复制代码",
      dataState: "idle",
      type: "button",
    },
    children: [
      {
        type: "element",
        tagName: "svg",
        properties: {
          ariaHidden: "true",
          className: ["code-block-copy-icon"],
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "2",
          viewBox: "0 0 24 24",
        },
        children: [
          {
            type: "element",
            tagName: "rect",
            properties: {
              height: "14",
              rx: "2",
              ry: "2",
              width: "14",
              x: "8",
              y: "8",
            },
            children: [],
          },
          {
            type: "element",
            tagName: "path",
            properties: {
              d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
            },
            children: [],
          },
        ],
      },
    ],
  };
}

function codeLanguage(node: HastElement): string | null {
  const className = (node.properties?.className ?? []) as Array<unknown>;
  for (const c of className) {
    if (typeof c === "string" && c.startsWith("language-")) {
      return c.slice("language-".length);
    }
  }
  return null;
}

function codeFilename(node: HastElement): string | null {
  const meta = node.data?.meta;
  if (typeof meta !== "string") return null;

  const match = /(?:^|\s)title=(?:"([^"]+)"|'([^']+)'|([^\s]+))/.exec(meta);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function rehypeKeyboardShortcuts() {
  return (tree: HastRoot) => {
    transformKeyboardShortcuts(tree);
  };
}

function transformKeyboardShortcuts(parent: HastParent): void {
  for (const child of parent.children) {
    if ((child as HastElement).type === "element") {
      transformKeyboardShortcuts(child as HastElement);
    }
  }

  for (let index = 0; index < parent.children.length - 2; index++) {
    const start = parent.children[index];
    const label = parent.children[index + 1];
    const end = parent.children[index + 2];

    if (!isRawKbdStart(start) || !isTextNode(label) || !isRawKbdEnd(end)) {
      continue;
    }

    parent.children.splice(index, 3, {
      type: "element",
      tagName: "kbd",
      properties: {},
      children: [{ type: "text", value: label.value }],
    });
  }
}

function isTextNode(node: HastNode): node is HastText {
  return (node as HastText).type === "text";
}

function isRawKbdStart(node: HastNode): node is HastRaw {
  return (
    (node as unknown as HastRaw).type === "raw" &&
    /^<kbd>$/i.test((node as unknown as HastRaw).value)
  );
}

function isRawKbdEnd(node: HastNode): node is HastRaw {
  return (
    (node as unknown as HastRaw).type === "raw" &&
    /^<\/kbd>$/i.test((node as unknown as HastRaw).value)
  );
}

function rehypeWrapTables() {
  return (tree: HastRoot) => {
    const tables: Array<{
      parent: HastParent;
      index: number;
      table: HastElement;
    }> = [];

    visit(tree as never, "element", (node: unknown, index: number | undefined, parent: unknown) => {
      const el = node as HastElement;
      if (el.tagName !== "table" || typeof index !== "number" || !isHastParent(parent)) {
        return;
      }

      tables.push({ parent, index, table: el });
    });

    for (const { parent, index, table } of tables) {
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["md-table-scroll"] },
        children: [table],
      };
    }
  };
}

function rehypeArticleImages() {
  return (tree: HastRoot) => {
    const paragraphs: Array<{
      parent: HastParent;
      index: number;
      image: HastElement;
    }> = [];

    visit(tree as never, "element", (node: unknown, index: number | undefined, parent: unknown) => {
      const el = node as HastElement;
      if (el.tagName === "img") {
        enhanceMarkdownImage(el);
        return;
      }

      if (el.tagName !== "p" || typeof index !== "number" || !isHastParent(parent)) {
        return;
      }

      const image = onlyImageChild(el);
      if (!image) return;

      enhanceMarkdownImage(image);
      paragraphs.push({ parent, index, image });
    });

    for (const { parent, index, image } of paragraphs) {
      parent.children[index] = {
        type: "element",
        tagName: "figure",
        properties: { className: ["md-image-frame"] },
        children: [image],
      };
    }
  };
}

function onlyImageChild(paragraph: HastElement): HastElement | null {
  let image: HastElement | null = null;

  for (const child of paragraph.children) {
    if (isTextNode(child) && child.value.trim() === "") {
      continue;
    }

    if ((child as HastElement).type === "element" && (child as HastElement).tagName === "img" && !image) {
      image = child as HastElement;
      continue;
    }

    return null;
  }

  return image;
}

function enhanceMarkdownImage(image: HastElement): void {
  const className = normalizeClassName(image.properties?.className);
  if (!className.includes("md-image")) {
    className.push("md-image");
  }

  image.properties = {
    ...(image.properties ?? {}),
    className,
    decoding: image.properties?.decoding ?? "async",
    loading: image.properties?.loading ?? "lazy",
  };
}

function normalizeClassName(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }
  return [];
}

function rehypeCollectToc(headings: TocHeading[]) {
  return (tree: HastRoot) => {
    visit(tree as never, "element", (node: unknown) => {
      const el = node as HastElement;
      if (el.tagName !== "h2" && el.tagName !== "h3") return;

      const id = el.properties?.id;
      if (typeof id !== "string" || !id) return;

      headings.push({
        id,
        text: hastToString(el as never),
        level: el.tagName === "h2" ? 2 : 3,
      });
    });
  };
}

function rehypeMarkdownAlerts() {
  return (tree: HastRoot) => {
    visit(tree as never, "element", (node: unknown) => {
      const el = node as HastElement;
      if (el.tagName !== "blockquote") return;

      const match = extractAlertMarker(el);
      if (!match) return;

      const type = match.type.toLowerCase();
      el.tagName = "aside";
      el.properties = {
        ...(el.properties ?? {}),
        className: ["markdown-alert", `markdown-alert-${type}`],
        dataAlertType: type,
        role: "note",
      };
      el.children = [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["markdown-alert-title"] },
          children: [
            createAlertIcon(match.type),
            {
              type: "element",
              tagName: "span",
              properties: { className: ["markdown-alert-label"] },
              children: [{ type: "text", value: formatAlertLabel(match.type) }],
            },
          ],
        },
        ...el.children,
      ];
    });
  };
}

function extractAlertMarker(
  blockquote: HastElement,
): { type: MarkdownAlertType } | null {
  const firstParagraph = blockquote.children.find(
    (child): child is HastElement =>
      (child as HastElement).type === "element" &&
      (child as HastElement).tagName === "p",
  );
  if (!firstParagraph) return null;

  const firstText = firstParagraph.children.find(
    (child): child is HastText => (child as HastText).type === "text",
  );
  if (!firstText) return null;

  const marker = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n\s*|\s+|$)/.exec(
    firstText.value,
  );
  if (!marker) return null;

  const type = marker[1] as MarkdownAlertType;
  firstText.value = firstText.value.slice(marker[0].length);

  if (
    firstText.value === "" &&
    firstParagraph.children.every(
      (child) => child === firstText || hastToString(child as never) === "",
    )
  ) {
    blockquote.children = blockquote.children.filter(
      (child) => child !== firstParagraph,
    );
  }

  return { type };
}

function formatAlertLabel(type: MarkdownAlertType): string {
  return `${type[0]}${type.slice(1).toLowerCase()}`;
}

function createAlertIcon(type: MarkdownAlertType): HastElement {
  return {
    type: "element",
    tagName: "svg",
    properties: {
      ariaHidden: "true",
      className: ["markdown-alert-icon"],
      fill: "none",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "2",
      viewBox: "0 0 24 24",
    },
    children: alertIconChildren(type),
  };
}

function alertIconChildren(type: MarkdownAlertType): HastElement[] {
  switch (type) {
    case "NOTE":
      return [
        svgCircle({ cx: "12", cy: "12", r: "10" }),
        svgPath("M12 16v-4"),
        svgPath("M12 8h.01"),
      ];
    case "TIP":
      return [
        svgPath(
          "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
        ),
        svgPath("M9 18h6"),
        svgPath("M10 22h4"),
      ];
    case "IMPORTANT":
      return [
        svgCircle({ cx: "12", cy: "12", r: "10" }),
        svgLine({ x1: "12", x2: "12", y1: "8", y2: "12" }),
        svgLine({ x1: "12", x2: "12.01", y1: "16", y2: "16" }),
      ];
    case "WARNING":
      return [
        svgPath(
          "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
        ),
        svgPath("M12 9v4"),
        svgPath("M12 17h.01"),
      ];
    case "CAUTION":
      return [
        svgPath("m15 9-6 6"),
        svgPath(
          "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z",
        ),
        svgPath("m9 9 6 6"),
      ];
  }
}

function svgPath(d: string): HastElement {
  return {
    type: "element",
    tagName: "path",
    properties: { d },
    children: [],
  };
}

function svgCircle(properties: Record<string, string>): HastElement {
  return {
    type: "element",
    tagName: "circle",
    properties,
    children: [],
  };
}

function svgLine(properties: Record<string, string>): HastElement {
  return {
    type: "element",
    tagName: "line",
    properties,
    children: [],
  };
}

// Sanitize schema extension — allow attributes shiki and our anchor plugins emit.
// `clobberPrefix: ""` disables the default `user-content-` id rewrite so heading
// slugs stay aligned with the autolink hrefs emitted by `rehype-autolink-headings`.
const sanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: "",
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "aside",
    "circle",
    "figure",
    "line",
    "path",
    "kbd",
    "svg",
  ],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    "*": [
      ...((defaultSchema.attributes?.["*"] ?? []) as unknown as string[]),
      "className",
      "style",
      "tabIndex",
    ],
    code: [
      ...((defaultSchema.attributes?.code ?? []) as unknown as string[]),
      "className",
      "style",
    ],
    span: [
      ...((defaultSchema.attributes?.span ?? []) as unknown as string[]),
      "className",
      "style",
    ],
    svg: [
      ...((defaultSchema.attributes?.svg ?? []) as unknown as string[]),
      "ariaHidden",
      "className",
      "fill",
      "stroke",
      "strokeLinecap",
      "strokeLinejoin",
      "strokeWidth",
      "viewBox",
    ],
    circle: [
      ...((defaultSchema.attributes?.circle ?? []) as unknown as string[]),
      "cx",
      "cy",
      "r",
    ],
    line: [
      ...((defaultSchema.attributes?.line ?? []) as unknown as string[]),
      "x1",
      "x2",
      "y1",
      "y2",
    ],
    path: [
      ...((defaultSchema.attributes?.path ?? []) as unknown as string[]),
      "d",
    ],
    kbd: [
      ...((defaultSchema.attributes?.kbd ?? []) as unknown as string[]),
      "className",
    ],
    pre: [
      ...((defaultSchema.attributes?.pre ?? []) as unknown as string[]),
      "className",
      "style",
      "tabIndex",
    ],
    div: [
      ...((defaultSchema.attributes?.div ?? []) as unknown as string[]),
      "className",
    ],
    figure: [
      ...((defaultSchema.attributes?.figure ?? []) as unknown as string[]),
      "className",
    ],
    img: [
      ...((defaultSchema.attributes?.img ?? []) as unknown as string[]),
      "className",
      "decoding",
      "loading",
    ],
    aside: [
      ...((defaultSchema.attributes?.blockquote ?? []) as unknown as string[]),
      "className",
      "dataAlertType",
      "role",
    ],
    a: [
      ...((defaultSchema.attributes?.a ?? []) as unknown as string[]),
      "ariaHidden",
      "ariaLabel",
      "tabIndex",
    ],
  },
} as typeof defaultSchema;

export interface RenderMarkdownOptions {
  theme?: BundledTheme;
}

/**
 * Render Markdown content to a sanitized HTML string with syntax highlighting.
 *
 * Empty input short-circuits to an empty string so callers (e.g. previews)
 * don't pay the highlighter init cost on first paint.
 */
export async function renderMarkdown(
  content: string,
  opts: RenderMarkdownOptions = {},
): Promise<string> {
  if (!content) return "";
  const themes: ShikiThemeSet = opts.theme
    ? { light: opts.theme, dark: opts.theme }
    : DEFAULT_THEMES;
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeMarkdownAlerts)
    .use(rehypeWrapTables)
    .use(rehypeKeyboardShortcuts)
    .use(rehypeArticleImages)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeShiki, { themes })
    .use(rehypeStringify)
    .process(content);
  return String(file);
}

export async function extractToc(content: string): Promise<TocHeading[]> {
  if (!content) return [];

  const headings: TocHeading[] = [];
  await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(rehypeCollectToc, headings)
    .use(rehypeStringify)
    .process(content);

  return headings;
}
