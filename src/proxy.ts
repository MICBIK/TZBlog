import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";
import { resolveProxyDecision } from "@/lib/proxyAccess";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const decision = resolveProxyDecision({
    pathname: nextUrl.pathname,
    search: nextUrl.search,
    origin: nextUrl.origin,
    isAuthed: !!req.auth,
    role: req.auth?.user?.role,
  });

  if (decision.action === "next") {
    return NextResponse.next();
  }

  if (decision.action === "redirect") {
    return NextResponse.redirect(decision.url);
  }

  return NextResponse.json(decision.body, { status: decision.status });
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
