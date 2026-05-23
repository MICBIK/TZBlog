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
  void markdown;
  void roundTripMarkdown;
  void renderMarkdown;

  return {
    candidate,
    priority,
    notionLikeScore,
    markdownSafetyScore,
    evidence: {
      markdownImportExport: "unknown",
      renderMarkdownParity: "unknown",
      unsupportedMarkdownFeatures: [],
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
