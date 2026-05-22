# specs/integration — GithubCard 接入 homepage

> spec-id 前缀：`SPEC-GC-I`

## SPEC-GC-I-1 — homepage renders GithubCard

```gherkin
GIVEN homepage src/app/(site)/page.tsx renders Hero / TechStack / Recent Posts / Site Stats

WHEN this spec executes

THEN page.tsx imports GithubCard:
  import { GithubCard } from "@/components/site/GithubCard"

AND renders <GithubCard /> at appropriate location (recommend: between TechStack and Recent Posts, OR after Site Stats)

AND existing sections continue to function

Test in src/app/(site)/page.test.tsx:
  - mock getGithubData service to return ok state
  - render(await HomePage())
  - expect getByText("GITHUB · DEVELOPMENT") visible
  - expect existing TechStack/Recent Posts assertions still pass
```

## Position recommendation

After TechStack, before Recent Posts:

```
Hero (HeroEditorial)
TechStack
GithubCard  ← here
Recent Posts
Site Stats
```

Rationale: tech-stack 介绍栈，github 介绍人和活动，自然过渡。

## Cache priming

GithubCard 是 async RSC，调用 getGithubData，触发 GitHub API fetch。第一次 cold render 慢 ~500ms-2s（3 endpoints parallel）。

ISR cache hit 后 < 50ms。

设计建议在 design-notes：
- ha1den 上线前 warm cache：访问 / 一次让 fetch 跑完
- OR 在 prebuild 阶段 fetch（next.config 可配但 MVP 不必）
