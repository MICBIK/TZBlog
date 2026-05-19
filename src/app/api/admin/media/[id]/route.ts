type RouteContext = { params: Promise<{ id: string }> }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DELETE = async (_req: Request, _ctx: RouteContext) => new Response()