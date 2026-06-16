import type { Metadata } from 'next';

import { SectionsClient } from './_components/SectionsClient';

export const metadata: Metadata = {
  title: '板块与置顶 · tzblog',
  robots: { index: false, follow: false },
};

/**
 * 后台「板块与置顶」页 —— 1:1 还原原型 admin-sections.html。
 * 侧栏由 (dashboard)/layout.tsx 的 AdminSidebar 注入（对应原型 admin-chrome）。
 * 本页只渲染 .main 区域：顶栏面包屑 + 内容板块表 + 首页置顶单选 + 保存条 + toast。
 */
export default function AdminSectionsPage() {
  return <SectionsClient />;
}
