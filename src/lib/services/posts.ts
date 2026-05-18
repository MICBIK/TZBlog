import { renderMarkdown } from "@/lib/markdown";
import type {
  CreatePostInput,
  PostFilter,
  UpdatePostInput,
} from "@/lib/schemas/post";

// `db` is provided by another agent (src/lib/db.ts). The import is intentional
// so this module compiles into the canonical service layer once the DB layer
// lands. Until then, every function throws "Not implemented".
//
// Importing renderMarkdown here is also intentional: per systemPatterns §3,
// post detail rendering crosses the markdown pipeline + DB so it belongs in
// a service. The actual call site (db.post.findUnique → renderMarkdown) is
// stubbed below.
//
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- placeholder for agent 5
import { db } from "@/lib/db";

export interface PostDetail<TPost = unknown> {
  post: TPost;
  /** Pre-rendered HTML for the active locale's content. */
  html: string;
}

/**
 * Fetch a published post by slug + locale, then render its Markdown content
 * to sanitized HTML. Returns null when not found or unpublished.
 *
 * Real implementation will:
 *   1. db.post.findUnique({ where: { slug }, include: { translations: true, ... } })
 *   2. pick translations[locale], fall back to default locale
 *   3. await renderMarkdown(translation.content)
 *   4. return { post, html }
 */
export async function getPostBySlug(
  _slug: string,
  _locale: string,
): Promise<PostDetail | null> {
  // Touch imports so linters don't drop them once this lands.
  void db;
  void renderMarkdown;
  throw new Error("Not implemented");
}

export interface ListPostsResult<TPost = unknown> {
  posts: TPost[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated list of published posts, optionally filtered by column or tag.
 */
export async function listPublishedPosts(
  _opts?: Partial<PostFilter>,
): Promise<ListPostsResult> {
  void db;
  throw new Error("Not implemented");
}

/**
 * Create a post with translations + tags inside a single transaction.
 */
export async function createPost(_input: CreatePostInput): Promise<{ id: string }> {
  void db;
  throw new Error("Not implemented");
}

/**
 * Patch a post and (when provided) replace its translations and tag set.
 */
export async function updatePost(
  _id: string,
  _input: UpdatePostInput,
): Promise<{ id: string }> {
  void db;
  throw new Error("Not implemented");
}
