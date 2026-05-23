import { describe, expect, it } from "vitest";
import {
  selectNotionEditorCandidate,
  type NotionEditorCandidateEvaluation,
} from "./notionEditorAdapter";

describe("notion editor adapter decision gate", () => {
  it("selectsCandidateOnlyAfterRoundTripEvidence", () => {
    const incompleteEvidence: NotionEditorCandidateEvaluation[] = [
      {
        candidate: "novel-tiptap",
        priority: 1,
        notionLikeScore: 5,
        markdownSafetyScore: 2,
        evidence: {
          markdownImportExport: "unknown",
          renderMarkdownParity: "unknown",
          unsupportedMarkdownFeatures: ["github-alert"],
        },
      },
      {
        candidate: "mdxeditor",
        priority: 2,
        notionLikeScore: 3,
        markdownSafetyScore: 4,
        evidence: {
          markdownImportExport: "pass",
          renderMarkdownParity: "unknown",
          unsupportedMarkdownFeatures: [],
        },
      },
    ];

    expect(selectNotionEditorCandidate(incompleteEvidence)).toBeNull();

    const verifiedEvidence: NotionEditorCandidateEvaluation[] = [
      {
        candidate: "novel-tiptap",
        priority: 1,
        notionLikeScore: 5,
        markdownSafetyScore: 2,
        evidence: {
          markdownImportExport: "fail",
          renderMarkdownParity: "pass",
          unsupportedMarkdownFeatures: ["table"],
        },
      },
      {
        candidate: "mdxeditor",
        priority: 2,
        notionLikeScore: 3,
        markdownSafetyScore: 4,
        evidence: {
          markdownImportExport: "pass",
          renderMarkdownParity: "pass",
          unsupportedMarkdownFeatures: [],
        },
      },
    ];

    expect(selectNotionEditorCandidate(verifiedEvidence)).toEqual({
      candidate: "mdxeditor",
      rationale:
        "mdxeditor passed Markdown import/export and renderMarkdown parity checks",
    });
  });
});
