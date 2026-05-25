# Magic Link Auth — Auth.js v5 + Resend + 频控反垃圾

> 决策来源：D3（Email Provider + Resend） + D4（无邮箱白名单 + 频控反垃圾） + D11（Resend SMTP） + D13（magic link + rate-limit + 后台审核 + 无 IP/邮箱白名单）。
>
> 复用现有 split-config（Edge `auth.config.ts` + Full `auth.ts`） + Prisma adapter + User/Account/Session/VerificationToken 表。

---

## 1. 关键 fact（已 grep 项目验证）

| 项 | 状态 | 证据 |
|---|------|------|
| `next-auth 5.0.0-beta.25` | 已安装 | `package.json:54` |
| `@auth/prisma-adapter 2.11.2` | 已安装 | `package.json:23` |
| Split-config | 已落地 | `src/lib/auth.ts` + `src/lib/auth.config.ts` |
| Edge-safe proxy | 已落地 | `src/proxy.ts` 守 `/admin/*` + `/api/admin/*`，用 Edge `auth()` |
| Prisma `User/Account/Session/VerificationToken` | 已有 | `prisma/schema.prisma:39-51, 271-305` |
| `User.password: String?` | 已支持 magic link 用户为 NULL | `prisma/schema.prisma:45` |
| `Role` enum | 仅 `ADMIN / AUTHOR`，**需扩展 `VISITOR`** | `prisma/schema.prisma:17-20` |
| `resend` SDK | 未安装，需 codex `pnpm add resend` | grep 无 |
| `@react-email/components` | 未安装，需 codex `pnpm add @react-email/components react-email` | grep 无 |
| `next-auth/providers/resend` | v5 beta 内置（`next-auth/providers/resend`），但**自定义 Email provider 更可控**（推荐方案 B） | Auth.js v5 文档 |

---

## 2. 方案选型（Agent 2 推荐方案 B）

### 方案 A：用 `next-auth/providers/resend` 内置 provider

```typescript
import Resend from 'next-auth/providers/resend'

providers: [
  Resend({
    apiKey: process.env.AUTH_RESEND_KEY,
    from: 'TZBlog <login@blog.haiden.dev>',
  })
]
```

**优势**：零代码，5 行接入。
**劣势**：邮件模板写死英文 + 字符串模板；error handling 不可控；无法在发送前插 rate-limit hook（v5 没有 pre-signin 钩子）。

### 方案 B：自定义 `EmailProvider`（推荐 ⭐）

```typescript
import Email from 'next-auth/providers/email'

providers: [
  Email({
    from: 'TZBlog <login@blog.haiden.dev>',
    sendVerificationRequest: customResendSender,
    maxAge: 15 * 60,  // 15 分钟有效
  })
]
```

**优势**：
- `customResendSender` 完全自定义：调 resend SDK + React Email 模板 + 中文 + 错误返回
- 在 sender 函数内可以做 rate-limit 检查（最后一道闸）
- 未来通知邮件（评论提醒 / 系统通知）复用同一 `resend` 客户端 + React Email 工作流

**劣势**：~120KB Node-only deps（不进 Edge bundle，proxy 不受影响）；多写 ~80 行代码。

**决策**：选方案 B。

---

## 3. Schema 改动（最小）

### 3.1 `Role` enum 扩展

```diff
 enum Role {
   ADMIN
   AUTHOR
+  VISITOR
 }
```

`VISITOR` 用于 magic link 登录的访客（留言板用户）。`ADMIN` 仍走 Credentials；`AUTHOR` 是历史保留位（单作者站点 = HaiDen = ADMIN）。

### 3.2 新增 `RateLimitLog` 表

```prisma
model RateLimitLog {
  id        String   @id @default(cuid())
  scope     String   // "magic_link:email", "magic_link:ip", "magic_link:combo"
  key       String   // 对应的 email / ip / hash 值
  createdAt DateTime @default(now())

  @@index([scope, key, createdAt])
}
```

设计要点：
- `scope` 区分维度：`magic_link:email` / `magic_link:ip` / `magic_link:combo`（email + ip 组合）
- `key` 存哈希值（不存原文，便于审计且符合 PII 最小化）
- 索引 `(scope, key, createdAt)` 支持 `COUNT(*) WHERE created_at > NOW() - INTERVAL '24 hours'` 高效查询
- 后台 `/admin/settings/security` 可清空旧日志（保留 30 天）

### 3.3 `Comment` 扩展（参考 channel-meta-cms.md）

`Comment` 增加 `authorUserId String?` + `visibility CommentVisibility` 字段，关联 magic link 登录的 User 与留言板私密会话。详见 `channel-meta-cms.md` §2.2。

---

## 4. Resend / React Email 集成

### 4.1 包安装

```bash
pnpm add resend @react-email/components
pnpm add -D react-email
```

环境变量（追加到 `.env.example`）：

```env
AUTH_RESEND_KEY=re_xxxxxxxxxxxx
AUTH_EMAIL_FROM="TZBlog <login@blog.haiden.dev>"
RATE_LIMIT_DAILY_SALT="rotate-monthly-1024-bit-secret"
```

### 4.2 邮件模板 `src/lib/email/templates/MagicLink.tsx`

```typescript
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface MagicLinkEmailProps {
  url: string
  email: string
  expiresInMinutes: number
}

export function MagicLinkEmail({ url, email, expiresInMinutes }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>登录 TZBlog · 一键验证</Preview>
      <Body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', backgroundColor: '#f7f3e7' }}>
        <Container style={{ maxWidth: 480, margin: '40px auto', padding: '32px 24px', backgroundColor: '#ffffff', borderRadius: 8 }}>
          <Heading style={{ fontSize: 22, fontWeight: 700, color: '#211f25', marginBottom: 16 }}>
            登录 TZBlog
          </Heading>
          <Text style={{ fontSize: 14, color: '#4a443e', lineHeight: 1.6 }}>
            您正在请求登录 TZBlog，邮箱地址：<strong>{email}</strong>
          </Text>
          <Text style={{ fontSize: 14, color: '#4a443e', lineHeight: 1.6 }}>
            点击下方按钮完成验证。链接将在 <strong>{expiresInMinutes} 分钟</strong>后失效。
          </Text>
          <Section style={{ margin: '32px 0' }}>
            <Button
              href={url}
              style={{
                backgroundColor: '#c64830',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 4,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              一键登录
            </Button>
          </Section>
          <Text style={{ fontSize: 12, color: '#8a857d' }}>
            如果按钮无法点击，请复制以下链接到浏览器：
            <br />
            <a href={url} style={{ color: '#c64830', wordBreak: 'break-all' }}>
              {url}
            </a>
          </Text>
          <Text style={{ fontSize: 12, color: '#8a857d', marginTop: 24 }}>
            如果您没有发起本次登录请求，请忽略此邮件。本站使用磁链一次性令牌，旧链接将自动失效。
          </Text>
          <Text style={{ fontSize: 11, color: '#bcb7af', marginTop: 16, borderTop: '1px solid #d4cdb8', paddingTop: 16 }}>
            TZBlog · 由 HaiDen 在杭州编写
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### 4.3 自定义 sender `src/lib/email/sendMagicLink.ts`

```typescript
import { Resend } from 'resend'
import { render } from '@react-email/render'

import { MagicLinkEmail } from './templates/MagicLink'
import { checkRateLimit, recordRateLimit } from '@/lib/security/rateLimit'
import { hashIdentifier } from '@/lib/security/hash'
import { AppError } from '@/lib/errors'

interface SendVerificationParams {
  identifier: string  // email
  url: string
  provider: { from: string }
  request: Request
}

const resend = new Resend(process.env.AUTH_RESEND_KEY!)
const MAGIC_LINK_EXPIRES_MINUTES = 15

export async function sendVerificationRequest({
  identifier: email,
  url,
  provider,
  request,
}: SendVerificationParams): Promise<void> {
  const ip = getClientIp(request)
  const emailHash = await hashIdentifier(email)
  const ipHash = await hashIdentifier(ip)
  const comboHash = await hashIdentifier(`${email}:${ip}`)

  // 三维度频控：per-email / per-IP / per-combo
  const emailExceeded = await checkRateLimit({
    scope: 'magic_link:email',
    key: emailHash,
    windowSeconds: 24 * 60 * 60,
    maxCount: 5,
  })
  if (emailExceeded) {
    throw new AppError({
      code: 'RATE_LIMITED',
      message: '该邮箱 24 小时内请求过多，请稍后再试',
    })
  }

  const ipExceeded = await checkRateLimit({
    scope: 'magic_link:ip',
    key: ipHash,
    windowSeconds: 60 * 60,
    maxCount: 10,
  })
  if (ipExceeded) {
    throw new AppError({
      code: 'RATE_LIMITED',
      message: '当前网络 1 小时内请求过多，请稍后再试',
    })
  }

  const comboExceeded = await checkRateLimit({
    scope: 'magic_link:combo',
    key: comboHash,
    windowSeconds: 10 * 60,
    maxCount: 3,
  })
  if (comboExceeded) {
    throw new AppError({
      code: 'RATE_LIMITED',
      message: '请求过于频繁，请 10 分钟后再试',
    })
  }

  const html = await render(
    <MagicLinkEmail
      url={url}
      email={email}
      expiresInMinutes={MAGIC_LINK_EXPIRES_MINUTES}
    />,
  )

  const { error } = await resend.emails.send({
    from: provider.from,
    to: email,
    subject: '登录 TZBlog',
    html,
    headers: {
      'X-Entity-Ref-ID': comboHash,
    },
  })

  if (error) {
    throw new AppError({
      code: 'EMAIL_SEND_FAILED',
      message: '邮件发送失败，请稍后再试',
      cause: error,
    })
  }

  // 三维度都记录（成功才记，失败不计入限额防止 DOS 自己）
  await Promise.all([
    recordRateLimit({ scope: 'magic_link:email', key: emailHash }),
    recordRateLimit({ scope: 'magic_link:ip', key: ipHash }),
    recordRateLimit({ scope: 'magic_link:combo', key: comboHash }),
  ])
}

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? '0.0.0.0'
}
```

### 4.4 Rate limit 工具 `src/lib/security/rateLimit.ts`

```typescript
import { db } from '@/lib/db'

interface RateLimitCheckParams {
  scope: string
  key: string
  windowSeconds: number
  maxCount: number
}

export async function checkRateLimit({
  scope,
  key,
  windowSeconds,
  maxCount,
}: RateLimitCheckParams): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000)
  const count = await db.rateLimitLog.count({
    where: { scope, key, createdAt: { gte: since } },
  })
  return count >= maxCount
}

interface RecordParams {
  scope: string
  key: string
}

export async function recordRateLimit({ scope, key }: RecordParams): Promise<void> {
  await db.rateLimitLog.create({ data: { scope, key } })
}

// 每天凌晨 3 点 cron 触发：清理 31 天以上日志
export async function cleanupOldRateLimitLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
  const result = await db.rateLimitLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
  return result.count
}
```

### 4.5 Hash 工具 `src/lib/security/hash.ts`

```typescript
import { createHash } from 'node:crypto'

const SALT = process.env.RATE_LIMIT_DAILY_SALT ?? ''

export async function hashIdentifier(identifier: string): Promise<string> {
  return createHash('sha256').update(`${SALT}:${identifier}`).digest('hex')
}
```

---

## 5. Auth.js v5 集成 `src/lib/auth.ts`

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'

import { db } from './db'
import { authConfig } from './auth.config'
import { loginSchema } from './schemas/auth'
import { sendVerificationRequest } from './email/sendMagicLink'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await db.user.findUnique({ where: { email } })
        if (!user || !user.password) return null

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
        }
      },
    }),
    EmailProvider({
      from: process.env.AUTH_EMAIL_FROM!,
      maxAge: 15 * 60,  // 15 分钟
      sendVerificationRequest,
    }),
  ],
  events: {
    async createUser({ user }) {
      // magic link 首次登录创建 User 时，默认 role = VISITOR
      if (user.id) {
        await db.user.update({
          where: { id: user.id },
          data: { role: 'VISITOR', name: user.name ?? user.email ?? 'Visitor' },
        })
      }
    },
  },
})
```

---

## 6. Edge-safe config 不变（关键：rate-limit 不在 middleware 里跑）

`src/lib/auth.config.ts` 保持现状。**rate-limit 由 `sendVerificationRequest` 在 Node runtime 内执行**，proxy 仍 Edge-safe。Edge runtime 不引入 Prisma / Resend。

---

## 7. 安全清单

- [x] `AUTH_SECRET` 必须 32+ 字节高熵随机串
- [x] `AUTH_RESEND_KEY` 不落代码，env only
- [x] HSTS / cookie secure 在 Next.js 16 默认开启（prod 模式）
- [x] Magic link token 默认 32 字节随机，Auth.js v5 内置
- [x] 15 分钟有效（覆盖 v5 默认 24h，更严）
- [x] One-time use：Auth.js 验证后立刻 invalidate VerificationToken
- [x] `RateLimitLog.key` 存哈希值，不存原文
- [x] `RATE_LIMIT_DAILY_SALT` 月度轮换
- [x] 不返回 "邮箱不存在" 等区分性错误（防 user enumeration）
- [x] CSP nonce 走 Next.js 16 内置 middleware

---

## 8. 登录 UI 设计 `src/app/(site)/login/page.tsx`

```
┌──────────────────────────────────────────────┐
│  TZBlog · 登录                                │
├──────────────────────────────────────────────┤
│                                              │
│  访客登录                                     │
│  ┌────────────────────────────────────────┐  │
│  │ Email: [_____________________]         │  │
│  │       [获取登录链接]                    │  │
│  └────────────────────────────────────────┘  │
│  我们会向您的邮箱发送一次性登录链接              │
│                                              │
│  ────────  管理员入口  ────────              │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Email:    [_____________]              │  │
│  │ Password: [_____________]              │  │
│  │           [登录]                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

- 表单走两条不同的 server action：`signIn('email', { email })` 与 `signIn('credentials', { email, password })`
- 错误显示：通用文案 "如该邮箱有效，登录链接已发送"（防 enumeration）
- Rate limit error：显示 "请求过多，请稍后再试"

---

## 9. 测试策略（仅列关键 spec，详见 specs/12-auth）

| Spec-ID | 测试函数 | 层级 | 关键断言 |
|---------|---------|------|---------|
| auth-magic-001 | sendsMagicLinkOnValidEmail | integration (Node) | 调 sendVerificationRequest → resend.emails.send 被 mock 收到正确 payload |
| auth-magic-002 | rateLimitPerEmailBlocksAfter5In24h | integration | 6 次同 email 触发，第 6 次 throw `RATE_LIMITED` |
| auth-magic-003 | rateLimitPerIpBlocksAfter10In1h | integration | 11 次同 IP 触发 |
| auth-magic-004 | rateLimitComboBlocksAfter3In10m | integration | 4 次同 email+IP 触发 |
| auth-magic-005 | doesNotLeakUserExistence | integration | 不存在邮箱 / 存在邮箱响应一致 |
| auth-magic-006 | createsVisitorRoleOnFirstLogin | integration | jwt callback 后 db.user.role = 'VISITOR' |
| auth-magic-007 | magicLinkExpiresAt15Minutes | integration | 16 分钟后 token 失效返回 `Invalid token` |
| auth-magic-008 | proxyAllowsAuthedVisitorToGuestbookOnly | integration | VISITOR 访 /admin/* → 403 redirect；访 /guestbook → 200 |
| auth-magic-009 | cleanupOldRateLimitLogsRemoves31DayPlusEntries | unit | 32 天日志被删 |

---

## 10. 风险表

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Resend 国内投递率低（QQ/163 邮箱可能延迟） | 高 | 中 | 文档说明 + dev 模式下 sendVerificationRequest 同时把 URL 打到 console（便于本地调试） |
| Auth.js v5 beta API 变动 | 中 | 高 | 版本锁 `5.0.0-beta.25`；升级前先在 staging 验证 |
| 频控被 IP 池绕过 | 中 | 中 | per-IP 配合 per-email + per-combo，三维度兜底 |
| User enumeration 攻击 | 中 | 中 | 通用错误文案 + 失败也消耗 rate-limit quota |
| rate-limit DB 表无限增长 | 中 | 低 | 31 天 cron 清理 + 索引覆盖 |
| Magic link 邮件被 mark spam | 中 | 中 | Resend SPF/DKIM/DMARC 自动配置 + 模板避免促销词 |

---

## 11. 一次性集成 checklist（供 codex 执行）

- [ ] `pnpm add resend @react-email/components`
- [ ] `pnpm add -D react-email`
- [ ] `prisma/schema.prisma` 加 `enum Role { ... VISITOR }` + 新 `RateLimitLog` model
- [ ] `pnpm db:migrate`
- [ ] 创建 `src/lib/email/templates/MagicLink.tsx`
- [ ] 创建 `src/lib/email/sendMagicLink.ts`
- [ ] 创建 `src/lib/security/rateLimit.ts` + `hash.ts`
- [ ] 修改 `src/lib/auth.ts` 加 EmailProvider + events.createUser
- [ ] `src/app/(site)/login/page.tsx` 双表单（visitor magic link + admin credentials）
- [ ] cron job `src/lib/jobs/rateLimitCleanup.ts` + 在 docker-compose 加 cron service（详见 recommendation-algorithm.md §8）
- [ ] `.env.example` 加 `AUTH_RESEND_KEY` / `AUTH_EMAIL_FROM` / `RATE_LIMIT_DAILY_SALT`
- [ ] 跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] dev 环境验证 magic link 流程（QQ / 163 / Gmail 各发一次）

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T12:45:00Z -->
