import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { disconnectTestDb, testDb } from "../../../tests/helpers/db";
import { hashIdentifier } from "@/lib/security/hash";
import { recordRateLimit } from "@/lib/security/rateLimit";

const sendMock = vi.fn(async () => ({ data: { id: "email_123" }, error: null }));

vi.mock("resend", () => ({
  Resend: vi.fn(function MockResend() {
    return {
      emails: {
        send: sendMock,
      },
    };
  }),
}));

vi.mock("@react-email/render", () => ({
  render: vi.fn(async () => "<html>登录 TZBlog</html>"),
}));

import {
  MAGIC_LINK_EXPIRES_MINUTES,
  MAGIC_LINK_MAX_AGE_SECONDS,
  isVerificationTokenExpired,
  sendVerificationRequest,
} from "./sendMagicLink";

function mkRequest(ip = "203.0.113.55"): Request {
  return new Request("http://localhost:3000/api/auth/signin/email", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

beforeEach(async () => {
  sendMock.mockClear();
  await testDb.rateLimitLog.deleteMany({});
  process.env.AUTH_RESEND_KEY = "re_test_key";
  vi.stubEnv("NODE_ENV", "test");
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("sendMagicLink auth-magic", () => {
  it("sendsMagicLinkOnValidEmail", async () => {
    await sendVerificationRequest({
      identifier: "visitor@example.com",
      url: "http://localhost:3000/api/auth/callback/email?token=abc",
      provider: { from: "TZBlog <auth@example.com>" },
      request: mkRequest(),
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "visitor@example.com",
        subject: "登录 TZBlog",
        html: expect.stringContaining("登录 TZBlog"),
      }),
    );
  });

  it("rateLimitPerEmailBlocksAfter5In24h", async () => {
    const email = "limited@example.com";
    const key = await hashIdentifier(email);

    for (let i = 0; i < 5; i += 1) {
      await recordRateLimit({ scope: "magic_link:email", key });
    }

    await expect(
      sendVerificationRequest({
        identifier: email,
        url: "http://localhost:3000/api/auth/callback/email?token=abc",
        provider: { from: "TZBlog <auth@example.com>" },
        request: mkRequest(),
      }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("rateLimitPerIpBlocksAfter10In1h", async () => {
    const ip = "203.0.113.99";
    const key = await hashIdentifier(ip);

    for (let i = 0; i < 10; i += 1) {
      await recordRateLimit({ scope: "magic_link:ip", key });
    }

    await expect(
      sendVerificationRequest({
        identifier: "another@example.com",
        url: "http://localhost:3000/api/auth/callback/email?token=abc",
        provider: { from: "TZBlog <auth@example.com>" },
        request: mkRequest(ip),
      }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("rateLimitComboBlocksAfter3In10m", async () => {
    const email = "combo@example.com";
    const ip = "203.0.113.44";
    const key = await hashIdentifier(`${email}:${ip}`);

    for (let i = 0; i < 3; i += 1) {
      await recordRateLimit({ scope: "magic_link:combo", key });
    }

    await expect(
      sendVerificationRequest({
        identifier: email,
        url: "http://localhost:3000/api/auth/callback/email?token=abc",
        provider: { from: "TZBlog <auth@example.com>" },
        request: mkRequest(ip),
      }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("doesNotLeakUserExistence", async () => {
    const known = await sendVerificationRequest({
      identifier: "known@example.com",
      url: "http://localhost:3000/api/auth/callback/email?token=known",
      provider: { from: "TZBlog <auth@example.com>" },
      request: mkRequest("203.0.113.1"),
    }).then(() => "ok");

    await testDb.rateLimitLog.deleteMany({});

    const unknown = await sendVerificationRequest({
      identifier: "unknown@example.com",
      url: "http://localhost:3000/api/auth/callback/email?token=unknown",
      provider: { from: "TZBlog <auth@example.com>" },
      request: mkRequest("203.0.113.2"),
    }).then(() => "ok");

    expect(known).toBe("ok");
    expect(unknown).toBe("ok");
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("magicLinkExpiresAt15Minutes", () => {
    expect(MAGIC_LINK_MAX_AGE_SECONDS).toBe(15 * 60);
    expect(MAGIC_LINK_EXPIRES_MINUTES).toBe(15);

    const expires = new Date(Date.now() + 14 * 60 * 1000);
    expect(isVerificationTokenExpired(expires)).toBe(false);

    const expired = new Date(Date.now() - 60 * 1000);
    expect(isVerificationTokenExpired(expired)).toBe(true);
  });

  it("devModeWithoutResendKeyLogsUrlToConsole", async () => {
    vi.stubEnv("AUTH_RESEND_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await sendVerificationRequest({
      identifier: "dev@example.com",
      url: "http://localhost:3000/api/auth/callback/email?token=dev",
      provider: { from: "TZBlog <auth@example.com>" },
      request: mkRequest(),
    });

    expect(sendMock).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(
      "[magic-link]",
      "http://localhost:3000/api/auth/callback/email?token=dev",
    );

    infoSpy.mockRestore();
  });
});
