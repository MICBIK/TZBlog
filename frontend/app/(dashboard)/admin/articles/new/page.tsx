import type { Metadata } from 'next';

import { EditorClient } from './EditorClient';

export const metadata: Metadata = {
  title: '写文章 · tzblog 控制台',
  description: '后台 Markdown 写作 + 实时预览',
  robots: { index: false, follow: false },
};

export default function NewArticlePage() {
  return <EditorClient />;
}
