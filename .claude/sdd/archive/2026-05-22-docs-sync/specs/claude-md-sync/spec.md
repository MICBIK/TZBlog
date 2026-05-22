# specs/claude-md-sync — CLAUDE.md R1 同步

> spec-id 前缀：`SPEC-DS-MD`
> 验证方式：grep before/after

## SPEC-DS-MD-1 — 同步 R1 决策（点赞永久 unique）

### Background

`CLAUDE.md` 第 84 行（在 **反垃圾** 段）：

```markdown
- 点赞：同访客 + 同文章 24h 内一次
```

R1 决策（comments-and-likes SDD 锁定）：点赞改为**永久 unique**（一次只能赞一次，不限时间窗口）。

#### 证据链

| 证据 | 出处 | 说明 |
|------|------|------|
| schema unique 约束 | `prisma/schema.prisma:210` | `@@unique([postId, visitorHash])` — 无时间字段 |
| service 实现 | `src/lib/services/likes.ts` `addLike` | P2002 fault tolerant，不限时间 |
| activeContext 记录 | `memory-bank/activeContext.md` | "R1 永久 unique 点赞" |
| progress.md 记录 | `memory-bank/progress.md:107` | "决策记录：R1 永久 unique 点赞" |

R1 与现存 CLAUDE.md 第 84 行的"24h 滚动"描述**直接冲突**。

### GIVEN / WHEN / THEN

```gherkin
GIVEN CLAUDE.md line 84 currently reads:
  "- 点赞：同访客 + 同文章 24h 内一次"

WHEN executing this spec

THEN line 84 must be replaced with:
  "- 点赞：同访客 + 同文章 永久 unique（一次）"

AND grep validation passes (before):
  grep -n "24h" CLAUDE.md
  # expected: 1 hit (or more), at least one on line 84 with "点赞" context

AND grep validation passes (after):
  grep -n "24h" CLAUDE.md
  # expected: 0 hits matching the 点赞 context (line 84 no longer contains "24h")
  grep -n "永久 unique" CLAUDE.md
  # expected: ≥1 hit, including line 84

AND no other line in CLAUDE.md is modified
```

### Acceptance

- 行 84 文本完全替换
- 行号可能因前后不变而保持 84，也允许保持
- git diff 仅 1 行 changed

---

## R6 在 CLAUDE.md 不需要修改（confirmed）

第一波 agent grep 已确认：

```bash
grep -ni "PENDING" CLAUDE.md
# 0 hits

grep -ni "commentCount 计 PENDING" CLAUDE.md
# 0 hits
```

R6 决策（commentCount 仅计 APPROVED）在 CLAUDE.md 中**没有对应的 stale 行**。R6 修正完全在 service 代码 + SDD archive 中体现，无需文档 sync。

**implications**：实施 AI 不需要为 R6 在 CLAUDE.md 做任何修改。如果 grep 显示有 "PENDING" / "commentCount" 字符串出现，触发 R2（stop + report）。

---

## 安全网（R2 决策）

如果实施 AI 在执行此 spec 之前 grep CLAUDE.md 发现**其他**与 R1/R6 相关的 stale 内容（例如评论流程描述、点赞 UI 描述等）：

- **STOP** — 不要扩大 scope
- 写一份 `additional-stale-items.md` 到 `.claude/sdd/docs-sync/`
- 在 completion-report.md 中标注
- 不修改这些 extra 行
