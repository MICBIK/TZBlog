import { z } from "zod";

export const githubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.string().url(),
  public_repos: z.number(),
  followers: z.number(),
  html_url: z.string().url(),
});

export const githubRepoSchema = z.object({
  name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  stargazers_count: z.number(),
  language: z.string().nullable(),
});

export const githubReposResponseSchema = z.array(githubRepoSchema);

export const githubEventSchema = z.object({
  type: z.string(),
  created_at: z.string(),
  payload: z
    .object({
      size: z.number().optional(),
      commits: z
        .array(
          z.object({
            sha: z.string(),
            message: z.string(),
          }),
        )
        .optional(),
    })
    .passthrough(),
});

export const githubEventsResponseSchema = z.array(githubEventSchema);

export type GithubUser = z.infer<typeof githubUserSchema>;
export type GithubRepo = z.infer<typeof githubRepoSchema>;
export type GithubEvent = z.infer<typeof githubEventSchema>;
