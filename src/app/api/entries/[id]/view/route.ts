import { NextResponse } from "next/server";

import { ok, withErrorHandler } from "@/lib/api-response";
import { errors } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { incrementEntryView } from "@/lib/services/entryPublic";
import { getDailySalt, getVisitorHash } from "@/lib/visitor";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { id } = await ctx.params;
    const visitorHash = getVisitorHash(req);

    const rl = checkRateLimit(`entry-view:${visitorHash}`, 10, 60_000);
    if (!rl.allowed) {
      throw errors.rateLimited();
    }

    const dayKey = getDailySalt();
    const result = await incrementEntryView(id, visitorHash, dayKey);
    return ok(result);
  },
);
