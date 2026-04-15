import type { GlobalConfig } from 'payload'

export const SiteProfile: GlobalConfig = {
  slug: 'site-profile',
  label: '站点配置',
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'avatar', type: 'text' },
    { name: 'summary', type: 'textarea', required: true },
    {
      name: 'siteMeta',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'location', type: 'text' },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        { name: 'icon', type: 'select', options: ['github', 'mail', 'rss'], required: true },
      ],
    },
    {
      name: 'pinnedRepos',
      type: 'array',
      fields: [
        { name: 'owner', type: 'text', required: true },
        { name: 'repo', type: 'text', required: true },
      ],
    },
    {
      name: 'techStack',
      type: 'group',
      fields: [
        { name: 'frontend', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
        { name: 'backend', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
        { name: 'devops', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
        { name: 'tools', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
      ],
    },
    {
      name: 'timeline',
      type: 'array',
      fields: [
        { name: 'date', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'summary', type: 'text', required: true },
      ],
    },
  ],
}
