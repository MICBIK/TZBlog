# prelaunch-readiness proposal

## Intent

把上线前已经识别出的技术债、文档债、展示内容缺口和 V2/V3 后续路线收敛为可验证的 readiness pass。目标不是一次性实现完整 V2/V3，而是让当前项目状态达到可继续部署和公开展示的基线，并把后续大功能拆成明确 backlog。

## Scope

Must:
- 移除 Next.js 16 `middleware.ts` deprecated warning，迁移到 `src/proxy.ts`。
- 移除 Prisma `driverAdapters` preview warning。
- 同步项目文档和展示里的真实技术栈、编辑器形态、路由守卫入口和完成状态。
- 替换 About 页 pre-launch placeholder 文案。
- 修正 `memory-bank` 中已过期的技术债和 P2/P4 状态。
- 把 V2/V3 从一句话愿望清单整理成可跟进 backlog。

Should:
- 增加 docs sanity 测试，防止 README / AGENTS / memory-bank 再出现明显过期状态。
- 保留当前已存在的用户工作流文件改动，不重置、不覆盖。

Won't:
- 不在本轮实现完整主题 GUI、详细 Analytics、邮件通知、编辑器增强或 `/en` 多语言。
- 不执行真实 VPS 部署或 DNS 配置。
- 不引入新依赖。

## Approach

1. 先补 `.claude/sdd/prelaunch-readiness/` specs 和 test-map。
2. 对非纯文档行为变更走 RED/GREEN：
   - proxy 入口迁移测试。
   - Prisma schema preview flag 测试。
   - TechStack 展示技术栈测试。
   - About placeholder 清理测试。
3. 文档和 memory-bank 属于 NO-TDD 范围，但仍通过 `tests/docs-sanity.test.ts` 做 sanity guard。
4. 最后跑 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`，确认 warning 缩减和质量门。

## Risks

- `CLAUDE.md` 当前已有未提交工作流改动，本轮只做必要的精准行修改，避免覆盖。
- Next proxy 迁移如果同时保留 `src/middleware.ts` 会让 Next build 报双入口冲突，因此必须删除旧入口文件。
- About 文案属于个人展示内容，当前先写可上线的工程向文案，后续用户可继续精修口吻。

