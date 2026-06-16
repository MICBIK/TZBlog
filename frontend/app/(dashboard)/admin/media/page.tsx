import type { Metadata } from 'next';

import { MediaClient } from './_components/MediaClient';

export const metadata: Metadata = {
  title: '媒体库 - 后台管理',
  description: 'TZBlog 后台媒体库',
  // 对照原型 admin-media.html <meta name="robots" content="noindex, nofollow">
  robots: { index: false, follow: false },
};

export default function MediaPage() {
  return <MediaClient />;
}
