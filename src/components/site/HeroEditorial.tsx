import Link from "next/link";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";

function revealStyle(delay: string): CSSProperties {
  return { "--reveal-delay": delay } as CSSProperties;
}

export function HeroEditorial() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="grid gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12"
    >
      <div className="space-y-8">
        <h1
          id="hero-heading"
          data-reveal
          style={revealStyle("0ms")}
          className="font-serif text-hero leading-display tracking-tight text-fg"
        >
          Building things,{" "}
          <br />
          one commit{" "}
          <br />
          at a time.
        </h1>

        <div
          data-reveal
          style={revealStyle("120ms")}
          className="h-px w-12 border-t border-border"
          aria-hidden="true"
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg">
            <Link
              href="/posts"
              data-reveal
              style={revealStyle("180ms")}
            >
              Read Blog →
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link
              href="/about"
              data-reveal
              style={revealStyle("240ms")}
            >
              About →
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4 lg:pt-2">
        <p
          data-reveal
          style={revealStyle("60ms")}
          className="font-mono text-label tracking-label uppercase text-muted-fg"
        >
          001 / NOTES
        </p>

        <p
          data-reveal
          style={revealStyle("100ms")}
          className="text-label tracking-label uppercase text-muted-fg"
        >
          BLOG · ISSUE 002 · MAY 2026
        </p>

        <div className="h-px w-8 border-t border-border" aria-hidden="true" />

        <p
          data-reveal
          style={revealStyle("160ms")}
          className="font-serif text-base leading-body italic text-muted-fg"
        >
          ha1den · Notes from the field · May 2026
        </p>
      </div>
    </section>
  );
}
