import { NextResponse } from "next/server";

import { ok, withErrorHandler } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { errors } from "@/lib/errors";
import { updateEntrySchema } from "@/lib/schemas/entry";
import { updateEntry } from "@/lib/services/entries";

type RouteContext = { params: Promise<{ id: string }> };

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw errors.unauthorized();
  }
  return session;
}

export const PATCH = withErrorHandler(
  async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    await requireAdminSession();
    const { id } = await ctx.params;
    const body = await req.json();
    const input = updateEntrySchema.parse(body);
    const entry = await updateEntry(id, input);
    return ok(entry);
  },
);
