import { describe, it, expect, vi, afterEach } from "vitest"

// factory 通过读 process.env 决定返回哪个 driver
// 每个测试重置 env 并重新 import

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

const S3_FULL_ENV = {
  STORAGE_DRIVER: "s3",
  S3_ENDPOINT: "http://localhost:9000",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
  S3_BUCKET: "bucket",
  S3_PUBLIC_URL: "http://localhost:9000/bucket",
}

// 2.8 默认 local

describe("storage factory", () => {
  it("falls back to LocalDiskStorage when STORAGE_DRIVER unset", async () => {
    vi.stubEnv("STORAGE_DRIVER", "")
    const { storage } = await import("./index")
    const { LocalDiskStorage } = await import("./local")
    expect(storage).toBeInstanceOf(LocalDiskStorage)
  })

  // 2.9 显式 s3
  it("returns S3Storage when STORAGE_DRIVER=s3 with full env", async () => {
    for (const [k, v] of Object.entries(S3_FULL_ENV)) vi.stubEnv(k, v)
    const { storage } = await import("./index")
    const { S3Storage } = await import("./s3")
    expect(storage).toBeInstanceOf(S3Storage)
  })

  // 2.10 s3 env 缺失 fail-fast
  it("throws AppError listing missing env when s3 incomplete", async () => {
    vi.stubEnv("STORAGE_DRIVER", "s3")
    // 故意不设 S3_ENDPOINT 等
    await expect(import("./index")).rejects.toMatchObject({
      code: "MISSING_ENV",
    })
  })
})
