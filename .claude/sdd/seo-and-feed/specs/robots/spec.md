## PLANNED Requirements

> **Status**: PLANNED — 实现未落地，本 spec 仅作契约占位。对应审计 **H3**。
>
> 实现路径：`src/app/robots.ts`（Next 15 `MetadataRoute.Robots` 文件约定）
> Follow-up 跟踪：`tasks.md §F.6`
>
> Spec IDs: **SPEC-E-R-1**, **SPEC-E-R-2**（"R" 前缀区分本 capability，避免与已落地的 SPEC-E-1..7 冲突）

### Requirement: robots.txt 允许全部 user-agent 抓取站点 [SPEC-E-R-1]

`src/app/robots.ts` SHALL 默认导出一个 sync function 返回 `MetadataRoute.Robots`：

```ts
import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site-meta"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
```

MVP 阶段不区分 user-agent、不设 disallow 路径（admin 路由由 middleware 守护，不依赖 robots.txt 隐藏）。

#### Scenario: robots.txt 内容含通配 allow
- **GIVEN** 部署后访问 `/robots.txt`
- **WHEN** Next 15 框架生成响应
- **THEN** body 含 `User-agent: *`
- **AND** body 含 `Allow: /`

### Requirement: robots.txt 引用 sitemap [SPEC-E-R-2]

robots.txt MUST 在 body 末尾输出 `Sitemap: <absolute-url>` 行，URL 由 `absoluteUrl("/sitemap.xml")` 计算，保证爬虫能发现 sitemap 入口。

#### Scenario: sitemap 引用使用 absolute URL
- **GIVEN** `env.SITE_URL = "https://tzblog.example.com"`
- **WHEN** Next 15 框架生成 `/robots.txt`
- **THEN** body 含 `Sitemap: https://tzblog.example.com/sitemap.xml`

## Notes

- Next 15 的 `MetadataRoute.Robots` 是 dynamic / static 都可（本 spec 选 static — sitemap URL 不随请求变化）
- 若未来需要按 environment 屏蔽抓取（staging 部署），改为 dynamic robots 并读 `process.env.VERCEL_ENV` / 自定义 env 切换 `disallow: "/"`，本 spec 不覆盖该场景
- 与 `sitemap` capability 共享 `absoluteUrl` helper（`src/lib/site-meta.ts`），避免 URL 拼接漂移

## Open Issues

- 整个 capability 未实现。补实现需走完整 TDD 微循环（test/feat 各一提交），见 `tasks.md §F.6`。
