# Spec 12 · Auth Magic Link

> Auth.js v5 Email Provider + Resend SDK + React Email 模板 + 三维度频控。
>
> Reference: `magic-link-auth.md` 全文

---

## Intent

为留言板访客提供邮箱 magic link 登录。管理员沿用 Credentials provider。一次性 token 15 分钟有效，三维频控（per-email/per-ip/per-combo），通用错误文案防 user enumeration。

---

## Specs

完整 9 个 spec 见 `magic-link-auth.md` §9。摘要：

| Spec-ID | 核心断言 |
|---------|---------|
| auth-magic-001 | sendsMagicLinkOnValidEmail：resend.emails.send 被 mock 收到中文 HTML payload |
| auth-magic-002 | rateLimitPerEmailBlocksAfter5In24h |
| auth-magic-003 | rateLimitPerIpBlocksAfter10In1h |
| auth-magic-004 | rateLimitComboBlocksAfter3In10m |
| auth-magic-005 | doesNotLeakUserExistence：不存在 / 存在 邮箱响应一致 |
| auth-magic-006 | createsVisitorRoleOnFirstLogin：jwt callback 后 db.user.role = 'VISITOR' |
| auth-magic-007 | magicLinkExpiresAt15Minutes |
| auth-magic-008 | proxyAllowsAuthedVisitorToGuestbookOnly：VISITOR 访 `/admin/*` → 403；访 `/guestbook` → 200 |
| auth-magic-009 | cleanupOldRateLimitLogsRemoves31DayPlusEntries |

新增（UI 层）：

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| auth-magic-010 | `/login` 页面 | 渲染 | 含「访客登录」+「管理员入口」双表单 |
| auth-magic-011 | 访客填 email + submit | 提交 | 调 `signIn('email', { email })`，显示「如该邮箱有效，登录链接已发送」 |
| auth-magic-012 | rate limit 触发 | 提交 | 显示通用「请求过多，请稍后再试」 |
| auth-magic-013 | dev mode + 没配 RESEND_KEY | 触发 sendMagicLink | URL 输出到 console，不实际发邮件 |

---

## Test File 映射

- `src/lib/email/sendMagicLink.test.ts` → 001 ~ 005, 007, 013
- `src/lib/security/rateLimit.test.ts` → 002 ~ 004, 009
- `src/lib/auth.test.ts` → 006
- `src/proxy.test.ts` → 008
- `src/app/(site)/login/page.test.tsx` → 010 ~ 012

---

## Acceptance

- [ ] auth-magic-001 ~ 013 全部 pass
- [ ] dev 环境验证：填 QQ/163/Gmail 邮箱发 magic link（人工 smoke）
- [ ] Production：DNS SPF/DKIM/DMARC 在 Resend 后台配齐
- [ ] Cron service 启动后 `rate_limit_logs` 表 31 天后被清理

---

## Don't

- 不暴露 user enumeration（错误文案统一）
- 不让 magic link token 复用
- 不在 middleware (Edge) 做 rate-limit
- 不实现"记住设备"功能（每次都需要新链接）

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:35:00Z -->
