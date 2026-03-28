## Context

TZBlog 已锁定为 `Astro + Payload CMS + PostgreSQL + Umami + Pagefind` 的完整前后端博客，但仓库目前仍停留在文档阶段。第一轮实现必须优先搭起后续所有功能都会依赖的本地开发基座，并保证结构清晰、可持续扩展、便于 AI 接手。

## Goals / Non-Goals

**Goals:**

- 建立可持续扩展的 monorepo 结构
- 让 `apps/web` 和 `apps/cms` 可以独立启动
- 提供本地 PostgreSQL 开发环境
- 形成统一的根级脚本入口和环境变量模板
- 为下一轮 collections、globals、数据拉取链路开发提供稳定基础

**Non-Goals:**

- 本轮不实现正式的 Payload collections / globals
- 本轮不打通 Astro 对 Payload 的真实内容拉取
- 本轮不接入 Umami、Pagefind、对象存储、3D Hero
- 本轮不做正式 UI 视觉实现，只保留最小页面骨架

## Decisions

- 使用 `pnpm workspace` 作为 monorepo 基础，以适配后续多应用与共享包扩展
- 使用 `turbo` 统一 dev / build / lint 任务入口，保持后续规模增长时的可维护性
- `apps/web` 使用官方 `create-astro` 最小模板，保留简洁骨架，避免过早加入多余集成
- `apps/cms` 使用官方 `create-payload-app` 的 `blank` 模板，保持接近 Payload 官方默认结构
- `infra/docker-compose.yml` 只提供 PostgreSQL，本轮不额外引入 MinIO、Umami、反向代理
- 环境变量模板放在根目录与应用目录，确保后续接手者不需要重新推断基础配置

## Risks / Trade-offs

- [Payload blank 模板默认依赖较多] → 保持官方结构，后续再做按需裁剪
- [Astro 与 Payload 各自有独立脚本体系] → 用根级 `turbo` 聚合统一入口
- [本轮未打通真实数据链路] → 在骨架页面显式标注 placeholder，避免误解为功能已完成
- [本地仅提供 PostgreSQL] → 将更多基础设施推迟到后续 change，保证本轮聚焦
