import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type HomeModuleState = {
  state: "loading" | "empty" | "error";
  title: string;
  detail: string;
};

type HomeModuleContent = ReactNode | HomeModuleState;

export interface HomeGardenProps {
  hero: ReactNode;
  featuredAndRecent: HomeModuleContent;
  columns: HomeModuleContent;
  principles: ReactNode;
  techStack: ReactNode;
  github: HomeModuleContent;
  stats: HomeModuleContent;
}

const stackItems = ["Next.js", "Prisma", "PostgreSQL", "Markdown", "Shiki"];

function revealStyle(delay: string): CSSProperties {
  return { "--reveal-delay": delay } as CSSProperties;
}

export function HomeGarden({
  hero,
  featuredAndRecent,
  columns,
  principles,
  techStack,
  github,
  stats,
}: HomeGardenProps) {
  return (
    <div
      data-home-garden
      data-home-motion-scope
      data-reduced-motion-safe
      className="mx-[calc(50%-50vw)] w-screen px-6 sm:px-8 lg:px-10"
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(220px,280px)]">
        <aside
          aria-label="作者身份"
          data-home-identity-rail
          data-home-mobile-profile-summary
          data-reveal
          style={revealStyle("0ms")}
          className="launch-panel order-1 h-fit min-w-0 max-w-full space-y-6 p-5 lg:sticky lg:top-24"
        >
          <header className="space-y-3">
            <p className="font-mono text-label tracking-label uppercase text-muted-fg">
              ha1den / TZBlog
            </p>
            <h2 className="font-serif text-h3 leading-display tracking-tight text-fg">
              HaiDen
            </h2>
            <p className="font-serif text-sm leading-body text-muted-fg">
              写作、工程实现和自部署系统的长期实验场。
            </p>
          </header>

          <section aria-labelledby="home-current-status" className="space-y-3">
            <h3
              id="home-current-status"
              className="font-mono text-label tracking-label uppercase text-muted-fg"
            >
              当前状态
            </h3>
            <p className="text-sm leading-body text-fg">
              正在把博客从普通模板推进到 creative technical garden，并重做写作体验。
            </p>
          </section>

          <div className="flex flex-wrap gap-2">
            {stackItems.map((item) => (
              <span
                key={item}
                className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted-fg"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-5 text-sm">
            <Link
              href="/about"
              className="text-muted-fg transition-colors hover:text-fg"
            >
              关于这个系统 →
            </Link>
            <Link
              href="/posts"
              className="text-muted-fg transition-colors hover:text-fg"
            >
              阅读最新文章 →
            </Link>
          </div>
        </aside>

        <div
          role="main"
          aria-label="首页内容流"
          data-home-content-stream
          data-home-motion-stagger
          style={revealStyle("80ms")}
          className="order-2 min-w-0 max-w-full space-y-[var(--space-section)]"
        >
          {hero}
          {renderHomeModule("文章", featuredAndRecent)}
          {renderHomeModule("项目", columns)}
          {principles}
          {techStack}
        </div>

        <aside
          aria-label="首页上下文"
          data-home-context-rail
          data-reveal
          style={revealStyle("160ms")}
          className="order-3 min-w-0 max-w-full space-y-6 xl:sticky xl:top-24 xl:h-fit"
        >
          {renderHomeModule("GitHub", github)}
          {renderHomeModule("统计", stats)}
        </aside>
      </div>
    </div>
  );
}

function renderHomeModule(label: string, content: HomeModuleContent) {
  if (!isHomeModuleState(content)) return content;

  const role = content.state === "error" ? "alert" : "status";

  return (
    <section
      role={role}
      aria-label={`${label}模块状态`}
      data-home-module-state={content.state}
      data-reveal
      className="launch-panel space-y-3 p-5"
    >
      <p className="font-mono text-label tracking-label uppercase text-muted-fg">
        {content.state}
      </p>
      <h2 className="font-serif text-lead leading-display tracking-tight text-fg">
        {content.title}
      </h2>
      <p className="text-sm leading-body text-muted-fg">
        {content.detail}
      </p>
    </section>
  );
}

function isHomeModuleState(content: HomeModuleContent): content is HomeModuleState {
  return (
    typeof content === "object" &&
    content !== null &&
    "state" in content &&
    "title" in content &&
    "detail" in content
  );
}

export default HomeGarden;
