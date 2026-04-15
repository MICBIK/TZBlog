import type { CollectionConfig } from 'payload'
import { triggerVercelDeploy } from '../hooks/triggerDeploy'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: '项目',
    plural: '项目',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'stage', 'updatedAt', '_status'],
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
      name: 'stage',
      type: 'select',
      required: true,
      label: '阶段',
      options: [
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Planned', value: 'Planned' },
        { label: 'Concept', value: 'Concept' },
        { label: 'Stable', value: 'Stable' },
        { label: 'Archived', value: 'Archived' },
      ],
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
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: '精选',
    },
    {
      name: 'stack',
      type: 'array',
      label: '技术栈',
      fields: [
        {
          name: 'item',
          type: 'text',
          required: true,
          label: '技术',
        },
      ],
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
      name: 'links',
      type: 'array',
      label: '链接',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: '链接文本',
        },
        {
          name: 'href',
          type: 'text',
          required: true,
          label: '链接地址',
        },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      label: '亮点',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          label: '亮点描述',
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
