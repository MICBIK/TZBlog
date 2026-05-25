import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { disconnectTestDb, testDb } from "../../../tests/helpers/db";
import { hashIdentifier } from "./hash";
import {
  checkRateLimit,
  cleanupOldRateLimitLogs,
  recordRateLimit,
} from "./rateLimit";

beforeEach(async () => {
  await testDb.rateLimitLog.deleteMany({});
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("rateLimit auth-magic", () => {
  it("rateLimitPerEmailBlocksAfter5In24h", async () => {
    const key = await hashIdentifier("visitor@example.com");

    for (let i = 0; i < 5; i += 1) {
      await recordRateLimit({ scope: "magic_link:email", key });
    }

    const exceeded = await checkRateLimit({
      scope: "magic_link:email",
      key,
      windowSeconds: 24 * 60 * 60,
      maxCount: 5,
    });

    expect(exceeded).toBe(true);
  });

  it("rateLimitPerIpBlocksAfter10In1h", async () => {
    const key = await hashIdentifier("203.0.113.10");

    for (let i = 0; i < 10; i += 1) {
      await recordRateLimit({ scope: "magic_link:ip", key });
    }

    const exceeded = await checkRateLimit({
      scope: "magic_link:ip",
      key,
      windowSeconds: 60 * 60,
      maxCount: 10,
    });

    expect(exceeded).toBe(true);
  });

  it("rateLimitComboBlocksAfter3In10m", async () => {
    const key = await hashIdentifier("visitor@example.com:203.0.113.10");

    for (let i = 0; i < 3; i += 1) {
      await recordRateLimit({ scope: "magic_link:combo", key });
    }

    const exceeded = await checkRateLimit({
      scope: "magic_link:combo",
      key,
      windowSeconds: 10 * 60,
      maxCount: 3,
    });

    expect(exceeded).toBe(true);
  });

  it("cleanupOldRateLimitLogsRemoves31DayPlusEntries", async () => {
    const stale = await testDb.rateLimitLog.create({
      data: {
        scope: "magic_link:email",
        key: "stale-key",
        createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      },
    });
    const fresh = await testDb.rateLimitLog.create({
      data: {
        scope: "magic_link:email",
        key: "fresh-key",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const removed = await cleanupOldRateLimitLogs();

    expect(removed).toBe(1);
    expect(
      await testDb.rateLimitLog.findUnique({ where: { id: stale.id } }),
    ).toBeNull();
    expect(
      await testDb.rateLimitLog.findUnique({ where: { id: fresh.id } }),
    ).not.toBeNull();
  });
});
