import { NextResponse } from "next/server";

import { ok, withErrorHandler } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { errors } from "@/lib/errors";
import { createEntrySchema } from "@/lib/schemas/entry";
import { createEntry } from "@/lib/services/entries";

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw errors.unauthorized();
  }
  return session;
}

export const POST = withErrorHandler(
  async (req: Request): Promise<NextResponse> => {
    const session = await requireAdminSession();
    const body = await req.json();
    const input = createEntrySchema.parse(body);
    const entry = await createEntry(input, session.user.id);
    return ok(entry);
  },
);
