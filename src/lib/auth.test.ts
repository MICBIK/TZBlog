import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { disconnectTestDb, testDb } from "../../tests/helpers/db";
import { ensureVisitorRoleOnCreate } from "./auth/visitorRole";
import { MAGIC_LINK_MAX_AGE_SECONDS } from "./email/sendMagicLink";

const TEST_EMAIL = "new-visitor@example.com";

beforeEach(async () => {
  await testDb.user.deleteMany({ where: { email: TEST_EMAIL } });
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("auth magic link", () => {
  it("createsVisitorRoleOnFirstLogin", async () => {
    const user = await testDb.user.create({
      data: {
        email: TEST_EMAIL,
        name: "Pending",
        role: "ADMIN",
      },
    });

    await ensureVisitorRoleOnCreate(user.id, user.email, user.name);

    const updated = await testDb.user.findUnique({ where: { id: user.id } });
    expect(updated?.role).toBe("VISITOR");
    expect(updated?.name).toBe("Pending");
  });

  it("usesFifteenMinuteMagicLinkMaxAge", () => {
    expect(MAGIC_LINK_MAX_AGE_SECONDS).toBe(15 * 60);
  });
});
