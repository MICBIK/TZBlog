import type { CollectionConfig } from 'payload'
import { triggerVercelDeploy } from '../hooks/triggerDeploy'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: '文章',
    plural: '文章',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
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
      admin: {
        description: 'URL 标识符，只能包含小写字母、数字和连字符',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      label: '摘要',
    },
    {
      name: 'category',
      type: 'text',
      required: true,
      label: '分类',
    },
    {
      name: 'orbit',
      type: 'text',
      required: true,
      label: '轨道标签',
      admin: {
        description: '副标题/轨道标签，如 Deep Space Observatory',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      label: '发布日期',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'readTime',
      type: 'text',
      required: true,
      label: '阅读时间',
      admin: {
        description: '如：8 min',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: '精选',
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
