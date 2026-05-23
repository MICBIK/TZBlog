export interface InteractiveExplainerStep {
  title: string;
  detail: string;
}

export interface InteractiveExplainerProps {
  title: string;
  description: string;
  steps: InteractiveExplainerStep[];
  fallback: {
    title: string;
    detail: string;
  };
}

export function InteractiveExplainer({
  title,
  description,
  steps,
  fallback,
}: InteractiveExplainerProps) {
  const titleId = `interactive-explainer-${slugify(title)}`;

  return (
    <section
      aria-labelledby={titleId}
      data-interactive-explainer
      data-reduced-motion-safe
      data-static-fallback="available"
      className="launch-panel my-[var(--space-stack-lg)] space-y-6 p-5 sm:p-6"
    >
      <header className="space-y-3">
        <p className="font-mono text-label tracking-label uppercase text-muted-fg">
          Interactive note
        </p>
        <h2
          id={titleId}
          className="font-serif text-h3 leading-display tracking-tight text-fg"
        >
          {title}
        </h2>
        <p className="max-w-[64ch] text-sm leading-body text-muted-fg md:text-base">
          {description}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
        <svg
          role="img"
          aria-label={`${title} 可视化`}
          data-explainer-visual
          viewBox="0 0 520 260"
          className="min-h-56 w-full rounded-lg border border-border bg-muted"
        >
          <title>{`${title} 可视化`}</title>
          <defs>
            <linearGradient id={`${titleId}-flow`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.55" />
              <stop offset="100%" stopColor="hsl(var(--fg))" stopOpacity="0.16" />
            </linearGradient>
          </defs>
          <rect
            x="24"
            y="24"
            width="472"
            height="212"
            rx="18"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
          />
          {steps.slice(0, 4).map((step, index) => {
            const x = 70 + index * 110;
            const active = index === 0;

            return (
              <g key={step.title}>
                {index > 0 ? (
                  <path
                    d={`M${x - 78} 130 C${x - 48} 96 ${x - 24} 96 ${x} 130`}
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeDasharray="5 6"
                    strokeLinecap="round"
                    strokeOpacity="0.5"
                    strokeWidth="2"
                  />
                ) : null}
                <circle
                  cx={x}
                  cy="130"
                  r={active ? "34" : "28"}
                  fill={active ? `url(#${titleId}-flow)` : "hsl(var(--bg))"}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y="135"
                  fill="hsl(var(--fg))"
                  fontFamily="var(--font-mono)"
                  fontSize="14"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {String(index + 1).padStart(2, "0")}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="space-y-4">
          <div
            role="group"
            aria-label="静态 fallback"
            data-explainer-fallback
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="font-mono text-label tracking-label uppercase text-muted-fg">
              Static fallback
            </p>
            <h3 className="mt-2 font-serif text-lead leading-display tracking-tight text-fg">
              {fallback.title}
            </h3>
            <p className="mt-2 text-sm leading-body text-muted-fg">
              {fallback.detail}
            </p>
          </div>

          <ol
            aria-label={`${title} 步骤`}
            data-explainer-steps
            className="space-y-3"
          >
            {steps.map((step, index) => (
              <li
                key={`${step.title}-${index}`}
                className="rounded-lg border border-border bg-bg p-4"
              >
                <p className="font-mono text-label tracking-label uppercase text-muted-fg">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-serif text-base leading-display tracking-tight text-fg">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-body text-muted-fg">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "block";
}
