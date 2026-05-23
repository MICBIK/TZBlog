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

export function selectNotionEditorCandidate(
  evaluations: NotionEditorCandidateEvaluation[],
): NotionEditorCandidateSelection | null {
  void evaluations;
  return null;
}
