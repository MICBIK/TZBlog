import { execFileSync } from "node:child_process";

import dotenv from "dotenv";

export default async function globalSetup() {
  dotenv.config();
  execFileSync("pnpm", ["db:seed"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  execFileSync("pnpm", ["exec", "tsx", "e2e/scripts/ensureAdminLogin.ts"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
}
