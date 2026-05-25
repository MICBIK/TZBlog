import { NextResponse } from "next/server";

import { ok, withErrorHandler } from "@/lib/api-response";
import {
  getEntryLikeState,
  toggleEntryLike,
} from "@/lib/services/entryPublic";
import { getVisitorHash } from "@/lib/visitor";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { id } = await ctx.params;
    const visitorHash = getVisitorHash(req);
    const result = await getEntryLikeState(id, visitorHash);
    return ok(result);
  },
);

export const POST = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    const { id } = await ctx.params;
    const visitorHash = getVisitorHash(req);
    const result = await toggleEntryLike(id, visitorHash);
    return ok(result);
  },
);
