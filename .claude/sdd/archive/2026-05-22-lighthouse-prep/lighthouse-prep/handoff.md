# Handoff — lighthouse-prep

> 你（接收 AI）正在执行 TZBlog 的 lighthouse-prep SDD。预计 1 天（T3）。
> **这是 pre-deploy 最后一个 SDD**。完成后 ha1den 接 audit + 上线。

## 30 秒概览

加 sitemap / robots / manifest / icon + 补全 root metadata + 加 security headers（CSP Report-Only） + perf audit（img dims / Tiptap 隔离 / font swap） + a11y audit（axe）+ 手工跑 Lighthouse 记录 baseline。

## 阅读顺序

1. master.md / handoff-guide.md / design-system.md / known-findings.md
2. `.claude/sdd/lighthouse-prep/proposal.md`
3. `.claude/sdd/lighthouse-prep/specs/{seo-assets,metadata,security,perf,a11y}/spec.md`
4. `.claude/sdd/lighthouse-prep/test-map.md`
5. `.claude/sdd/lighthouse-prep/design-notes.md` — sitemap/robots/manifest 完整 skeleton + Lighthouse 跑法 + baseline.md template
6. `.claude/sdd/lighthouse-prep/tasks.md`

## 依赖

- 所有前置 SDDs 完成（hero-editorial / tech-stack / github-card / about / tags / analytics-dashboard / readme-and-docs）
- env.ts 改：加 `NEXT_PUBLIC_SITE_URL`
- 现有 next.config.ts
- 现有 src/app/layout.tsx

## 执行总览

```
§A seo-assets (scope seo-assets)        - 2 commits
§B metadata (scope seo-metadata)        - 2 commits
§C security (scope security-headers)    - 2 commits
§D perf-audit (scope perf-audit)        - 2 commits
§E a11y-audit (scope a11y-audit)        - 2 commits
§F lighthouse-baseline (NO-TDD docs)    - 1 commit
```

11 commits 总。

## ⚠️ 必须 ASK ha1den 的事

1. **装 jest-axe 是否同意**？(~50KB devDep)
   - 同意 → 用 jest-axe + toHaveNoViolations
   - 不同意 → fallback 手动 a11y 断言 + completion-report 标 deferred
2. **NEXT_PUBLIC_SITE_URL 在 .env 是否已设**？若否，提醒上线前必须设
3. **og-default.png 是否需要 ha1den 提供**？MVP 用 placeholder（提醒后期替）

## 关键约束

- **CSP 必须 Report-Only** at launch (R2) — handoff 含切 enforce 计划
- **不装 PWA SW** (R7)
- **不阻塞上线** — Lighthouse < 90 写 backlog 不卡上线 (R8)
- **fallback 路径** — jest-axe 不装就手动断言
- **不改外观** — perf/a11y 修复仅技术性，不动设计
- **`--no-verify` 禁止**

## CSP 详查

specs/security/spec.md 含完整 CSP 字串。注意：
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — Next dev + Tiptap 需要
- `style-src 'self' 'unsafe-inline'` — Tailwind / Tiptap
- `img-src 'self' data: https: blob:` — MinIO origins + Tiptap base64
- `frame-ancestors 'none'`

上线后 1 周观察 violation 报告再切 enforce。**这一步 ha1den 后续做**，handoff 写清。

## env 改动

需在 `src/lib/env.ts` schema 加：
```ts
NEXT_PUBLIC_SITE_URL: z.string().url().optional()
```
build 时 NEXT_PUBLIC_ 前缀的变量必须在 build 时可见（写入 .env / build env）。

## perf audit grep 命令

```bash
# img missing dimensions
grep -rn "<img" src/ --include="*.tsx" | grep -v "width="

# Tiptap leaks to site
grep -rn "@tiptap" src/components/site/ src/app/\(site\)/

# Font display
grep -n "display" src/app/layout.tsx
```

## Lighthouse 跑法（completion-report 必须含）

```bash
pnpm build
pnpm start &
sleep 5
pnpm dlx lighthouse http://localhost:3000 --output=html --output-path=tests/lighthouse-baseline.html --chrome-flags="--headless"
```

填 `tests/lighthouse-baseline.md` 模板（design-notes 含）。

## 禁止事项

| 禁止 | 为什么 |
|------|-------|
| 装 next-pwa / SW | R7 |
| 接 lighthouse-ci action | 增量 |
| CSP enforce at launch | R2 Report-Only |
| 改外观以提分 | 不动设计 |
| 删 'unsafe-inline' from CSP | Tiptap 需要 |
| 强制要求 ≥ 90 才能上线 | 写 backlog 不阻塞 (R8) |
| `--no-verify` | 违反 |

## 完成后输出

`.claude/sdd/lighthouse-prep/completion-report.md` 必须含：
1. 11 commits hash
2. test counts (含 a11y test 数 + 是否走 jest-axe / fallback)
3. Lighthouse 4 维分数 + CWV 数字
4. axe 违规数（critical / serious）
5. **post-launch CSP 切换计划**：明文写"上线 1 周后改 Report-Only 为 enforce"
6. **post-launch og-default.png 替换提醒**
7. 待改 backlog（如有 < 90 项）

## TL;DR

```
读 SDD → ASK ha1den (jest-axe?) →
§A seo-assets RED+GREEN →
§B metadata RED+GREEN →
§C security RED+GREEN →
§D perf-audit RED+GREEN →
§E a11y-audit RED+GREEN →
§F lighthouse baseline docs commit →
全套质量门 → completion-report → 停。
```

收工。**ha1den 接 audit + 上线**。
