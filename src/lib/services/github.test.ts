import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const modulePath = "./" + "github";
const mockFetch = vi.fn();

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/env");
  vi.resetModules();
});

describe("getGithubData", () => {
  it("returns ok with user + commits + topRepos on happy path", async () => {
    mockEnv("octocat");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T00:00:00.000Z"));
    mockFetch
      .mockResolvedValueOnce(jsonResponse(userSample()))
      .mockResolvedValueOnce(jsonResponse(reposSample()))
      .mockResolvedValueOnce(jsonResponse(eventsSample()));

    const { getGithubData } = await importService();
    const data = await getGithubData();

    expect(data).toMatchObject({
      status: "ok",
      user: {
        login: "octocat",
        name: "monalisa octocat",
        bio: "There once was...",
        avatar_url: "https://github.com/images/error/octocat_happy.gif",
        html_url: "https://github.com/octocat",
        public_repos: 2,
        followers: 20,
      },
      recentCommitCount: 5,
      topRepos: [
        expect.objectContaining({ name: "stars-80", stargazers_count: 80 }),
        expect.objectContaining({ name: "stars-10", stargazers_count: 10 }),
        expect.objectContaining({ name: "stars-3", stargazers_count: 3 }),
      ],
    });
  });

  it("fetch options include { next: { revalidate: 3600 } }", async () => {
    mockEnv("octocat");
    mockFetch
      .mockResolvedValueOnce(jsonResponse(userSample()))
      .mockResolvedValueOnce(jsonResponse(reposSample()))
      .mockResolvedValueOnce(jsonResponse(eventsSample()));

    const { getGithubData } = await importService();
    await getGithubData();

    expect(mockFetch).toHaveBeenCalledTimes(3);
    for (const call of mockFetch.mock.calls) {
      expect(call[1]).toMatchObject({
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "tzblog/1.0",
        },
        next: { revalidate: 3600 },
      });
      expect(call[1]?.headers).not.toHaveProperty("Authorization");
    }
  });

  it("returns unavailable missing_env when GITHUB_USERNAME absent", async () => {
    mockEnv(undefined);

    const { getGithubData } = await importService();
    const data = await getGithubData();

    expect(data).toEqual({ status: "unavailable", reason: "missing_env" });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it("returns unavailable user_not_found on 404", async () => {
    mockEnv("missing-user");
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, 404));

    const { getGithubData } = await importService();
    const data = await getGithubData();

    expect(data).toEqual({ status: "unavailable", reason: "user_not_found" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalled();
  });

  it("returns unavailable upstream_error on 5xx OR parse_error on bad json", async () => {
    mockEnv("octocat");
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "oops" }, 500));

    let service = await importService();
    await expect(service.getGithubData()).resolves.toEqual({
      status: "unavailable",
      reason: "upstream_error",
    });
    expect(console.warn).toHaveBeenCalled();

    vi.resetModules();
    mockEnv("octocat");
    mockFetch.mockReset();
    vi.mocked(console.warn).mockClear();
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ name: "missing-login" }))
      .mockResolvedValueOnce(jsonResponse(reposSample()))
      .mockResolvedValueOnce(jsonResponse(eventsSample()));

    service = await importService();
    await expect(service.getGithubData()).resolves.toEqual({
      status: "unavailable",
      reason: "parse_error",
    });
    expect(console.warn).toHaveBeenCalled();
  });

  it("returns unavailable rate_limited on 403 + ratelimit header", async () => {
    mockEnv("octocat");
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "API rate limit exceeded" }), {
        status: 403,
        headers: { "X-RateLimit-Remaining": "0" },
      }),
    );

    const { getGithubData } = await importService();
    const data = await getGithubData();

    expect(data).toEqual({ status: "unavailable", reason: "rate_limited" });
    expect(console.warn).toHaveBeenCalled();
  });

  it("returns unavailable network_error when fetch throws", async () => {
    mockEnv("octocat");
    mockFetch.mockRejectedValueOnce(new Error("network down"));

    const { getGithubData } = await importService();
    const data = await getGithubData();

    expect(data).toEqual({ status: "unavailable", reason: "network_error" });
    expect(console.warn).toHaveBeenCalled();
  });
});

async function importService(): Promise<{
  getGithubData: () => Promise<GithubDataResult>;
}> {
  return (await import(modulePath)) as {
    getGithubData: () => Promise<GithubDataResult>;
  };
}

function mockEnv(username: string | undefined) {
  vi.doMock("@/lib/env", () => ({
    env: { GITHUB_USERNAME: username },
  }));
}

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status });
}

function userSample() {
  return {
    login: "octocat",
    avatar_url: "https://github.com/images/error/octocat_happy.gif",
    html_url: "https://github.com/octocat",
    name: "monalisa octocat",
    bio: "There once was...",
    public_repos: 2,
    followers: 20,
  };
}

function reposSample() {
  return [
    {
      name: "stars-80",
      html_url: "https://github.com/octocat/stars-80",
      description: "Top repo",
      stargazers_count: 80,
      language: "JavaScript",
    },
    {
      name: "stars-10",
      html_url: "https://github.com/octocat/stars-10",
      description: null,
      stargazers_count: 10,
      language: "TypeScript",
    },
    {
      name: "stars-3",
      html_url: "https://github.com/octocat/stars-3",
      description: "Third repo",
      stargazers_count: 3,
      language: null,
    },
  ];
}

function eventsSample() {
  return [
    {
      type: "PushEvent",
      created_at: "2026-05-21T00:00:00.000Z",
      payload: { size: 3, commits: [{ sha: "a", message: "recent" }] },
    },
    {
      type: "PushEvent",
      created_at: "2026-05-20T00:00:00.000Z",
      payload: { commits: [{ sha: "b", message: "recent" }, { sha: "c", message: "recent" }] },
    },
    {
      type: "PushEvent",
      created_at: "2026-05-01T00:00:00.000Z",
      payload: { size: 8 },
    },
    {
      type: "IssuesEvent",
      created_at: "2026-05-21T00:00:00.000Z",
      payload: { size: 10 },
    },
  ];
}

type GithubDataResult =
  | {
      status: "ok";
      user: {
        login: string;
        name: string | null;
        bio: string | null;
        avatar_url: string;
        html_url: string;
        public_repos: number;
        followers: number;
      };
      recentCommitCount: number;
      topRepos: Array<{
        name: string;
        html_url: string;
        description: string | null;
        stargazers_count: number;
        language: string | null;
      }>;
    }
  | {
      status: "unavailable";
      reason:
        | "missing_env"
        | "rate_limited"
        | "user_not_found"
        | "upstream_error"
        | "parse_error"
        | "network_error";
    };
