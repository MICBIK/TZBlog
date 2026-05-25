import { NextResponse } from "next/server";

import { ok, withErrorHandler } from "@/lib/api-response";
import { requireAdmin } from "@/lib/services/auth";
import { markGuestbookThreadResolved } from "@/lib/services/guestbook";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandler(
  async (_req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdmin();
    const { id } = await ctx.params;
    const thread = await markGuestbookThreadResolved(id);
    return ok(thread);
  },
);
