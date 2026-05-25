import type { ThemeName } from "./resolveTheme";

export function resolveFontProse(theme: ThemeName): string {
  switch (theme) {
    case "ink":
      return "var(--font-noto-serif-sc), var(--font-source-serif), Georgia, serif";
    case "terminal":
      return "var(--font-jetbrains-mono), var(--font-geist-mono), monospace";
    case "aurora":
    case "admin":
    default:
      return "var(--font-inter), var(--font-geist-sans), system-ui, sans-serif";
  }
}

export function resolveFontMono(theme: ThemeName): string {
  void theme;
  return "var(--font-geist-mono), ui-monospace, monospace";
}
