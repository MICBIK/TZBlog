import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getPosts } from '../lib/payload'
import { siteMeta } from '../data/content'

export async function GET(context: APIContext) {
  const posts = await getPosts()
  const latestPosts = posts.slice(0, 20)

  return rss({
    title: siteMeta.title,
    description: siteMeta.description,
    site: context.site?.toString() || import.meta.env.SITE_URL || 'https://tzblog.dev',
    items: latestPosts.map((post) => ({
      title: post.title,
      description: post.summary,
      pubDate: new Date(post.publishedAt),
      link: `/posts/${post.slug}/`,
      categories: post.tags,
    })),
  })
}
