export type NotionEditorCandidateName =
  | "novel-tiptap"
  | "mdxeditor"
  | "milkdown";

export type NotionEditorEvidenceStatus = "unknown" | "pass" | "fail";

export interface NotionEditorCandidateEvaluation {
  candidate: NotionEditorCandidateName;
  priority: number;
  notionLikeScore: number;
  markdownSafetyScore: number;
  evidence: {
    markdownImportExport: NotionEditorEvidenceStatus;
    renderMarkdownParity: NotionEditorEvidenceStatus;
    unsupportedMarkdownFeatures: string[];
  };
}

export interface NotionEditorCandidateSelection {
  candidate: NotionEditorCandidateName;
  rationale: string;
}

export interface NotionEditorCandidateEvaluationInput {
  candidate: NotionEditorCandidateName;
  priority: number;
  notionLikeScore: number;
  markdownSafetyScore: number;
  markdown: string;
  roundTripMarkdown: (markdown: string) => string | Promise<string>;
  renderMarkdown: (markdown: string) => string | Promise<string>;
}

export async function evaluateNotionEditorCandidate({
  candidate,
  priority,
  notionLikeScore,
  markdownSafetyScore,
  markdown,
  roundTripMarkdown,
  renderMarkdown,
}: NotionEditorCandidateEvaluationInput): Promise<NotionEditorCandidateEvaluation> {
  const roundTrippedMarkdown = await roundTripMarkdown(markdown);
  const originalHtml = normalizeHtml(await renderMarkdown(markdown));
  const roundTrippedHtml = normalizeHtml(await renderMarkdown(roundTrippedMarkdown));

  const markdownImportExport =
    normalizeMarkdown(markdown) === normalizeMarkdown(roundTrippedMarkdown)
      ? "pass"
      : "fail";
  const renderMarkdownParity =
    originalHtml === roundTrippedHtml ? "pass" : "fail";
  const unsupportedMarkdownFeatures = collectUnsupportedMarkdownFeatures(
    markdown,
    roundTrippedMarkdown,
  );

  return {
    candidate,
    priority,
    notionLikeScore,
    markdownSafetyScore,
    evidence: {
      markdownImportExport,
      renderMarkdownParity,
      unsupportedMarkdownFeatures,
    },
  };
}

export function selectNotionEditorCandidate(
  evaluations: NotionEditorCandidateEvaluation[],
): NotionEditorCandidateSelection | null {
  const verifiedCandidates = evaluations
    .filter((evaluation) => {
      return (
        evaluation.evidence.markdownImportExport === "pass" &&
        evaluation.evidence.renderMarkdownParity === "pass" &&
        evaluation.evidence.unsupportedMarkdownFeatures.length === 0
      );
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;

      const aScore = a.notionLikeScore + a.markdownSafetyScore;
      const bScore = b.notionLikeScore + b.markdownSafetyScore;
      return bScore - aScore;
    });

  const selected = verifiedCandidates[0];
  if (!selected) return null;

  return {
    candidate: selected.candidate,
    rationale: `${selected.candidate} passed Markdown import/export and renderMarkdown parity checks`,
  };
}

function normalizeMarkdown(value: string): string {
  return value.replace(/\r\n/g, "\n").trimEnd();
}

function normalizeHtml(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function collectUnsupportedMarkdownFeatures(
  originalMarkdown: string,
  roundTrippedMarkdown: string,
): string[] {
  const features = new Set<string>();

  if (
    hasGithubAlert(originalMarkdown) &&
    !hasGithubAlert(roundTrippedMarkdown)
  ) {
    features.add("github-alert");
  }

  if (hasTable(originalMarkdown) && !hasTable(roundTrippedMarkdown)) {
    features.add("table");
  }

  if (
    hasCodeFence(originalMarkdown) &&
    !hasCodeFence(roundTrippedMarkdown)
  ) {
    features.add("code-fence");
  }

  if (hasImage(originalMarkdown) && !hasImage(roundTrippedMarkdown)) {
    features.add("image");
  }

  return [...features];
}

function hasGithubAlert(markdown: string): boolean {
  return /^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/im.test(markdown);
}

function hasTable(markdown: string): boolean {
  const lines = markdown.split(/\r?\n/);

  return lines.some((line, index) => {
    const previousLine = lines[index - 1];
    if (!previousLine?.includes("|")) return false;

    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  });
}

function hasCodeFence(markdown: string): boolean {
  return /```/.test(markdown);
}

function hasImage(markdown: string): boolean {
  return /!\[[^\]]*]\([^)]+\)/.test(markdown);
}
