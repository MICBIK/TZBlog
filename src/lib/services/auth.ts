import { auth } from "@/lib/auth";
import { errors } from "@/lib/errors";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw errors.unauthorized();
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw errors.forbidden("Admin access required");
  }
  return session;
}
