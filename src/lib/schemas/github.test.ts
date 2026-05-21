import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

const githubSchemaPath = "./github";

describe("GitHub API schemas", () => {
  it("githubUserSchema parses real /users response", async () => {
    const { githubUserSchema } = await schemas();

    const parsed = githubUserSchema.parse({
      login: "octocat",
      id: 1,
      node_id: "MDQ6VXNlcjE=",
      avatar_url: "https://github.com/images/error/octocat_happy.gif",
      html_url: "https://github.com/octocat",
      name: "monalisa octocat",
      bio: "There once was...",
      public_repos: 2,
      followers: 20,
      following: 0,
    });

    expect(parsed).toMatchObject({
      login: "octocat",
      name: "monalisa octocat",
      bio: "There once was...",
      avatar_url: "https://github.com/images/error/octocat_happy.gif",
      html_url: "https://github.com/octocat",
      public_repos: 2,
      followers: 20,
    });
  });

  it("githubRepoSchema parses real /repos element", async () => {
    const { githubRepoSchema, githubReposResponseSchema } = await schemas();

    const repo = {
      name: "Hello-World",
      full_name: "octocat/Hello-World",
      html_url: "https://github.com/octocat/Hello-World",
      description: "This your first repo!",
      stargazers_count: 80,
      language: "JavaScript",
    };

    expect(githubRepoSchema.parse(repo)).toMatchObject({
      name: "Hello-World",
      html_url: "https://github.com/octocat/Hello-World",
      description: "This your first repo!",
      stargazers_count: 80,
      language: "JavaScript",
    });
    expect(githubReposResponseSchema.parse([repo])).toHaveLength(1);
  });

  it("githubEventSchema parses PushEvent", async () => {
    const { githubEventSchema, githubEventsResponseSchema } = await schemas();

    const event = {
      id: "22249084947",
      type: "PushEvent",
      created_at: "2022-06-09T12:47:28Z",
      payload: {
        size: 3,
        commits: [{ sha: "abc", message: "commit message" }],
      },
    };

    const parsed = githubEventSchema.parse(event);
    expect(parsed.type).toBe("PushEvent");
    expect(parsed.payload.size).toBe(3);
    expect(parsed.payload.commits?.[0]?.sha).toBe("abc");
    expect(githubEventsResponseSchema.parse([event])).toHaveLength(1);
  });

  it("schemas reject malformed", async () => {
    const {
      githubEventsResponseSchema,
      githubReposResponseSchema,
      githubUserSchema,
    } = await schemas();

    expect(() => githubUserSchema.parse({ name: "missing-login" })).toThrow(
      ZodError,
    );
    expect(() => githubReposResponseSchema.parse({ name: "not-array" })).toThrow(
      ZodError,
    );
    expect(() =>
      githubEventsResponseSchema.parse([{ type: "PushEvent", payload: {} }]),
    ).toThrow(ZodError);
  });

  it("schemas accept nullable bio / description / language", async () => {
    const { githubRepoSchema, githubUserSchema } = await schemas();

    expect(() =>
      githubUserSchema.parse({
        login: "octocat",
        avatar_url: "https://github.com/images/error/octocat_happy.gif",
        html_url: "https://github.com/octocat",
        name: null,
        bio: null,
        public_repos: 2,
        followers: 20,
      }),
    ).not.toThrow();

    expect(() =>
      githubRepoSchema.parse({
        name: "Hello-World",
        html_url: "https://github.com/octocat/Hello-World",
        description: null,
        stargazers_count: 80,
        language: null,
      }),
    ).not.toThrow();
  });
});

async function schemas() {
  return (await vi.importActual(githubSchemaPath)) as {
    githubUserSchema: {
      parse: (value: unknown) => GithubUser;
    };
    githubRepoSchema: {
      parse: (value: unknown) => GithubRepo;
    };
    githubReposResponseSchema: {
      parse: (value: unknown) => GithubRepo[];
    };
    githubEventSchema: {
      parse: (value: unknown) => GithubEvent;
    };
    githubEventsResponseSchema: {
      parse: (value: unknown) => GithubEvent[];
    };
  };
}

interface GithubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
}

interface GithubRepo {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
}

interface GithubEvent {
  type: string;
  created_at: string;
  payload: {
    size?: number;
    commits?: Array<{ sha: string; message: string }>;
  };
}
