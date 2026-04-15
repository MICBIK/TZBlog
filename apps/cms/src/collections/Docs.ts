import type { CollectionConfig } from 'payload'
import { triggerVercelDeploy } from '../hooks/triggerDeploy'

export const Docs: CollectionConfig = {
  slug: 'docs',
  labels: {
    singular: '文档',
    plural: '文档',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'version', 'updatedAt', '_status'],
  },
  hooks: {
    afterChange: [
      async () => {
        await triggerVercelDeploy()
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: '标题',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL 标识',
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      label: '摘要',
    },
    {
      name: 'version',
      type: 'text',
      required: true,
      label: '版本',
      admin: {
        description: '如：v0.2 / draft',
      },
    },
    {
      name: 'orbit',
      type: 'text',
      required: true,
      label: '轨道标签',
    },
    {
      name: 'updatedAt',
      type: 'date',
      required: true,
      label: '更新日期',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: '标签',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
          label: '标签',
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      required: true,
      label: '内容章节',
      fields: [
        {
          name: 'id',
          type: 'text',
          required: true,
          label: '章节 ID',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: '章节标题',
        },
        {
          name: 'paragraphs',
          type: 'array',
          required: true,
          label: '段落',
          fields: [
            {
              name: 'text',
              type: 'textarea',
              required: true,
              label: '段落内容',
            },
          ],
        },
        {
          name: 'bullets',
          type: 'array',
          label: '列表项',
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
              label: '列表内容',
            },
          ],
        },
      ],
    },
  ],
}
