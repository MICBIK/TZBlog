import type { GlobalConfig } from 'payload'

export const SiteProfile: GlobalConfig = {
  slug: 'site-profile',
  label: '站点配置',
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: '姓名' },
    { name: 'role', type: 'text', required: true, label: '角色' },
    { name: 'avatar', type: 'text', label: '头像' },
    { name: 'summary', type: 'textarea', required: true, label: '简介' },
    {
      name: 'siteMeta',
      type: 'group',
      label: '站点元信息',
      fields: [
        { name: 'title', type: 'text', label: '站点标题' },
        { name: 'description', type: 'textarea', label: '站点描述' },
        { name: 'location', type: 'text', label: '位置' },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: '社交链接',
      fields: [
        { name: 'label', type: 'text', required: true, label: '标签' },
        { name: 'href', type: 'text', required: true, label: '链接' },
        { name: 'icon', type: 'select', options: ['github', 'mail', 'rss'], required: true, label: '图标' },
      ],
    },
    {
      name: 'pinnedRepos',
      type: 'array',
      label: '置顶仓库',
      fields: [
        { name: 'owner', type: 'text', required: true, label: '仓库所有者' },
        { name: 'repo', type: 'text', required: true, label: '仓库名称' },
      ],
    },
    {
      name: 'techStack',
      type: 'group',
      label: '技术栈',
      fields: [
        { name: 'frontend', type: 'array', label: '前端技术', fields: [{ name: 'item', type: 'text', required: true }] },
        { name: 'backend', type: 'array', label: '后端技术', fields: [{ name: 'item', type: 'text', required: true }] },
        { name: 'devops', type: 'array', label: '运维技术', fields: [{ name: 'item', type: 'text', required: true }] },
        { name: 'tools', type: 'array', label: '工具', fields: [{ name: 'item', type: 'text', required: true }] },
      ],
    },
    {
      name: 'timeline',
      type: 'array',
      label: '时间线',
      fields: [
        { name: 'date', type: 'text', required: true, label: '日期' },
        { name: 'title', type: 'text', required: true, label: '标题' },
        { name: 'summary', type: 'text', required: true, label: '摘要' },
      ],
    },
  ],
}
