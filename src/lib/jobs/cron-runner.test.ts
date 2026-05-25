import { beforeEach, describe, expect, it, vi } from "vitest";

const cronCallbacks: Array<() => Promise<void> | void> = [];
const recomputeMock = vi.fn(async () => undefined);

vi.mock("cron", () => ({
  CronJob: class {
    constructor(_expr: string, onTick: () => Promise<void> | void) {
      cronCallbacks.push(onTick);
    }
  },
}));

vi.mock("./recomputeTrending", () => ({
  recomputeAllTrending: recomputeMock,
}));

vi.mock("@/lib/security/rateLimit", () => ({
  cleanupOldRateLimitLogs: vi.fn(async () => 0),
}));

describe("cron-runner", () => {
  beforeEach(() => {
    cronCallbacks.length = 0;
    recomputeMock.mockClear();
    vi.resetModules();
  });

  it("cronRunsHourly", async () => {
    process.env.CRON_RUNNER_AUTOSTART = "false";
    const { startCronRunner } = await import("./cron-runner");
    startCronRunner();

    expect(cronCallbacks.length).toBeGreaterThanOrEqual(1);
    await cronCallbacks[0]();

    expect(recomputeMock).toHaveBeenCalledTimes(1);
  });

  it("cronRunnerStartedLog", async () => {
    process.env.CRON_RUNNER_AUTOSTART = "false";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { startCronRunner } = await import("./cron-runner");
    startCronRunner();
    expect(logSpy.mock.calls.some((call) => call[0] === "[cron] runner started")).toBe(true);
    logSpy.mockRestore();
  });
});
