# Spec 07 · Entry Detail

> 通用 Entry 详情页 + 按 kind 渲染装饰 + 评论 + 下一篇推荐。
>
> Reference: `channel-meta-cms.md` §5 / `design-notes.md` A10 / `recommendation-algorithm.md` §5-7

---

## Specs

### 路由层

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| ed-001 | seeded Entry kind=ARTICLE slug=`why-i-rewrote` | 访问 `/posts/why-i-rewrote` | 200，渲染 ARTICLE 详情，主题 Ink |
| ed-002 | seeded Entry kind=NOTE | 访问 `/posts/<slug>` | 404（仅 ARTICLE 命中 `/posts/`） |
| ed-003 | seeded Entry kind=ARTICLE | 访问 `/c/articles/why-i-rewrote` | 301 → `/posts/why-i-rewrote` |
| ed-004 | seeded Entry kind=LINK | 访问 `/c/stream/link-postgres-locks` | 200，渲染 LINK 卡片样式 |
| ed-005 | seeded Entry kind=GUESTBOOK_THREAD | 访问 `/c/guestbook/<slug>` | 404（GUESTBOOK 不通过 /c/ 暴露） |

### 渲染装饰

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| ed-006 | Entry kind=ARTICLE | 渲染 | 含 TOC 侧栏 + 阅读分钟 + Shiki 代码高亮 + GH alert 渲染 |
| ed-007 | Entry kind=NOTE | 渲染 | 无 TOC，prose 渲染 |
| ed-008 | Entry kind=LINK | 渲染 | source 卡片在顶部 + 摘要 body 在下 |
| ed-009 | Entry kind=QUOTE | 渲染 | 大引号 + author + source 链接 |
| ed-010 | Entry kind=REVIEW | 渲染 | rating 星 + cover + external link + body |
| ed-011 | Entry kind=HOT_TAKE | 渲染 | source platform 标识 + sourceSnippet 引用 + body |
| ed-012 | Entry kind=JOKE | 渲染 | 简洁 prose |

### 互动

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| ed-013 | 已发布 Entry | 第一次访问（独立 visitorHash + dayKey） | viewCount +1，写入 EntryView |
| ed-014 | 同访客同天再访问 | 触发 | viewCount 不变（unique constraint） |
| ed-015 | 点击点赞按钮 | 触发 | likeCount +1，写入 EntryLike；按钮变高亮；再点 → 取消（-1） |
| ed-016 | 评论表单提交 | 触发 | POST `/api/comments`，状态 PENDING，等审核 |
| ed-017 | 已审核评论列表 | 渲染 | 倒序显示 + 用户名 + 时间 + 内容 |

### 下一篇推荐

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| ed-018 | Entry 属于 Series | 渲染底部下一篇 | 显示 "系列下一篇 · 第 N 章" + 链接 |
| ed-019 | Entry 不属于 Series 但有 similar tags | 渲染 | 显示 "你可能感兴趣" + 链接 |
| ed-020 | Entry 无 series 无 similar | 渲染 | 显示 "近期文章" + 链接（同 channel 最新） |

---

## Test File

- `src/app/(site)/posts/[slug]/page.test.tsx` → ed-001 ~ ed-006
- `src/app/(site)/c/[slug]/[entry-slug]/page.test.tsx` → ed-002 ~ ed-005
- `src/components/site/EntryDetail.test.tsx` → ed-006 ~ ed-012
- `src/app/api/entries/[id]/view/route.test.ts` → ed-013, ed-014
- `src/app/api/entries/[id]/like/route.test.ts` → ed-015
- `src/components/site/NextEntry.test.tsx` → ed-018 ~ ed-020

---

## Acceptance

- [x] 20 spec 全 pass
- [x] smoke 截图已生成（`smoke/m4-public-ui/entry-*`），待人工对比 ≥ 90%

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
