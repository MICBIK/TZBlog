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
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'stage',
      type: 'select',
      required: true,
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
    },
    {
      name: 'updatedAt',
      type: 'date',
      required: true,
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
    },
    {
      name: 'stack',
      type: 'array',
      fields: [
        {
          name: 'item',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'links',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'href',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'id',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'paragraphs',
          type: 'array',
          required: true,
          fields: [
            {
              name: 'text',
              type: 'textarea',
              required: true,
            },
          ],
        },
        {
          name: 'bullets',
          type: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
