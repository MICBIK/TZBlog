import type { IStorage } from "./types"

export interface S3StorageOptions {
  endpoint: string
  accessKey: string
  secretKey: string
  region: string
  bucket: string
  publicUrl: string
}

export class S3Storage implements IStorage {
  private bucket: string
  private publicUrlBase: string

  constructor(_opts: S3StorageOptions) {
    this.bucket = _opts.bucket
    this.publicUrlBase = _opts.publicUrl.replace(/\/$/, "")
  }

  async put(input: {
    key: string
    body: Buffer
    contentType: string
  }): Promise<{ url: string }> {
    void input
    throw new Error("not implemented")
  }

  async delete(key: string): Promise<void> {
    void key
    throw new Error("not implemented")
  }

  publicUrl(key: string): string {
    void key
    throw new Error("not implemented")
  }
}
