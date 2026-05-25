# Tasks — M1-M5 微循环结构

> 1 spec = 1 微循环（[TEST-RED] + [IMPL-GREEN] 两提交），scope = `<capability>`。
> 强制：未带 `[no-tdd]` 的 `feat:` commit 前 5 个 commit 必须有同 scope 的 `test:`（husky hook 守门）。

---

## M1 · Schema + Migration (5 天)

scope: `schema` / `migration` / `cleanup-prep`

### 1. schema 微循环（10 spec × 2 提交 = 20）

每条 spec 一组：
- `1.x.a [TEST-RED] schema-00x`
- `1.x.b [IMPL-GREEN] schema-00x`

执行顺序：schema-001 → 010（按 capability 表）。

### 2. migration 微循环（10 spec × 2 = 20）

- mig-001 ~ mig-010 顺序执行
- 注意：mig-001（drop 旧表）**已预授权**（详见 codex-handoff.md §0/§5）

### 3. 顺序固定不交叉

```
schema-001 RED → schema-001 GREEN → schema-002 RED → ... → schema-010 GREEN
                                  ↓
mig-001 RED → mig-001 GREEN (含 prisma migrate reset) → ... → mig-010 GREEN
                                  ↓
cleanup-prep (删 prisma schema.prisma 中旧 model 定义) [no-tdd]
```

### M1 Gate（自动推进，无人工 checkpoint）

- [ ] `pnpm prisma migrate reset --force` 跑通
- [ ] `pnpm db:seed` 完整 showcase 数据
- [ ] schema + migration 全 spec 通过
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 全绿
- [ ] `git tag m1-schema-migration-complete`
- [ ] 自动进 M2

---

## M2 · Admin CMS + Editor (6 天)

scope: `editor-milkdown` / `admin-channel` / `admin-entry`

### 1. Editor Gate-A 任务（一次性）[no-tdd]

```
2.1.a [TEST-RED] N/A
2.1.b [IMPL-GREEN no-tdd] pnpm add 所有 @milkdown/* 包；删除 @blocknote/* @codemirror/*
2.1.c [VERIFY] pnpm build 报告 admin route bundle delta ≤ 250kb
```

### 2. Editor 微循环（18 spec × 2 = 36）

执行：
- editor-001 ~ 009 (round-trip 9 spec) 优先做完，决定 Gate B pass/fail
- 如 editor-008（inline HTML）失败 → STOP，向 HaiDen 报告，升级 explore 重选编辑器
- editor-010 ~ 018 后续

### 3. Admin Channel CRUD 微循环（15 spec × 2 = 30）

ach-001 ~ ach-015 顺序

### 4. Admin Entry Editor 微循环（15 spec × 2 = 30）

ee-001 ~ ee-015 顺序，依赖 Editor Gate B 通过

### M2 Gate（自动推进）

- [ ] Editor Gate B（8 fixture round-trip） 全 pass 或按 codex-handoff §4.2 自动 fallback
- [ ] Admin Channel CRUD 工作
- [ ] Admin Entry Editor 集成 Milkdown 可用
- [ ] `pnpm test` 全绿
- [ ] `git tag m2-editor-admin-complete`
- [ ] 自动进 M3

---

## M3 · Theme System (4 天)

scope: `theme-tokens` / `public-shell`

### 1. Theme tokens 微循环（14 spec × 2 = 28）

theme-001 ~ theme-014 顺序

依赖：先替换 `globals.css` 为 `theme-token-strategy.md` §3 草案 → 再写测试

### 2. Public shell 微循环（10 spec × 2 = 20）

shell-001 ~ shell-010 顺序

### M3 Gate（自动推进）

- [ ] 三皮 token 工作
- [ ] 路由级硬映射验证
- [ ] shadcn 组件三皮兼容
- [ ] 截图对比 demo-front 还原 ≥ 90%（codex 截 screenshot 后用 visual diff 自动评分）
- [ ] `git tag m3-theme-system-complete`
- [ ] 自动进 M4

---

## M4 · Public UI (6 天)

scope: `home` / `channel-pages` / `entry-detail` / `reading-mode` / `terminal-stream`

### 1. Home composition（10 spec × 2 = 20）

home-001 ~ home-010

### 2. Channel pages（15 spec × 2 = 30）

chl-001 ~ chl-015，按 layout 分组：CHRONICLE → CARDS → TIMELINE → GREP → FEED

### 3. Entry detail（20 spec × 2 = 40）

ed-001 ~ ed-020，按路由层 → 渲染装饰 → 互动 → 下一篇 分阶段

### 4. Reading mode（12 spec × 2 = 24）

read-001 ~ read-012

### 5. Terminal stream（10 spec × 2 = 20）

term-001 ~ term-010

### M4 Gate（自动推进）

- [x] 前台所有路由可访问
- [x] 5 个 layout 工作
- [x] 三皮在对应路由生效
- [x] Lighthouse mobile ≥ 85
- [x] `git tag m4-public-ui-complete`
- [ ] 自动进 M5

---

## M5 · Auth + Guestbook + 推荐 + Cleanup (4 天)

scope: `auth-magic-link` / `guestbook` / `recommendation` / `cleanup`

### 1. Auth magic link（13 spec × 2 = 26）

auth-magic-001 ~ auth-magic-013

### 2. Guestbook（11 spec × 2 = 22）

gb-001 ~ gb-011

### 3. Recommendation（18 spec × 2 = 36）

trend-001 ~ trend-007 + next-001 ~ next-008 + cron-001 ~ cron-003

### 4. Cleanup（14 spec × 2 = 28）

clean-001 ~ clean-014（最后一道闸）

### M5 Gate（自动推进）

- [ ] 全部 215 spec 通过（或 KNOWN-DEVIATIONS.md 记录跳过）
- [ ] grep guard 0 命中
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` 全绿
- [ ] `git tag m5-auth-guestbook-recommendation-complete`
- [ ] 自动进入 codex-handoff.md §8 完工流程

---

## 总览（commit 数预估）

| Milestone | RED commits | GREEN commits | no-tdd commits | Total |
|-----------|------------|--------------|----------------|-------|
| M1 | 20 | 20 | 1-2 | ~42 |
| M2 | 48 | 48 | 1-2 | ~98 |
| M3 | 24 | 24 | 1-2 | ~50 |
| M4 | 67 | 67 | 1-2 | ~136 |
| M5 | 56 | 56 | 1-2 | ~114 |
| **Total** | **215** | **215** | **5-10** | **~440 commits** |

每 commit 平均 5-30 行代码改动，平均 2-5 分钟。每 milestone 检查点强制 ha1den 人工 review。

---

## 微循环执行模板（codex 必看）

```
[轮 N] 写 spec X 微循环

1. 写测试：
   - 在 test file 创建测试函数 X
   - 执行 `pnpm vitest run --filter <test-file>`
   - **必须**看到 FAIL 输出（含 stack trace），否则违规
   - git commit -m "test(<scope>): X" -m "RED: <PASTE FAIL OUTPUT>"

2. 写实现：
   - 编辑 impl file 让测试通过
   - 执行 `pnpm vitest run --filter <test-file>`
   - **必须**看到 PASS 输出
   - git commit -m "feat(<scope>): X" -m "GREEN: <PASTE PASS OUTPUT>"

3. （可选）refactor：
   - 重构 impl，不改测试
   - 重跑测试确认仍 PASS
   - git commit -m "refactor(<scope>): X improvements"
```

NO-TDD 例外（cleanup）：

```
git commit -m "chore(cleanup): drop @blocknote deps [no-tdd]"
```

仅限：纯样式 / 文档 / pure deps 操作。重构 / 配置变更 / 依赖增减不在范围。

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T14:00:00Z -->
