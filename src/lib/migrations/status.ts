import { execFileSync } from "node:child_process"

export function assertMigrationStatusUpToDate(): string {
  return execFileSync("pnpm", ["prisma", "migrate", "status"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
}
