import { randomBytes } from "crypto"
import type { Media } from "@prisma/client"
import { imageSize } from "image-size"

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

function buildKey(mimeType: string): string {
  const extMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  }
  const ext = extMap[mimeType] ?? "bin"
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  return `${yyyy}/${mm}/${randomBytes(12).toString("hex")}.${ext}`
}

// best-effort：image-size 拒不合规 buffer 时尺寸留 null（Media.width/height 本就 optional）
function readDimensions(buf: Buffer): { width: number | null; height: number | null } {
  try {
    const dim = imageSize(buf)
    if (typeof dim.width === "number" && typeof dim.height === "number") {
      return { width: dim.width, height: dim.height }
    }
  } catch {
    // 解析失败 → 尺寸未知
  }
  return { width: null, height: null }
}

export async function createMedia(
  input: MediaCreateInput,
  store: IStorage = defaultStorage,
): Promise<Media> {
  const key = buildKey(input.mimeType)
  const { url } = await store.put({ key, body: input.body, contentType: input.mimeType })
  const { width, height } = readDimensions(input.body)

  try {
    return await db.media.create({
      data: {
        key,
        url,
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.size,
        width,
        height,
        uploadedBy: input.uploadedBy,
      },
    })
  } catch (e) {
    await store.delete(key).catch(() => {})
    throw e
  }
}

export async function listMedia(filter: MediaFilterInput): Promise<{
  items: Media[]
  total: number
  page: number
  pageSize: number
}> {
  const { page, pageSize } = filter
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.media.count(),
  ])

  return { items, total, page, pageSize }
}

export async function deleteMedia(
  id: string,
  store: IStorage = defaultStorage,
): Promise<void> {
  const row = await db.media.findUnique({ where: { id } })
  if (!row) throw errors.notFound(`Media ${id} not found`)

  await db.media.delete({ where: { id } })

  // storage.delete 内部已对 ENOENT / NoSuchKey 幂等；真错误（EACCES、磁盘满、网络）
  // 必须透传 —— 此时 DB 行已删，调用方拿到错误可去清理孤儿文件
  await store.delete(row.key)
}
