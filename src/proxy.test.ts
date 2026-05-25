import { describe, expect, it } from "vitest";

import { resolveProxyDecision } from "@/lib/proxyAccess";

describe("proxy auth-magic-008", () => {
  it("proxyAllowsAuthedVisitorToGuestbookOnly", () => {
    const guestbook = resolveProxyDecision({
      pathname: "/guestbook",
      search: "",
      origin: "http://localhost:3000",
      isAuthed: true,
      role: "VISITOR",
    });
    expect(guestbook.action).toBe("next");

    const admin = resolveProxyDecision({
      pathname: "/admin",
      search: "",
      origin: "http://localhost:3000",
      isAuthed: true,
      role: "VISITOR",
    });
    expect(admin).toEqual({
      action: "json",
      status: 403,
      body: {
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      },
    });
  });
});
