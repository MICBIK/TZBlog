export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "PAYLOAD_TOO_LARGE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UPSTREAM_FAILURE"
  | "INTERNAL_ERROR"

export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public httpStatus: number,
    public details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export const errors = {
  validation: (msg: string, details?: Record<string, unknown>) =>
    new AppError("VALIDATION_ERROR", msg, 400, details),
  unauthorized: (msg = "Authentication required") =>
    new AppError("UNAUTHORIZED", msg, 401),
  forbidden: (msg = "Access denied") => new AppError("FORBIDDEN", msg, 403),
  notFound: (msg = "Resource not found") =>
    new AppError("NOT_FOUND", msg, 404),
  conflict: (msg: string) => new AppError("CONFLICT", msg, 409),
  payloadTooLarge: (msg = "文件超过大小限制") =>
    new AppError("PAYLOAD_TOO_LARGE", msg, 413),
  rateLimited: (msg = "Too many requests") =>
    new AppError("RATE_LIMITED", msg, 429),
  upstream: (msg: string) => new AppError("UPSTREAM_FAILURE", msg, 502),
  internal: (msg = "Internal server error") =>
    new AppError("INTERNAL_ERROR", msg, 500),
}
