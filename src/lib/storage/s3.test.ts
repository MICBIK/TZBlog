import { describe, it, expect, vi, beforeEach } from "vitest"

import { S3Storage } from "./s3"

const mockPutObject = vi.fn().mockResolvedValue(undefined)
const mockRemoveObject = vi.fn().mockResolvedValue(undefined)

vi.mock("minio", () => ({
  Client: vi.fn().mockImplementation(() => ({
    putObject: mockPutObject,
    removeObject: mockRemoveObject,
    bucketExists: vi.fn().mockResolvedValue(true),
    makeBucket: vi.fn().mockResolvedValue(undefined),
  })),
}))

const BUCKET = "test-bucket"
const PUBLIC_URL = "https://cdn.tzblog.dev"

let storage: S3Storage

beforeEach(() => {
  vi.clearAllMocks()
  storage = new S3Storage({
    endpoint: "http://localhost:9000",
    accessKey: "minioadmin",
    secretKey: "minioadmin",
    region: "auto",
    bucket: BUCKET,
    publicUrl: PUBLIC_URL,
  })
})

// 2.5 publicUrl

describe("S3Storage.publicUrl", () => {
  it("normalises trailing slash on PUBLIC_URL", () => {
    const s = new S3Storage({
      endpoint: "http://localhost:9000",
      accessKey: "a",
      secretKey: "b",
      region: "auto",
      bucket: BUCKET,
      publicUrl: "https://cdn.tzblog.dev/",
    })
    expect(s.publicUrl("2026/05/abc.png")).toBe("https://cdn.tzblog.dev/2026/05/abc.png")
  })

  it("joins public url and key without double slash", () => {
    expect(storage.publicUrl("2026/05/abc.png")).toBe(
      "https://cdn.tzblog.dev/2026/05/abc.png",
    )
  })
})

// 2.6 put

describe("S3Storage.put", () => {
  it("calls minio putObject with bucket / key / contentType", async () => {
    const key = "2026/05/test.png"
    const body = Buffer.from("data")
    const { url } = await storage.put({ key, body, contentType: "image/png" })

    expect(mockPutObject).toHaveBeenCalledWith(
      BUCKET,
      key,
      body,
      body.length,
      expect.objectContaining({ "Content-Type": "image/png" }),
    )
    expect(url).toBe(`${PUBLIC_URL}/${key}`)
  })
})

// 2.7 delete

describe("S3Storage.delete", () => {
  it("calls minio removeObject", async () => {
    await storage.delete("2026/05/test.png")
    expect(mockRemoveObject).toHaveBeenCalledWith(BUCKET, "2026/05/test.png")
  })

  it("swallows NoSuchKey-like errors", async () => {
    mockRemoveObject.mockRejectedValueOnce(
      Object.assign(new Error("NoSuchKey"), { code: "NoSuchKey" }),
    )
    await expect(storage.delete("2026/05/missing.png")).resolves.toBeUndefined()
  })
})
