/**
 * Analytics service — PageView 入库。
 *
 * Stub: TDD RED 阶段，签名占位让 typecheck 通过；运行时 throw。
 */

export interface RecordPageViewInput {
  path: string
  visitorHash: string
  ua: string
  referrer?: string
}

export async function recordPageView(input: RecordPageViewInput): Promise<void> {
  throw new Error(`not implemented: recordPageView(${input.path}, ${input.visitorHash})`)
}
