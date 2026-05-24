import { db } from "@/lib/db"
import { errors } from "@/lib/errors"

export async function deleteChannel(id: string): Promise<void> {
  const current = await db.channel.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!current) {
    throw errors.notFound(`Channel ${id} not found`)
  }

  await db.channel.delete({ where: { id } })
}
