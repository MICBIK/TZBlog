import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function grepCount(command: string): number {
  const output = execSync(`${command} || true`, {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();

  return output === "" ? 0 : output.split("\n").length;
}

describe("M1 cleanup guard", () => {
  it("has no legacy Prisma Post model", () => {
    expect(grepCount(`grep -r "model Post " prisma/`)).toBe(0);
  });

  it("has no HomeGarden residue in src", () => {
    expect(grepCount(`grep -rwn "HomeGarden" src/ --exclude=cleanup-guard.test.ts`)).toBe(0);
  });

  it("has no BlockNote source imports", () => {
    expect(grepCount(`grep -r 'from "@blocknote' src/`)).toBe(0);
  });

  it("does not list BlockNote or direct CodeMirror packages", () => {
    const packageJson = readFileSync(join(ROOT, "package.json"), "utf8");

    expect(packageJson).not.toMatch(/@blocknote|@codemirror|"codemirror"/);
  });
});
