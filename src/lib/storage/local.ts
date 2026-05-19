import { mkdir, writeFile, unlink } from "fs/promises"
import { join, dirname } from "path"

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
    void input.contentType
    const dest = join(this.uploadDir, input.key)
    await mkdir(dirname(dest), { recursive: true })
    await writeFile(dest, input.body)
    return { url: this.publicUrl(input.key) }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir, key))
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e
    }
  }

  publicUrl(key: string): string {
    return `${this.prefix}/${key}`
  }
}
