import { getGithubData, type GithubDataResult } from "@/lib/services/github";

type OkData = Extract<GithubDataResult, { status: "ok" }>;
type UnavailableReason = Extract<
  GithubDataResult,
  { status: "unavailable" }
>["reason"];

export async function GithubCard() {
  const data = await getGithubData();
  return data.status === "ok" ? (
    <SuccessState data={data} />
  ) : (
    <FallbackState reason={data.reason} />
  );
}

function SuccessState({ data }: { data: OkData }) {
  const { user, recentCommitCount, topRepos } = data;

  return (
    <section
      aria-labelledby="github-card-heading"
      className="launch-panel min-h-[420px] space-y-[var(--space-stack-lg)] p-5 sm:p-6"
    >
      <CardHeader />

      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar is external GitHub URL, below-the-fold, lazy-loaded; next/image would proxy URL and break offline fallback */}
        <img
          src={user.avatar_url}
          alt={`${user.login} avatar`}
          width={48}
          height={48}
          loading="lazy"
          className="h-12 w-12 rounded-full border border-border"
        />
        <div className="space-y-1">
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif text-base text-fg hover:underline"
          >
            {user.login}
          </a>
          {user.bio ? (
            <p className="text-sm leading-body text-muted-fg">
              {user.bio}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="font-serif text-h2 leading-display tracking-tight text-fg">
          {recentCommitCount}
        </span>
        <span className="font-mono uppercase text-label tracking-label text-muted-fg">
          commits · last 7 days
        </span>
      </div>

      <ul className="space-y-4">
        {topRepos.map((repo) => (
          <li key={repo.name}>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block space-y-1"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-serif text-base text-fg group-hover:underline">
                  {repo.name}
                </span>
                <span className="font-mono text-sm text-muted-fg">
                  ★ {repo.stargazers_count}
                </span>
              </span>
              {repo.description ? (
                <span className="block text-sm leading-body text-muted-fg">
                  {repo.description}
                </span>
              ) : null}
              {repo.language ? (
                <span className="block font-mono text-xs text-muted-fg">
                  {repo.language}
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CardHeader() {
  return (
    <header className="space-y-3">
      <p className="font-mono uppercase text-label tracking-label text-muted-fg">
        GITHUB
      </p>
        <h2
          id="github-card-heading"
        className="font-serif text-h2 leading-display tracking-tight text-fg"
        >
        GitHub Activity
        </h2>
        <div
          className="h-px w-12 border-t border-border"
          aria-hidden="true"
        />
      </header>
  );
}

function FallbackIcon() {
  return (
    <svg
      data-testid="github-fallback-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-muted-fg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M12 2.75a9.25 9.25 0 0 0-2.93 18.03c.46.08.63-.2.63-.45v-1.62c-2.55.55-3.08-1.08-3.08-1.08-.42-1.07-1.03-1.36-1.03-1.36-.84-.57.06-.56.06-.56.93.07 1.42.96 1.42.96.82 1.4 2.15 1 2.68.76.08-.6.32-1 .58-1.23-2.03-.23-4.17-1.02-4.17-4.53 0-1 .36-1.82.95-2.46-.1-.23-.41-1.16.09-2.43 0 0 .78-.25 2.55.94A8.8 8.8 0 0 1 12 7.4c.79 0 1.57.1 2.31.31 1.77-1.19 2.54-.94 2.54-.94.5 1.27.19 2.2.1 2.43.59.64.94 1.46.94 2.46 0 3.52-2.14 4.3-4.18 4.53.33.28.62.84.62 1.69v2.45c0 .25.17.54.64.45A9.25 9.25 0 0 0 12 2.75Z" />
    </svg>
  );
}

function FallbackState({ reason }: { reason: UnavailableReason }) {
  return (
    <section
      aria-labelledby="github-card-heading"
      className="launch-panel min-h-[420px] space-y-[var(--space-stack-lg)] p-5 sm:p-6"
    >
      <CardHeader />

      <div className="flex items-start gap-3">
        <div className="rounded-full border border-border bg-muted p-2">
          <FallbackIcon />
        </div>
        <div className="space-y-2">
          <p className="font-serif text-base text-fg">
            GitHub 数据暂不可用
          </p>
          <p className="text-sm leading-body text-muted-fg">
            {fallbackHint(reason)}
          </p>
        </div>
      </div>
    </section>
  );
}

function fallbackHint(reason: UnavailableReason): string {
  switch (reason) {
    case "missing_env":
      return "Set GITHUB_USERNAME in your environment to surface live activity.";
    case "rate_limited":
      return "GitHub API rate limit reached; data will refresh once the window resets.";
    case "user_not_found":
      return "Configured GitHub user could not be found.";
    case "upstream_error":
      return "GitHub API returned an error; try again later.";
    case "parse_error":
      return "GitHub API response could not be parsed.";
    case "network_error":
      return "Could not reach GitHub.";
  }
}
