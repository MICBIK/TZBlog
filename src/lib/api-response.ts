import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { AppError } from "./errors"

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) })
}

export function failure(error: AppError) {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    { status: error.httpStatus },
  )
}

export function withErrorHandler<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => Promise<NextResponse>,
>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (e) {
      if (e instanceof AppError) return failure(e)
      if (e instanceof ZodError) {
        return failure(
          new AppError("VALIDATION_ERROR", "Invalid input", 400, {
            issues: e.issues,
          }),
        )
      }
      console.error("[API ERROR]", e)
      return failure(
        new AppError("INTERNAL_ERROR", "Internal server error", 500),
      )
    }
  }) as T
}
