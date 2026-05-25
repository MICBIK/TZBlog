import type { ThemeName } from "@/lib/theme/resolveTheme";

export interface ThemeProviderProps {
  theme: ThemeName;
  hero?: boolean;
  mode?: "light" | "dark";
  className?: string;
  children: React.ReactNode;
}

export function ThemeProvider({
  theme,
  hero = false,
  mode,
  className,
  children,
}: ThemeProviderProps) {
  return (
    <div
      data-theme={theme}
      data-hero={hero ? "true" : undefined}
      data-mode={mode}
      data-reduced-motion-safe
      className={className}
    >
      {children}
    </div>
  );
}

export default ThemeProvider;
