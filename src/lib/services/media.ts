import type { Media } from "@prisma/client"

import { db } from "@/lib/db"
import { storage as defaultStorage, type IStorage } from "@/lib/storage"
import { errors } from "@/lib/errors"
import type { MediaFilterInput } from "@/lib/schemas/media"

export type MediaCreateInput = {
  filename: string
  mimeType: string
  body: Buffer
  size: number
  uploadedBy: string
}

export async function createMedia(
  input: MediaCreateInput,
  store: IStorage = defaultStorage,
): Promise<Media> {
  void input
  void store
  void db
  throw new Error("not implemented")
}

export async function listMedia(filter: MediaFilterInput): Promise<{
  items: Media[]
  total: number
  page: number
  pageSize: number
}> {
  void filter
  throw new Error("not implemented")
}

export async function deleteMedia(
  id: string,
  store: IStorage = defaultStorage,
): Promise<void> {
  void id
  void errors
  void store
  throw new Error("not implemented")
}
