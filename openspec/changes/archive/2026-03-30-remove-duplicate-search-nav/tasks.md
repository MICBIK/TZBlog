## 1. OpenSpec 工件

- [x] 1.1 创建 change 目录（openspec new change）
- [x] 1.2 撰写 proposal.md
- [x] 1.3 撰写 specs/platform-foundation/spec.md
- [x] 1.4 撰写 tasks.md

## 2. 实现

- [x] 2.1 从 `apps/web/src/data/content.ts` navItems 中删除 `{ label: '搜索', href: '/search' }` 一行

## 3. 验证

- [x] 3.1 `astro check` 0 errors / 0 warnings
- [x] 3.2 本机目视验证：顶部导航不再出现「搜索」链接
- [x] 3.3 本机目视验证：Search Relay 按钮仍然存在且可跳转
- [x] 3.4 本机目视验证：`/search` 页面功能正常

## 4. 收尾

- [x] 4.1 OpenSpec validate 通过
- [x] 4.2 提交 atomic commit: `fix(web): remove duplicate search nav entry, keep Search Relay CTA` — 已提交 f1033be
