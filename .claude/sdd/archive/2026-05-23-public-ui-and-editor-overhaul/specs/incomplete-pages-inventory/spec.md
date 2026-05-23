# Spec — incomplete-pages-inventory

> Capability：路由完成度盘点 + 死链清理。
> 范围：本 spec 主要是"清单与决策的检查"，实际改动多落在 `admin-readability` spec AR-1 等。
> 上游：`incomplete-pages-inventory.md`、`admin-readability` spec。

---

## IP-1 路由盘点文档完整性

### IP-1.1 文档落地

**GIVEN** `incomplete-pages-inventory.md` 已撰写
**WHEN** spec 通过
**THEN** 文档存在；前台 + 后台 + API 所有路由都有评级；评级标准与 spec 一致；分桶（本轮 / V2 / V3 / 删除 / 不动）逻辑无遗漏。

### IP-1.2 文档与代码一致

**GIVEN** 文档列出 5 个 admin page（concepts/posts/columns/comments/media）+ `/admin/_editor-demo` + login
**WHEN** 实施完所有改动后
**THEN** 实际 `find src/app -name page.tsx` 输出与文档表格一一对应；没有未盘点的路由（执行方在归档前 grep 复核）。

---

## IP-2 死链消除

### IP-2.1 sidebar 死链清零

**GIVEN** admin sidebar 当前含 `/admin/analytics` 与 `/admin/settings` 死链
**WHEN** 实施完 spec AR-1
**THEN** sidebar 不再有任何 href 指向不存在的 page.tsx。

### IP-2.2 前台 / 公开链接死链清零

**GIVEN** 前台 SiteHeader / SiteFooter / 各页面相互链接
**WHEN** 实施完整体改动
**THEN** 不存在任何指向 404 的内部链接；执行方在 implementation 末段用 `pnpm build` 输出 + 简单脚本扫所有 `<Link href>` 验证。

### IP-2.3 死链检测脚本（可选）

**GIVEN** 想要自动化死链检测
**WHEN** 实施
**THEN** 可选加一个 `scripts/check-internal-links.ts`（用 simple regex + fs 验证）；如果加，写到 package.json 的 `pnpm check:links`；不强制。

---

## IP-3 `/admin/_editor-demo` 处理

### IP-3.1 路由保留 + 隐藏

**GIVEN** `_editor-demo` 用于 editor PoC 沙箱
**WHEN** 实施
**THEN** 路由文件保留（`src/app/(admin)/admin/_editor-demo/page.tsx`）；sidebar 中不暴露；首页 / about / posts 等任何用户可见入口不提及；仅开发者手动访问 URL；归档前再决定是否真的删除路由（可推到 V2）。

### IP-3.2 demo 页内容契约

**GIVEN** `_editor-demo` 页
**WHEN** 用于 EC-* spec 的 PoC
**THEN** 页面顶部显示 banner "Editor PoC sandbox — not part of production"；包含一个 `<MarkdownEditorWithPreview>` mount + 一些预填测试 markdown（用于手动 round-trip 验证）；不允许该页提交数据到 DB。

---

## IP-4 未来加路由的强约束

### IP-4.1 新加路由的导航接通

**GIVEN** implementation 阶段若 home-redesign / about-redesign 决定加新 section 引出新 URL（不在本 spec 列表）
**WHEN** 该路由实现
**THEN** 必须同步更新 `incomplete-pages-inventory.md`（加一行 + 评级 + 处理）；不允许有"路由 ready 但未盘点"。

---

## IP-5 测试覆盖

### IP-5.1 导航 sweep 测试

**GIVEN** AdminSidebar / SiteHeader 渲染
**WHEN** 测试
**THEN** 断言每个 nav item 的 href 字符串都对应一个 `app/...` 文件存在（用 `fs.existsSync` 在 test setup 中跑，或 hardcode 当前路由清单 + 在 spec 中维护）；新增 / 移除路由时测试同步更新。

### IP-5.2 不允许 404 路径出现在导航

**GIVEN** sidebar 数据 const
**WHEN** 测试
**THEN** 断言 NAV_ITEMS 中不出现 "analytics" / "settings"（按文本断言）；future-proof：当未来 V2 加回 settings 时移除此断言。
