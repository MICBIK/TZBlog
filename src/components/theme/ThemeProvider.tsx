import type { ReactNode } from "react";

export function ThemeProvider({ children }: { theme?: string; hero?: boolean; children: ReactNode }) {
  return <div>{children}</div>;
}
