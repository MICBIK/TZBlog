# Spec — review-ui (C)

> Capability: admin 评论审核页 UI
> Stage: P1-C / §D
> SPEC-ID 前缀：`SPEC-C-U-`

## Domain rules

- 列表页路径：`/admin/comments`
- 默认 tab：PENDING（审核员最关心）
- URL 同步：`?status=PENDING&q=...&page=1`（searchParams）
- 服务端组件直接 await listCommentsForAdmin（与 admin/posts page 一致）
- 客户端组件管理多选 state 与批量操作

## Specs

### SPEC-C-U-1 — page.tsx 4 tab + 列表

**GIVEN** 4 个 status 各有评论数据
**WHEN** 访问 `/admin/comments`（默认 ?status=PENDING）
**THEN** 渲染：
  - 顶部 4 个 tab（PENDING / APPROVED / SPAM / REJECTED）+ 各自计数
  - 当前 tab=PENDING 高亮
  - 下方列表展示 PENDING 评论
  - Filters bar（q 搜索框）

**WHEN** 切到 `?status=APPROVED` tab
**THEN** 列表展示 APPROVED 评论；URL 同步

### SPEC-C-U-2 — CommentsTable 行展示 + 行内动作

**GIVEN** 列表数据 5 条
**WHEN** 渲染 `<CommentsTable items={...} />`
**THEN** 每行展示：
  - 多选 checkbox
  - authorName + authorEmail (subtitle)
  - content 截断（前 80 chars）
  - post slug + title
  - createdAt 格式化
  - status badge
  - 行内动作按钮：APPROVE / SPAM / REJECT / DELETE（按 status 显示可用项）

**WHEN** 点击 APPROVE 按钮
**THEN** 触发 PATCH，乐观更新行 status；失败回滚 + toast.error

### SPEC-C-U-3 — 多选 + BulkActions

**GIVEN** 列表展示 5 条，用户选中 3 条
**WHEN** 渲染 `<CommentsTable />`
**THEN** 顶部 BulkActions 栏出现，显示「已选 3 条」+ APPROVE/SPAM/REJECT/DELETE 按钮

**WHEN** 点 BulkActions APPROVE
**THEN** 触发 POST /bulk，乐观更新 3 行；成功后 BulkActions 关闭 + toast.success

### SPEC-C-U-4 — AdminSidebar 加「评论管理」link

**WHEN** 渲染 admin sidebar
**THEN** 链接列表含「评论管理」指向 `/admin/comments`
**AND** 链接图标用 MessageSquare 或类似
