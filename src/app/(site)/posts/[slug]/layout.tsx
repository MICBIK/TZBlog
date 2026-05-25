import { ThemeProvider } from "@/components/theme/ThemeProvider";

export default function PostSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider theme="ink">{children}</ThemeProvider>;
}
