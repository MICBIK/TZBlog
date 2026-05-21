import { ZodError } from "zod";

import { env } from "@/lib/env";
import {
  githubEventsResponseSchema,
  githubReposResponseSchema,
  githubUserSchema,
  type GithubRepo,
  type GithubUser,
} from "@/lib/schemas/github";

export interface GithubData {
  status: "ok";
  user: Pick<
    GithubUser,
    | "login"
    | "name"
    | "bio"
    | "avatar_url"
    | "html_url"
    | "public_repos"
    | "followers"
  >;
  recentCommitCount: number;
  topRepos: GithubRepo[];
}

export interface GithubUnavailable {
  status: "unavailable";
  reason:
    | "missing_env"
    | "rate_limited"
    | "user_not_found"
    | "upstream_error"
    | "parse_error"
    | "network_error";
}

export type GithubDataResult = GithubData | GithubUnavailable;

const API_BASE = "https://api.github.com";
const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "tzblog/1.0",
} as const;
const ISR_CACHE = { next: { revalidate: 3600 } } as const;

export async function getGithubData(): Promise<GithubDataResult> {
  const username = env.GITHUB_USERNAME;

  if (!username) {
    console.warn("[github] GITHUB_USERNAME not set; returning unavailable");
    return { status: "unavailable", reason: "missing_env" };
  }

  try {
    const userRes = await githubFetch(`/users/${username}`);

    if (userRes.status === 404) {
      console.warn(`[github] user not found: ${username}`);
      return { status: "unavailable", reason: "user_not_found" };
    }

    if (isRateLimited(userRes)) {
      console.warn("[github] rate limited");
      return { status: "unavailable", reason: "rate_limited" };
    }

    if (!userRes.ok) {
      console.warn("[github] upstream error", { userStatus: userRes.status });
      return { status: "unavailable", reason: "upstream_error" };
    }

    const [reposRes, eventsRes] = await Promise.all([
      githubFetch(`/users/${username}/repos?sort=stars&per_page=3`),
      githubFetch(`/users/${username}/events/public`),
    ]);

    if (isRateLimited(reposRes) || isRateLimited(eventsRes)) {
      console.warn("[github] rate limited");
      return { status: "unavailable", reason: "rate_limited" };
    }

    if (!reposRes.ok || !eventsRes.ok) {
      console.warn("[github] upstream error", {
        reposStatus: reposRes.status,
        eventsStatus: eventsRes.status,
      });
      return { status: "unavailable", reason: "upstream_error" };
    }

    const user = githubUserSchema.parse(await userRes.json());
    const repos = githubReposResponseSchema.parse(await reposRes.json());
    const events = githubEventsResponseSchema.parse(await eventsRes.json());

    return {
      status: "ok",
      user: {
        login: user.login,
        name: user.name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        public_repos: user.public_repos,
        followers: user.followers,
      },
      recentCommitCount: countRecentCommits(events),
      topRepos: repos,
    };
  } catch (err) {
    if (err instanceof ZodError) {
      console.warn("[github] schema parse error", err.message);
      return { status: "unavailable", reason: "parse_error" };
    }

    console.warn("[github] network or unknown error", err);
    return { status: "unavailable", reason: "network_error" };
  }
}

function githubFetch(path: string) {
  return fetch(`${API_BASE}${path}`, {
    headers: HEADERS,
    ...ISR_CACHE,
  });
}

function isRateLimited(res: Response) {
  return res.status === 403 && res.headers.get("X-RateLimit-Remaining") === "0";
}

function countRecentCommits(events: Array<{
  type: string;
  created_at: string;
  payload: {
    size?: number;
    commits?: Array<{ sha: string; message: string }>;
  };
}>) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return events
    .filter(
      (event) =>
        event.type === "PushEvent" &&
        new Date(event.created_at).getTime() >= sevenDaysAgo,
    )
    .reduce(
      (sum, event) =>
        sum + (event.payload.size ?? event.payload.commits?.length ?? 0),
      0,
    );
}
