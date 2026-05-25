import { NextResponse } from "next/server";

import { created, withErrorHandler } from "@/lib/api-response";
import { requireAuth } from "@/lib/services/auth";
import { createGuestbookCommentSchema } from "@/lib/schemas/guestbookMessage";
import { createGuestbookReply } from "@/lib/services/guestbook";

export const POST = withErrorHandler(async (req: Request): Promise<NextResponse> => {
  const session = await requireAuth();
  const body = await req.json();
  const input = createGuestbookCommentSchema.parse(body);
  const comment = await createGuestbookReply(
    {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
      name: session.user.name,
    },
    input.threadId,
    input.content,
  );
  return created(comment);
});
