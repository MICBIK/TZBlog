import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";

import { env } from "@/lib/env";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: "TZBlog",
    template: "%s · TZBlog",
  },
  description: "ha1den 的技术博客 — Next.js / TypeScript / 性能优化 / 产品工程",
  openGraph: {
    type: "website",
    siteName: "TZBlog",
    locale: "zh_CN",
    description: "ha1den 的技术博客 — Next.js / TypeScript / 性能优化 / 产品工程",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TZBlog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TZBlog",
    description: "ha1den 的技术博客 — Next.js / TypeScript / 性能优化 / 产品工程",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg font-sans text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
