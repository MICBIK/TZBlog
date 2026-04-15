import type { CollectionConfig } from 'payload'

export const LabExperiments: CollectionConfig = {
  slug: 'lab-experiments',
  labels: {
    singular: '实验',
    plural: '实验',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tag', 'status'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: '标题' },
    { name: 'summary', type: 'textarea', required: true, label: '摘要' },
    { name: 'status', type: 'text', required: true, label: '状态', admin: { description: '如：Running / Ready for Review / Stable' } },
    { name: 'href', type: 'text', required: true, label: '链接' },
    { name: 'tag', type: 'text', required: true, label: '标签' },
  ],
}
