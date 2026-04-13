import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: import.meta.env.SITE_URL || 'https://tzblog.dev',
  server: {
    host: true,
    port: 4321,
  },
  integrations: [sitemap()],
})
