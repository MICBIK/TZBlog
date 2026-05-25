import path from "node:path";

export const M4_PUBLIC_UI_SMOKE_DIR = path.join(
  process.cwd(),
  ".claude/sdd/blog-ia-redesign/smoke/m4-public-ui",
);

export type M4SmokeViewport = "desktop" | "mobile";

export type M4SmokeScene = {
  id: string;
  path: string;
  readySelector: string;
  demoDirection: string;
  initScript?: string;
  viewports?: readonly M4SmokeViewport[];
};

export const M4_SMOKE_SCENES: readonly M4SmokeScene[] = [
  {
    id: "reading-ink-garden",
    path: "/posts/why-i-rewrote-my-blog",
    readySelector: "[data-article-reader]",
    demoDirection: "demo-front/demos/ink-garden/",
  },

  {
    id: "terminal-stream",
    path: "/c/stream",
    readySelector: "[data-testid='grep-layout']",
    demoDirection: "demo-front/demos/terminal-workshop/",
    initScript:
      "window.localStorage.setItem('tzblog.terminal.boot.v1:stream', '1')",
  },
  {
    id: "terminal-boot",
    path: "/c/stream",
    readySelector: "[data-testid='terminal-boot']",
    demoDirection: "demo-front/demos/terminal-workshop/",
    initScript:
      "window.localStorage.removeItem('tzblog.terminal.boot.v1:stream')",
    viewports: ["desktop"],
  },
  {
    id: "entry-note-vim",
    path: "/c/stream/note-2026-05-23",
    readySelector: "[data-testid='terminal-entry-detail']",
    demoDirection: "demo-front/demos/terminal-workshop/",
  },
  {
    id: "entry-link-card",
    path: "/c/stream/link-postgres-locks",
    readySelector: "[data-testid='entry-link-card']",
    demoDirection: "demo-front/demos/terminal-workshop/",
  },
] as const;

export function m4ScreenshotPath(
  sceneId: string,
  viewport: M4SmokeViewport,
): string {
  return path.join(M4_PUBLIC_UI_SMOKE_DIR, `${sceneId}-${viewport}.png`);
}
