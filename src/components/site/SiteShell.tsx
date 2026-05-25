export interface SiteShellProps {
  channels: unknown[];
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return <div data-site-shell-stub>{children}</div>;
}
