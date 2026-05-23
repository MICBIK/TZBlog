import { describe, expect, it } from "vitest";
import {
  evaluateNotionEditorCandidate,
  selectNotionEditorCandidate,
  type NotionEditorCandidateEvaluation,
} from "./notionEditorAdapter";
import { renderMarkdown } from "@/lib/markdown";

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

  it("preservesMarkdownFixtureSemantics", async () => {
    const markdown = [
      "## 写作系统 POC",
      "",
      "这是 **粗体**、*斜体*、`inline code` 和 [链接](https://example.com)。",
      "",
      "![示例图](/uploads/example.png)",
      "",
      "> [!WARNING]",
      "> 保留 GitHub alert callout。",
      "",
      "> 普通引用也要保留。",
      "",
      "| 功能 | 状态 |",
      "| --- | --- |",
      "| 表格 | 保留 |",
      "| 中文 | 保留 |",
      "",
      "```ts title=\"src/demo.ts\"",
      "const answer = 42;",
      "```",
      "",
      "<kbd>⌘</kbd> + <kbd>K</kbd>",
    ].join("\n");

    const evaluation = await evaluateNotionEditorCandidate({
      candidate: "mdxeditor",
      priority: 2,
      notionLikeScore: 3,
      markdownSafetyScore: 4,
      markdown,
      roundTripMarkdown: (source) => source,
      renderMarkdown,
    });

    expect(evaluation.evidence).toEqual({
      markdownImportExport: "pass",
      renderMarkdownParity: "pass",
      unsupportedMarkdownFeatures: [],
    });

    const lossyEvaluation = await evaluateNotionEditorCandidate({
      candidate: "novel-tiptap",
      priority: 1,
      notionLikeScore: 5,
      markdownSafetyScore: 2,
      markdown,
      roundTripMarkdown: (source) =>
        source
          .replace("> [!WARNING]\n> 保留 GitHub alert callout。\n\n", "")
          .replace("| 功能 | 状态 |\n| --- | --- |\n| 表格 | 保留 |\n| 中文 | 保留 |\n\n", ""),
      renderMarkdown,
    });

    expect(lossyEvaluation.evidence.markdownImportExport).toBe("fail");
    expect(lossyEvaluation.evidence.renderMarkdownParity).toBe("fail");
    expect(lossyEvaluation.evidence.unsupportedMarkdownFeatures).toEqual(
      expect.arrayContaining(["github-alert", "table"]),
    );
  });
});
