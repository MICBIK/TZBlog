import { createHash } from "node:crypto";

const SALT = process.env.RATE_LIMIT_DAILY_SALT ?? "";

export async function hashIdentifier(identifier: string): Promise<string> {
  return createHash("sha256").update(`${SALT}:${identifier}`).digest("hex");
}
