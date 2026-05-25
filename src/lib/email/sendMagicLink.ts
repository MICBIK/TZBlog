import { render } from "@react-email/render";
import { Resend } from "resend";

import { MagicLinkEmail } from "@/lib/email/templates/MagicLink";
import { errors } from "@/lib/errors";
import { hashIdentifier } from "@/lib/security/hash";
import { checkRateLimit, recordRateLimit } from "@/lib/security/rateLimit";

interface SendVerificationParams {
  identifier: string;
  url: string;
  provider: { from?: string | null };
  request: Request;
}

export const MAGIC_LINK_MAX_AGE_SECONDS = 15 * 60;
export const MAGIC_LINK_EXPIRES_MINUTES = 15;

const RATE_LIMITS = {
  email: { scope: "magic_link:email", windowSeconds: 24 * 60 * 60, maxCount: 5 },
  ip: { scope: "magic_link:ip", windowSeconds: 60 * 60, maxCount: 10 },
  combo: { scope: "magic_link:combo", windowSeconds: 10 * 60, maxCount: 3 },
} as const;

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "0.0.0.0";
  return request.headers.get("x-real-ip") ?? "0.0.0.0";
}

export function isVerificationTokenExpired(
  expires: Date,
  now: Date = new Date(),
): boolean {
  return expires.getTime() <= now.getTime();
}

export async function sendVerificationRequest({
  identifier: email,
  url,
  provider,
  request,
}: SendVerificationParams): Promise<void> {
  const ip = getClientIp(request);
  const emailHash = await hashIdentifier(email);
  const ipHash = await hashIdentifier(ip);
  const comboHash = await hashIdentifier(`${email}:${ip}`);

  const emailExceeded = await checkRateLimit({
    ...RATE_LIMITS.email,
    key: emailHash,
  });
  if (emailExceeded) {
    throw errors.rateLimited("该邮箱 24 小时内请求过多，请稍后再试");
  }

  const ipExceeded = await checkRateLimit({
    ...RATE_LIMITS.ip,
    key: ipHash,
  });
  if (ipExceeded) {
    throw errors.rateLimited("当前网络 1 小时内请求过多，请稍后再试");
  }

  const comboExceeded = await checkRateLimit({
    ...RATE_LIMITS.combo,
    key: comboHash,
  });
  if (comboExceeded) {
    throw errors.rateLimited("请求过于频繁，请 10 分钟后再试");
  }

  const resendKey = process.env.AUTH_RESEND_KEY;
  const isDevWithoutResend =
    process.env.NODE_ENV !== "production" && !resendKey;

  if (isDevWithoutResend) {
    console.info("[magic-link]", url);
  } else {
    const resend = new Resend(resendKey);
    const html = await render(
      MagicLinkEmail({
        url,
        email,
        expiresInMinutes: MAGIC_LINK_EXPIRES_MINUTES,
      }),
    );

    const { error } = await resend.emails.send({
      from:
        provider.from ??
        process.env.AUTH_EMAIL_FROM ??
        "TZBlog <onboarding@resend.dev>",
      to: email,
      subject: "登录 TZBlog",
      html,
      headers: {
        "X-Entity-Ref-ID": comboHash,
      },
    });

    if (error) {
      throw errors.upstream("邮件发送失败，请稍后再试");
    }
  }

  await Promise.all([
    recordRateLimit({ scope: RATE_LIMITS.email.scope, key: emailHash }),
    recordRateLimit({ scope: RATE_LIMITS.ip.scope, key: ipHash }),
    recordRateLimit({ scope: RATE_LIMITS.combo.scope, key: comboHash }),
  ]);
}
