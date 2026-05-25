import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf-8");
}

describe("admin AR-4 button, form, and focus conventions", () => {
  const commentsTable = source("src/components/admin/comments/CommentsTable.tsx");
  const postMetaSidebar = source(
    "src/components/admin/entries/EntryEditor.tsx",
  );
  const postRowActions = source(
    "src/components/admin/entries/EntryRowActions.tsx",
  );
  const coverUploader = source("src/components/admin/entries/EntryEditor.tsx");
  const mediaUploadDropzone = source(
    "src/components/admin/media/MediaUploadDropzone.tsx",
  );

  it("uses Button variants instead of ad-hoc native button styling in comment actions", () => {
    expect(commentsTable).toContain('import { Button } from "@/components/ui/button"');
    expect(commentsTable).not.toMatch(
      /className="rounded border border-border px-(2|3)/,
    );
  });

  it("uses destructive tokens for delete row actions", () => {
    const destructiveActionSources = [
      commentsTable,
      postRowActions,
    ];

    for (const actionSource of destructiveActionSources) {
      expect(actionSource).toContain("text-destructive");
      expect(actionSource).toContain("hover:bg-destructive/10");
      expect(actionSource).not.toMatch(/text-red-|bg-red-|hover:bg-red-/);
    }
  });

  it("uses semantic form helper and label tokens in post metadata", () => {
    expect(postMetaSidebar).toContain("text-sm font-medium text-fg");
    expect(postMetaSidebar).toContain("text-sm text-muted-fg");
    expect(postMetaSidebar).not.toContain("text-[hsl(var(--muted))]");
  });

  it("uses ring token utilities for custom upload focus surfaces", () => {
    for (const uploadSource of [coverUploader, mediaUploadDropzone]) {
      expect(uploadSource).toContain("focus-visible:ring-ring");
      expect(uploadSource).toContain("focus-visible:ring-offset-bg");
      expect(uploadSource).not.toContain("focus-visible:ring-[hsl(var(--ring))]");
      expect(uploadSource).not.toContain(
        "focus-visible:ring-offset-[hsl(var(--bg))]",
      );
    }
  });
});
