# Grep Snapshot Before — docs-sync

## P2 unchecked rows

```text
3:- [ ] 首页 Hero + 技术栈 + 最近文章 + GitHub 数据
4:- [ ] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）
5:- [ ] 文章列表 + 专栏聚合页 + 标签页
7:- [ ] 自研 Analytics 客户端上报（`<AnalyticsBeacon>`）
```

## Target rows

```text
142:- [ ] 文章详情（Shiki + TOC + 浏览上报 + 点赞 + 评论区）
145:- [ ] 自研 Analytics 客户端上报（`<AnalyticsBeacon>`）
84:- 点赞：同访客 + 同文章 24h 内一次
```

## R2 guard

```text
grep -ni "PENDING\|commentCount 计 PENDING" CLAUDE.md
# no output
```
