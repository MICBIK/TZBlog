import { describe, it, expect } from "vitest"
import { mediaFilterSchema } from "./media"
import { validateUpload } from "./media"

// ─── fixture buffers ────────────────────────────────────────────────────────

// Minimal valid PNG (magic header only is enough for file-type detection)
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// Minimal JPEG (SOI marker)
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])

// EXE disguised as PNG (MZ header, content-type image/png)
const EXE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00])

// SVG (XML text)
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')

// 4 MB of PNG-magic repeated (big enough to pass size check)
const FOUR_MB = Buffer.alloc(4 * 1024 * 1024)
PNG.copy(FOUR_MB)

// 6 MB (should fail)
const SIX_MB = Buffer.alloc(6 * 1024 * 1024)
PNG.copy(SIX_MB)

// ─── 3.1 mediaFilterSchema defaults ─────────────────────────────────────────

describe("mediaFilterSchema", () => {
  it("defaults page=1 pageSize=12 when nothing provided", () => {
    const r = mediaFilterSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.page).toBe(1)
      expect(r.data.pageSize).toBe(12)
    }
  })

  // 3.2 pageSize upper bound
  it("rejects pageSize > 100", () => {
    const r = mediaFilterSchema.safeParse({ pageSize: 200 })
    expect(r.success).toBe(false)
  })

  it("rejects page=0", () => {
    const r = mediaFilterSchema.safeParse({ page: 0 })
    expect(r.success).toBe(false)
  })

  it("coerces string page/pageSize from URL query", () => {
    const r = mediaFilterSchema.safeParse({ page: "2", pageSize: "24" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.page).toBe(2)
      expect(r.data.pageSize).toBe(24)
    }
  })
})

// ─── 3.3 validateUpload accepts real PNG ────────────────────────────────────

describe("validateUpload", () => {
  it("accepts real PNG", async () => {
    await expect(
      validateUpload({ body: PNG, contentType: "image/png", size: PNG.length }),
    ).resolves.toBeUndefined()
  })

  it("accepts real JPEG", async () => {
    await expect(
      validateUpload({ body: JPEG, contentType: "image/jpeg", size: JPEG.length }),
    ).resolves.toBeUndefined()
  })

  // 3.4 exe disguised as PNG
  it("rejects exe with image/png content-type via magic number", async () => {
    await expect(
      validateUpload({ body: EXE, contentType: "image/png", size: EXE.length }),
    ).rejects.toMatchObject({ code: "VALIDATION" })
  })

  // 3.5 SVG rejected
  it("rejects image/svg+xml", async () => {
    await expect(
      validateUpload({ body: SVG, contentType: "image/svg+xml", size: SVG.length }),
    ).rejects.toMatchObject({ code: "VALIDATION" })
  })

  // 3.6 4MB passes
  it("accepts 4MB file", async () => {
    await expect(
      validateUpload({ body: FOUR_MB, contentType: "image/png", size: FOUR_MB.length }),
    ).resolves.toBeUndefined()
  })

  // 3.7 6MB rejected
  it("rejects 6MB file with PAYLOAD_TOO_LARGE", async () => {
    await expect(
      validateUpload({ body: SIX_MB, contentType: "image/png", size: SIX_MB.length }),
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" })
  })
})
