import { NextResponse } from "next/server";

import { created, withErrorHandler } from "@/lib/api-response";
import { requireAuth } from "@/lib/services/auth";
import { createGuestbookThreadSchema } from "@/lib/schemas/guestbookMessage";
import { createGuestbookThread } from "@/lib/services/guestbook";

export const POST = withErrorHandler(async (req: Request): Promise<NextResponse> => {
  const session = await requireAuth();
  const body = await req.json();
  const input = createGuestbookThreadSchema.parse(body);
  const thread = await createGuestbookThread(
    {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
      name: session.user.name,
    },
    input.content,
  );
  return created(thread);
});
