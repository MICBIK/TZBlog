import { CronJob } from "cron";

import { cleanupOldRateLimitLogs } from "@/lib/security/rateLimit";

import { recomputeAllTrending } from "./recomputeTrending";

export function startCronRunner(): void {
  new CronJob(
    "0 * * * *",
    async () => {
      try {
        await recomputeAllTrending();
        console.log("[cron] trending recomputed at", new Date().toISOString());
      } catch (error) {
        console.error("[cron] trending failed", error);
      }
    },
    null,
    true,
  );

  new CronJob(
    "0 3 * * *",
    async () => {
      try {
        const removed = await cleanupOldRateLimitLogs();
        console.log(`[cron] cleaned ${removed} old rate-limit entries`);
      } catch (error) {
        console.error("[cron] rate-limit cleanup failed", error);
      }
    },
    null,
    true,
  );

  console.log("[cron] runner started");
}

if (process.env.CRON_RUNNER_AUTOSTART !== "false") {
  startCronRunner();
}
