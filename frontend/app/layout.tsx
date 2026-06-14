import type { Metadata } from 'next';
import { JetBrains_Mono, Noto_Sans_SC } from 'next/font/google';

import { Providers } from '@/components/providers/Providers';
import { BackgroundFX } from '@/components/layout/BackgroundFX';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { SITE_URL } from '@/lib/constants';
import './globals.css';

// 字体方案（DESIGN.md §3）：
// mono → 代码、数字、标签、命令行提示符
// sans → 长文正文、段落、说明性文字
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sans-sc',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TZBlog - 个人技术博客',
    template: '%s | TZBlog',
  },
  description:
    'TZBlog 是一个基于 Next.js 16 + Go 的个人技术博客平台，分享前端、后端与全栈开发实践。',
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${jetbrainsMono.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <BackgroundFX />
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
