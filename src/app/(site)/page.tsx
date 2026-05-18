import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const techStack = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Docker",
];

const samplePosts = [
  {
    slug: "sample-post-1",
    title: "Sample Post 1",
    excerpt: "Placeholder excerpt for the first sample post.",
    date: "2026-01-01",
  },
  {
    slug: "sample-post-2",
    title: "Sample Post 2",
    excerpt: "Placeholder excerpt for the second sample post.",
    date: "2026-01-08",
  },
  {
    slug: "sample-post-3",
    title: "Sample Post 3",
    excerpt: "Placeholder excerpt for the third sample post.",
    date: "2026-01-15",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="space-y-6">
        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          Hi, I&apos;m HaiDen.
        </h1>
        <p className="text-lg text-muted-fg md:text-xl">
          A developer who builds things and writes about them.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/posts">Read Blog</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/about">About Me</Link>
          </Button>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Tech Stack</h2>
        <div className="rounded-lg border border-border bg-muted/40 p-6 font-mono text-sm">
          <p className="text-muted-fg">
            <span className="text-accent">$</span> whoami
          </p>
          <ul className="mt-3 space-y-1">
            {techStack.map((tech) => (
              <li key={tech} className="text-fg">
                <span className="text-muted-fg">-</span> {tech}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Recent Posts
          </h2>
          <Link
            href="/posts"
            className="text-sm text-muted-fg hover:text-fg transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {samplePosts.map((post) => (
            <Card key={post.slug} className="bg-bg">
              <CardHeader>
                <CardTitle className="text-base">{post.title}</CardTitle>
                <CardDescription>{post.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-fg">{post.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Site Stats */}
      <section className="border-t border-border pt-8">
        <p className="text-sm text-muted-fg">
          0 views · 0 posts · 0 comments
        </p>
      </section>
    </div>
  );
}
