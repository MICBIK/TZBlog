import type { IStorage } from "./types"

export interface LocalDiskStorageOptions {
  uploadDir: string
  publicUrlPrefix: string
}

export class LocalDiskStorage implements IStorage {
  private uploadDir: string
  private prefix: string

  constructor(opts: LocalDiskStorageOptions) {
    this.uploadDir = opts.uploadDir
    this.prefix = opts.publicUrlPrefix.replace(/\/$/, "")
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
