/**
 * Likes service — 永久 unique 一次性点赞 (D3)。
 * 实现见 SPEC-D3-L-1..4。
 *
 * Stub: TDD RED 阶段，签名占位让 typecheck 通过；运行时 throw。
 */

export async function addLike(
  slug: string,
  visitorHash: string,
): Promise<{ liked: boolean; likeCount: number }> {
  throw new Error(`not implemented: addLike(${slug}, ${visitorHash})`)
}

export async function hasLikedBy(
  slug: string,
  visitorHash: string,
): Promise<boolean> {
  throw new Error(`not implemented: hasLikedBy(${slug}, ${visitorHash})`)
}
