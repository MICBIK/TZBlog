import Link from "next/link";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";

function revealStyle(delay: string): CSSProperties {
  return { "--reveal-delay": delay } as CSSProperties;
}

export function HomeHero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="launch-surface relative isolate overflow-hidden rounded-[2rem] px-5 py-8 sm:px-8 lg:px-10"
    >
      <div
        data-hero-dot-grid
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-100"
      />
      <div
        data-hero-grain
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-100"
      />
      <div className="relative space-y-8">
        <header className="space-y-4">
          <p
            data-reveal
            style={revealStyle("0ms")}
            className="font-mono text-label tracking-label uppercase text-muted-fg"
          >
            NOTES · v0.x · MAY 2026
          </p>
          <h1
            id="home-hero-heading"
            data-reveal
            style={revealStyle("100ms")}
            className="hero-title font-serif text-hero leading-display tracking-tight text-fg"
          >
            个人写作，工程实现，克制表达。
          </h1>
          <div
            data-reveal
            style={revealStyle("200ms")}
            className="hero-divider h-px w-12 border-t border-border"
            aria-hidden="true"
          />
          <p
            data-reveal
            style={revealStyle("200ms")}
            className="hero-lede max-w-[55ch] font-serif text-lead leading-body text-muted-fg"
          >
            这里记录一个中文单语博客系统的技术实践：从 source-first
            Markdown 编辑，到 PostgreSQL 驱动的数据层，再到能解释取舍的阅读体验。
          </p>
        </header>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg">
            <Link
              href="/posts"
              data-reveal
              style={revealStyle("300ms")}
            >
              阅读文章
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link
              href="/about"
              data-reveal
              style={revealStyle("300ms")}
            >
              关于我
            </Link>
          </Button>
          <p
            data-reveal
            style={revealStyle("300ms")}
            className="hero-now font-mono text-label tracking-label uppercase text-muted-fg"
          >
            Now: writing on i18n, hardening deploy
          </p>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
