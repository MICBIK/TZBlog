# Spec 10 · Admin Channel CRUD

> 后台 `/admin/channels` Channel 增删改 + order swap + kind/layout 联动表单。
>
> Reference: `channel-meta-cms.md` §8 / `design-notes.md` Q4 + A1 + A2

---

## Specs

### 列表 `/admin/channels`

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| ach-001 | admin 已登录 | 访问 `/admin/channels` | 200，渲染 Channel 列表（order / slug / kind / layout / entry count / enabled toggle） |
| ach-002 | Channel 列表项 | 点击 ↑ | server action 触发 order swap，列表立即重排 |
| ach-003 | Channel 列表项 | 点击 enabled toggle | server action 触发 UPDATE enabled |
| ach-004 | Channel 列表项 | 点击行 | 跳 `/admin/channels/<id>/edit` |

### 新建 `/admin/channels/new`

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| ach-005 | 新建表单 | 渲染 | 5 步表单：slug / kind / layout / theme & accent / translations / visibility |
| ach-006 | 选 kind=NOTES | 联动 | layout dropdown 仅显示 `TIMELINE / FEED` |
| ach-007 | 选 kind=LINKS | 联动 | layout dropdown 仅显示 `GREP / CARDS` |
| ach-008 | 选 kind=GUESTBOOK | 校验 | 提示 "GUESTBOOK 由 seed 创建，admin 不能新建" |
| ach-009 | slug 已存在 | 提交 | 返回 409 + 显示 "slug 已被使用" |
| ach-010 | slug 不符合 kebab-case | 提交 | 返回 400 + 显示规则提示 |
| ach-011 | 提交 valid 表单 | submit | db INSERT Channel + ChannelTranslation；redirect `/admin/channels/<id>/edit` |

### 编辑 `/admin/channels/[id]/edit`

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| ach-012 | 编辑现有 Channel | 渲染表单 | 表单预填当前值 |
| ach-013 | 修改 layout（同 kind 兼容范围内） | 提交 | PATCH，前台 Channel 页立即换 layout |
| ach-014 | 删除 Channel（点击删除按钮） | confirm dialog → submit | db cascade delete entries / series / translations |
| ach-015 | 删除 kind=GUESTBOOK 的 Channel | 触发 | 拒绝 + 提示 "GUESTBOOK 不可删除" |

---

## Test File

- `src/app/(admin)/admin/channels/page.test.tsx`
- `src/app/(admin)/admin/channels/new/page.test.tsx`
- `src/app/(admin)/admin/channels/[id]/edit/page.test.tsx`
- `src/app/api/admin/channels/route.test.ts`
- `src/app/api/admin/channels/[id]/route.test.ts`
- `src/lib/schemas/channel.test.ts`

---

## Acceptance

- [ ] 15 spec 全 pass
- [ ] 验收门 7：HaiDen 在 admin 新建 `smoke-test-channel` (slug=smoke-test, kind=NOTES, layout=TIMELINE) + 3 个 NOTE entries，访问 `/c/smoke-test` 立即可见 → 元模型动态性证明

---

## Don't

- 不暴露 Channel.theme 字段编辑（由路由推论）
- 不做拖拽（YAGNI 单作者）
- 不允许 admin 自定义 layout / kind 枚举值

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
