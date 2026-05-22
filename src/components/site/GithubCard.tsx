import { getGithubData, type GithubDataResult } from "@/lib/services/github";

const LABEL = "GITHUB · DEVELOPMENT";

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
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="space-y-3">
        <h2
          id="github-card-heading"
          className="font-mono uppercase text-[var(--text-label)] tracking-[var(--tracking-label)] text-muted-fg"
        >
          {LABEL}
        </h2>
        <div
          className="h-px w-12 border-t border-border"
          aria-hidden="true"
        />
      </header>

      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar is external GitHub URL, below-the-fold, lazy-loaded; next/image would proxy URL and break offline fallback */}
        <img
          src={user.avatar_url}
          alt={`${user.login} avatar`}
          width={48}
          height={48}
          loading="lazy"
          className="w-12 h-12 rounded-full border border-border"
        />
        <div className="space-y-1">
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif text-[var(--text-base)] text-fg hover:underline"
          >
            {user.login}
          </a>
          {user.bio ? (
            <p className="text-sm leading-[var(--leading-body)] text-muted-fg">
              {user.bio}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="font-serif text-[var(--text-h2)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg">
          {recentCommitCount}
        </span>
        <span className="font-mono uppercase text-[var(--text-label)] tracking-[var(--tracking-label)] text-muted-fg">
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
                <span className="font-serif text-[var(--text-base)] text-fg group-hover:underline">
                  {repo.name}
                </span>
                <span className="font-mono text-sm text-muted-fg">
                  ★ {repo.stargazers_count}
                </span>
              </span>
              {repo.description ? (
                <span className="block text-sm leading-[var(--leading-body)] text-muted-fg">
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

function FallbackState({ reason }: { reason: UnavailableReason }) {
  return (
    <section
      aria-labelledby="github-card-heading"
      className="space-y-[var(--space-stack-lg)]"
    >
      <header className="space-y-3">
        <h2
          id="github-card-heading"
          className="font-mono uppercase text-[var(--text-label)] tracking-[var(--tracking-label)] text-muted-fg"
        >
          {LABEL}
        </h2>
        <div
          className="h-px w-12 border-t border-border"
          aria-hidden="true"
        />
      </header>

      <p className="font-serif text-[var(--text-base)] text-fg">
        GitHub data unavailable
      </p>
      <p className="text-sm leading-[var(--leading-body)] text-muted-fg">
        {fallbackHint(reason)}
      </p>
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
