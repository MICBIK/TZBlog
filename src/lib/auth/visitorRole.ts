import { db } from "@/lib/db";

export async function ensureVisitorRoleOnCreate(
  userId: string,
  email: string | null | undefined,
  name: string | null | undefined,
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      role: "VISITOR",
      name: name ?? email ?? "Visitor",
    },
  });
}
