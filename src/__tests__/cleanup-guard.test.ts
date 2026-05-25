import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const ROOT = process.cwd();
const GUARD_FILE = "cleanup-guard.test.ts";

function grepCount(pattern: string, dir: string): number {
  try {
    const result = execSync(
      `grep -r ${pattern} ${dir} --include="*.tsx" --include="*.ts" --include="*.prisma" --exclude=${GUARD_FILE} || true`,
      { encoding: "utf8" },
    );
    return result.trim() ? result.trim().split("\n").length : 0;
  } catch {
    return 0;
  }
}

describe("cleanup guard — no legacy code remnants", () => {
  test.each([
    [`"model Post "`, "prisma/"],
    [`"model Column "`, "prisma/"],
    [`-w HomeGarden`, "src/"],
    [`-w HomeHero`, "src/"],
    [`-w HomeColumns`, "src/"],
    [`-w HomeFeaturedAndRecent`, "src/"],
    [`-w NotionBlockEditor`, "src/"],
    [`@blocknote`, "src/"],
    [`@codemirror`, "src/"],
    [`@/lib/services/posts`, "src/"],
    [`-w PostEditor`, "src/"],
    [`-w MarkdownEditorWithPreview`, "src/"],
    [`-w listPosts`, "src/"],
    [`-w getPostBySlug`, "src/"],
  ])("no occurrences of %s in %s", (pattern, dir) => {
    expect(grepCount(pattern, join(ROOT, dir))).toBe(0);
  });

  test("legacy directory src/app/(site)/columns absent", () => {
    expect(existsSync(join(ROOT, "src/app/(site)/columns"))).toBe(false);
  });

  test("legacy directory src/app/(admin)/admin/posts absent", () => {
    expect(existsSync(join(ROOT, "src/app/(admin)/admin/posts"))).toBe(false);
  });

  test("admin entries directory exists", () => {
    expect(existsSync(join(ROOT, "src/app/(admin)/admin/entries"))).toBe(true);
  });

  test("legacy notion-block-editor SDD archived", () => {
    expect(existsSync(join(ROOT, ".claude/sdd/notion-block-editor"))).toBe(false);
    expect(
      existsSync(
        join(ROOT, ".claude/sdd/archive/2026-05-25-notion-block-editor/SUPERSEDED.md"),
      ),
    ).toBe(true);
  });

  test("round-trip fixtures remain for Milkdown editor", () => {
    expect(
      existsSync(join(ROOT, "src/components/editor/__fixtures__/round-trip/basic.md")),
    ).toBe(true);
  });

  test("package.json no longer references blocknote / codemirror", () => {
    const pkg = JSON.parse(execSync("cat package.json", { encoding: "utf8" }));
    const all = JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(all).not.toMatch(/@blocknote/);
    expect(all).not.toMatch(/@codemirror/);
    expect(all).not.toMatch(/"codemirror"/);
  });
});
