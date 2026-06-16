import type { Metadata } from 'next';

import EditorWorkspace from './_components/EditorWorkspace';

export const metadata: Metadata = {
  title: '写文章 · tzblog 控制台',
  description: '编辑现有文章',
  robots: { index: false, follow: false },
};

export default function EditArticlePage() {
  return <EditorWorkspace />;
}
