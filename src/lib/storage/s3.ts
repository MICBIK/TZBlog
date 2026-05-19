import { Client } from "minio"

import type { IStorage } from "./types"

export interface S3StorageOptions {
  endpoint: string
  accessKey: string
  secretKey: string
  region: string
  bucket: string
  publicUrl: string
}

interface MinioLike {
  putObject(
    bucket: string,
    key: string,
    body: Buffer,
    size: number,
    headers: Record<string, string>,
  ): Promise<unknown>
  removeObject(bucket: string, key: string): Promise<void>
}

function parseEndpoint(url: string) {
  const u = new URL(url)
  return {
    endPoint: u.hostname,
    port: u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80,
    useSSL: u.protocol === "https:",
  }
}

export class S3Storage implements IStorage {
  private client: MinioLike
  private bucket: string
  private publicUrlBase: string

  constructor(optsOrClient: S3StorageOptions | { client: MinioLike; bucket: string; publicUrl: string }) {
    if ("client" in optsOrClient) {
      this.client = optsOrClient.client
      this.bucket = optsOrClient.bucket
      this.publicUrlBase = optsOrClient.publicUrl.replace(/\/$/, "")
    } else {
      const opts = optsOrClient
      this.bucket = opts.bucket
      this.publicUrlBase = opts.publicUrl.replace(/\/$/, "")
      this.client = new Client({
        ...parseEndpoint(opts.endpoint),
        accessKey: opts.accessKey,
        secretKey: opts.secretKey,
        region: opts.region,
      })
    }
  }

  async put(input: {
    key: string
    body: Buffer
    contentType: string
  }): Promise<{ url: string }> {
    await this.client.putObject(this.bucket, input.key, input.body, input.body.length, {
      "Content-Type": input.contentType,
    })
    return { url: this.publicUrl(input.key) }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === "NoSuchKey" || code === "NoSuchObject") return
      throw e
    }
  }

  publicUrl(key: string): string {
    return `${this.publicUrlBase}/${key}`
  }
}
