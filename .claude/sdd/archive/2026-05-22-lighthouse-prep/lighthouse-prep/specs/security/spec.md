# specs/security — security headers

> spec-id 前缀：`SPEC-LH-H`

## SPEC-LH-H-1 — next.config.ts emits security headers

```gherkin
GIVEN next.config.ts has headers() async function

WHEN Next.js serves any response

THEN response includes:
  - Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()

Test (integration via Next.js dev server OR unit by parsing next.config):
  - prefer integration: GET / and inspect headers
  - fallback: parse next.config.ts AST for header key presence
```

## SPEC-LH-H-2 — CSP report-only

```gherkin
GIVEN next.config.ts headers()

THEN response includes:
  - Content-Security-Policy-Report-Only: <policy>

WHERE policy at minimum:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';  // 'unsafe-inline' 是 Next.js dev / Tiptap 兼容；可上线后 nonce 升级
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;  // MinIO 通过 https; data: 给 Tiptap base64
  font-src 'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';

AND uses Report-Only header (NOT enforce) to allow safe rollout
```

## next.config.ts headers() skeleton

```ts
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/(.*)", headers: SECURITY_HEADERS },
    ]
  },
  // ... existing config
}
```

## CSP enforce switching plan (record in handoff)

handoff.md 必须含：
> ⚠️ Post-launch: after 1 week of monitoring CSP Report-Only logs (browser DevTools / endpoint), confirm no false positives, then change `Content-Security-Policy-Report-Only` to `Content-Security-Policy` to enforce.
