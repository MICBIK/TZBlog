import { LocalDiskStorage } from "./local"
import { S3Storage } from "./s3"
import type { IStorage } from "./types"

export type { IStorage }
export { LocalDiskStorage } from "./local"
export { S3Storage } from "./s3"

function createStorage(): IStorage {
  const driver = process.env.STORAGE_DRIVER ?? "local"

  if (driver === "s3") {
    const required = [
      "S3_ENDPOINT",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_BUCKET",
      "S3_PUBLIC_URL",
    ]
    const missing = required.filter((k) => !process.env[k])
    if (missing.length > 0) {
      // Lazy import to avoid circular — errors module is app-level
      const err = new Error(
        `STORAGE_DRIVER=s3 but missing env: ${missing.join(", ")}`,
      ) as Error & { code: string }
      err.code = "MISSING_ENV"
      throw err
    }

    return new S3Storage({
      endpoint: process.env.S3_ENDPOINT!,
      accessKey: process.env.S3_ACCESS_KEY_ID!,
      secretKey: process.env.S3_SECRET_ACCESS_KEY!,
      region: process.env.S3_REGION ?? "auto",
      bucket: process.env.S3_BUCKET!,
      publicUrl: process.env.S3_PUBLIC_URL!,
    })
  }

  return new LocalDiskStorage({
    uploadDir: process.env.LOCAL_UPLOAD_DIR ?? "public/uploads",
    publicUrlPrefix: process.env.LOCAL_PUBLIC_URL_PREFIX ?? "/uploads",
  })
}

export const storage = createStorage()
