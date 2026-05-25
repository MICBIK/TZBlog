export type ProxyDecision =
  | { action: "next" }
  | { action: "redirect"; url: string }
  | {
      action: "json";
      status: number;
      body: {
        error: {
          code: string;
          message: string;
        };
      };
    };

export function resolveProxyDecision(input: {
  pathname: string;
  search: string;
  origin: string;
  isAuthed: boolean;
  role?: string | null;
}): ProxyDecision {
  const { pathname, search, origin, isAuthed, role } = input;
  const isApi = pathname.startsWith("/api/");
  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isProtected) {
    return { action: "next" };
  }

  if (isAuthed) {
    if (role === "VISITOR") {
      return {
        action: "json",
        status: 403,
        body: {
          error: {
            code: "FORBIDDEN",
            message: "Access denied",
          },
        },
      };
    }
    return { action: "next" };
  }

  if (isApi) {
    return {
      action: "json",
      status: 401,
      body: {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      },
    };
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("from", pathname + search);
  return { action: "redirect", url: loginUrl.toString() };
}
