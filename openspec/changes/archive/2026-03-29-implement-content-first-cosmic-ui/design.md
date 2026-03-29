## Context

TZBlog 设计文档已锁定“内容优先、宇宙主题克制表达、清晰信息架构”的方向，但工程实现还停留在首页 + 文章占位页。为了让后续 CMS 建模、数据链路与 UI 迭代在同一基线上推进，需要先把前台模板体系完整落地。

## Goals / Non-Goals

**Goals**

- 提供完整一级导航与关键路由入口
- 首页按设计文档落地 6 区块结构
- 落地文章/项目/文档/笔记的列表与详情页面模板
- 建立统一布局、样式变量、卡片与阅读区层级
- 提供可直接切换到 Payload 数据源的页面结构

**Non-Goals**

- 本轮不接入真实 Payload API 数据
- 本轮不实现重型 3D 或复杂 shader 特效
- 本轮不接入评论系统与会员系统
- 本轮不改动 CMS schema

## Decisions

- 使用单一 `SiteLayout` 承载全站头部、主内容容器与 Footer Dock，避免页面结构分裂。
- 使用 `src/data/content.ts` 提供配置驱动示例数据，明确后续替换为 Payload 时的字段契约。
- 首页严格对应 6 区块：Hero、Focus Stream、Mission Panels、Selected Works、Timeline、Footer Dock。
- 详情页采用“阅读主轴 + 辅助面板”结构：主文区、目录/元信息、上下篇或关联入口。
- 视觉层以 CSS 渐变、轨道线、弱扫描效果实现“深空观测站”氛围，保留 reduced-motion 友好行为。

## Risks / Trade-offs

- [示例数据非真实 CMS 内容] → 明确数据层是契约草图，后续可无痛替换成 API。
- [页面一次性增加较多] → 通过统一布局和复用样式降低复杂度。
- [高视觉密度风险] → 控制动效与背景强度，优先正文可读性。
- [未接入搜索引擎索引] → 本轮先提供搜索页面与交互入口，后续接 Pagefind 真索引。
