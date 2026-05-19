import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtemp, rm, readFile } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

import { LocalDiskStorage } from "./local"

let tmpDir: string
let storage: LocalDiskStorage

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "tzblog-storage-test-"))
  storage = new LocalDiskStorage({
    uploadDir: tmpDir,
    publicUrlPrefix: "/uploads",
  })
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// 2.1 publicUrl

describe("LocalDiskStorage.publicUrl", () => {
  it("joins prefix and key", () => {
    expect(storage.publicUrl("2026/05/abc.png")).toBe("/uploads/2026/05/abc.png")
  })

  it("handles prefix with trailing slash", () => {
    const s = new LocalDiskStorage({ uploadDir: tmpDir, publicUrlPrefix: "/uploads/" })
    expect(s.publicUrl("2026/05/abc.png")).toBe("/uploads/2026/05/abc.png")
  })
})

// 2.2 put — creates nested directories

describe("LocalDiskStorage.put", () => {
  it("creates nested directories for dated keys", async () => {
    const key = "2026/05/test.png"
    await storage.put({ key, body: PNG_MAGIC, contentType: "image/png" })
    const written = await readFile(join(tmpDir, key))
    expect(written).toEqual(PNG_MAGIC)
  })

  // 2.3 put returns full url
  it("returns full url with prefix", async () => {
    const key = "2026/05/test.png"
    const { url } = await storage.put({ key, body: PNG_MAGIC, contentType: "image/png" })
    expect(url).toBe("/uploads/2026/05/test.png")
  })
})

// 2.4 delete — idempotent

describe("LocalDiskStorage.delete", () => {
  it("deletes an existing file", async () => {
    const key = "2026/05/del.png"
    await storage.put({ key, body: PNG_MAGIC, contentType: "image/png" })
    await expect(storage.delete(key)).resolves.toBeUndefined()
  })

  it("is idempotent — no ENOENT for missing file", async () => {
    await expect(storage.delete("2026/05/never-existed.png")).resolves.toBeUndefined()
  })
})
