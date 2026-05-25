import type { ReactNode } from "react";

import { resolveFontMono } from "@/lib/theme/font";

import { TerminalCursor } from "./TerminalCursor";

type TerminalShellProps = {
  slug: string;
  children: ReactNode;
};

export function TerminalShell({ slug, children }: TerminalShellProps) {
  return (
    <div
      data-theme="terminal"
      data-testid="terminal-shell"
      className="min-h-[50vh] bg-bg text-fg"
      style={{ fontFamily: resolveFontMono("terminal") }}
    >
      <div
        data-testid="terminal-prompt"
        className="border-b border-border px-4 py-3 font-mono text-sm"
      >
        <span className="text-muted-fg">hai@tzblog:</span>
        <span className="text-fg">~/{slug}$</span>
        <TerminalCursor />
      </div>
      <div className="terminal-shell-content space-y-6 px-4 py-6">{children}</div>
    </div>
  );
}
