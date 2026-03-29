## Why

TZBlog 已经有明确的产品与视觉设计文档，但前台仍停留在最小占位页，无法体现“内容优先 + 深空观测站”的信息架构，也无法支撑后续 CMS 联动前的真实页面评审与开发协作。

当前需要先把完整前台界面骨架落地为可浏览、可测试、可审计的页面系统，确保：

- 首页是内容分发中心而非单屏展示
- 一级导航与多内容类型路由齐全
- 列表页与详情页具备稳定阅读结构
- 视觉语言统一且动效克制

## What Changes

- 实现 Astro 前台的完整 IA 路由骨架：`/`、`/posts`、`/projects`、`/docs`、`/notes`、`/lab`、`/about`、`/search`
- 实现 posts/projects/docs/notes 的列表页与详情页模板
- 实现首页 6 区块结构（Hero、Focus Stream、Mission Panels、Selected Works、Timeline、Footer Dock）
- 建立配置驱动的数据层（站点配置、导航、示例内容、时间线）
- 建立统一布局与全局样式系统（深空观测站视觉语言 + 响应式）
- 完成前台构建测试、规范校验、代码审计与问题修复

## Capabilities

### Modified Capabilities

- `platform-foundation`: 从“最小占位骨架”扩展为“可评审的完整前台信息架构与页面模板系统”

## Impact

- 主要影响目录：`apps/web/src/**`
- 更新前台页面模板、样式体系与示例内容数据
- 为后续 Payload 数据接入保留稳定的前台页面契约
- 不改动已锁定技术栈，不回退为静态单页展示方案
