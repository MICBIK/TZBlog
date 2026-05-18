import { Client } from "minio"

function parseEndpoint(url: string) {
  const u = new URL(url)
  return {
    endPoint: u.hostname,
    port: u.port
      ? Number(u.port)
      : u.protocol === "https:"
        ? 443
        : 80,
    useSSL: u.protocol === "https:",
  }
}

export const storage = new Client({
  ...parseEndpoint(process.env.S3_ENDPOINT!),
  accessKey: process.env.S3_ACCESS_KEY_ID!,
  secretKey: process.env.S3_SECRET_ACCESS_KEY!,
  region: process.env.S3_REGION || "auto",
})

export const STORAGE_BUCKET = process.env.S3_BUCKET!
export const STORAGE_PUBLIC_URL = process.env.S3_PUBLIC_URL!

export async function ensureBucket() {
  const exists = await storage.bucketExists(STORAGE_BUCKET)
  if (!exists) await storage.makeBucket(STORAGE_BUCKET)
}

export function publicUrl(key: string): string {
  return `${STORAGE_PUBLIC_URL.replace(/\/$/, "")}/${key}`
}

export async function uploadObject(
  key: string,
  buffer: Buffer,
  contentType: string,
) {
  await storage.putObject(STORAGE_BUCKET, key, buffer, buffer.length, {
    "Content-Type": contentType,
  })
  return publicUrl(key)
}
